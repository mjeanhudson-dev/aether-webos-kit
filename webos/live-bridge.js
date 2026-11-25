/* ==========================================================================
   Aether Live Co-Pilot bridge (Gemini 3.8 Live over WebSocket, zero dependencies, UMD)
   Author: Eloquent (@mjeanhudson-dev)

   - Nothing connects on page load. The socket opens only after the user presses Connect.
   - Auth: Gemini EPHEMERAL TOKEN only (the value of token.name from auth_tokens.create),
     sent as the access_token query parameter on the v1beta endpoint, as documented. A raw
     API key (AIza...) is rejected. The token lives in a closure variable only, is never
     written to storage, exports, or capsules, and is wiped as soon as the URL is built.
   - Pure protocol builders and the tool applier are exported so Node can test them offline.
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

  var WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';
  var MODEL_LIVE = 'models/gemini-3.8-live';
  var MODEL_THINKING = 'models/gemini-3.8-live-extended-thinking';
  var VIEWS = ['mindmap', 'dualview', 'lexicon', 'capsule'];
  var MAX_TOOL_CALLS = 30;
  var MAX_LOG_LINES = 200;
  var DASHES = new RegExp('[\\u2013\\u2014]', 'g');
  var CONTROLS = new RegExp('[\\u0000-\\u001f\\u007f-\\u009f\\u2028\\u2029]', 'g');
  var MD_SPECIALS = new RegExp('[\\[\\]()<>*`\\\\{}|]', 'g');

  var SYSTEM_TEXT = 'You are the voice co-pilot inside the Aether WebOS studio. Speak plainly and briefly. '
    + 'When the user states a task, call append_floorplan_task. When they define a word, call define_lexicon_term. '
    + 'When they ask to see a different view, call select_studio_view. Never invent facts about their plan.';

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
      '<p class="live-copilot__note">Needs a Gemini ephemeral token (the token name from a server-side auth_tokens call). It stays in this tab\'s memory only, is cleared the moment you press Connect, and nothing connects until then. If your token is locked to one model, choose the matching option.</p>' +
      '<div class="live-copilot__row">' +
        '<label class="live-copilot__field">Model<select data-live-model>' +
          '<option value="live">Gemini 3.8 Live (voice)</option>' +
          '<option value="thinking">Gemini 3.8 Live Extended Thinking (voice)</option>' +
          '<option value="text">Gemini 3.8 Live (text only)</option>' +
        '</select></label>' +
        '<label class="live-copilot__field">Ephemeral token<input data-live-token type="password" autocomplete="off" spellcheck="false"></label>' +
      '</div>' +
      '<div class="live-copilot__row">' +
        '<button type="button" class="btn btn--primary" data-live-connect>Connect</button>' +
        '<button type="button" class="btn btn--ghost" data-live-disconnect disabled>Disconnect</button>' +
        '<button type="button" class="btn btn--ghost" data-live-talk disabled>Hold to talk</button>' +
        '<span class="live-copilot__status" data-live-status role="status" aria-live="polite">Not connected</span>' +
      '</div>' +
      '<form class="live-copilot__row" data-live-form>' +
        '<label class="live-copilot__field live-copilot__field--grow">Type to the co-pilot<input data-live-text type="text" autocomplete="off" disabled></label>' +
        '<button type="submit" class="btn btn--ghost" data-live-send disabled>Send</button>' +
      '</form>' +
      '<pre class="live-copilot__log" data-live-log aria-live="polite"></pre>';

    var q = function (s) { return body.querySelector(s); };
    var el = { model: q('[data-live-model]'), token: q('[data-live-token]'), connect: q('[data-live-connect]'),
      disconnect: q('[data-live-disconnect]'), talk: q('[data-live-talk]'), status: q('[data-live-status]'),
      form: q('[data-live-form]'), text: q('[data-live-text]'), send: q('[data-live-send]'), log: q('[data-live-log]') };

    var ws = null, micCtx = null, micStream = null, micNode = null, playCtx = null, playHead = 0, sources = [];
    var talking = false, micGen = 0, toolCount = 0, logLines = [], sessionAudio = false;

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
      if (ev.setupComplete) { setConnected(true, true, sessionAudio); setStatus('Ready'); }
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
      setConnected(false, false, false);
      setStatus(reason || 'Not connected');
    }

    el.connect.addEventListener('click', function () {
      var mode = el.model.value;
      var audio = mode !== 'text';
      var url;
      try { url = buildSocketUrl(el.token.value); } catch (e) { setStatus(String(e.message || e)); return; }
      el.token.value = '';
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
    });
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
    if (d.open) mount(d);
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
    else autoMount();
  }

  return {
    version: '2.3.0',
    WS_BASE: WS_BASE,
    MODEL_LIVE: MODEL_LIVE,
    MODEL_THINKING: MODEL_THINKING,
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
