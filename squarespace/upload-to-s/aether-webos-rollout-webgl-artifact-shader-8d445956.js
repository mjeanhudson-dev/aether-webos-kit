/**
 * Aether Artifact WebGL Shader Runtime
 * Photorealistic single-pass GPU relighting & phase-cleavage shader driven by
 * real macro mineral photography (Molten Mercury -> Liquid-Iron Cleavage ->
 * Widmanstatten Crystal Lock). Lazy-initialized off the critical path with
 * KHR_parallel_shader_compile and zero raymarching loops for locked 60fps.
 * Author: Eloquent (@mjeanhudson-dev)
 */
(function (global) {
  'use strict';

  var SINGLETON_KEY = '__AetherArtifactShaderState';
  var MAX_DPR = 1.25;
  var MAX_BACKING_W = 1440;
  var MAX_BACKING_H = 900;
  var DEFAULT_POINTER = 0.5;
  var REDUCED_SHOWCASE_PROGRESS = 0.56;

  var DEFAULT_TEX_ASPECTS = [16.0 / 9.0, 16.0 / 10.0, 16.0 / 9.0];

  var TEXTURE_URLS = [
    'assets/artifact-mercury.webp',
    'assets/artifact-poster.webp',
    'assets/artifact-crystal.webp'
  ];

  var VERT_SRC = [
    'attribute vec2 a_pos;',
    'varying vec2 v_uv;',
    'void main() {',
    '  v_uv = a_pos * 0.5 + 0.5;',
    '  gl_Position = vec4(a_pos, 0.0, 1.0);',
    '}'
  ].join('\n');

  var FRAG_SRC = [
    'precision mediump float;',
    '',
    'varying vec2 v_uv;',
    'uniform sampler2D u_tex0;',
    'uniform sampler2D u_tex1;',
    'uniform sampler2D u_tex2;',
    'uniform vec2 u_res;',
    'uniform vec3 u_texAspects;',
    'uniform float u_time;',
    'uniform float u_progress;',
    'uniform vec2 u_mouse;',
    '',
    'float luma(vec3 c) {',
    '  return dot(c, vec3(0.299, 0.587, 0.114));',
    '}',
    '',
    '// Cover-fit UV transform preserving each plate natural aspect ratio',
    'vec2 fitCover(vec2 uv, vec2 res, float texRatio) {',
    '  float viewRatio = res.x / max(res.y, 1.0);',
    '  vec2 p = uv - 0.5;',
    '  if (viewRatio > texRatio) {',
    '    p.y *= texRatio / viewRatio;',
    '  } else {',
    '    p.x *= viewRatio / texRatio;',
    '  }',
    '  return vec2(p.x + 0.5, 0.5 - p.y);',
    '}',
    '',
    'void main() {',
    '  float prog = clamp(u_progress, 0.0, 1.0);',
    '  vec2 mOff = (u_mouse - 0.5) * 2.0;',
    '',
    '  // Phase weights: 0..0.38 Mercury, 0.34..0.74 Cleavage, 0.68..1.0 Crystal Lock',
    '  float wCleav = smoothstep(0.22, 0.56, prog);',
    '  float wLock  = smoothstep(0.62, 0.92, prog);',
    '  float liquidAmt = 1.0 - wLock * 0.82;',
    '',
    '  // Subtle macro camera push + pointer parallax + breathing drift',
    '  float zoom = 1.0 + prog * 0.065 + sin(u_time * 0.42) * 0.004 * liquidAmt;',
    '  vec2 baseUv = (v_uv - 0.5) / zoom + 0.5;',
    '  baseUv -= mOff * vec2(0.018, -0.014);',
    '',
    '  vec2 uv0 = fitCover(baseUv, u_res, u_texAspects.x);',
    '  vec2 uv1 = fitCover(baseUv, u_res, u_texAspects.y);',
    '  vec2 uv2 = fitCover(baseUv, u_res, u_texAspects.z);',
    '  float activeAspect = mix(u_texAspects.x, mix(u_texAspects.y, u_texAspects.z, wLock), wCleav);',
    '  vec2 uvRef = fitCover(baseUv, u_res, activeAspect);',
    '',
    '  // Specimen radial envelope so #05070B obsidian frame edges never warp',
    '  vec2 cDelta = uvRef - vec2(0.5, 0.5);',
    '  float rMask = 1.0 - smoothstep(0.26, 0.54, length(cDelta * vec2(1.0, 1.35)));',
    '',
    '  // Organic fluid surface-tension warp (stronger in molten mercury phase)',
    '  float t = u_time;',
    '  vec2 flow = vec2(',
    '    sin(uvRef.y * 11.5 + t * 0.85) * cos(uvRef.x * 8.0 - t * 0.55),',
    '    cos(uvRef.x * 10.5 - t * 0.72) * sin(uvRef.y * 9.0 + t * 0.48)',
    '  ) * 0.0055 * liquidAmt * rMask;',
    '',
    '  // Cursor meniscus deflection mapped through the exact zoom/parallax/fitCover space',
    '  vec2 mouseVuv = vec2(u_mouse.x, 1.0 - u_mouse.y);',
    '  vec2 mouseBase = (mouseVuv - 0.5) / zoom + 0.5 - mOff * vec2(0.018, -0.014);',
    '  vec2 cursorUv = fitCover(mouseBase, u_res, activeAspect);',
    '  vec2 toCur = uvRef - cursorUv;',
    '  float curFalloff = exp(-dot(toCur, toCur) * 18.0) * liquidAmt * rMask;',
    '  flow += toCur * curFalloff * 0.022;',
    '',
    '  vec2 uvLiq = clamp(uv0 + flow, 0.002, 0.998);',
    '  vec2 uvMid = clamp(uv1 + flow * (0.55 - wLock * 0.35), 0.002, 0.998);',
    '  vec2 uvCry = clamp(uv2 + flow * 0.12, 0.002, 0.998);',
    '',
    '  // Phase-gated texture sampling (3-5 taps instead of 9, aspect-invariant texel spacing)',
    '  float tapTex = mix(2.8, 1.6, wCleav);',
    '  vec2 px = vec2(tapTex / 1280.0, tapTex * activeAspect / 1280.0);',
    '  vec3 baseCol;',
    '  float lumR;',
    '  float lumD;',
    '  if (wCleav <= 0.002) {',
    '    baseCol = texture2D(u_tex0, uvLiq).rgb;',
    '    lumR = luma(texture2D(u_tex0, uvLiq + vec2(px.x, 0.0)).rgb);',
    '    lumD = luma(texture2D(u_tex0, uvLiq + vec2(0.0, px.y)).rgb);',
    '  } else if (wLock <= 0.002) {',
    '    vec3 c0 = texture2D(u_tex0, uvLiq).rgb;',
    '    vec3 c1 = texture2D(u_tex1, uvMid).rgb;',
    '    float l1 = luma(c1);',
    '    float cleaveEdge = smoothstep(0.0, 0.34, wCleav * 1.32 - (1.0 - l1) * 0.26) * smoothstep(0.0, 0.06, wCleav);',
    '    cleaveEdge = mix(cleaveEdge, 1.0, smoothstep(0.92, 1.0, wCleav));',
    '    baseCol = mix(c0, c1, cleaveEdge);',
    '    if (cleaveEdge < 0.5) {',
    '      lumR = luma(texture2D(u_tex0, uvLiq + vec2(px.x, 0.0)).rgb);',
    '      lumD = luma(texture2D(u_tex0, uvLiq + vec2(0.0, px.y)).rgb);',
    '    } else {',
    '      lumR = luma(texture2D(u_tex1, uvMid + vec2(px.x, 0.0)).rgb);',
    '      lumD = luma(texture2D(u_tex1, uvMid + vec2(0.0, px.y)).rgb);',
    '    }',
    '  } else if (wLock >= 0.998) {',
    '    baseCol = texture2D(u_tex2, uvCry).rgb;',
    '    lumR = luma(texture2D(u_tex2, uvCry + vec2(px.x, 0.0)).rgb);',
    '    lumD = luma(texture2D(u_tex2, uvCry + vec2(0.0, px.y)).rgb);',
    '  } else {',
    '    vec3 c1 = texture2D(u_tex1, uvMid).rgb;',
    '    vec3 c2 = texture2D(u_tex2, uvCry).rgb;',
    '    float l2 = luma(c2);',
    '    float lockEdge = smoothstep(0.0, 0.34, wLock * 1.32 - l2 * 0.22) * smoothstep(0.0, 0.06, wLock);',
    '    lockEdge = mix(lockEdge, 1.0, smoothstep(0.92, 1.0, wLock));',
    '    baseCol = mix(c1, c2, lockEdge);',
    '    if (lockEdge < 0.5) {',
    '      lumR = luma(texture2D(u_tex1, uvMid + vec2(px.x, 0.0)).rgb);',
    '      lumD = luma(texture2D(u_tex1, uvMid + vec2(0.0, px.y)).rgb);',
    '    } else {',
    '      lumR = luma(texture2D(u_tex2, uvCry + vec2(px.x, 0.0)).rgb);',
    '      lumD = luma(texture2D(u_tex2, uvCry + vec2(0.0, px.y)).rgb);',
    '    }',
    '  }',
    '',
    '  // Phase-adapted, noise-gated Sobel normal (suppresses 8x8 WebP quantization on smooth mercury)',
    '  float lumC = luma(baseCol);',
    '  vec2 grad = vec2(lumC - lumR, lumD - lumC);',
    '  float reliefGate = smoothstep(0.009, 0.032, length(grad));',
    '  float reliefGain = mix(1.85, 4.4, wCleav) * reliefGate;',
    '  vec3 texN = normalize(vec3(grad.x * reliefGain, grad.y * reliefGain, mix(0.86, 0.48, wCleav)));',
    '  vec3 liqN = normalize(vec3((uvRef.x - 0.5) * 0.85 + flow.x * 16.0, (0.5 - uvRef.y) * 0.85 - flow.y * 16.0, 1.0));',
    '  vec3 surfN = normalize(mix(liqN, texN, mix(0.45, 1.0, wCleav)));',
    '',
    '  // Cursor-steered raking studio key light across natural Widmanstatten & mercury relief',
    '  vec3 lightDir = normalize(vec3(mOff.x * 0.78 + sin(t * 0.28) * 0.16, -mOff.y * 0.65 + 0.35, 0.72));',
    '  vec3 halfVec = normalize(lightDir + vec3(0.0, 0.0, 1.0));',
    '  float ndotl = max(dot(surfN, lightDir), 0.0);',
    '  float spec = pow(max(dot(surfN, halfVec), 0.0), mix(34.0, 52.0, wLock));',
    '  float objMask = smoothstep(0.032, 0.11, lumC);',
    '',
    '  // Platinum-steel metallic sheen + natural recessed amber troilite warmth',
    '  vec3 col = baseCol * (0.90 + 0.22 * ndotl * objMask);',
    '  col += vec3(0.92, 0.91, 0.88) * spec * (0.16 + 0.14 * curFalloff) * objMask;',
    '',
    '  // Subtle warm lift strictly on natural amber/bronze troilite mineral seams',
    '  float amberness = clamp((baseCol.r - baseCol.b) * 3.4 - 0.14, 0.0, 1.0) * smoothstep(0.06, 0.22, baseCol.r);',
    '  float troiPulse = 0.22 + 0.34 * sin(t * 1.15) * 0.5 + 0.42 * wCleav * (1.0 - wLock * 0.45);',
    '  col += vec3(0.89, 0.48, 0.17) * amberness * troiPulse * 0.45;',
    '',
    '  // Seamless radial feather directly into #05070B obsidian stage ground',
    '  vec2 vigUv = (v_uv - 0.5) * vec2(1.22, 1.38);',
    '  float vig = 1.0 - smoothstep(0.32, 0.78, length(vigUv));',
    '  vec3 obsBg = vec3(0.0196, 0.0275, 0.0431);',
    '  gl_FragColor = vec4(mix(obsBg, clamp(col, 0.0, 1.0), vig), 1.0);',
    '}'
  ].join('\n');

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function smoothstep01(edge0, edge1, x) {
    var t = clamp01((x - edge0) / Math.max(edge1 - edge0, 0.0001));
    return t * t * (3 - 2 * t);
  }

  function isFileOrigin() {
    return Boolean(global.location && global.location.protocol === 'file:');
  }

  function isCrossOriginHttpUrl(rawUrl) {
    if (!rawUrl || isFileOrigin() || typeof URL !== 'function' || !global.location) return false;
    try {
      var parsed = new URL(rawUrl, global.location.href);
      return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.origin !== global.location.origin;
    } catch (e) {
      return false;
    }
  }

  function resolveHref(rawUrl) {
    if (!rawUrl || typeof URL !== 'function' || !global.location) return rawUrl || '';
    try {
      return new URL(rawUrl, global.location.href).href;
    } catch (e) {
      return rawUrl;
    }
  }

  function yieldMain(fn) {
    if (global.scheduler && typeof global.scheduler.yield === 'function') {
      global.scheduler.yield().then(fn);
    } else {
      setTimeout(fn, 0);
    }
  }

  function parseCssNum(val, fallback) {
    if (!val) return fallback;
    var n = parseFloat(String(val).trim());
    return Number.isFinite(n) ? clamp01(n) : fallback;
  }

  function syncToggleButtons(state) {
    var toggles = document.querySelectorAll('[data-aether-shader-toggle]');
    for (var i = 0; i < toggles.length; i++) {
      var btn = toggles[i];
      // Per WCAG / modern-web-guidance motion rule: do not pair aria-pressed with
      // a dynamic Pause/Resume label, or screen readers announce a pressed "Resume" button.
      if (btn.hasAttribute('aria-pressed')) {
        btn.removeAttribute('aria-pressed');
      }
      if (state.fallback) {
        btn.disabled = true;
        btn.hidden = true;
      } else {
        btn.disabled = state.reducedMotion;
        btn.hidden = false;
        if (!btn.hasAttribute('data-aether-keep-label')) {
          var nextLabel = state.reducedMotion
            ? 'Shader static (reduced motion)'
            : state.paused
              ? 'Resume shader'
              : 'Pause shader';
          btn.textContent = nextLabel;
          if (btn.hasAttribute('aria-label')) {
            btn.setAttribute('aria-label', nextLabel);
          }
        }
      }
    }
  }

  function applyActState(state) {
    if (!state.actEl) return;
    var label = state.fallback
      ? 'fallback'
      : state.reducedMotion
        ? 'static'
        : state.paused
          ? 'paused'
          : state.ready
            ? 'live'
            : 'standby';
    state.actEl.setAttribute('data-aether-shader-state', label);
    state.actEl.classList.toggle('is-webgl-ready', !state.fallback && state.ready && state.texturesReady);
    state.actEl.classList.toggle('is-webgl-fallback', state.fallback);
  }

  function stopLoop(state) {
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
      state.rafId = 0;
    }
  }

  function stopStaticRedraw(state) {
    if (state.staticRafId) {
      cancelAnimationFrame(state.staticRafId);
      state.staticRafId = 0;
    }
  }

  function stopCompilePoll(state) {
    if (state.compilePollId) {
      cancelAnimationFrame(state.compilePollId);
      state.compilePollId = 0;
    }
    if (state.uploadRafId) {
      cancelAnimationFrame(state.uploadRafId);
      state.uploadRafId = 0;
    }
  }

  function ensureFallbackPlates(state) {
    if (state.fallbackPlates || !state.actEl) return;
    var stage = (state.canvas && state.canvas.parentElement) || state.actEl.querySelector('[data-sc-stage]') || state.actEl;
    if (!stage) return;
    var urls = resolveTextureUrls(state);
    var anchor = state.posterImg && state.posterImg.parentElement === stage ? state.posterImg.nextSibling : state.canvas;

    function makePlate(url, cls) {
      var img = document.createElement('img');
      img.className = 'artifact-fallback-plate ' + cls;
      img.src = url;
      img.decoding = 'async';
      img.alt = '';
      img.setAttribute('aria-hidden', 'true');
      img.style.opacity = '0';
      stage.insertBefore(img, anchor || null);
      return img;
    }

    state.fallbackPlates = {
      mercury: makePlate(urls[0], 'artifact-fallback-plate--mercury'),
      crystal: makePlate(urls[2], 'artifact-fallback-plate--crystal')
    };
  }

  function syncFallbackPlates(state) {
    if (!state.fallback || !state.fallbackPlates) return;
    if (state.reducedMotion) {
      state.fallbackPlates.mercury.style.opacity = '0';
      state.fallbackPlates.crystal.style.opacity = '0';
      return;
    }
    var p = clamp01(state.targetProgress);
    var wCleav = smoothstep01(0.22, 0.56, p);
    var wLock = smoothstep01(0.62, 0.92, p);
    state.fallbackPlates.mercury.style.opacity = (1 - wCleav).toFixed(3);
    state.fallbackPlates.crystal.style.opacity = wLock.toFixed(3);
  }

  function releaseWebGL(state) {
    var gl = state.gl;
    if (!gl) return;
    state.gl = null;
    state.uploadQueue = [];
    try {
      if (!gl.isContextLost()) {
        for (var i = 0; i < state.textures.length; i++) {
          if (state.textures[i]) gl.deleteTexture(state.textures[i]);
        }
        if (state.buffer) gl.deleteBuffer(state.buffer);
        if (state.program) gl.deleteProgram(state.program);
        var loseExt = gl.getExtension('WEBGL_lose_context');
        if (loseExt && typeof loseExt.loseContext === 'function') {
          loseExt.loseContext();
        }
      }
    } catch (e) {}
    state.textures = [null, null, null];
    state.buffer = null;
    state.program = null;
  }

  function activateFallback(state) {
    if (state.fallback) return;
    state.fallback = true;
    state.ready = false;
    stopLoop(state);
    stopStaticRedraw(state);
    stopCompilePoll(state);
    releaseWebGL(state);
    if (state.canvas) {
      state.canvas.hidden = true;
      state.canvas.style.display = 'none';
      state.canvas.setAttribute('aria-hidden', 'true');
    }
    ensureFallbackPlates(state);
    readProgressTarget(state);
    syncFallbackPlates(state);
    applyActState(state);
    syncToggleButtons(state);
  }

  function readProgressTarget(state) {
    if (!state.actEl) return;
    // Direct inline style read only (ScrollCraft always writes inline --sc-p; never force getComputedStyle)
    var pRaw = state.actEl.style.getPropertyValue('--sc-p');
    if (pRaw !== '') {
      state.targetProgress = parseCssNum(pRaw, state.targetProgress);
    }
  }

  function computeEffectiveDpr(state) {
    var base = Math.min(global.devicePixelRatio || 1, MAX_DPR);
    return Math.max(0.5, base * state.resScale);
  }

  function resizeCanvas(state) {
    if (!state.gl || !state.canvas) return;
    var rect = state.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    var effDpr = computeEffectiveDpr(state);
    var w = Math.round(rect.width * effDpr);
    var h = Math.round(rect.height * effDpr);
    if (w > MAX_BACKING_W) {
      var sW = MAX_BACKING_W / w;
      w = MAX_BACKING_W;
      h = Math.max(1, Math.round(h * sW));
    }
    if (h > MAX_BACKING_H) {
      var sH = MAX_BACKING_H / h;
      h = MAX_BACKING_H;
      w = Math.max(1, Math.round(w * sH));
    }
    state.dpr = effDpr;
    if (state.canvas.width !== w || state.canvas.height !== h) {
      state.canvas.width = w;
      state.canvas.height = h;
      state.gl.viewport(0, 0, w, h);
    }
  }

  function drawFrame(state) {
    var gl = state.gl;
    if (!gl || !state.program || !state.texturesReady || state.fallback || gl.isContextLost()) return;
    if (state.needsResize) {
      state.needsResize = false;
      resizeCanvas(state);
    }
    gl.useProgram(state.program);
    gl.uniform1f(state.uTime, state.simTime);
    gl.uniform2f(state.uRes, state.canvas.width, state.canvas.height);
    gl.uniform3f(
      state.uTexAspects,
      state.texAspects[0],
      state.texAspects[1],
      state.texAspects[2]
    );
    gl.uniform1f(state.uProgress, state.smoothProgress);
    gl.uniform2f(state.uMouse, state.smoothMx, state.smoothMy);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!state.firstPainted) {
      state.firstPainted = true;
      if (state.canvas) state.canvas.classList.add('is-ready');
      applyActState(state);
    }
  }

  function requestStaticRedraw(state) {
    if (
      state.staticRafId ||
      state.rafId ||
      !state.ready ||
      !state.texturesReady ||
      state.fallback ||
      state.reducedMotion ||
      state.docHidden ||
      state.contentSkipped ||
      !state.inView
    ) {
      return;
    }
    state.staticRafId = requestAnimationFrame(function () {
      state.staticRafId = 0;
      if (
        state.ready &&
        state.texturesReady &&
        !state.fallback &&
        !state.reducedMotion &&
        !state.docHidden &&
        !state.contentSkipped &&
        state.inView
      ) {
        drawFrame(state);
      }
    });
  }

  function shouldAnimate(state) {
    return (
      state.ready &&
      state.texturesReady &&
      !state.fallback &&
      !state.reducedMotion &&
      !state.paused &&
      !state.docHidden &&
      !state.contentSkipped &&
      state.inView
    );
  }

  function scheduleLoop(state) {
    if (state.rafId || !shouldAnimate(state)) return;
    stopStaticRedraw(state);
    state.lastMs = performance.now();
    function tick(now) {
      state.rafId = 0;
      if (!shouldAnimate(state)) return;

      var rawDtMs = now - state.lastMs;
      state.lastMs = now;

      // Adaptive resolution governor: require 5 consecutive slow frames (ignore single hiccups)
      if (rawDtMs > 30 && rawDtMs < 180) {
        state.slowStreak = (state.slowStreak || 0) + 1;
        if (state.slowStreak >= 5 && state.resScale > 0.50) {
          state.resScale = Math.max(0.45, state.resScale - 0.15);
          state.needsResize = true;
          state.slowStreak = 0;
        }
      } else if (rawDtMs <= 26) {
        state.slowStreak = 0;
      }

      var dt = Math.min(0.05, Math.max(0.0, rawDtMs * 0.001));
      state.simTime += dt;

      readProgressTarget(state);
      var k = 1 - Math.exp(-dt * 10.0);
      state.smoothProgress += (state.targetProgress - state.smoothProgress) * k;
      state.smoothMx += (state.targetMx - state.smoothMx) * k;
      state.smoothMy += (state.targetMy - state.smoothMy) * k;

      drawFrame(state);
      if (shouldAnimate(state)) {
        state.rafId = requestAnimationFrame(tick);
      }
    }
    state.rafId = requestAnimationFrame(tick);
  }

  function createTexture(gl, unit, img) {
    var tex = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    try {
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    } catch (err) {
      gl.bindTexture(gl.TEXTURE_2D, null);
      gl.deleteTexture(tex);
      throw err;
    }
    return tex;
  }

  function resolveTextureUrls(state) {
    // Honor Squarespace /s/ rewritten URLs from inert <template id="aether-artifact-plates">
    var tpl = document.getElementById('aether-artifact-plates');
    var root = tpl && tpl.content ? tpl.content : null;
    var mEl = root ? root.querySelector('[data-plate="mercury"]') : null;
    var cEl = root ? root.querySelector('[data-plate="cleave"]') : null;
    var kEl = root ? root.querySelector('[data-plate="crystal"]') : null;
    return [
      (mEl && mEl.getAttribute('src')) || TEXTURE_URLS[0],
      (cEl && cEl.getAttribute('src')) || (state.posterImg && state.posterImg.getAttribute('src')) || TEXTURE_URLS[1],
      (kEl && kEl.getAttribute('src')) || TEXTURE_URLS[2]
    ];
  }

  function drainTextureUploadQueue(state) {
    if (state.uploadRafId || state.fallback || !state.gl || state.gl.isContextLost()) return;
    if (!state.uploadQueue.length) return;
    state.uploadRafId = requestAnimationFrame(function () {
      state.uploadRafId = 0;
      if (state.fallback || !state.gl || state.gl.isContextLost()) return;
      var next = state.uploadQueue.shift();
      if (!next) return;
      try {
        state.textures[next.idx] = createTexture(state.gl, next.idx, next.img);
      } catch (err) {
        // SecurityError on cross-origin CDN redirect or file:// drops cleanly to 3-plate CSS fallback
        activateFallback(state);
        return;
      }
      state.uploadedCount++;
      if (state.uploadedCount >= 3) {
        state.texturesReady = true;
        if (state.ready) {
          bindTextureUniforms(state);
          state.needsResize = true;
          readProgressTarget(state);
          state.smoothProgress = state.targetProgress;
          drawFrame(state);
          if (shouldAnimate(state)) scheduleLoop(state);
        }
      } else if (state.uploadQueue.length) {
        drainTextureUploadQueue(state);
      }
    });
  }

  function loadTextures(state) {
    if (state.texturesLoading || state.texturesReady || state.fallback) return;
    state.texturesLoading = true;
    var urls = resolveTextureUrls(state);
    var failed = false;

    function onImageReady(idx, img) {
      if (failed || state.fallback || !state.gl || state.gl.isContextLost()) return;
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        state.texAspects[idx] = img.naturalWidth / img.naturalHeight;
      }
      var enqueue = function () {
        if (failed || state.fallback || !state.gl || state.gl.isContextLost()) return;
        state.uploadQueue.push({ idx: idx, img: img });
        drainTextureUploadQueue(state);
      };
      if (typeof img.decode === 'function') {
        img.decode().then(enqueue, enqueue);
      } else {
        enqueue();
      }
    }

    function onImageError() {
      if (failed) return;
      failed = true;
      activateFallback(state);
    }

    for (var i = 0; i < 3; i++) {
      (function (idx, url) {
        // Reuse existing <img class="artifact-poster"> on same-origin Cleave plate to avoid duplicate HTTP fetch
        var poster = idx === 1 ? state.posterImg : null;
        var canReusePoster = Boolean(
          poster &&
          !isCrossOriginHttpUrl(url) &&
          resolveHref(url) === resolveHref(poster.currentSrc || poster.getAttribute('src'))
        );

        if (canReusePoster) {
          if (poster.loading === 'lazy') {
            poster.loading = 'eager';
          }
          if (poster.complete) {
            if (poster.naturalWidth > 0) {
              onImageReady(idx, poster);
            } else {
              onImageError();
            }
          } else {
            poster.addEventListener('load', function () { onImageReady(idx, poster); }, { once: true });
            poster.addEventListener('error', onImageError, { once: true });
          }
          return;
        }

        var img = new Image();
        img.decoding = 'async';
        if (isCrossOriginHttpUrl(url)) {
          img.crossOrigin = 'anonymous';
        }
        img.onload = function () { onImageReady(idx, img); };
        img.onerror = onImageError;
        img.src = url;
      })(i, urls[i]);
    }
  }

  function bindTextureUniforms(state) {
    var gl = state.gl;
    if (!gl || !state.program) return;
    gl.useProgram(state.program);
    gl.uniform1i(gl.getUniformLocation(state.program, 'u_tex0'), 0);
    gl.uniform1i(gl.getUniformLocation(state.program, 'u_tex1'), 1);
    gl.uniform1i(gl.getUniformLocation(state.program, 'u_tex2'), 2);
  }

  function finalizeProgram(state, gl, prog, vs, fs) {
    if (state.fallback || gl.isContextLost()) return;
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      activateFallback(state);
      return;
    }
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    state.program = prog;
    state.buffer = buf;
    state.uTime = gl.getUniformLocation(prog, 'u_time');
    state.uRes = gl.getUniformLocation(prog, 'u_res');
    state.uTexAspects = gl.getUniformLocation(prog, 'u_texAspects');
    state.uProgress = gl.getUniformLocation(prog, 'u_progress');
    state.uMouse = gl.getUniformLocation(prog, 'u_mouse');
    state.ready = true;
    state.needsResize = true;

    if (state.texturesReady) {
      bindTextureUniforms(state);
      readProgressTarget(state);
      state.smoothProgress = state.targetProgress;
      drawFrame(state);
      if (shouldAnimate(state)) scheduleLoop(state);
    } else {
      applyActState(state);
    }
  }

  function initWebGLLazy(state) {
    if (state.glInitialized || state.fallback || state.reducedMotion) return;
    if (state.contextCount >= 1) return;
    if (isFileOrigin()) {
      // file:// blocks WebGL texImage2D on local rasters with SecurityError; engage 3-plate CSS fallback immediately
      activateFallback(state);
      return;
    }
    var canvas = state.canvas;
    if (!canvas || typeof canvas.getContext !== 'function') {
      activateFallback(state);
      return;
    }
    state.glInitialized = true;

    // Antialias disabled on fullscreen quad: avoids 4x MSAA VRAM/resolve overhead
    var opts = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: false
    };
    var gl = canvas.getContext('webgl', opts) || canvas.getContext('experimental-webgl', opts);
    if (!gl || gl.isContextLost()) {
      activateFallback(state);
      return;
    }

    state.gl = gl;
    state.contextCount = 1;

    // Detect software renderers early and scale backing resolution proactively
    try {
      var dbg = gl.getExtension('WEBGL_debug_renderer_info');
      var rName = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) || '') : '';
      if (/swiftshader|llvmpipe|software|basic render/i.test(rName)) {
        state.resScale = 0.48;
      }
    } catch (e) {}

    // Yield after context spin-up so shader compilation and texture fetches do not stack behind getContext()
    yieldMain(function () {
      if (state.fallback || gl.isContextLost()) return;
      var vs = gl.createShader(gl.VERTEX_SHADER);
      var fs = gl.createShader(gl.FRAGMENT_SHADER);
      if (!vs || !fs) {
        activateFallback(state);
        return;
      }
      gl.shaderSource(vs, VERT_SRC);
      gl.compileShader(vs);
      gl.shaderSource(fs, FRAG_SRC);
      gl.compileShader(fs);

      var prog = gl.createProgram();
      if (!prog) {
        activateFallback(state);
        return;
      }
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);

      // Begin async texture fetch & staggered 1-per-frame uploads in parallel with GPU shader compilation
      loadTextures(state);

      var parallelExt = gl.getExtension('KHR_parallel_shader_compile');
      if (parallelExt && parallelExt.COMPLETION_STATUS_KHR) {
        function pollCompile() {
          state.compilePollId = 0;
          if (state.fallback || gl.isContextLost()) return;
          if (gl.getProgramParameter(prog, parallelExt.COMPLETION_STATUS_KHR)) {
            finalizeProgram(state, gl, prog, vs, fs);
          } else {
            state.compilePollId = requestAnimationFrame(pollCompile);
          }
        }
        state.compilePollId = requestAnimationFrame(pollCompile);
      } else {
        finalizeProgram(state, gl, prog, vs, fs);
      }
    });
  }

  function mount() {
    var existing = global[SINGLETON_KEY];
    if (existing && existing.mounted) {
      return api;
    }

    var canvas = document.getElementById('aether-artifact-canvas');
    var actEl = document.getElementById('act-artifact') || (canvas ? canvas.closest('[data-sc-act]') : null);
    if (!canvas || !actEl) {
      return api;
    }

    var reduceMq = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var posterImg = actEl.querySelector('.artifact-poster');

    var state = existing || {
      mounted: true,
      glInitialized: false,
      ready: false,
      texturesLoading: false,
      texturesReady: false,
      uploadedCount: 0,
      uploadQueue: [],
      texAspects: DEFAULT_TEX_ASPECTS.slice(),
      firstPainted: false,
      fallback: false,
      fallbackPlates: null,
      paused: false,
      reducedMotion: Boolean(reduceMq && reduceMq.matches),
      inView: false,
      contentSkipped: false,
      docHidden: Boolean(document.hidden),
      needsResize: true,
      rafId: 0,
      staticRafId: 0,
      compilePollId: 0,
      uploadRafId: 0,
      lastMs: 0,
      emaFrameMs: 16,
      resScale: 1.0,
      simTime: 0,
      dpr: Math.min(global.devicePixelRatio || 1, MAX_DPR),
      contextCount: 0,
      targetProgress: 0,
      smoothProgress: 0,
      targetMx: DEFAULT_POINTER,
      smoothMx: DEFAULT_POINTER,
      targetMy: DEFAULT_POINTER,
      smoothMy: DEFAULT_POINTER,
      canvas: canvas,
      actEl: actEl,
      posterImg: posterImg,
      gl: null,
      program: null,
      buffer: null,
      textures: [null, null, null],
      observers: [],
      cleanups: []
    };
    state.mounted = true;
    state.canvas = canvas;
    state.actEl = actEl;
    state.posterImg = posterImg;
    global[SINGLETON_KEY] = state;

    if (state.reducedMotion) {
      // Hold crisp static photorealistic poster under reduced motion (zero GPU stall)
      canvas.hidden = true;
      canvas.setAttribute('aria-hidden', 'true');
      state.smoothProgress = REDUCED_SHOWCASE_PROGRESS;
      applyActState(state);
      syncToggleButtons(state);
    } else if (isFileOrigin()) {
      activateFallback(state);
    } else {
      applyActState(state);
      syncToggleButtons(state);
    }

    // Warm-zone IntersectionObserver: defer ALL WebGL context/compile work until near Act 4
    function scheduleIdleInit() {
      if (state.glInitialized || state.reducedMotion || state.fallback) return;
      if (typeof global.requestIdleCallback === 'function') {
        global.requestIdleCallback(function () {
          initWebGLLazy(state);
        }, { timeout: 300 });
      } else {
        setTimeout(function () { initWebGLLazy(state); }, 0);
      }
    }

    if ('IntersectionObserver' in global) {
      var warmIo = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              warmIo.disconnect();
              scheduleIdleInit();
              break;
            }
          }
        },
        { rootMargin: '1100px 0px', threshold: 0 }
      );
      warmIo.observe(actEl);
      state.observers.push(warmIo);

      // Strict viewport observer: inset by 1px so edge-touching #act-studio (bottom === 0) pauses rAF immediately
      var viewIo = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            var e = entries[i];
            state.inView = Boolean(
              e.isIntersecting &&
              (!e.intersectionRect || (e.intersectionRect.height > 0 && e.intersectionRect.width > 0))
            );
          }
          if (state.inView && !state.glInitialized && !state.reducedMotion && !state.fallback) {
            initWebGLLazy(state);
          }
          if (state.inView && state.fallback) {
            readProgressTarget(state);
            syncFallbackPlates(state);
          } else if (shouldAnimate(state)) {
            scheduleLoop(state);
          } else {
            stopLoop(state);
            if (state.inView && state.paused && !state.fallback && !state.reducedMotion) {
              readProgressTarget(state);
              state.smoothProgress = state.targetProgress;
              requestStaticRedraw(state);
            }
          }
        },
        { rootMargin: '-1px 0px', threshold: 0 }
      );
      viewIo.observe(actEl);
      state.observers.push(viewIo);
    } else if (!state.reducedMotion) {
      state.inView = true;
      initWebGLLazy(state);
    }

    // content-visibility: auto pause hook (does not bubble)
    var cvSkippedMap = new WeakMap();
    var cvTargets = [actEl];
    if (canvas && cvTargets.indexOf(canvas) === -1) cvTargets.push(canvas);
    if (canvas && canvas.parentElement && cvTargets.indexOf(canvas.parentElement) === -1) {
      cvTargets.push(canvas.parentElement);
    }
    function onContentVisibility(e) {
      var target = e && e.currentTarget ? e.currentTarget : actEl;
      cvSkippedMap.set(target, Boolean(e && e.skipped));
      var anySkipped = false;
      for (var k = 0; k < cvTargets.length; k++) {
        if (cvSkippedMap.get(cvTargets[k])) {
          anySkipped = true;
          break;
        }
      }
      state.contentSkipped = anySkipped;
      if (state.contentSkipped) {
        stopLoop(state);
        stopStaticRedraw(state);
      } else if (shouldAnimate(state)) {
        state.needsResize = true;
        scheduleLoop(state);
      } else if (state.paused && state.inView && !state.fallback && !state.reducedMotion) {
        state.needsResize = true;
        readProgressTarget(state);
        state.smoothProgress = state.targetProgress;
        requestStaticRedraw(state);
      }
    }
    for (var cvIdx = 0; cvIdx < cvTargets.length; cvIdx++) {
      (function (el) {
        el.addEventListener('contentvisibilityautostatechange', onContentVisibility);
        state.cleanups.push(function () {
          el.removeEventListener('contentvisibilityautostatechange', onContentVisibility);
        });
      })(cvTargets[cvIdx]);
    }

    // Document visibility pause hook
    function onVisChange() {
      state.docHidden = Boolean(document.hidden);
      if (state.docHidden) {
        stopLoop(state);
        stopStaticRedraw(state);
      } else if (shouldAnimate(state)) {
        scheduleLoop(state);
      } else if (state.paused && state.inView && !state.fallback && !state.reducedMotion) {
        state.needsResize = true;
        readProgressTarget(state);
        state.smoothProgress = state.targetProgress;
        requestStaticRedraw(state);
      }
    }
    document.addEventListener('visibilitychange', onVisChange);
    state.cleanups.push(function () {
      document.removeEventListener('visibilitychange', onVisChange);
    });

    // Resize handling (also triggers coalesced single-frame redraw when paused)
    function onResize() {
      state.needsResize = true;
      if (state.paused && !state.fallback && !state.reducedMotion) {
        requestStaticRedraw(state);
      }
    }
    global.addEventListener('resize', onResize, { passive: true });
    state.cleanups.push(function () {
      global.removeEventListener('resize', onResize);
    });
    if ('ResizeObserver' in global) {
      var ro = new ResizeObserver(onResize);
      ro.observe(canvas);
      state.observers.push(ro);
    }

    // Pause / Resume toggle delegate
    function onDocClick(e) {
      var btn = e.target && e.target.closest ? e.target.closest('[data-aether-shader-toggle]') : null;
      if (!btn) return;
      api.toggle();
    }
    document.addEventListener('click', onDocClick);
    state.cleanups.push(function () {
      document.removeEventListener('click', onDocClick);
    });

    // WebGL context loss resilience
    function onContextLost(e) {
      if (e && e.preventDefault) e.preventDefault();
      stopLoop(state);
      activateFallback(state);
    }
    canvas.addEventListener('webglcontextlost', onContextLost);
    state.cleanups.push(function () {
      canvas.removeEventListener('webglcontextlost', onContextLost);
    });

    // Dynamic prefers-reduced-motion reaction
    if (reduceMq && typeof reduceMq.addEventListener === 'function') {
      function onReduceChange(e) {
        state.reducedMotion = Boolean(e.matches);
        if (state.reducedMotion) {
          stopLoop(state);
          stopStaticRedraw(state);
          canvas.hidden = true;
          canvas.setAttribute('aria-hidden', 'true');
          syncFallbackPlates(state);
        } else {
          if (state.fallback) {
            syncFallbackPlates(state);
          } else {
            canvas.hidden = false;
            canvas.removeAttribute('aria-hidden');
            if (!state.glInitialized && state.inView) initWebGLLazy(state);
            else if (shouldAnimate(state)) scheduleLoop(state);
            else if (state.paused && state.inView) requestStaticRedraw(state);
          }
        }
        applyActState(state);
        syncToggleButtons(state);
      }
      reduceMq.addEventListener('change', onReduceChange);
      state.cleanups.push(function () {
        reduceMq.removeEventListener('change', onReduceChange);
      });
    }

    return api;
  }

  function getStateObj() {
    return global[SINGLETON_KEY] || null;
  }

  var api = {
    mount: mount,
    setPointer: function (nx, ny) {
      var st = getStateObj();
      if (!st) return;
      st.targetMx = clamp01(nx);
      st.targetMy = clamp01(ny);
    },
    setProgress: function (p) {
      var st = getStateObj();
      if (!st) return;
      st.targetProgress = clamp01(p);
      if (st.fallback) {
        syncFallbackPlates(st);
      } else if (st.paused && !st.reducedMotion) {
        if (Math.abs(st.targetProgress - st.smoothProgress) > 0.0005) {
          st.smoothProgress = st.targetProgress;
          requestStaticRedraw(st);
        }
      }
    },
    pause: function () {
      var st = getStateObj();
      if (!st || st.fallback) return;
      st.paused = true;
      stopLoop(st);
      readProgressTarget(st);
      if (Math.abs(st.targetProgress - st.smoothProgress) > 0.0005) {
        st.smoothProgress = st.targetProgress;
        requestStaticRedraw(st);
      }
      applyActState(st);
      syncToggleButtons(st);
    },
    play: function () {
      var st = getStateObj();
      if (!st || st.fallback || st.reducedMotion) return;
      st.paused = false;
      stopStaticRedraw(st);
      if (!st.glInitialized && st.inView) initWebGLLazy(st);
      applyActState(st);
      syncToggleButtons(st);
      scheduleLoop(st);
    },
    toggle: function () {
      var st = getStateObj();
      if (!st || st.fallback || st.reducedMotion) return;
      if (st.paused) api.play();
      else api.pause();
    },
    getState: function () {
      var st = getStateObj();
      if (!st) {
        return {
          mounted: false,
          ready: false,
          fallback: false,
          running: false,
          paused: false,
          reducedMotion: false,
          inView: false,
          contentSkipped: false,
          progress: 0,
          pointer: [DEFAULT_POINTER, DEFAULT_POINTER],
          dpr: 1,
          texAspects: DEFAULT_TEX_ASPECTS.slice(),
          contextCount: 0
        };
      }
      return {
        mounted: st.mounted,
        ready: st.ready,
        texturesReady: st.texturesReady,
        fallback: st.fallback,
        running: Boolean(st.rafId),
        paused: st.paused,
        reducedMotion: st.reducedMotion,
        inView: st.inView,
        contentSkipped: st.contentSkipped,
        progress: Number(st.smoothProgress.toFixed(4)),
        pointer: [Number(st.smoothMx.toFixed(4)), Number(st.smoothMy.toFixed(4))],
        dpr: Number(st.dpr.toFixed(2)),
        resScale: Number(st.resScale.toFixed(2)),
        texAspects: st.texAspects.map(function (a) { return Number(a.toFixed(4)); }),
        contextCount: st.contextCount
      };
    },
    destroy: function () {
      var st = getStateObj();
      if (!st) return;
      stopLoop(st);
      stopStaticRedraw(st);
      stopCompilePoll(st);
      releaseWebGL(st);
      for (var i = 0; i < st.observers.length; i++) {
        try { st.observers[i].disconnect(); } catch (e) {}
      }
      st.observers = [];
      for (var j = 0; j < st.cleanups.length; j++) {
        try { st.cleanups[j](); } catch (e) {}
      }
      st.cleanups = [];
      st.mounted = false;
    }
  };

  global.AetherArtifactShader = api;

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mount, { once: true });
    } else {
      mount();
    }
  }
})(typeof window !== 'undefined' ? window : globalThis);
