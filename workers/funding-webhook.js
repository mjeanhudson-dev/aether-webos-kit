/**
 * Aether funding webhook (Cloudflare Worker, zero dependencies).
 * Author: Eloquent (@mjeanhudson-dev)
 *
 * Routes:
 *   POST /webhook/polar   verify Standard Webhooks HMAC-SHA256
 *   POST /webhook/stripe  verify Stripe-Signature (t=,v1=) HMAC-SHA256
 *   GET  /api/funding-stats   public aggregate, no personal data
 *
 * Design:
 *  - One KV key per provider event ("ev:<provider>:<event id>"). Writing the same
 *    event twice overwrites the same key, so retries and replays cannot double count
 *    and concurrent deliveries cannot lose updates.
 *  - Totals are computed on read (cached 60s). Fine for a small project; list() is
 *    capped, so move to D1 or a Durable Object if volume ever grows.
 *  - Fail-closed: missing secret or KV returns 503, bad or stale signature returns 401.
 *  - Only USD amounts feed the cents totals. Cents are hidden until MIN_PUBLIC_BACKERS
 *    so a single supporter's amount cannot be read off the public endpoint.
 *
 * Status: written but NOT tested against real Stripe or Polar deliveries.
 * Capture one real test delivery from each provider before trusting the totals.
 */

const MAX_BODY_BYTES = 64 * 1024;
const TOLERANCE_SECONDS = 300;
const EVENT_TTL_SECONDS = 60 * 60 * 24 * 400;
const MIN_PUBLIC_BACKERS = 5;
const MAX_EVENTS_COUNTED = 1000;
const HEX64 = /^[0-9a-f]{64}$/;

function json(body, status, origin, env, cacheable) {
  const allowed = env.ALLOWED_ORIGIN || '';
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': cacheable && status === 200 ? 'public, max-age=60' : 'no-store',
    'x-content-type-options': 'nosniff',
    vary: 'Origin',
  };
  if (allowed && origin === allowed) headers['access-control-allow-origin'] = allowed;
  return new Response(JSON.stringify(body), { status, headers });
}

function hex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmac(keyBytes, message) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
}

function base64ToBytes(b64) {
  const bin = atob(b64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function verifyStripe(rawBody, header, secret) {
  const entries = header.split(',').map((p) => p.trim().split('='));
  const ts = Number(entries.find((e) => e[0] === 't')?.[1]);
  const sigs = entries.filter((e) => e[0] === 'v1' && HEX64.test(e[1] || '')).map((e) => e[1]);
  if (!ts || sigs.length === 0) return false;
  if (Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false;
  const expected = hex(await hmac(new TextEncoder().encode(secret), `${ts}.${rawBody}`));
  return sigs.some((s) => timingSafeEqual(expected, s));
}

// Standard Webhooks: signed content is "<id>.<timestamp>.<body>", signature header holds
// space separated "v1,<base64>" entries. The key may be the base64-decoded secret (with an
// optional "whsec_" prefix) or the raw secret text, so both interpretations are accepted.
async function verifyPolar(rawBody, headers, secret) {
  const id = headers.get('webhook-id');
  const ts = Number(headers.get('webhook-timestamp'));
  const sigHeader = headers.get('webhook-signature') || '';
  if (!id || !ts) return false;
  if (Math.abs(Date.now() / 1000 - ts) > TOLERANCE_SECONDS) return false;
  const candidates = [new TextEncoder().encode(secret)];
  try { candidates.push(base64ToBytes(secret.replace(/^whsec_/, ''))); } catch { /* raw text only */ }
  const received = sigHeader.split(' ').filter((s) => s.startsWith('v1,')).map((s) => s.slice(3));
  if (received.length === 0) return false;
  for (const keyBytes of candidates) {
    const digest = await hmac(keyBytes, `${id}.${ts}.${rawBody}`);
    const expected = btoa(String.fromCharCode(...new Uint8Array(digest)));
    if (received.some((s) => timingSafeEqual(s, expected))) return true;
  }
  return false;
}

async function record(env, key, entry) {
  await env.FUNDING_KV.put(key, JSON.stringify(entry), { expirationTtl: EVENT_TTL_SECONDS });
}

async function totals(env) {
  const list = await env.FUNDING_KV.list({ prefix: 'ev:', limit: MAX_EVENTS_COUNTED });
  let backers = 0;
  let monthly = 0;
  let oneTime = 0;
  for (const k of list.keys) {
    let entry;
    try { entry = JSON.parse(await env.FUNDING_KV.get(k.name)); } catch { continue; }
    if (!entry) continue;
    if (entry.backer) backers += 1;
    if (entry.usd_cents) {
      if (entry.recurring) monthly += entry.usd_cents;
      else oneTime += entry.usd_cents;
    }
  }
  const visible = backers >= MIN_PUBLIC_BACKERS;
  return {
    backers,
    monthly_cents: visible ? monthly : null,
    one_time_cents: visible ? oneTime : null,
    truncated: !list.list_complete,
    as_of: new Date().toISOString().slice(0, 10),
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin') || '';

    if (request.method === 'GET' && url.pathname === '/api/funding-stats') {
      if (!env.FUNDING_KV) return json({ error: 'unconfigured' }, 503, origin, env, false);
      return json(await totals(env), 200, origin, env, true);
    }

    if (request.method !== 'POST') return json({ error: 'not_found' }, 404, origin, env, false);
    const provider = url.pathname === '/webhook/polar' ? 'polar' : url.pathname === '/webhook/stripe' ? 'stripe' : null;
    if (!provider) return json({ error: 'not_found' }, 404, origin, env, false);

    const secret = provider === 'polar' ? env.POLAR_WEBHOOK_SECRET : env.STRIPE_WEBHOOK_SECRET;
    if (!secret || !env.FUNDING_KV) return json({ error: 'unconfigured' }, 503, origin, env, false);

    const declared = Number(request.headers.get('content-length'));
    if (!declared || declared > MAX_BODY_BYTES) return json({ error: 'bad_length' }, 413, origin, env, false);
    const sigPresent = provider === 'stripe' ? request.headers.get('stripe-signature') : request.headers.get('webhook-signature');
    if (!sigPresent) return json({ error: 'bad_signature' }, 401, origin, env, false);

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).length > MAX_BODY_BYTES) return json({ error: 'too_large' }, 413, origin, env, false);

    const ok = provider === 'stripe'
      ? await verifyStripe(rawBody, sigPresent, secret)
      : await verifyPolar(rawBody, request.headers, secret);
    if (!ok) return json({ error: 'bad_signature' }, 401, origin, env, false);

    let event;
    try { event = JSON.parse(rawBody); } catch { return json({ error: 'bad_json' }, 400, origin, env, false); }

    try {
      if (provider === 'stripe' && event.id && (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded')) {
        const obj = event.data && event.data.object ? event.data.object : {};
        if (obj.payment_status === 'paid') {
          const usd = String(obj.currency || '').toLowerCase() === 'usd';
          await record(env, `ev:stripe:${event.id}`, {
            backer: true,
            recurring: obj.mode === 'subscription',
            usd_cents: usd ? Number(obj.amount_total) || 0 : 0,
          });
        }
      } else if (provider === 'polar' && event.type === 'order.created') {
        const id = request.headers.get('webhook-id');
        const data = event.data || {};
        const reason = data.billing_reason || '';
        const usd = String(data.currency || '').toLowerCase() === 'usd';
        await record(env, `ev:polar:${id}`, {
          backer: reason === 'purchase' || reason === 'subscription_create',
          recurring: Boolean(data.subscription_id),
          usd_cents: usd ? Number(data.net_amount ?? data.amount) || 0 : 0,
        });
      }
    } catch {
      return json({ error: 'store_failed' }, 500, origin, env, false);
    }
    return json({ ok: true }, 200, origin, env, false);
  },
};
