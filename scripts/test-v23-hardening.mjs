/* Hardening tests for v2.3: funding webhook worker and Gemini Live bridge protocol.
   Run: node scripts/test-v23-hardening.mjs   (Node built-ins only, no packages) */
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import worker from '../workers/funding-webhook.js';
import liveToken from '../workers/live-token.js';

const require = createRequire(import.meta.url);
const bridge = require('../webos/live-bridge.js');
const funding = require('../scripts/stage-choreography.js');

function mockKv() {
  const m = new Map();
  return {
    get: async (k) => (m.has(k) ? m.get(k) : null),
    put: async (k, v) => { m.set(k, v); },
    list: async ({ prefix }) => ({ keys: [...m.keys()].filter((k) => k.startsWith(prefix)).map((name) => ({ name })), list_complete: true }),
    _m: m,
  };
}

const STRIPE_SECRET = 'whsec_stripe_test_secret';
const POLAR_SECRET_B64 = Buffer.from('polar-test-key-bytes-0123456789').toString('base64');
const POLAR_SECRET = `whsec_${POLAR_SECRET_B64}`;

function env(extra) {
  return { FUNDING_KV: mockKv(), STRIPE_WEBHOOK_SECRET: STRIPE_SECRET, POLAR_WEBHOOK_SECRET: POLAR_SECRET, ALLOWED_ORIGIN: 'https://mjeanhudson-dev.github.io', ...extra };
}

function stripeRequest(event, { secret = STRIPE_SECRET, ts = Math.floor(Date.now() / 1000), extraSigs = [] } = {}) {
  const body = JSON.stringify(event);
  const v1 = crypto.createHmac('sha256', secret).update(`${ts}.${body}`).digest('hex');
  const sigs = [...extraSigs, v1].map((s) => `v1=${s}`).join(',');
  return new Request('https://w.test/webhook/stripe', {
    method: 'POST', body,
    headers: { 'content-length': String(Buffer.byteLength(body)), 'stripe-signature': `t=${ts},${sigs}` },
  });
}

function polarRequest(event, id, { ts = Math.floor(Date.now() / 1000), keyBytes = Buffer.from(POLAR_SECRET_B64, 'base64') } = {}) {
  const body = JSON.stringify(event);
  const sig = crypto.createHmac('sha256', keyBytes).update(`${id}.${ts}.${body}`).digest('base64');
  return new Request('https://w.test/webhook/polar', {
    method: 'POST', body,
    headers: { 'content-length': String(Buffer.byteLength(body)), 'webhook-id': id, 'webhook-timestamp': String(ts), 'webhook-signature': `v1,${sig}` },
  });
}

const paid = (id, cents = 500, currency = 'usd', mode = 'payment') => ({ id, type: 'checkout.session.completed', data: { object: { payment_status: 'paid', amount_total: cents, currency, mode } } });

async function stats(e) {
  const r = await worker.fetch(new Request('https://w.test/api/funding-stats', { headers: { origin: 'https://mjeanhudson-dev.github.io' } }), e);
  return { res: r, body: await r.json() };
}

test('worker: missing secret fails closed with 503', async () => {
  const e = env({ STRIPE_WEBHOOK_SECRET: undefined });
  assert.equal((await worker.fetch(stripeRequest(paid('evt_1')), e)).status, 503);
});

test('worker: oversized or missing content-length is rejected with 413', async () => {
  const e = env();
  const big = new Request('https://w.test/webhook/stripe', { method: 'POST', body: 'x', headers: { 'content-length': '999999', 'stripe-signature': 't=1,v1=00' } });
  assert.equal((await worker.fetch(big, e)).status, 413);
});

test('worker: bad signature returns 401 and stores nothing', async () => {
  const e = env();
  const res = await worker.fetch(stripeRequest(paid('evt_bad'), { secret: 'wrong_secret' }), e);
  assert.equal(res.status, 401);
  assert.equal(e.FUNDING_KV._m.size, 0);
});

test('worker: stale timestamp is rejected', async () => {
  const e = env();
  const res = await worker.fetch(stripeRequest(paid('evt_old'), { ts: Math.floor(Date.now() / 1000) - 3600 }), e);
  assert.equal(res.status, 401);
});

test('worker: Stripe accepts any v1 during secret rotation and records one USD paid session', async () => {
  const e = env();
  const decoy = 'a'.repeat(64);
  const res = await worker.fetch(stripeRequest(paid('evt_ok', 700), { extraSigs: [decoy] }), e);
  assert.equal(res.status, 200);
  assert.equal(e.FUNDING_KV._m.size, 1);
  assert.equal(JSON.parse(e.FUNDING_KV._m.get('ev:stripe:evt_ok')).usd_cents, 700);
});

test('worker: replaying the same Stripe event id does not double count', async () => {
  const e = env();
  await worker.fetch(stripeRequest(paid('evt_dup')), e);
  await worker.fetch(stripeRequest(paid('evt_dup')), e);
  assert.equal(e.FUNDING_KV._m.size, 1);
});

test('worker: unpaid sessions and non-USD amounts never inflate USD cents', async () => {
  const e = env();
  const unpaid = paid('evt_unpaid'); unpaid.data.object.payment_status = 'unpaid';
  await worker.fetch(stripeRequest(unpaid), e);
  await worker.fetch(stripeRequest(paid('evt_eur', 900, 'eur')), e);
  assert.equal(e.FUNDING_KV._m.has('ev:stripe:evt_unpaid'), false);
  assert.equal(JSON.parse(e.FUNDING_KV._m.get('ev:stripe:evt_eur')).usd_cents, 0);
});

test('worker: Polar verifies with base64-decoded key and separates purchase from renewal', async () => {
  const e = env();
  const purchase = { type: 'order.created', data: { billing_reason: 'purchase', currency: 'usd', net_amount: 1000, subscription_id: 'sub_1' } };
  const renewal = { type: 'order.created', data: { billing_reason: 'subscription_cycle', currency: 'usd', net_amount: 1000, subscription_id: 'sub_1' } };
  assert.equal((await worker.fetch(polarRequest(purchase, 'msg_1'), e)).status, 200);
  assert.equal((await worker.fetch(polarRequest(renewal, 'msg_2'), e)).status, 200);
  assert.equal(JSON.parse(e.FUNDING_KV._m.get('ev:polar:msg_1')).backer, true);
  assert.equal(JSON.parse(e.FUNDING_KV._m.get('ev:polar:msg_2')).backer, false);
  assert.equal(JSON.parse(e.FUNDING_KV._m.get('ev:polar:msg_2')).recurring, true);
});

test('worker: Polar rejects a signature made with the wrong key', async () => {
  const e = env();
  const ev = { type: 'order.created', data: { billing_reason: 'purchase', currency: 'usd', net_amount: 100 } };
  assert.equal((await worker.fetch(polarRequest(ev, 'msg_x', { keyBytes: Buffer.from('not-the-key') }), e)).status, 401);
});

test('worker: cents are hidden below 5 backers, shown at 5, Vary header set', async () => {
  const e = env();
  for (let i = 0; i < 4; i++) await worker.fetch(stripeRequest(paid(`evt_a${i}`, 100)), e);
  let s = await stats(e);
  assert.equal(s.body.backers, 4);
  assert.equal(s.body.one_time_cents, null);
  await worker.fetch(stripeRequest(paid('evt_a4', 100)), e);
  s = await stats(e);
  assert.equal(s.body.backers, 5);
  assert.equal(s.body.one_time_cents, 500);
  assert.equal(s.res.headers.get('vary'), 'Origin');
  assert.equal(s.res.headers.get('access-control-allow-origin'), 'https://mjeanhudson-dev.github.io');
});

test('bridge: setup targets the right models, NON_BLOCKING tools, correct modality', () => {
  const live = bridge.buildSetupMessage({ audio: true });
  assert.equal(live.setup.model, 'models/gemini-3.8-live');
  assert.deepEqual(live.setup.generationConfig.responseModalities, ['AUDIO']);
  assert.ok(live.setup.outputAudioTranscription);
  const think = bridge.buildSetupMessage({ audio: true, extendedThinking: true });
  assert.equal(think.setup.model, 'models/gemini-3.8-live-extended-thinking');
  assert.equal(think.setup.generationConfig.thinkingConfig.thinkingLevel, 'low');
  const text = bridge.buildSetupMessage({ audio: false });
  assert.deepEqual(text.setup.generationConfig.responseModalities, ['TEXT']);
  const decls = live.setup.tools[0].functionDeclarations;
  assert.equal(decls.length, 4);
  for (const d of decls) assert.equal(d.behavior, 'NON_BLOCKING');
  assert.ok(decls.some((d) => d.name === 'capture_visitor_framework'));
});

test('bridge: realtime messages use text/audio/audioStreamEnd and never media', () => {
  const t = bridge.buildRealtimeTextMessage('hi');
  const a = bridge.buildRealtimeAudioMessage('AAAA');
  const e = bridge.buildAudioStreamEndMessage();
  assert.deepEqual(Object.keys(t.realtimeInput), ['text']);
  assert.equal(a.realtimeInput.audio.mimeType, 'audio/pcm;rate=16000');
  assert.equal(e.realtimeInput.audioStreamEnd, true);
  for (const m of [t, a, e]) assert.equal('media' in m.realtimeInput, false);
});

test('bridge: parseServerEvent reads every part, interruption, status, and tool calls', () => {
  const ev = bridge.parseServerEvent({
    interactionStatus: 'IN_PROGRESS',
    serverContent: {
      modelTurn: { parts: [{ inlineData: { data: 'QQ==' } }, { text: 'one ' }, { inlineData: { data: 'Qg==' } }, { text: 'two' }] },
      inputTranscription: { text: 'hello' }, outputTranscription: { text: 'hi there' }, interrupted: true,
    },
    toolCall: { functionCalls: [{ id: 'c1', name: 'select_studio_view', args: { view: 'lexicon' } }] },
  });
  assert.deepEqual(ev.audioChunks, ['QQ==', 'Qg==']);
  assert.equal(ev.text.join(''), 'one two');
  assert.equal(ev.interrupted, true);
  assert.equal(ev.interactionStatus, 'IN_PROGRESS');
  assert.equal(ev.functionCalls[0].name, 'select_studio_view');
  assert.equal(bridge.parseServerEvent({ interactionStatus: 'IDLE' }).interactionStatus, 'IDLE');
});

test('bridge: socket URL needs a token, uses v1beta access_token, rejects raw API keys', () => {
  assert.throws(() => bridge.buildSocketUrl('  '));
  assert.throws(() => bridge.buildSocketUrl('AI' + 'za_fixture_rejected_raw_key'), /API key/);
  assert.throws(() => bridge.buildSocketUrl('two words'));
  const u = bridge.buildSocketUrl('auth_tokens/abc123');
  assert.match(u, /^wss:\/\/generativelanguage\.googleapis\.com\/ws\/google\.ai\.generativelanguage\.v1alpha\.GenerativeService\.BidiGenerateContentConstrained[?]access_token=auth_tokens%2Fabc123$/);
  assert.equal(/[?&]key=/.test(u), false);
});

test('bridge: tool applier edits markdown safely and rejects bad input', () => {
  let md = '# Plan\n\n## Wave 0: Start\n- [ ] first [Wave 0]\n\n## Lexicon\n- **old**: term\n\n## Soul\n- keep\n';
  const host = { getText: () => md, setText: (s) => { md = s; }, selectTab: (id) => { host.tab = id; } };
  assert.equal(bridge.applyToolCall({ name: 'append_floorplan_task', args: { wave: 0, task: 'call the \u2014 plumber' } }, host).ok, true);
  assert.match(md, /- \[ \] call the - plumber \[Wave 0\]\n\n## Lexicon/);
  assert.equal(md.includes('\u2014'), false);
  assert.equal(bridge.applyToolCall({ name: 'define_lexicon_term', args: { term: 'Buffer', meaning: 'one month of rent' } }, host).ok, true);
  assert.match(md, /- \*\*Buffer\*\*: one month of rent\n\n## Soul/);
  assert.equal(bridge.applyToolCall({ name: 'select_studio_view', args: { view: 'capsule' } }, host).ok, true);
  assert.equal(host.tab, 'capsule');
  assert.equal(bridge.applyToolCall({ name: 'append_floorplan_task', args: { wave: 9, task: 'x' } }, host).ok, false);
  assert.equal(bridge.applyToolCall({ name: 'select_studio_view', args: { view: 'javascript:alert(1)' } }, host).ok, false);
  assert.equal(bridge.applyToolCall({ name: 'rm_rf', args: {} }, host).ok, false);
});

test('bridge: module has no storage, cookie, or fetch use, and opens the socket only inside the Connect handler', () => {
  const src = require('node:fs').readFileSync(new URL('../webos/live-bridge.js', import.meta.url), 'utf8');
  for (const bad of ['localStorage', 'sessionStorage', 'document.cookie', 'indexedDB', 'sendBeacon', 'XMLHttpRequest', 'eval(']) {
    assert.equal(src.includes(bad), false, `forbidden: ${bad}`);
  }
  assert.equal((src.match(/new WebSocket\(/g) || []).length, 1);
  const click = src.indexOf("el.connect.addEventListener('click'");
  const start = src.indexOf('function startSession(');
  assert.ok(click > -1 && start > click);
  assert.ok(src.indexOf('new WebSocket(') > start);
  assert.equal((src.match(/fetch\(/g) || []).length, 1);
  assert.ok(src.indexOf('fetch(') > click && src.indexOf('fetch(') < start);
  assert.ok(src.includes('^https:'));
});

test('bridge: tool args are strictly typed and coerced values are rejected', () => {
  const host = { getText: () => '## Wave 0: A\n', setText: () => {}, selectTab: () => {} };
  const bad = [
    { wave: null, task: 'x' }, { wave: '', task: 'x' }, { wave: false, task: 'x' }, { wave: [], task: 'x' },
    { wave: 0, task: { a: 1 } }, { wave: 0, task: '' }, { wave: 3, task: 'x' }, { wave: 0.5, task: 'x' },
  ];
  for (const args of bad) assert.equal(bridge.applyToolCall({ name: 'append_floorplan_task', args }, host).ok, false, JSON.stringify(args));
  assert.equal(bridge.applyToolCall({ name: 'append_floorplan_task', args: { wave: '2', task: 'ok' } }, host).ok, true);
  assert.equal(bridge.applyToolCall({ name: 'select_studio_view', args: { view: ['lexicon'] } }, host).ok, false);
  assert.equal(bridge.applyToolCall({ name: 'define_lexicon_term', args: { term: {}, meaning: 'm' } }, host).ok, false);
});

test('bridge: injected text cannot add headings, links, HTML, bold pairs, wave tags, or line breaks', () => {
  const evil = 'hi\n## Pwned\u2028- [ ] spoof [Wave 2] [x](javascript:alert(1)) <img src=x onerror=1> `code` **bold** \u2014 end';
  const c = bridge.clean(evil, 200);
  assert.equal(/[\n\r\u2028\u2029\u2014\u2013\[\]()<>*`]/.test(c), false);
  assert.ok(c.length <= 200);
  const surrogate = bridge.clean('a'.repeat(59) + '\u{1F600}\u{1F600}', 60);
  assert.equal(Array.from(surrogate).length <= 60, true);
  assert.equal(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/.test(surrogate), false);
});

test('bridge: insertIntoSection is line anchored, skips fences, handles missing and end-of-file headers', () => {
  const re0 = /^## Wave 0(?![0-9])/;
  const collide = '## Wave 01: other\n- a\n\n## Wave 0: real\n- b\n';
  assert.equal(bridge.insertIntoSection(collide, re0, '## Wave 0', '- NEW'), '## Wave 01: other\n- a\n\n## Wave 0: real\n- b\n- NEW\n');
  const fenced = '```\n## Wave 0: fake\n```\n## Wave 0: real\n- b\n## Soul\n- s\n';
  const out = bridge.insertIntoSection(fenced, re0, '## Wave 0', '- NEW');
  assert.ok(out.indexOf('- NEW') > out.indexOf('## Wave 0: real') && out.indexOf('- NEW') < out.indexOf('## Soul'));
  const missing = '# Plan\n\n## Wave 0: A\n- a\n\n## Lexicon\n- t\n\n## Soul\n- s\n';
  const m1 = bridge.insertIntoSection(missing, /^## Wave 1(?![0-9])/, '## Wave 1: Added by voice', '- w1');
  assert.ok(m1.indexOf('## Wave 1: Added by voice') > m1.indexOf('- a') && m1.indexOf('## Wave 1: Added by voice') < m1.indexOf('## Lexicon'));
  assert.ok(bridge.insertIntoSection('# Only title\n', /^## Lexicon\b/, '## Lexicon', '- x').endsWith('## Lexicon\n- x\n'));
  const h1end = '## Lexicon\n- a\n# New H1\n- keep\n';
  assert.equal(bridge.insertIntoSection(h1end, /^## Lexicon\b/, '## Lexicon', '- n'), '## Lexicon\n- a\n- n\n# New H1\n- keep\n');
  assert.equal(bridge.insertIntoSection('## Lexicon Extras\n- a\n', /^## Lexicon\b/, '## Lexicon', '- n').includes('## Lexicon Extras'), true);
});

test('bridge: setup uses SMART transcription only for audio, and parseServerEvent survives malformed input', () => {
  assert.equal(bridge.buildSetupMessage({ audio: true }).setup.inputAudioTranscription.mode, 'SMART');
  assert.equal('inputAudioTranscription' in bridge.buildSetupMessage({ audio: false }).setup, false);
  const ev = bridge.parseServerEvent({
    serverContent: { interactionStatus: 'IDLE', modelTurn: { parts: [null, 7, { text: 'ok' }, { inlineData: { data: 'QQ==' } }] } },
    toolCall: { functionCalls: [null, { name: 5 }, { id: 'c', name: 'select_studio_view', args: null }] },
    toolCallCancellation: { ids: ['c0'] },
  });
  assert.deepEqual(ev.text, ['ok']);
  assert.deepEqual(ev.audioChunks, ['QQ==']);
  assert.equal(ev.interactionStatus, 'IDLE');
  assert.equal(ev.functionCalls.length, 1);
  assert.deepEqual(ev.functionCalls[0].args, {});
  assert.deepEqual(ev.cancelledCalls, ['c0']);
  assert.doesNotThrow(() => bridge.parseServerEvent(null));
  assert.doesNotThrow(() => bridge.parseServerEvent('x'));
});

test('pack script: live-bridge is ranked between refractory and artifact-shader', () => {
  const src = require('node:fs').readFileSync(new URL('./pack-squarespace.mjs', import.meta.url), 'utf8');
  const i = (s) => src.indexOf(s);
  assert.ok(i('/\\/refractory\\.js/i.test(line)) return 2') > -1);
  assert.ok(i('/\\/live-bridge\\.js/i.test(line)) return 3') > i('/\\/refractory\\.js/i.test(line)) return 2'));
  assert.ok(i('/\\/artifact-shader\\.js/i.test(line)) return 4') > i('/\\/live-bridge\\.js/i.test(line)) return 3'));
});

test('funding loader: null manifest channels stay inactive and preserve disabled support state', () => {
  const realManifest = JSON.parse(require('node:fs').readFileSync(new URL('../context/funding.json', import.meta.url), 'utf8'));
  const res = funding.resolveFundingChannels(realManifest);
  assert.equal(res.active, false);
  assert.deepEqual(res.actions, []);
  assert.equal(res.statsEndpoint, null);
});

test('funding loader: valid https Stripe, GitHub Sponsors, Polar, and stats URLs activate in order', () => {
  const res = funding.resolveFundingChannels({
    posture: 'Stripe checkout active.',
    live_stats_endpoint: 'https://stats.example.workers.dev/api/funding-stats',
    channels: {
      stripe_one_time: { url: 'https://buy.stripe.com/test_123456' },
      github_sponsors: { url: 'https://github.com/sponsors/mjeanhudson-dev' },
      polar: { url: 'https://polar.sh/mjeanhudson-dev' },
      billing_portal_url: 'https://billing.stripe.com/p/login/test_123'
    }
  });
  assert.equal(res.active, true);
  assert.deepEqual(res.actions.map((a) => a.key), ['stripe_one_time', 'github_sponsors', 'polar', 'billing_portal']);
  assert.equal(res.statsEndpoint, 'https://stats.example.workers.dev/api/funding-stats');
});

test('funding loader: rejects javascript, http, placeholder, and malformed URLs', () => {
  const res = funding.resolveFundingChannels({
    live_stats_endpoint: 'http://insecure.example/stats',
    channels: {
      stripe_one_time: { url: 'https://buy.stripe.com/REPLACE_WITH_REAL_PAYMENT_LINK' },
      github_sponsors: { url: 'javascript:alert(1)' },
      polar: { url: 'http://polar.sh/http-only' },
      billing_portal_url: 'not a url'
    }
  });
  assert.equal(res.active, false);
  assert.deepEqual(res.actions, []);
  assert.equal(res.statsEndpoint, null);
});

test('v2.4 contact manifest & quote synthesizer: eloquent@eloquentwin.com, zero gmail, deterministic Wave 0..2 scope', () => {
  const fs = require('node:fs');
  const rawContact = fs.readFileSync(new URL('../context/contact.json', import.meta.url), 'utf8');
  assert.equal(/gmail\.com|googlemail\.com/i.test(rawContact), false);
  const contactJson = JSON.parse(rawContact);
  assert.equal(contactJson.public_email, 'eloquent@eloquentwin.com');
  assert.equal(contactJson.quote_webhook_url, 'https://aether-live-token.eloquentwin.workers.dev/api/quote');
  assert.equal(contactJson.response_window, '1 to 2 business days');

  const cfg = funding.resolveContactConfig(contactJson);
  assert.equal(cfg.publicEmail, 'eloquent@eloquentwin.com');
  assert.equal(cfg.quoteWebhookUrl, 'https://aether-live-token.eloquentwin.workers.dev/api/quote');
  assert.equal(cfg.responseWindow, '1 to 2 business days');

  const rejectedGmail = funding.resolveContactConfig({ public_email: 'someone@gmail.com', quote_webhook_url: 'http://insecure.test' });
  assert.equal(rejectedGmail.publicEmail, 'eloquent@eloquentwin.com');
  assert.equal(rejectedGmail.quoteWebhookUrl, null);

  const syn = funding.synthesizeQuoteScope({
    name: 'Morgan Vance',
    email: 'morgan@vancelabs.example',
    company: 'Vance Field Systems',
    track: 'local-ai-vault',
    timeline: '1-to-2-months',
    brief: 'Local vault with SHA-256 parity checks for 14 field engineers.'
  });
  assert.match(syn.refId, /^AEQ-[0-9A-F]{4}-[0-9A-F]{4}$/);
  assert.equal(syn.refId, funding.synthesizeQuoteScope({
    name: 'Another Name',
    track: 'local-ai-vault',
    timeline: '1-to-2-months',
    company: 'Vance Field Systems',
    brief: 'Local vault with SHA-256 parity checks for 14 field engineers.'
  }).refId);
  assert.equal(syn.waves.length, 3);
  assert.match(syn.waves[0], /SHA-256|field|engineers|vault/i);
  assert.match(syn.mailtoHref, /^mailto:eloquent@eloquentwin\.com\?subject=/);
  assert.equal(syn.capsule.schema, 'aether.quote.capsule.v1');
  assert.equal(syn.capsule.recipient, 'eloquent@eloquentwin.com');
  assert.equal(/[\u2014\u2013]/.test(syn.plainBrief), false);
});

test('v2.4 hero & stage markup: pre-impact freeze-frame, detonation hooks, AI quote router, and #act-contact form', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /id="cleave-stage"[^>]*data-impact-state="frozen"/);
  assert.match(html, /src="assets\/meteor-preimpact\.webp"[^>]*width="2560"[^>]*height="1440"/);
  assert.match(html, /src="assets\/meteor-detonation\.webp"[^>]*width="2560"[^>]*height="1440"/);
  assert.match(html, /id="cleave-detonate-btn"[\s\S]*?data-aether-detonate[\s\S]*?aria-expanded="false"/);
  assert.match(html, /id="cleave-meteor"[\s\S]*?data-aether-detonate[\s\S]*?aria-expanded="false"/);
  assert.match(html, /id="aether-quote-router"\s+data-quote-router/);
  for (const intent of ['offline-workspace', 'local-ai-vault', 'custom-webos-site', 'free-kit']) {
    assert.match(html, new RegExp(`data-router-intent="${intent}"`));
  }
  assert.match(html, /id="router-route-btn"\s+data-quote-route-btn/);
  assert.match(html, /data-impact-reset/);
  assert.match(html, /id="act-contact"\s+class="contact-section"/);
  assert.match(html, /id="aether-quote-form"[^>]*action="mailto:eloquent@eloquentwin\.com"/);
  assert.match(html, /id="quote-brief"[\s\S]*?spellcheck="true"/);
  assert.match(html, /id="aether-quote-preview"/);
  assert.match(html, /id="quote-wave-0"/);
  assert.match(html, /id="quote-wave-1"/);
  assert.match(html, /id="quote-wave-2"/);
  assert.match(html, /data-aether-open-copilot[\s\S]*?Talk to Gemini/);
  assert.match(html, /class="live-copilot__badge">Voice \+ Text</);
  assert.equal(/[\u2014\u2013]/.test(html), false);
});

test('v2.4 refractory studio: live native spellcheck toggle and sculpted SVG bezier floorplan', () => {
  const fs = require('node:fs');
  const refObj = require('../webos/refractory.js');
  assert.equal(typeof refObj.setSpellcheck, 'function');
  assert.equal(refObj.getState().spellcheck, true);
  assert.equal(refObj.setSpellcheck(false, { silentStatus: true }), false);
  assert.equal(refObj.getState().spellcheck, false);
  assert.equal(refObj.setSpellcheck(true, { silentStatus: true }), true);
  assert.equal(refObj.getState().spellcheck, true);

  const refSrc = fs.readFileSync(new URL('../webos/refractory.js', import.meta.url), 'utf8');
  assert.match(refSrc, /data-aw-spellcheck-toggle/);
  assert.match(refSrc, /Spellcheck: On/);
  assert.match(refSrc, /Spellcheck: Off/);
  assert.match(refSrc, /rx:\s*14,\s*ry:\s*14/);
  assert.match(refSrc, /function buildCubicEdgePath\(/);
  assert.equal(/[\u2014\u2013]/.test(refSrc), false);
});

test('v2.4 sculpted widget radii & perceptual mineral palette: zero 2px sharp button regressions', () => {
  const fs = require('node:fs');
  const siteCss = fs.readFileSync(new URL('../styles/site.css', import.meta.url), 'utf8');
  const refCss = fs.readFileSync(new URL('../webos/refractory.css', import.meta.url), 'utf8');
  const expSrc = fs.readFileSync(new URL('../webos/exporter.js', import.meta.url), 'utf8');

  assert.match(siteCss, /--aether-r-shell:\s*28px/);
  assert.match(siteCss, /--aether-r-pill:\s*999px/);
  assert.match(refCss, /--aw-r-shell:\s*28px/);
  assert.match(refCss, /--aw-r-card:\s*20px/);
  assert.match(refCss, /--aw-r-dossier:\s*18px/);
  assert.match(refCss, /--aw-r-ctrl:\s*12px/);
  assert.match(refCss, /--aw-r-pill:\s*999px/);

  for (const [name, src] of [['styles/site.css', siteCss], ['webos/refractory.css', refCss], ['webos/exporter.js', expSrc]]) {
    assert.equal(/border-radius:\s*2px/i.test(src), false, `2px border-radius regression in ${name}`);
    assert.equal(/#67CEFA|#4ADE80|#F87171/i.test(src), false, `stock color regression in ${name}`);
    assert.equal(/transition:\s*all\b/i.test(src), false, `transition: all in ${name}`);
    assert.equal(/backdrop-filter|drop-shadow|mask-image/i.test(src), false, `expensive blur/filter/mask rule in ${name}`);
    assert.equal(/[\u2014\u2013]/.test(src), false, `em/en dash in ${name}`);
  }
});

test('v2.4 HiDPI / 4K geological assets & provenance sidecars exist on disk', () => {
  const fs = require('node:fs');
  const assets = [
    'meteor-preimpact.webp',
    'meteor-detonation.webp',
    'meteorite-crust.webp',
    'shard-01.webp',
    'shard-02.webp',
    'impact-void.webp',
    'artifact-poster.webp',
    'artifact-mercury.webp',
    'artifact-crystal.webp'
  ];
  for (const file of assets) {
    const webpUrl = new URL(`../assets/${file}`, import.meta.url);
    const jsonUrl = new URL(`../assets/${file}.json`, import.meta.url);
    assert.equal(fs.existsSync(webpUrl), true, `missing ${file}`);
    assert.ok(fs.statSync(webpUrl).size > 20000, `${file} too small`);
    assert.equal(fs.existsSync(jsonUrl), true, `missing sidecar ${file}.json`);
    const sidecar = JSON.parse(fs.readFileSync(jsonUrl, 'utf8'));
    assert.ok(typeof sidecar.prompt === 'string' && sidecar.prompt.length > 20, `invalid prompt in ${file}.json`);
  }
  const shaderSrc = fs.readFileSync(new URL('../webgl/artifact-shader.js', import.meta.url), 'utf8');
  assert.match(shaderSrc, /MAX_DPR\s*=\s*1\.75/);
  assert.match(shaderSrc, /MAX_BACKING_W\s*=\s*2560/);
  const stageSrc = fs.readFileSync(new URL('../scripts/stage-choreography.js', import.meta.url), 'utf8');
  assert.match(stageSrc, /predecodeStageMedia/);
});


function ltReq(origin, body) {
  const headers = { 'content-type': 'application/json', ...(origin ? { origin } : {}) };
  return new Request('https://t.test/api/live-token', { method: 'POST', headers, body: JSON.stringify(body || {}) });
}
async function withFetch(impl, fn) {
  const orig = globalThis.fetch;
  globalThis.fetch = impl;
  try { return await fn(); } finally { globalThis.fetch = orig; }
}
const OK_ORIGIN = 'https://eloquentwin.com';

test('live-token: missing key fails closed 503, bad or missing origin 403', async () => {
  assert.equal((await liveToken.fetch(ltReq(OK_ORIGIN), {})).status, 503);
  assert.equal((await liveToken.fetch(ltReq('https://evil.example'), { GEMINI_API_KEY: 'k' })).status, 403);
  assert.equal((await liveToken.fetch(ltReq(null), { GEMINI_API_KEY: 'k' })).status, 403);
});

test('live-token: Turnstile required and verified when configured', async () => {
  const env = { GEMINI_API_KEY: 'k', TURNSTILE_SECRET_KEY: 's' };
  assert.equal((await liveToken.fetch(ltReq(OK_ORIGIN), env)).status, 403);
  await withFetch(async () => new Response(JSON.stringify({ success: false })), async () => {
    assert.equal((await liveToken.fetch(ltReq(OK_ORIGIN, { turnstileToken: 'bad' }), env)).status, 403);
  });
  await withFetch(async () => new Response(JSON.stringify({ success: true, action: 'other', hostname: 'eloquentwin.com' })), async () => {
    assert.equal((await liveToken.fetch(ltReq(OK_ORIGIN, { turnstileToken: 'tok' }), env)).status, 403);
  });
  await withFetch(async () => new Response(JSON.stringify({ success: true, action: 'live_token', hostname: 'localhost' })), async () => {
    assert.equal((await liveToken.fetch(ltReq(OK_ORIGIN, { turnstileToken: 'tok' }), env)).status, 403);
  });
  await withFetch(async (u) => {
    if (String(u).includes('siteverify')) {
      return new Response(JSON.stringify({ success: true, action: 'live_token', hostname: 'eloquentwin.com' }));
    }
    return new Response(JSON.stringify({ name: 'auth_tokens/ts_ok' }));
  }, async () => {
    const ok = await liveToken.fetch(ltReq(OK_ORIGIN, { turnstileToken: 'good' }), env);
    assert.equal(ok.status, 200);
    assert.equal((await ok.json()).token, 'auth_tokens/ts_ok');
  });
});

test('live-token: valid request mints one-use token, no-store, never leaks the key', async () => {
  const SECRET = 'fixture_secret_key_value';
  let seen;
  await withFetch(async (u, init) => { seen = { u: String(u), init }; return new Response(JSON.stringify({ name: 'auth_tokens/abc' })); }, async () => {
    const res = await liveToken.fetch(ltReq(OK_ORIGIN), { GEMINI_API_KEY: SECRET });
    assert.equal(res.status, 200);
    assert.equal(res.headers.get('cache-control'), 'no-store');
    assert.equal(res.headers.get('vary'), 'Origin');
    assert.equal(res.headers.get('access-control-allow-origin'), OK_ORIGIN);
    const text = await res.text();
    assert.equal(text.includes(SECRET), false);
    assert.equal(JSON.parse(text).token, 'auth_tokens/abc');
    assert.match(seen.u, /v1alpha\/auth_tokens$/);
    assert.equal(JSON.parse(seen.init.body).uses, 1);
  });
});

test('bridge: capture_visitor_framework writes Discovery Framework, syncs quote, and validates args', () => {
  let md = '# Plan\n\n## Wave 0: Start\n- [ ] first [Wave 0]\n\n## Lexicon\n- **old**: term\n';
  let synced = null;
  const host = { getText: () => md, setText: (s) => { md = s; }, selectTab: () => {}, syncQuote: (fw) => { synced = fw; } };
  assert.match(bridge.SYSTEM_TEXT, /goals.*pain points.*bottlenecks/i);
  assert.match(bridge.DISCOVERY_GREETING, /goal.*pain point.*bottleneck/i);
  assert.equal(bridge.applyToolCall({ name: 'capture_visitor_framework', args: { goal: 'Ship site', pain_point: '', bottleneck: 'DNS' } }, host).ok, false);
  const res = bridge.applyToolCall({
    name: 'capture_visitor_framework',
    args: {
      goal: 'Automate intake — cleanly',
      pain_point: 'Manual triage <script>',
      bottleneck: 'Slow quotes',
      recommended_track: 'UNKNOWN_TRACK',
      light_demo_idea: 'Interactive scope preview'
    }
  }, host);
  assert.equal(res.ok, true);
  assert.match(md, /## Discovery Framework/);
  assert.match(md, /- \*\*Goal\*\*: Automate intake - cleanly/);
  assert.match(md, /- \*\*Pain point\*\*: Manual triage script/);
  assert.match(md, /- \*\*Bottleneck\*\*: Slow quotes/);
  assert.match(md, /- \*\*Track\*\*: hybrid-suite/);
  assert.match(md, /- \*\*Light demo\*\*: Interactive scope preview/);
  assert.deepEqual(synced, {
    goal: 'Automate intake - cleanly',
    pain_point: 'Manual triage script',
    bottleneck: 'Slow quotes',
    recommended_track: 'hybrid-suite',
    light_demo_idea: 'Interactive scope preview'
  });
});

test('live-token worker: POST /api/quote stores valid capsules in KV and rejects bad origins or schemas', async () => {
  const kv = mockKv();
  const qReq = (origin, body) => new Request('https://t.test/api/quote', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(origin ? { origin } : {}) },
    body: JSON.stringify(body),
  });
  assert.equal((await liveToken.fetch(qReq('https://evil.example', {}), { TOKEN_RATE_KV: kv })).status, 403);
  assert.equal((await liveToken.fetch(qReq(OK_ORIGIN, { schema: 'wrong' }), { TOKEN_RATE_KV: kv })).status, 400);
  const okRes = await liveToken.fetch(
    qReq(OK_ORIGIN, { schema: 'aether.quote.capsule.v1', ref_id: 'AEQ-1234-ABCD', brief: 'Goal: ship fast' }),
    { TOKEN_RATE_KV: kv }
  );
  assert.equal(okRes.status, 200);
  const okBody = await okRes.json();
  assert.equal(okBody.ref_id, 'AEQ-1234-ABCD');
  assert.equal(okBody.refId, 'AEQ-1234-ABCD');
  assert.equal(kv._m.size, 1);

  const syn = funding.synthesizeQuoteScope({
    name: 'Test User',
    contact: 'test@example.com',
    track: 'webos-kit',
    timeline: '2-to-4-weeks',
    brief: 'Verify camelCase refId capsule saves cleanly.'
  });
  const synRes = await liveToken.fetch(
    qReq(OK_ORIGIN, syn.capsule),
    { TOKEN_RATE_KV: kv }
  );
  assert.equal(synRes.status, 200);
  const synBody = await synRes.json();
  assert.equal(synBody.refId, syn.refId);
  assert.equal(synBody.ref_id, syn.refId);
  assert.equal(kv._m.size, 2);
});

test('a2a: .well-known/agent.json is valid and points to eloquentwin.com', () => {
  const fs = require('node:fs');
  const card = JSON.parse(fs.readFileSync(new URL('../.well-known/agent.json', import.meta.url), 'utf8'));
  assert.equal(card.protocolVersion, '1.0.1');
  assert.equal(card.url, 'https://eloquentwin.com/');
  assert.equal(card.contact, 'eloquent@eloquentwin.com');

  const robots = fs.readFileSync(new URL('../robots.txt', import.meta.url), 'utf8');
  assert.match(robots, /Sitemap:\s*https:\/\/eloquentwin\.com\/sitemap\.xml/);
  assert.match(robots, /User-agent:\s*Googlebot/);
  assert.match(robots, /User-agent:\s*OAI-SearchBot/);

  const sitemap = fs.readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.match(sitemap, /<loc>https:\/\/eloquentwin\.com\/<\/loc>/);
  assert.match(sitemap, /<loc>https:\/\/eloquentwin\.com\/llms\.txt<\/loc>/);

  const llms = fs.readFileSync(new URL('../llms.txt', import.meta.url), 'utf8');
  assert.match(llms, /3-Track Offer Catalog/);
  assert.match(llms, /eloquent@eloquentwin\.com/);
  assert.equal(/[\u2014\u2013]/.test(llms), false);

  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /"hasOfferCatalog"/);
  assert.match(html, /"ProfessionalService"/);
  assert.match(html, /"areaServed"/);
});
