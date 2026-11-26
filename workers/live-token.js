/**
 * Aether live-token Worker (Cloudflare Worker, zero dependencies).
 * Author: Eloquent (@mjeanhudson-dev)
 *
 * POST /api/live-token  ->  { token, expireTime }   one-use Gemini ephemeral token
 *
 * - Fail closed: no GEMINI_API_KEY -> 503; Origin not in ALLOWED_ORIGINS -> 403.
 * - If TURNSTILE_SECRET_KEY is set, a valid Turnstile response is required.
 * - If TOKEN_RATE_KV is bound, limits each IP to MAX_PER_WINDOW tokens per window.
 * - shortcut: the KV rate limit is read-then-write, so a burst can slightly exceed it; use a
 *   Durable Object or the Rate Limiting binding if abuse appears.
 * The API key never leaves this Worker.
 */

const DEFAULT_ORIGINS = 'https://eloquentwin.com,https://www.eloquentwin.com,https://aether-webos-kit.pages.dev';
const DEFAULT_HOSTNAMES = 'eloquentwin.com,www.eloquentwin.com,aether-webos-kit.pages.dev';
const EXPECTED_ACTION = 'live_token';
const MINT_URL = 'https://generativelanguage.googleapis.com/v1alpha/auth_tokens';
const TURNSTILE_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TOKEN_TTL_MS = 5 * 60 * 1000;
const NEW_SESSION_MS = 2 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const WINDOW_SECONDS = 600;
const MAX_BODY_BYTES = 2048;
const MAX_QUOTE_BYTES = 16384;
const QUOTE_TTL_SECONDS = 60 * 60 * 24 * 90;

function reply(body, status, origin, allowed) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    vary: 'Origin',
  };
  if (allowed) {
    headers['access-control-allow-origin'] = origin;
    headers['access-control-allow-methods'] = 'POST, OPTIONS';
    headers['access-control-allow-headers'] = 'content-type';
    headers['access-control-max-age'] = '600';
  }
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin') || '';
    const allowedList = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS).split(',').map((s) => s.trim()).filter(Boolean);
    const allowed = allowedList.includes(origin);

    if (url.pathname !== '/api/live-token' && url.pathname !== '/api/quote') return reply({ error: 'not_found' }, 404, origin, false);
    if (request.method === 'OPTIONS') return reply(null, allowed ? 204 : 403, origin, allowed);
    if (request.method !== 'POST') return reply({ error: 'method_not_allowed' }, 405, origin, false);
    if (!allowed) return reply({ error: 'forbidden_origin' }, 403, origin, false);

    if (url.pathname === '/api/quote') {
      if (!env.TOKEN_RATE_KV) return reply({ error: 'unconfigured' }, 503, origin, true);
      const qDeclared = Number(request.headers.get('content-length'));
      if (qDeclared > MAX_QUOTE_BYTES) return reply({ error: 'too_large' }, 413, origin, true);
      let qBody;
      try {
        const qRaw = await request.text();
        if (!qRaw || qRaw.length > MAX_QUOTE_BYTES) return reply({ error: 'bad_length' }, 413, origin, true);
        qBody = JSON.parse(qRaw);
      } catch {
        return reply({ error: 'bad_json' }, 400, origin, true);
      }
      const refId = qBody && typeof qBody.refId === 'string'
        ? qBody.refId
        : (qBody && typeof qBody.ref_id === 'string' ? qBody.ref_id : '');
      if (!qBody || qBody.schema !== 'aether.quote.capsule.v1' || !/^AEQ-[0-9A-F]{4}-[0-9A-F]{4}$/.test(refId)) {
        return reply({ error: 'bad_capsule' }, 400, origin, true);
      }
      const qIp = request.headers.get('cf-connecting-ip') || '';
      if (qIp) {
        const qRateKey = `rl:quote:${qIp}`;
        const qUsed = Number(await env.TOKEN_RATE_KV.get(qRateKey)) || 0;
        if (qUsed >= MAX_PER_WINDOW) return reply({ error: 'rate_limited' }, 429, origin, true);
        await env.TOKEN_RATE_KV.put(qRateKey, String(qUsed + 1), { expirationTtl: WINDOW_SECONDS });
      }
      const storedKey = `quote:${new Date().toISOString().slice(0, 10)}:${refId}`;
      await env.TOKEN_RATE_KV.put(storedKey, JSON.stringify({ received_at: new Date().toISOString(), origin, capsule: qBody }), { expirationTtl: QUOTE_TTL_SECONDS });
      return reply({ ok: true, refId, ref_id: refId }, 200, origin, true);
    }

    if (!env.GEMINI_API_KEY) return reply({ error: 'unconfigured' }, 503, origin, true);

    const declared = Number(request.headers.get('content-length'));
    if (declared > MAX_BODY_BYTES) return reply({ error: 'too_large' }, 413, origin, true);
    let body = {};
    try { const raw = await request.text(); if (raw.length > MAX_BODY_BYTES) return reply({ error: 'too_large' }, 413, origin, true); if (raw) body = JSON.parse(raw); } catch { return reply({ error: 'bad_json' }, 400, origin, true); }

    const ip = request.headers.get('cf-connecting-ip') || '';
    if (env.TURNSTILE_SECRET_KEY) {
      const expectedHostnames = new Set(
        (env.TURNSTILE_HOSTNAMES || DEFAULT_HOSTNAMES).split(',').map((s) => s.trim()).filter(Boolean)
      );
      const tt = body && typeof body.turnstileToken === 'string' ? body.turnstileToken : '';
      if (!tt || tt.length > 2048 || expectedHostnames.size === 0) {
        return reply({ error: 'turnstile_required' }, 403, origin, true);
      }
      const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: tt });
      if (ip) form.set('remoteip', ip);
      let verdict;
      try {
        const tr = await fetch(TURNSTILE_URL, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          signal: AbortSignal.timeout(10000),
          body: form,
        });
        if (!tr.ok) return reply({ error: 'turnstile_failed' }, 403, origin, true);
        verdict = await tr.json();
      } catch {
        return reply({ error: 'turnstile_unreachable' }, 403, origin, true);
      }
      if (
        !verdict ||
        verdict.success !== true ||
        verdict.action !== EXPECTED_ACTION ||
        !expectedHostnames.has(verdict.hostname)
      ) {
        return reply({ error: 'turnstile_failed' }, 403, origin, true);
      }
    }

    let rateKey = null;
    if (env.TOKEN_RATE_KV && ip) {
      rateKey = `rl:${ip}`;
      const used = Number(await env.TOKEN_RATE_KV.get(rateKey)) || 0;
      if (used >= MAX_PER_WINDOW) return reply({ error: 'rate_limited' }, 429, origin, true);
      await env.TOKEN_RATE_KV.put(rateKey, String(used + 1), { expirationTtl: WINDOW_SECONDS });
    }

    const expireTime = new Date(Date.now() + TOKEN_TTL_MS).toISOString();
    let res;
    try {
      res = await fetch(MINT_URL, {
        method: 'POST',
        headers: { 'x-goog-api-key': env.GEMINI_API_KEY, 'content-type': 'application/json' },
        body: JSON.stringify({ uses: 1, expireTime, newSessionExpireTime: new Date(Date.now() + NEW_SESSION_MS).toISOString() }),
      });
    } catch { return reply({ error: 'upstream_unreachable' }, 502, origin, true); }
    if (!res.ok) return reply({ error: 'upstream_refused', status: res.status }, 502, origin, true);
    let data;
    try { data = await res.json(); } catch { return reply({ error: 'upstream_bad_json' }, 502, origin, true); }
    if (!data || typeof data.name !== 'string' || !data.name) return reply({ error: 'upstream_no_token' }, 502, origin, true);
    return reply({ token: data.name, expireTime }, 200, origin, true);
  },
};
