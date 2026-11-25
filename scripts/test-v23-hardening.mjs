/* Hardening tests for v2.3: funding webhook worker and Gemini Live bridge protocol.
   Run: node scripts/test-v23-hardening.mjs   (Node built-ins only, no packages) */
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import worker from '../workers/funding-webhook.js';

const require = createRequire(import.meta.url);
const bridge = require('../webos/live-bridge.js');

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
  assert.equal(decls.length, 3);
  for (const d of decls) assert.equal(d.behavior, 'NON_BLOCKING');
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
  assert.match(u, /^wss:\/\/generativelanguage\.googleapis\.com\/ws\/google\.ai\.generativelanguage\.v1beta\.GenerativeService\.BidiGenerateContent[?]access_token=auth_tokens%2Fabc123$/);
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
  for (const bad of ['localStorage', 'sessionStorage', 'document.cookie', 'indexedDB', 'sendBeacon', 'XMLHttpRequest', 'fetch(', 'eval(']) {
    assert.equal(src.includes(bad), false, `forbidden: ${bad}`);
  }
  assert.equal((src.match(/new WebSocket\(/g) || []).length, 1);
  assert.ok(src.indexOf('new WebSocket(') > src.indexOf("el.connect.addEventListener('click'"));
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
