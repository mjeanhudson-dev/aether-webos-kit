/* ==========================================================================
   Aether Live Co-Pilot bridge (Gemini 3.8 Live over WebSocket, zero dependencies, UMD)
   Author: Eloquent (@mjeanhudson-dev)

   - Nothing connects on page load. The socket opens only after the user presses Connect.
   - Auth: Gemini EPHEMERAL TOKEN only (the value of token.name from auth_tokens.create),
     sent as the access_token query parameter on the v1alpha BidiGenerateContentConstrained endpoint (the plain endpoint rejects ephemeral tokens). A raw
     API key (AIza...) is rejected. The token lives in a closure variable only, is never
     written to storage, exports, or capsules, and is wiped as soon as the URL is built.
   - Pure protocol builders and the tool applier are exported so Node can test them offline.
   - Optional 1-click mode: set data-live-token-endpoint (https only) on #aether-live-copilot; with an empty token box, Connect POSTs there for a one-use token.
    - shortcut: the placement of thinkingConfig inside generationConfig, the text-only
     response modality, and the toolResponse body are NOT yet verified against a live
     server; run one real session before relying on them. If your token is locked with
     live_connect_constraints, pick the matching model option or the server may reject setup.
   - shortcut: the mic uses ScriptProcessor (deprecated but universal); move to AudioWorklet
     if browsers drop it.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.AetherLiveBridge = factory();
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  var WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained';
  var MODEL_LIVE = 'models/gemini-3.8-live';
  var MODEL_THINKING = 'models/gemini-3.8-live-extended-thinking';
  var VIEWS = ['mindmap', 'dualview', 'lexicon', 'capsule'];
  var TRACKS = ['offline-workspace', 'local-ai-vault', 'custom-webos-site', 'hybrid-suite'];
  var MAX_TOOL_CALLS = 30;
  var MAX_LOG_LINES = 200;
  var DASHES = new RegExp('[\\u2013\\u2014]', 'g');
  var CONTROLS = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f\\u2028\\u2029]', 'g');
  var MD_SPECIALS = new RegExp('[\\[\\]()<>*`\\\\{}|]', 'g');

  var DISCOVERY_GREETING = 'Greet the visitor in one short, plain sentence and ask what they are trying to achieve by visiting - their main goal, biggest pain point, or bottleneck - so you can map a quick framework together for a custom light demo.';

  var SYSTEM_TEXT = 'You are the discovery co-pilot inside the Aether WebOS studio. Speak plainly and briefly, one question at a time. '
    + 'Your main job is to ask visitors what they are trying to achieve on this site: their goals, pain points, and bottlenecks. '
    + 'As soon as you have a clear goal, pain point, and bottleneck, synthesize a concise framework and call capture_visitor_framework '
    + 'with a recommended_track (offline-workspace, local-ai-vault, custom-webos-site, or hybrid-suite) and a concrete light_demo_idea so Eloquent can build them a light demo. '
    + 'Also call append_floorplan_task for specific plan tasks, define_lexicon_term when they define a word, and select_studio_view to switch views. Never invent facts.';

  // Strips control and line-separator characters, dashes, and markdown/HTML specials, then
  // truncates by code point so a surrogate pair is never cut in half.
  function clean(value, max) {
    var s = String(value).replace(DASHES, '-').replace(CONTROLS, ' ').replace(MD_SPECIALS, '').replace(/\s+/g, ' ').trim();
    return Array.from(s).slice(0, max).join('').trim();
  }

  function toolDeclarations() {
    return [{
      functionDeclarations: [
        {
          name: 'append_floorplan_task',
          description: 'Add one checklist task to the plan under a wave (0, 1 or 2).',
          behavior: 'NON_BLOCKING',
          parameters: { type: 'OBJECT', properties: { wave: { type: 'INTEGER' }, task: { type: 'STRING' } }, required: ['wave', 'task'] }
        },
        {
          name: 'define_lexicon_term',
          description: 'Add a plain-English term and its meaning to the Lexicon.',
          behavior: 'NON_BLOCKING',
          parameters: { type: 'OBJECT', properties: { term: { type: 'STRING' }, meaning: { type: 'STRING' } }, required: ['term', 'meaning'] }
        },
        {
          name: 'select_studio_view',
          description: 'Switch the studio to one view: mindmap, dualview, lexicon or capsule.',
          behavior: 'NON_BLOCKING',
          parameters: { type: 'OBJECT', properties: { view: { type: 'STRING' } }, required: ['view'] }
        },
        {
          name: 'capture_visitor_framework',
          description: 'Record the visitor goals, pain points, bottlenecks, and recommended light-demo framework.',
          behavior: 'NON_BLOCKING',
          parameters: {
            type: 'OBJECT',
            properties: {
              goal: { type: 'STRING' },
              pain_point: { type: 'STRING' },
              bottleneck: { type: 'STRING' },
              recommended_track: { type: 'STRING' },
              light_demo_idea: { type: 'STRING' }
            },
            required: ['goal', 'pain_point', 'bottleneck']
          }
        }
      ]
    }];
  }

  function buildSetupMessage(opts) {
    var o = opts || {};
    var generationConfig = { responseModalities: [o.audio ? 'AUDIO' : 'TEXT'] };
    if (o.extendedThinking) generationConfig.thinkingConfig = { thinkingLevel: 'low' };
    var setup = {
      model: o.extendedThinking ? MODEL_THINKING : MODEL_LIVE,
      generationConfig: generationConfig,
      systemInstruction: { parts: [{ text: SYSTEM_TEXT }] },
      tools: toolDeclarations()
    };
    if (o.audio) {
      setup.inputAudioTranscription = { mode: 'SMART' };
      setup.outputAudioTranscription = {};
    }
    return { setup: setup };
  }

  function buildRealtimeTextMessage(text) {
    return { realtimeInput: { text: String(text) } };
  }

  function buildRealtimeAudioMessage(base64Pcm16k) {
    return { realtimeInput: { audio: { data: base64Pcm16k, mimeType: 'audio/pcm;rate=16000' } } };
  }

  function buildAudioStreamEndMessage() {
    return { realtimeInput: { audioStreamEnd: true } };
  }

  function buildToolResponse(calls) {
    return {
      toolResponse: {
        functionResponses: (calls || []).map(function (c) {
          return { id: c.id, name: c.name, response: { result: c.ok === false ? 'rejected' : 'ok' } };
        })
      }
    };
  }

  function validateToken(token) {
    var t = String(token == null ? '' : token).trim();
    if (!t) throw new Error('An ephemeral token is required.');
    if (/^AIza/.test(t) || /\s/.test(t)) throw new Error('That looks like an API key. Paste an ephemeral token instead.');
    return t;
  }

  function buildSocketUrl(token) {
    return WS_BASE + '?access_token=' + encodeURIComponent(validateToken(token));
  }

  // Processes EVERY part of an event, never just the first, and tolerates malformed entries.
  function parseServerEvent(msg) {
    var m = (msg && typeof msg === 'object') ? msg : {};
    var sc = (m.serverContent && typeof m.serverContent === 'object') ? m.serverContent : {};
    var out = {
      setupComplete: Boolean(m.setupComplete),
      audioChunks: [],
      text: [],
      inputTranscription: '',
      outputTranscription: '',
      interrupted: sc.interrupted === true,
      turnComplete: sc.turnComplete === true,
      interactionStatus: m.interactionStatus || sc.interactionStatus || null,
      functionCalls: [],
      cancelledCalls: [],
      goAway: Boolean(m.goAway)
    };
    var parts = sc.modelTurn && Array.isArray(sc.modelTurn.parts) ? sc.modelTurn.parts : [];
    for (var i = 0; i < parts.length; i++) {
      var p = parts[i];
      if (!p || typeof p !== 'object') continue;
      if (p.inlineData && typeof p.inlineData.data === 'string' && p.inlineData.data) out.audioChunks.push(p.inlineData.data);
      if (typeof p.text === 'string') out.text.push(p.text);
    }
    if (sc.inputTranscription && typeof sc.inputTranscription.text === 'string') out.inputTranscription = sc.inputTranscription.text;
    if (sc.outputTranscription && typeof sc.outputTranscription.text === 'string') out.outputTranscription = sc.outputTranscription.text;
    var fcs = m.toolCall && Array.isArray(m.toolCall.functionCalls) ? m.toolCall.functionCalls : [];
    for (var j = 0; j < fcs.length; j++) {
      var f = fcs[j];
      if (!f || typeof f !== 'object' || typeof f.name !== 'string') continue;
      out.functionCalls.push({ id: f.id, name: f.name, args: (f.args && typeof f.args === 'object') ? f.args : {} });
    }
    if (m.toolCallCancellation && Array.isArray(m.toolCallCancellation.ids)) out.cancelledCalls = m.toolCallCancellation.ids.slice();
    return out;
  }

  // Line-anchored insertion. headerRe must match a whole heading line; headerText is what is
  // created if the section is missing. Fenced code blocks are skipped. A section ends at the
  // next H1 or H2. If a Wave section is missing it is created before Lexicon/Wiki/Soul.
  function insertIntoSection(markdown, headerRe, headerText, line) {
    var lines = String(markdown || '').replace(/\r\n?/g, '\n').split('\n');
    var inFence = false, start = -1, end = lines.length, firstTail = -1, i, l;
    for (i = 0; i < lines.length; i++) {
      l = lines[i];
      if (/^\s*```/.test(l)) { inFence = !inFence; continue; }
      if (inFence) continue;
      if (start === -1 && headerRe.test(l)) { start = i; continue; }
      if (start !== -1 && /^#{1,2}\s/.test(l)) { end = i; break; }
    }
    if (start === -1) {
      inFence = false;
      for (i = 0; i < lines.length; i++) {
        l = lines[i];
        if (/^\s*```/.test(l)) { inFence = !inFence; continue; }
        if (!inFence && /^## (Lexicon|Wiki|Soul)\b/.test(l)) { firstTail = i; break; }
      }
      var block = [headerText, line, ''];
      if (firstTail === -1) {
        while (lines.length && lines[lines.length - 1] === '') lines.pop();
        return lines.concat(['', headerText, line, '']).join('\n');
      }
      lines.splice.apply(lines, [firstTail, 0].concat(block));
      return lines.join('\n');
    }
    var last = end - 1;
    while (last > start && lines[last].trim() === '') last--;
    lines.splice(last + 1, 0, line);
    return lines.join('\n');
  }

  // host = { getText(), setText(str), selectTab(id) }. Returns { ok, error? }.
  function applyToolCall(call, host) {
    var a = (call && call.args && typeof call.args === 'object') ? call.args : {};
    if (!host) return { ok: false, error: 'no host' };
    var name = call && call.name;
    if (name === 'append_floorplan_task') {
      var waveOk = (typeof a.wave === 'number' && (a.wave === 0 || a.wave === 1 || a.wave === 2))
        || (typeof a.wave === 'string' && /^[012]$/.test(a.wave));
      var task = typeof a.task === 'string' ? clean(a.task, 200) : '';
      if (!waveOk || !task) return { ok: false, error: 'bad task arguments' };
      var wave = Number(a.wave);
      host.setText(insertIntoSection(host.getText(), new RegExp('^## Wave ' + wave + '(?![0-9])'), '## Wave ' + wave + ': Added by voice',
        '- [ ] ' + task + ' [Wave ' + wave + ']'));
      return { ok: true };
    }
    if (name === 'define_lexicon_term') {
      var term = typeof a.term === 'string' ? clean(a.term, 60) : '';
      var meaning = typeof a.meaning === 'string' ? clean(a.meaning, 240) : '';
      if (!term || !meaning) return { ok: false, error: 'bad lexicon arguments' };
      host.setText(insertIntoSection(host.getText(), /^## Lexicon\b/, '## Lexicon', '- **' + term + '**: ' + meaning));
      return { ok: true };
    }
    if (name === 'select_studio_view') {
      var view = typeof a.view === 'string' ? a.view.toLowerCase() : '';
      if (VIEWS.indexOf(view) === -1) return { ok: false, error: 'unknown view' };
      host.selectTab(view);
      return { ok: true };
    }
    if (name === 'capture_visitor_framework') {
      var goal = typeof a.goal === 'string' ? clean(a.goal, 220) : '';
      var pain = typeof a.pain_point === 'string' ? clean(a.pain_point, 220) : '';
      var bottle = typeof a.bottleneck === 'string' ? clean(a.bottleneck, 220) : '';
      if (!goal || !pain || !bottle) return { ok: false, error: 'bad framework arguments' };
      var rawTrack = typeof a.recommended_track === 'string' ? a.recommended_track.trim().toLowerCase() : '';
      var track = TRACKS.indexOf(rawTrack) !== -1 ? rawTrack : 'hybrid-suite';
      var demo = typeof a.light_demo_idea === 'string' ? clean(a.light_demo_idea, 220) : '';
      var md = host.getText();
      md = insertIntoSection(md, /^## Discovery Framework\b/, '## Discovery Framework', '- **Goal**: ' + goal);
      md = insertIntoSection(md, /^## Discovery Framework\b/, '## Discovery Framework', '- **Pain point**: ' + pain);
      md = insertIntoSection(md, /^## Discovery Framework\b/, '## Discovery Framework', '- **Bottleneck**: ' + bottle);
      md = insertIntoSection(md, /^## Discovery Framework\b/, '## Discovery Framework', '- **Track**: ' + track);
      if (demo) md = insertIntoSection(md, /^## Discovery Framework\b/, '## Discovery Framework', '- **Light demo**: ' + demo);
      host.setText(md);
      if (typeof host.syncQuote === 'function') {
        host.syncQuote({ goal: goal, pain_point: pain, bottleneck: bottle, recommended_track: track, light_demo_idea: demo });
      }
      return { ok: true };
    }
    return { ok: false, error: 'unknown tool' };
  }

  function b64FromBytes(bytes) {
    var s = '';
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }

  function bytesFromB64(b64) {
    var bin = atob(b64);
    var out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  /* ----------------------------------------------------------- Browser UI ---- */
  function mount(details) {
    if (!details || details.getAttribute('data-live-ready') === '1') return;
    details.setAttribute('data-live-ready', '1');
    var body = details.querySelector('[data-live-body]');
    if (!body) return;

    body.innerHTML =
      '<p class="live-copilot__note">Connect to map your goals, pain points, and bottlenecks with Gemini into a structured framework for a custom light demo. Nothing connects until you press Connect; tokens stay in tab memory only.</p>' +
      '<div class="live-copilot__row">' +
        '<label class="live-copilot__field">Model<select data-live-model>' +
          '<option value="live">Gemini 3.8 Live (voice)</option>' +
          '<option value="thinking">Gemini 3.8 Live Extended Thinking (voice)</option>' +
          '<option value="text">Gemini 3.8 Live (text only)</option>' +
        '</select></label>' +
        '<label class="live-copilot__field">Ephemeral token<input data-live-token type="password" autocomplete="off" spellcheck="false"></label>' +
      '</div>' +
      '<div class="live-copilot__turnstile" data-live-turnstile></div>' +
      '<div class="live-copilot__row">' +
        '<button type="button" class="btn btn--primary" data-live-connect>Connect</button>' +
        '<button type="button" class="btn btn--ghost" data-live-disconnect disabled>Disconnect</button>' +
        '<button type="button" class="btn btn--ghost" data-live-talk disabled>' +
          '<svg class="btn__icon" width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">' +
            '<rect x="5.5" y="1.75" width="5" height="7.5" rx="2.5" stroke="currentColor" stroke-width="1.4"/>' +
            '<path d="M3.25 7.25a4.75 4.75 0 0 0 9.5 0M8 12v2.25M5.5 14.25h5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>' +
          '</svg>' +
          '<span>Hold to talk</span>' +
        '</button>' +
        '<a class="btn btn--ghost" href="#act-contact" data-live-handoff hidden>Send framework for a light demo</a>' +
        '<span class="live-copilot__status" data-live-status role="status" aria-live="polite">Not connected</span>' +
      '</div>' +
      '<form class="live-copilot__row" data-live-form>' +
        '<label class="live-copilot__field live-copilot__field--grow">Tell Gemini your goals or bottlenecks<input data-live-text type="text" autocomplete="off" disabled></label>' +
        '<button type="submit" class="btn btn--ghost" data-live-send disabled>Send</button>' +
      '</form>' +
      '<pre class="live-copilot__log" data-live-log aria-live="polite"></pre>';

    var q = function (s) { return body.querySelector(s); };
    var el = { model: q('[data-live-model]'), token: q('[data-live-token]'), turnstile: q('[data-live-turnstile]'),
      connect: q('[data-live-connect]'), disconnect: q('[data-live-disconnect]'), talk: q('[data-live-talk]'),
      handoff: q('[data-live-handoff]'), status: q('[data-live-status]'), form: q('[data-live-form]'),
      text: q('[data-live-text]'), send: q('[data-live-send]'), log: q('[data-live-log]') };

    var ws = null, micCtx = null, micStream = null, micNode = null, playCtx = null, playHead = 0, sources = [];
    var talking = false, micGen = 0, toolCount = 0, logLines = [], sessionAudio = false, greeted = false;
    var tsWidgetId = null, tsToken = '';

    function g() { return typeof globalThis !== 'undefined' ? globalThis : window; }
    function log(line) {
      logLines.push(String(line).slice(0, 400));
      if (logLines.length > MAX_LOG_LINES) logLines = logLines.slice(-MAX_LOG_LINES);
      el.log.textContent = logLines.join('\n');
      el.log.scrollTop = el.log.scrollHeight;
    }
    function setStatus(s) { el.status.textContent = s; }
    function setConnected(on, ready, audio) {
      el.connect.disabled = on;
      el.disconnect.disabled = !on;
      el.talk.disabled = !(on && ready && audio);
      el.text.disabled = !(on && ready);
      el.send.disabled = !(on && ready);
    }

    function editor() {
      var t = document.getElementById('aw-note-input');
      if (!t && g().AetherRefractory && g().AetherRefractory.mount) {
        try { g().AetherRefractory.mount('#aether-webos-mount'); } catch (e) { /* studio not mountable yet */ }
        t = document.getElementById('aw-note-input');
      }
      return t;
    }
    var host = {
      getText: function () { var t = editor(); return t ? t.value : ''; },
      setText: function (s) {
        var t = editor();
        if (!t) throw new Error('Studio editor not ready');
        t.value = s;
        t.dispatchEvent(new Event('input', { bubbles: true }));
      },
      selectTab: function (id) {
        if (g().AetherRefractory && g().AetherRefractory.selectTab) g().AetherRefractory.selectTab(id);
      },
      syncQuote: function (fw) {
        var trackEl = document.getElementById('quote-track');
        if (trackEl && fw.recommended_track) {
          trackEl.value = fw.recommended_track;
          trackEl.dispatchEvent(new Event('change', { bubbles: true }));
        }
        var briefEl = document.getElementById('quote-brief');
        if (briefEl) {
          var parts = [
            'Goal: ' + fw.goal,
            'Pain point: ' + fw.pain_point,
            'Bottleneck: ' + fw.bottleneck
          ];
          if (fw.light_demo_idea) parts.push('Light demo idea: ' + fw.light_demo_idea);
          briefEl.value = parts.join('\n');
          briefEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (el.handoff) el.handoff.hidden = false;
      }
    };

    function flushPlayback() {
      sources.forEach(function (s) { try { s.stop(); } catch (e) { /* already ended */ } });
      sources = [];
      playHead = 0;
    }
    function playPcm24k(b64) {
      try {
        var bytes = bytesFromB64(b64);
        var n = Math.floor(bytes.byteLength / 2);
        if (n < 1) return;
        if (!playCtx) playCtx = new (g().AudioContext || g().webkitAudioContext)({ sampleRate: 24000 });
        var view = new DataView(bytes.buffer, bytes.byteOffset, n * 2);
        var buf = playCtx.createBuffer(1, n, 24000);
        var ch = buf.getChannelData(0);
        for (var i = 0; i < n; i++) ch[i] = view.getInt16(i * 2, true) / 32768;
        var src = playCtx.createBufferSource();
        src.buffer = buf;
        src.connect(playCtx.destination);
        var at = Math.max(playCtx.currentTime, playHead);
        src.start(at);
        playHead = at + buf.duration;
        sources.push(src);
        src.onended = function () { sources = sources.filter(function (s) { return s !== src; }); };
      } catch (e) { /* skip a bad audio chunk, keep the rest of the event */ }
    }

    function send(obj) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(obj)); }

    function onMessage(socket, data) {
      if (socket !== ws || typeof data !== 'string') return;
      var parsed;
      try { parsed = JSON.parse(data); } catch (e) { return; }
      var ev = parseServerEvent(parsed);
      if (ev.setupComplete) {
        setConnected(true, true, sessionAudio);
        setStatus('Ready');
        if (!greeted) {
          greeted = true;
          send(buildRealtimeTextMessage(DISCOVERY_GREETING));
        }
      }
      if (ev.interrupted) flushPlayback();
      else ev.audioChunks.forEach(playPcm24k);
      if (ev.text.length) log('Co-pilot: ' + ev.text.join(''));
      if (ev.inputTranscription) log('You: ' + ev.inputTranscription);
      if (ev.outputTranscription) log('Co-pilot: ' + ev.outputTranscription);
      if (ev.interactionStatus === 'IN_PROGRESS') setStatus('Thinking');
      else if (ev.interactionStatus === 'IDLE') setStatus('Ready');
      if (ev.goAway) log('Server asked to wrap up this session soon.');
      if (ev.cancelledCalls.length) log('Server cancelled ' + ev.cancelledCalls.length + ' tool call(s) that may already have been applied.');
      if (ev.functionCalls.length) {
        var results = ev.functionCalls.map(function (c) {
          var r;
          if (toolCount >= MAX_TOOL_CALLS) r = { ok: false, error: 'tool call limit reached' };
          else {
            toolCount++;
            try { r = applyToolCall(c, host); } catch (e) { r = { ok: false, error: String(e && e.message || e) }; }
          }
          log('Tool ' + String(c.name).slice(0, 40) + ': ' + (r.ok ? 'applied' : 'rejected (' + r.error + ')'));
          return { id: c.id, name: c.name, ok: r.ok };
        });
        send(buildToolResponse(results));
      }
    }

    function stopMic() {
      micGen++;
      talking = false;
      if (micNode) { try { micNode.onaudioprocess = null; micNode.disconnect(); } catch (e) { /* ignore */ } micNode = null; }
      if (micStream) { micStream.getTracks().forEach(function (t) { t.stop(); }); micStream = null; }
      if (micCtx) { try { micCtx.close(); } catch (e) { /* ignore */ } micCtx = null; }
    }

    function disconnect(reason) {
      stopMic();
      flushPlayback();
      if (playCtx) { try { playCtx.close(); } catch (e) { /* ignore */ } playCtx = null; }
      var s = ws;
      ws = null;
      if (s) { try { s.close(); } catch (e) { /* ignore */ } }
      el.token.value = '';
      toolCount = 0;
      greeted = false;
      setConnected(false, false, false);
      setStatus(reason || 'Not connected');
    }

    if (el.handoff) {
      el.handoff.addEventListener('click', function () {
        var brief = document.getElementById('quote-brief');
        if (brief && !brief.value.trim()) {
          var raw = host.getText();
          if (raw) {
            brief.value = raw.slice(0, 1800);
            brief.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      });
    }

    var tokenEndpoint = (details.getAttribute('data-live-token-endpoint') || '').trim();
    var tsSitekey = (details.getAttribute('data-turnstile-sitekey') || '').trim();
    function drawTurnstile() {
      if (!tsSitekey || !el.turnstile || tsWidgetId != null || !g().turnstile || !g().turnstile.render) return;
      tsWidgetId = g().turnstile.render(el.turnstile, {
        sitekey: tsSitekey,
        action: 'live_token',
        callback: function (t) { tsToken = t || ''; },
        'expired-callback': function () { tsToken = ''; },
        'error-callback': function () { tsToken = ''; }
      });
    }
    if (tsSitekey && el.turnstile) {
      if (g().turnstile && g().turnstile.render) drawTurnstile();
      else if (!document.getElementById('cf-turnstile-api')) {
        var sc = document.createElement('script');
        sc.id = 'cf-turnstile-api';
        sc.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        sc.async = true;
        sc.defer = true;
        sc.onload = drawTurnstile;
        document.head.appendChild(sc);
      }
    }
    function resetTurnstile() {
      tsToken = '';
      if (tsWidgetId != null && g().turnstile && g().turnstile.reset) g().turnstile.reset(tsWidgetId);
    }

    el.connect.addEventListener('click', function () {
      var typed = el.token.value;
      el.token.value = '';
      if (typed.trim() || !tokenEndpoint) { startSession(typed); return; }
      if (!/^https:\/\//i.test(tokenEndpoint)) { setStatus('Token endpoint must be https'); return; }
      var ts = tsToken || (g().turnstile && g().turnstile.getResponse ? (tsWidgetId != null ? g().turnstile.getResponse(tsWidgetId) : g().turnstile.getResponse()) : undefined);
      if (tsSitekey && !ts) { setStatus('Complete verification check first'); return; }
      setStatus('Requesting token');
      el.connect.disabled = true;
      fetch(tokenEndpoint, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ turnstileToken: ts }), credentials: 'omit' })
        .then(function (r) { if (!r.ok) throw new Error('Token request refused (' + r.status + ')'); return r.json(); })
        .then(function (j) { resetTurnstile(); startSession(j && j.token); })
        .catch(function (e) { resetTurnstile(); el.connect.disabled = false; setStatus(String(e && e.message || e)); });
    });
    function startSession(tokenValue) {
      var mode = el.model.value;
      var audio = mode !== 'text';
      var url;
      try { url = buildSocketUrl(tokenValue); } catch (e) { el.connect.disabled = false; setStatus(String(e.message || e)); return; }
      sessionAudio = audio;
      setStatus('Connecting');
      el.connect.disabled = true;
      var socket;
      try { socket = new WebSocket(url); } catch (e) { disconnect('Could not open the connection'); return; }
      ws = socket;
      socket.binaryType = 'arraybuffer';
      socket.onopen = function () {
        if (socket !== ws) return;
        send(buildSetupMessage({ audio: audio, extendedThinking: mode === 'thinking' }));
        setConnected(true, false, audio);
        setStatus('Setting up');
      };
      socket.onmessage = function (evt) {
        var d = evt.data;
        if (d instanceof ArrayBuffer) d = new TextDecoder().decode(d);
        onMessage(socket, d);
      };
      socket.onerror = function () { if (socket === ws) setStatus('Connection error'); };
      socket.onclose = function () { if (socket === ws) disconnect('Disconnected'); };
    }
    el.disconnect.addEventListener('click', function () { disconnect('Disconnected'); });

    el.form.addEventListener('submit', function (e) {
      e.preventDefault();
      var t = el.text.value.trim();
      if (!t || el.text.disabled) return;
      send(buildRealtimeTextMessage(t));
      log('You: ' + t);
      el.text.value = '';
    });

    function startTalk() {
      if (talking || el.talk.disabled || !ws) return;
      talking = true;
      flushPlayback();
      var gen = ++micGen;
      var Ctx = g().AudioContext || g().webkitAudioContext;
      navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true } }).then(function (stream) {
        if (gen !== micGen || !talking || !ws) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
        micStream = stream;
        try {
          micCtx = new Ctx({ sampleRate: 16000 });
          var src = micCtx.createMediaStreamSource(stream);
          var proc = micCtx.createScriptProcessor(2048, 1, 1);
          proc.onaudioprocess = function (ev) {
            if (!ws || ws.bufferedAmount > 1048576) return;
            var f = ev.inputBuffer.getChannelData(0);
            var pcm = new Int16Array(f.length);
            for (var i = 0; i < f.length; i++) { var s = Math.max(-1, Math.min(1, f[i])); pcm[i] = s < 0 ? s * 32768 : s * 32767; }
            send(buildRealtimeAudioMessage(b64FromBytes(new Uint8Array(pcm.buffer))));
          };
          src.connect(proc);
          proc.connect(micCtx.destination);
          micNode = proc;
          setStatus('Listening');
        } catch (e) { stopMic(); setStatus('Microphone unavailable'); }
      }).catch(function () { if (gen === micGen) { stopMic(); setStatus('Microphone blocked'); } });
    }
    function endTalk() {
      if (!talking) return;
      stopMic();
      send(buildAudioStreamEndMessage());
      setStatus('Ready');
    }
    el.talk.addEventListener('pointerdown', function (e) { try { el.talk.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ } startTalk(); });
    el.talk.addEventListener('pointerup', endTalk);
    el.talk.addEventListener('pointercancel', endTalk);
    el.talk.addEventListener('lostpointercapture', endTalk);
    el.talk.addEventListener('blur', endTalk);
    el.talk.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!e.repeat) startTalk(); } });
    el.talk.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); endTalk(); } });
    document.addEventListener('visibilitychange', function () { if (document.hidden) endTalk(); });
    window.addEventListener('pagehide', function () { disconnect('Not connected'); });
  }

  function autoMount() {
    if (typeof document === 'undefined') return;
    var d = document.getElementById('aether-live-copilot');
    if (!d) return;
    d.addEventListener('toggle', function () { if (d.open) mount(d); });
    if (d.open || (typeof location !== 'undefined' && location.hash === '#aether-live-copilot')) {
      d.open = true;
      mount(d);
    }
    var triggers = document.querySelectorAll('[data-aether-open-copilot]');
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', function (e) {
        e.preventDefault();
        d.open = true;
        mount(d);
        if (typeof d.scrollIntoView === 'function') d.scrollIntoView({ behavior: 'smooth', block: 'center' });
        var c = d.querySelector('[data-live-connect]');
        if (c && typeof c.focus === 'function') setTimeout(function () { c.focus({ preventScroll: true }); }, 220);
      });
    }
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
    else autoMount();
  }

  return {
    version: '2.5.0',
    WS_BASE: WS_BASE,
    MODEL_LIVE: MODEL_LIVE,
    MODEL_THINKING: MODEL_THINKING,
    TRACKS: TRACKS,
    DISCOVERY_GREETING: DISCOVERY_GREETING,
    SYSTEM_TEXT: SYSTEM_TEXT,
    buildSetupMessage: buildSetupMessage,
    buildRealtimeTextMessage: buildRealtimeTextMessage,
    buildRealtimeAudioMessage: buildRealtimeAudioMessage,
    buildAudioStreamEndMessage: buildAudioStreamEndMessage,
    buildToolResponse: buildToolResponse,
    buildSocketUrl: buildSocketUrl,
    parseServerEvent: parseServerEvent,
    applyToolCall: applyToolCall,
    insertIntoSection: insertIntoSection,
    clean: clean,
    mount: mount
  };
}));
