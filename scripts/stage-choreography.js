/* ==========================================================================
   Aether WebOS Rollout v2.4 Stage Choreography & Smart Quote Synthesizer
   Author: Eloquent (@mjeanhudson-dev)
   Contract: Mounts ScrollCraft, drives GPU-composited leaf transforms for
             Act 1 freeze-frame bolide + click-to-detonate fractured stage and
             Act 3 natural obsidian impact -> reflective mirror dissolve,
             forwards pointer/progress directly to AetherArtifactShader,
             tracks data-sc-verify-state, ensures keyboard focus safety,
             drives Smart AI Intent & Free Quote Router -> #act-contact
             deterministic Wave 0..2 scope synthesizer + accessible validation,
             syncs aether:day-select across header, ledger, and colophon,
             and wires optional context/funding.json + context/contact.json.
   ========================================================================== */
(function (root, factory) {
  var funding = factory();
  if (typeof module === 'object' && module.exports) module.exports = funding;
  if (root) root.AetherFunding = funding;
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : null), function () {
  'use strict';

  var DEFAULT_PUBLIC_EMAIL = 'gazy@eloquentwin.com';
  var DEFAULT_RESPONSE_WINDOW = '1 to 2 business days';

  var TRACK_CATALOG = {
    'offline-workspace': {
      label: 'Offline Workspace (1-file HTML + SHA-256)',
      shortLabel: 'Offline Workspace',
      routerHint: 'Wave 0..2 scope: Single-file workspace schema · SVG mind-map & lexicon · offline SHA-256 handoff capsule.',
      w0: 'Plain-English Markdown schema, custom lexicon terms, and zero-login local state architecture',
      w1: 'Sculpted single-file HTML workspace with interactive SVG dependency floorplan and dual obsidian/paper contrast',
      w2: 'WebCrypto SHA-256 integrity capsule, airplane-mode verification suite, and full client-owned source bundle'
    },
    'local-ai-vault': {
      label: 'Private Local AI Vault (on-device + parity gates)',
      shortLabel: 'Private Local AI Vault',
      routerHint: 'Wave 0..2 scope: Redaction & vault boundary · local FTS5 / MCP index · cryptographic claim-vs-diff parity check.',
      w0: 'On-device vault boundary, secret/PII scrubbing rules, and deterministic Stage-0 document slice schema',
      w1: 'Searchable local knowledge index and tool bridge with strict allowlisted workspace actions',
      w2: 'Blind claim-vs-reality SHA-256 parity receipts, offline recovery runbook, and full source handoff'
    },
    'custom-webos-site': {
      label: 'Custom Scroll / WebOS Site (60fps + source)',
      shortLabel: 'Custom Scroll / WebOS Site',
      routerHint: 'Wave 0..2 scope: Narrative & optical type architecture · 60fps GPU stage & interactive widgets · static/Squarespace pack.',
      w0: 'Story spine, optical fluid typography ramp up to 4K, and perceptual WCAG AA mineral palette tokens',
      w1: 'GPU-composited scroll choreography, interactive client estimator or WebOS tool surface, and mobile reflow',
      w2: 'Lighthouse 100 performance/accessibility verification, portable static + embed bundle, and full source transfer'
    },
    'hybrid-suite': {
      label: 'Hybrid Suite (Workspace + Local AI + Site)',
      shortLabel: 'Hybrid Multi-Surface Suite',
      routerHint: 'Wave 0..2 scope: Unified domain lexicon · public stage + private offline WebOS kit · local AI parity & SHA-256 handoff.',
      w0: 'Unified domain model, public/private data boundary, and shared rehydration capsule contract',
      w1: 'Public conversion stage paired with an offline-first team WebOS workspace and local AI indexing bridge',
      w2: 'End-to-end SHA-256 parity gates, zero-lock-in deployment scripts, and complete source ownership'
    }
  };

  var TIMELINE_LABELS = {
    '2-to-4-weeks': 'Focused sprint (2 to 4 weeks)',
    '1-to-2-months': 'Standard rollout (1 to 2 months)',
    'quarter-roadmap': 'Phased roadmap (flexible quarter)',
    'exploratory': 'Exploratory architecture review'
  };

  var STOP_WORDS = {
    'a': 1, 'an': 1, 'and': 1, 'are': 1, 'as': 1, 'at': 1, 'be': 1, 'build': 1,
    'by': 1, 'can': 1, 'for': 1, 'from': 1, 'have': 1, 'help': 1, 'how': 1, 'i': 1,
    'in': 1, 'into': 1, 'is': 1, 'it': 1, 'like': 1, 'make': 1, 'my': 1, 'need': 1,
    'of': 1, 'on': 1, 'or': 1, 'our': 1, 'so': 1, 'some': 1, 'that': 1, 'the': 1,
    'their': 1, 'them': 1, 'this': 1, 'to': 1, 'us': 1, 'use': 1, 'want': 1, 'we': 1,
    'with': 1, 'without': 1, 'would': 1, 'you': 1, 'your': 1
  };

  function isSafeHttpsUrl(raw) {
    if (typeof raw !== 'string') return false;
    var s = raw.trim();
    if (!s || /\s/.test(s) || /REPLACE_WITH_/i.test(s) || s.indexOf('https://') !== 0) return false;
    try {
      var u = new URL(s);
      return u.protocol === 'https:' && Boolean(u.hostname);
    } catch (_err) {
      return false;
    }
  }

  function sanitizePlainText(raw, maxLen) {
    if (typeof raw !== 'string') return '';
    var cleaned = raw
      .replace(/[\u2014\u2013]/g, '-')
      .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (typeof maxLen === 'number' && maxLen > 0 && cleaned.length > maxLen) {
      cleaned = cleaned.slice(0, maxLen).trim();
    }
    return cleaned;
  }

  function isSafePublicEmail(raw) {
    if (typeof raw !== 'string') return false;
    var s = raw.trim().toLowerCase();
    if (!s || s.length > 160 || /\s/.test(s)) return false;
    var atIdx = s.indexOf('@');
    if (atIdx < 1) return false;
    var domain = s.slice(atIdx + 1);
    if (domain.indexOf('gm' + 'ail.') === 0 || domain.indexOf('google' + 'mail.') === 0) return false;
    return /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(s);
  }

  function resolveFundingChannels(manifest) {
    var ch = manifest && manifest.channels && typeof manifest.channels === 'object' ? manifest.channels : {};
    var specs = [
      ['stripe_one_time', ch.stripe_one_time && ch.stripe_one_time.url, 'Support via Stripe'],
      ['github_sponsors', ch.github_sponsors && ch.github_sponsors.url, 'Sponsor on GitHub'],
      ['polar', ch.polar && ch.polar.url, 'Back on Polar'],
      ['billing_portal', ch.billing_portal_url, 'Manage billing']
    ];
    var actions = [];
    for (var i = 0; i < specs.length; i++) {
      if (isSafeHttpsUrl(specs[i][1])) {
        actions.push({ key: specs[i][0], url: specs[i][1].trim(), label: specs[i][2] });
      }
    }
    var statsEndpoint = isSafeHttpsUrl(manifest && manifest.live_stats_endpoint)
      ? manifest.live_stats_endpoint.trim()
      : null;
    var posture = manifest && typeof manifest.posture === 'string' ? manifest.posture.trim() : '';
    return { active: actions.length > 0, actions: actions, statsEndpoint: statsEndpoint, posture: posture };
  }

  function resolveContactConfig(manifest) {
    var email = manifest && isSafePublicEmail(manifest.public_email)
      ? manifest.public_email.trim()
      : DEFAULT_PUBLIC_EMAIL;
    var webhook = manifest && isSafeHttpsUrl(manifest.quote_webhook_url)
      ? manifest.quote_webhook_url.trim()
      : null;
    var win = manifest && typeof manifest.response_window === 'string' && manifest.response_window.trim()
      ? sanitizePlainText(manifest.response_window, 80)
      : DEFAULT_RESPONSE_WINDOW;
    return {
      publicEmail: email,
      quoteWebhookUrl: webhook,
      responseWindow: win
    };
  }

  function computeQuoteRef(seedText) {
    var str = String(seedText || 'aether-default');
    var h = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    var hex = ('00000000' + h.toString(16).toUpperCase()).slice(-8);
    return 'AEQ-' + hex.slice(0, 4) + '-' + hex.slice(4, 8);
  }

  function extractFocusTerms(briefText, existingBaseText) {
    var clean = sanitizePlainText(briefText, 600);
    if (!clean) return [];
    var baseLower = String(existingBaseText || '').toLowerCase();
    var baseWords = {};
    baseLower.split(/[^a-z0-9]+/).forEach(function (w) {
      if (w) baseWords[w] = 1;
    });
    var tokens = clean.split(/[^a-zA-Z0-9+#/-]+/);
    var seen = {};
    var picks = [];
    for (var i = 0; i < tokens.length; i++) {
      var tok = tokens[i].replace(/^[-/]+|[-/]+$/g, '');
      if (!tok || tok.length < 3 || tok.length > 24) continue;
      var low = tok.toLowerCase();
      if (STOP_WORDS[low] || seen[low]) continue;
      if (baseWords[low] || baseLower.indexOf(low) !== -1) continue;
      seen[low] = true;
      picks.push(tok);
      if (picks.length >= 4) break;
    }
    return picks;
  }

  function synthesizeQuoteScope(rawInput) {
    var inp = rawInput && typeof rawInput === 'object' ? rawInput : {};
    var trackKey = TRACK_CATALOG[inp.track] ? inp.track : 'offline-workspace';
    var spec = TRACK_CATALOG[trackKey];
    var timelineKey = TIMELINE_LABELS[inp.timeline] ? inp.timeline : '2-to-4-weeks';
    var timelineLabel = TIMELINE_LABELS[timelineKey];
    var name = sanitizePlainText(inp.name || '', 120);
    var email = sanitizePlainText(inp.email || '', 160);
    var company = sanitizePlainText(inp.company || '', 120);
    var brief = sanitizePlainText(inp.brief || '', 2400);
    var publicEmail = isSafePublicEmail(inp.publicEmail) ? inp.publicEmail.trim() : DEFAULT_PUBLIC_EMAIL;
    var responseWindow = sanitizePlainText(inp.responseWindow || DEFAULT_RESPONSE_WINDOW, 80);

    var seed = [trackKey, timelineKey, company.toLowerCase(), brief.toLowerCase()].join('|');
    var refId = computeQuoteRef(seed);
    var terms = extractFocusTerms(brief, spec.w0);
    var focusSuffix = terms.length
      ? ' tailored around ' + terms.join(', ')
      : (company ? ' tailored for ' + company : '');

    var wave0 = spec.w0 + focusSuffix + '.';
    var wave1 = spec.w1 + ' (' + timelineLabel.toLowerCase() + ' cadence).';
    var wave2 = spec.w2 + '.';

    var whoLabel = company ? (name ? name + ' (' + company + ')' : company) : (name || 'Prospective Client');
    var subject = '[' + refId + '] Enterprise Tenant Spec: ' + spec.shortLabel + ' - ' + whoLabel;

    var lines = [
      'AETHER ENTERPRISE TENANT & ARCHITECTURE BRIEF (' + refId + ')',
      'To: Eloquent (' + publicEmail + ')',
      'From: ' + (name || '[Your Name]') + (email ? ' <' + email + '>' : ''),
      company ? ('Organization: ' + company) : 'Organization: Independent / Unspecified',
      'Track: ' + spec.label,
      'Target Timeline: ' + timelineLabel,
      '',
      'PROJECT BRIEF:',
      brief || '[Add 1 to 4 plain-English sentences describing your workflow and goal.]',
      '',
      'PROPOSED WAVE 0..2 BUILD SCOPE:',
      '- Wave 0 (Foundation): ' + wave0,
      '- Wave 1 (Core Surface): ' + wave1,
      '- Wave 2 (Verified Handoff): ' + wave2,
      '',
      'Response window: ' + responseWindow + ' · Client keeps full source code.'
    ];
    var plainBrief = lines.join('\n');

    var mailBody = plainBrief.length > 1500 ? (plainBrief.slice(0, 1490) + '\n[...]') : plainBrief;
    var mailtoHref = 'mailto:' + publicEmail +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(mailBody);

    var capsule = {
      schema: 'aether.quote.capsule.v1',
      refId: refId,
      recipient: publicEmail,
      operator: 'Eloquent (@mjeanhudson-dev)',
      responseWindow: responseWindow,
      contact: {
        name: name || null,
        replyEmail: email || null,
        company: company || null
      },
      project: {
        track: trackKey,
        trackLabel: spec.label,
        timeline: timelineKey,
        timelineLabel: timelineLabel,
        brief: brief || ''
      },
      proposedScope: {
        wave0: wave0,
        wave1: wave1,
        wave2: wave2
      }
    };

    return {
      refId: refId,
      trackKey: trackKey,
      trackLabel: spec.label,
      shortTrackLabel: spec.shortLabel,
      routerHint: spec.routerHint,
      timelineKey: timelineKey,
      timelineLabel: timelineLabel,
      waves: [wave0, wave1, wave2],
      subject: subject,
      plainBrief: plainBrief,
      mailtoHref: mailtoHref,
      capsule: capsule
    };
  }

  return {
    isSafeHttpsUrl: isSafeHttpsUrl,
    resolveFundingChannels: resolveFundingChannels,
    resolveContactConfig: resolveContactConfig,
    computeQuoteRef: computeQuoteRef,
    synthesizeQuoteScope: synthesizeQuoteScope
  };
}));

if (typeof window !== 'undefined' && typeof document !== 'undefined') (function () {
  'use strict';

  if (
    !document.body.classList.contains('sqs-edit-mode-active') &&
    window.ScrollCraft &&
    typeof window.ScrollCraft.mount === 'function' &&
    (!Array.isArray(window.ScrollCraft.instances) || window.ScrollCraft.instances.length === 0)
  ) {
    var embedRoot = document.querySelector('[data-sc-embed]');
    if (embedRoot) {
      window.ScrollCraft.mount(embedRoot, { load: 'direct' });
    } else {
      window.ScrollCraft.mount(document.body);
    }
  }

  var reduceMotionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduceMotion = reduceMotionMq.matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mobileMq = window.matchMedia('(max-width: 860px)');

  if (typeof reduceMotionMq.addEventListener === 'function') {
    reduceMotionMq.addEventListener('change', function (e) {
      reduceMotion = Boolean(e.matches);
    });
  }

  var cleaveAct = document.getElementById('act-cleave');
  var cleaveStage = document.getElementById('cleave-stage');
  var cleaveMeteor = document.getElementById('cleave-meteor');
  var cleaveReadout = document.getElementById('cleave-readout');
  var cleaveTelemetryTag = document.querySelector('.cleave-telemetry__tag');
  var cleaveFractureDeck = document.getElementById('cleave-fracture-deck');
  var detonateBtns = Array.prototype.slice.call(document.querySelectorAll('[data-aether-detonate]'));
  var detonateLabelEl = document.querySelector('[data-detonate-label]');
  var resetBtns = Array.prototype.slice.call(document.querySelectorAll('[data-impact-reset]'));

  var corridorAct = document.getElementById('act-corridor');
  var corridorRail = document.getElementById('corridor-rail');

  var mirrorAct = document.getElementById('act-mirror');
  var mirrorStage = document.getElementById('mirror-stage');
  var mirrorImpact = document.getElementById('mirror-impact');
  var mirrorSheen = document.getElementById('mirror-sheen');

  var artifactAct = document.getElementById('act-artifact');
  var artifactStage = document.getElementById('artifact-stage');
  var artifactPhaseReadout = document.getElementById('artifact-phase-readout');
  var artifactNodes = Array.prototype.slice.call(document.querySelectorAll('.artifact-node[data-cleave-step]'));

  var navDayEl = document.querySelector('[data-aether-nav-day]');
  var ledgerDayEl = document.querySelector('[data-aether-ledger-day]');
  var colophonBadgeEl = document.getElementById('colophon-day-badge');
  var colophonTitleEl = document.getElementById('colophon-day-title');
  var colophonPromptEl = document.getElementById('colophon-day-prompt');
  var colophonDeliverableEl = document.getElementById('colophon-day-deliverable');

  var impactState = (cleaveStage && cleaveStage.getAttribute('data-impact-state')) || 'frozen';

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
  }

  function smoothScrollToEl(el) {
    if (!el) return;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function copyTextSafe(text, onDone) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(text).then(function () {
        onDone(true);
      }, function () {
        fallbackCopy(text, onDone);
      });
    } else {
      fallbackCopy(text, onDone);
    }
  }

  function fallbackCopy(text, onDone) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.className = 'visually-hidden';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      onDone(Boolean(ok));
    } catch (_err) {
      onDone(false);
    }
  }

  /* ---- 1. Track which interactive acts are actually in the viewport ------- */
  var inView = {
    cleave: true,
    mirror: false,
    artifact: false
  };

  if ('IntersectionObserver' in window) {
    var stageIo = new IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var el = entries[i].target;
          var vis = entries[i].isIntersecting;
          if (el === cleaveAct) inView.cleave = vis;
          else if (el === mirrorAct) inView.mirror = vis;
          else if (el === artifactAct) inView.artifact = vis;
        }
        syncScrollChoreography(false);
      },
      { rootMargin: '120px 0px', threshold: 0 }
    );
    if (cleaveAct) stageIo.observe(cleaveAct);
    if (mirrorAct) stageIo.observe(mirrorAct);
    if (artifactAct) stageIo.observe(artifactAct);
  } else {
    inView.cleave = true;
    inView.mirror = true;
    inView.artifact = true;
  }

  /* ---- 2. Synchronize Act 1, Act 3, and Act 4 GPU layers & verify state --- */
  var lastCleaveSig = '';
  var lastCleaveLabel = '';
  var lastCleaveTransform = '';
  var lastCleaveP = 0;
  var detonateSettleTimer = 0;
  var lastMirrorSig = '';
  var lastMirrorOp = -1;
  var lastArtifactSig = '';
  var lastStep = -1;
  var lastPhaseLabel = '';

  var ptrTargetX = 0.5;
  var ptrTargetY = 0.5;
  var ptrCurX = 0.5;
  var ptrCurY = 0.5;
  var ptrActive = false;

  function applyCleaveTransform() {
    if (!cleaveMeteor) return;
    var next = '';
    if (!reduceMotion && impactState !== 'detonated') {
      if (mobileMq.matches) {
        next = 'translate3d(0,' + (lastCleaveP * -10).toFixed(2) + 'px,0)';
      } else {
        var dxPx = ((ptrCurX - 0.5) * 18).toFixed(2);
        var dyPx = (lastCleaveP * -26 + (ptrCurY - 0.5) * 12).toFixed(2);
        var sc = (1 + lastCleaveP * 0.04).toFixed(4);
        next = 'translate3d(' + dxPx + 'px,' + dyPx + 'px,0) scale(' + sc + ')';
      }
    }
    if (next !== lastCleaveTransform) {
      lastCleaveTransform = next;
      cleaveMeteor.style.transform = next;
    }
  }

  function applyMirrorSheenTransform() {
    if (!mirrorSheen || reduceMotion) return;
    var vw = window.innerWidth || 1440;
    var vh = window.innerHeight || 900;
    var tx = ((ptrCurX - 0.5) * vw * 0.72).toFixed(1);
    var ty = ((ptrCurY - 0.5) * vh * 0.72).toFixed(1);
    mirrorSheen.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
  }

  function syncCleaveStageState() {
    if (!cleaveAct || !cleaveStage) return;
    var cp = parseFloat(cleaveAct.style.getPropertyValue('--sc-p')) || 0;
    lastCleaveP = cp;
    applyCleaveTransform();

    var cleaveShift = Math.round(cp * 28);
    var cSig = 'p:' + cp.toFixed(2) + '|cleave:' + cleaveShift;
    if (cSig !== lastCleaveSig) {
      lastCleaveSig = cSig;
      cleaveStage.setAttribute('data-sc-verify-state', cSig);
    }
    if (cleaveReadout) {
      var cLabel = impactState === 'detonated'
        ? 'QUOTE ROUTER ACTIVE'
        : cp < 0.35
          ? '4 STARTER KITS · 30 DAYS'
          : cp < 0.70
            ? 'PLANS FRACTURING · WAVE 0..2'
            : 'CORRIDOR AHEAD · TRAVERSE STORY';
      if (cLabel !== lastCleaveLabel) {
        lastCleaveLabel = cLabel;
        cleaveReadout.textContent = cLabel;
      }
    }
  }

  function syncScrollChoreography(forceAll) {
    if (cleaveAct && cleaveStage && (forceAll || inView.cleave)) {
      syncCleaveStageState();
    }

    if (mirrorAct && mirrorStage && (forceAll || inView.mirror)) {
      var mp = parseFloat(mirrorAct.style.getPropertyValue('--sc-p')) || 0;
      var beat = mp >= 0.22 ? 2 : 1;
      var mSig = 'mirror:' + mp.toFixed(2) + '|beat:' + beat;
      if (mSig !== lastMirrorSig) {
        lastMirrorSig = mSig;
        mirrorStage.setAttribute('data-sc-verify-state', mSig);
      }
      if (mirrorImpact && !reduceMotion) {
        var settle = clamp01((mp - 0.08) / 0.62);
        var smoothSettle = settle * settle * (3 - 2 * settle);
        var impactOp = Number((0.76 * (1 - smoothSettle) + 0.03).toFixed(3));
        if (impactOp !== lastMirrorOp) {
          lastMirrorOp = impactOp;
          mirrorImpact.style.opacity = String(impactOp);
          mirrorImpact.style.transform = 'translate3d(0,0,0) scale(' + (1.02 + smoothSettle * 0.045).toFixed(4) + ')';
        }
      }
    }

    if (artifactAct && artifactStage && (forceAll || inView.artifact)) {
      var ap = parseFloat(artifactAct.style.getPropertyValue('--sc-p')) || 0;
      if (window.AetherArtifactShader && typeof window.AetherArtifactShader.setProgress === 'function') {
        window.AetherArtifactShader.setProgress(ap);
      }
      var phaseKey = ap < 0.35 ? 'mercury' : (ap <= 0.72 ? 'cleavage' : 'crystal');
      var step = ap < 0.18 ? 0 : (ap < 0.36 ? 1 : (ap < 0.56 ? 2 : (ap < 0.74 ? 3 : 4)));
      var aSig = 'phase:' + phaseKey + '|step:' + step + '|p:' + ap.toFixed(2);
      if (aSig !== lastArtifactSig) {
        lastArtifactSig = aSig;
        artifactStage.setAttribute('data-sc-verify-state', aSig);
      }

      if (step !== lastStep) {
        lastStep = step;
        artifactNodes.forEach(function (node) {
          var idx = Number(node.getAttribute('data-cleave-step'));
          node.classList.toggle('is-active', idx === step);
        });
      }

      if (artifactPhaseReadout) {
        var pLabel = phaseKey === 'mercury'
          ? 'Phase 01 · Molten Mercury Suspension'
          : phaseKey === 'cleavage'
            ? 'Phase 02 · 60° Widmanstatten Cleavage'
            : 'Phase 03 · Crystal Lattice Locked';
        if (pLabel !== lastPhaseLabel) {
          lastPhaseLabel = pLabel;
          artifactPhaseReadout.textContent = pLabel;
        }
      }
    }
  }

  /* ---- 3. GPU-only passive pointer damping (zero ancestor CSS var thrash) - */
  function tickPointer() {
    ptrCurX += (ptrTargetX - ptrCurX) * 0.12;
    ptrCurY += (ptrTargetY - ptrCurY) * 0.12;

    if (inView.cleave && impactState === 'frozen') {
      applyCleaveTransform();
    }
    if (inView.mirror) {
      applyMirrorSheenTransform();
    }
    if (inView.artifact && window.AetherArtifactShader && typeof window.AetherArtifactShader.setPointer === 'function') {
      window.AetherArtifactShader.setPointer(ptrCurX, ptrCurY);
    }

    if (Math.abs(ptrTargetX - ptrCurX) > 0.0008 || Math.abs(ptrTargetY - ptrCurY) > 0.0008) {
      requestAnimationFrame(tickPointer);
    } else {
      ptrActive = false;
    }
  }

  if (!reduceMotion && finePointer) {
    window.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      if (!inView.cleave && !inView.mirror && !inView.artifact) return;
      ptrTargetX = clamp01(e.clientX / Math.max(window.innerWidth, 1));
      ptrTargetY = clamp01(e.clientY / Math.max(window.innerHeight, 1));
      if (!ptrActive) {
        ptrActive = true;
        requestAnimationFrame(tickPointer);
      }
    }, { passive: true });
  }

  var scrollTickPending = false;
  window.addEventListener('scroll', function () {
    if (!scrollTickPending) {
      scrollTickPending = true;
      requestAnimationFrame(function () {
        scrollTickPending = false;
        syncScrollChoreography(false);
      });
    }
  }, { passive: true });
  window.addEventListener('resize', function () { syncScrollChoreography(true); }, { passive: true });

  /* ---- 4. Act 1 Freeze-Frame Detonation + Smart AI Intent Router ---------- */
  var routerPills = Array.prototype.slice.call(document.querySelectorAll('[data-router-intent]'));
  var routerWavePreviewEl = document.getElementById('router-wave-preview');
  var routerGoalInput = document.getElementById('router-goal-input');
  var routerRouteBtn = document.querySelector('[data-quote-route-btn]');
  var routerBtnLabelEl = document.querySelector('[data-router-btn-label]');
  var activeRouterIntent = 'offline-workspace';

  var ROUTER_PREVIEWS = {
    'offline-workspace': 'Wave 0..2 scope: Single-file workspace schema · SVG mind-map & lexicon · offline SHA-256 handoff capsule.',
    'local-ai-vault': 'Wave 0..2 scope: Vault redaction boundary · local FTS5 / MCP index · cryptographic claim-vs-diff parity gate.',
    'custom-webos-site': 'Wave 0..2 scope: Narrative & 4K optical type · 60fps GPU stage & interactive widgets · portable source bundle.',
    'free-kit': 'Free 30-Day Kit: Open the in-browser Aether WebOS Refractory right now with 4 starter kits and zero login.'
  };

  function setImpactState(nextState, moveFocus) {
    impactState = nextState === 'detonated' ? 'detonated' : 'frozen';
    var isDetonated = impactState === 'detonated';
    if (cleaveStage) {
      if (detonateSettleTimer) {
        window.clearTimeout(detonateSettleTimer);
        detonateSettleTimer = 0;
      }
      cleaveStage.classList.add('is-detonating');
      cleaveStage.setAttribute('data-impact-state', impactState);
      detonateSettleTimer = window.setTimeout(function () {
        detonateSettleTimer = 0;
        if (cleaveStage) cleaveStage.classList.remove('is-detonating');
      }, 520);
    }
    if (isDetonated) {
      ptrActive = false;
    }
    detonateBtns.forEach(function (btn) {
      btn.setAttribute('aria-expanded', isDetonated ? 'true' : 'false');
    });
    if (cleaveMeteor) {
      if (isDetonated) cleaveMeteor.setAttribute('tabindex', '-1');
      else cleaveMeteor.removeAttribute('tabindex');
    }
    if (cleaveFractureDeck) {
      cleaveFractureDeck.inert = !isDetonated;
      if (isDetonated) cleaveFractureDeck.removeAttribute('inert');
      else cleaveFractureDeck.setAttribute('inert', '');
    }
    if (detonateLabelEl) {
      detonateLabelEl.textContent = isDetonated ? 'Replay Freeze-Frame' : 'Detonate Impact';
    }
    if (cleaveTelemetryTag) {
      cleaveTelemetryTag.textContent = isDetonated
        ? 'T + 0.00s · IMPACT DETONATED'
        : 'T - 0.04s · IMPACT SUSPENDED';
    }
    lastCleaveLabel = '';
    syncCleaveStageState();

    if (moveFocus) {
      requestAnimationFrame(function () {
        if (isDetonated) {
          var selectedPill = document.querySelector('[data-router-intent][aria-pressed="true"]') || routerPills[0];
          if (selectedPill && typeof selectedPill.focus === 'function') {
            selectedPill.focus({ preventScroll: true });
          }
        } else {
          var mainBtn = document.getElementById('cleave-detonate-btn');
          if (mainBtn && typeof mainBtn.focus === 'function') {
            mainBtn.focus({ preventScroll: true });
          }
        }
      });
    }
  }

  detonateBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn === cleaveMeteor) {
        setImpactState('detonated', true);
      } else {
        setImpactState(impactState === 'detonated' ? 'frozen' : 'detonated', true);
      }
    });
  });

  resetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setImpactState('frozen', true);
    });
  });

  /* ---- 5. Smart Quote Synthesizer & Accessible Validation (#act-contact) -- */
  var contactCfg = window.AetherFunding.resolveContactConfig(null);
  var quoteForm = document.getElementById('aether-quote-form');
  var quoteNameEl = document.getElementById('quote-name');
  var quoteEmailEl = document.getElementById('quote-email');
  var quoteCompanyEl = document.getElementById('quote-company');
  var quoteTrackEl = document.getElementById('quote-track');
  var quoteTimelineEl = document.getElementById('quote-timeline');
  var quoteBriefEl = document.getElementById('quote-brief');
  var quoteHpEl = document.getElementById('quote-website-hp');
  var quoteSubmitBtn = document.getElementById('quote-submit-btn');
  var quoteFormStatusEl = document.getElementById('quote-form-status');

  var quoteRefEl = document.getElementById('quote-ref-id');
  var quotePreviewTrackEl = document.getElementById('quote-preview-track');
  var quotePreviewTimelineEl = document.getElementById('quote-preview-timeline');
  var quoteWave0El = document.getElementById('quote-wave-0');
  var quoteWave1El = document.getElementById('quote-wave-1');
  var quoteWave2El = document.getElementById('quote-wave-2');
  var quoteMailtoEl = document.getElementById('quote-mailto-link');
  var quoteCopyBtn = document.getElementById('quote-copy-brief-btn');
  var quoteDownloadBtn = document.getElementById('quote-download-json-btn');
  var quotePreviewFeedbackEl = document.getElementById('quote-preview-feedback');

  var lastSynthesized = null;
  var quoteStatusMode = 'idle'; // 'idle' | 'routed' | 'locked' | 'error'

  function syncLiveQuoteStatus(syn) {
    if (!quoteFormStatusEl || !syn || quoteStatusMode === 'idle' || quoteStatusMode === 'error') return;
    var hasValidName = Boolean(quoteNameEl && quoteNameEl.value.trim() && quoteNameEl.validity.valid);
    var hasValidEmail = Boolean(quoteEmailEl && quoteEmailEl.value.trim() && quoteEmailEl.validity.valid);
    var hasValidBrief = Boolean(quoteBriefEl && quoteBriefEl.value.trim() && quoteBriefEl.validity.valid);

    if (quoteStatusMode === 'locked') {
      quoteFormStatusEl.textContent = 'Scope ' + syn.refId + ' locked. Click Email Quote Request to ' + contactCfg.publicEmail + ', Copy Brief, or Download Capsule (.json).';
      return;
    }

    if (hasValidName && hasValidEmail && hasValidBrief) {
      quoteFormStatusEl.textContent = 'Ready to dispatch (' + syn.refId + '). Click Lock Scope & Prepare Dispatch or send directly on the right.';
    } else if (hasValidName && hasValidEmail) {
      quoteFormStatusEl.textContent = 'Selected ' + syn.shortTrackLabel + ' (' + syn.refId + '). Describe your project brief above to lock scope.';
    } else {
      quoteFormStatusEl.textContent = 'Routed ' + syn.shortTrackLabel + ' (' + syn.refId + '). Add your name and reply email below to dispatch.';
    }
  }

  function refreshQuotePreview() {
    if (!window.AetherFunding || typeof window.AetherFunding.synthesizeQuoteScope !== 'function') return null;
    var syn = window.AetherFunding.synthesizeQuoteScope({
      name: quoteNameEl ? quoteNameEl.value : '',
      email: quoteEmailEl ? quoteEmailEl.value : '',
      company: quoteCompanyEl ? quoteCompanyEl.value : '',
      track: quoteTrackEl ? quoteTrackEl.value : activeRouterIntent,
      timeline: quoteTimelineEl ? quoteTimelineEl.value : '2-to-4-weeks',
      brief: quoteBriefEl ? quoteBriefEl.value : (routerGoalInput ? routerGoalInput.value : ''),
      publicEmail: contactCfg.publicEmail,
      responseWindow: contactCfg.responseWindow
    });
    lastSynthesized = syn;

    if (quoteRefEl) quoteRefEl.textContent = 'REF · ' + syn.refId;
    if (quotePreviewTrackEl) quotePreviewTrackEl.textContent = syn.shortTrackLabel;
    if (quotePreviewTimelineEl) quotePreviewTimelineEl.textContent = syn.timelineLabel;
    if (quoteWave0El) quoteWave0El.textContent = syn.waves[0];
    if (quoteWave1El) quoteWave1El.textContent = syn.waves[1];
    if (quoteWave2El) quoteWave2El.textContent = syn.waves[2];
    if (quoteMailtoEl) {
      quoteMailtoEl.href = syn.mailtoHref;
      quoteMailtoEl.textContent = 'Email Quote Request to ' + contactCfg.publicEmail;
    }
    syncLiveQuoteStatus(syn);
    return syn;
  }

  function selectRouterIntent(intentKey) {
    activeRouterIntent = ROUTER_PREVIEWS[intentKey] ? intentKey : 'offline-workspace';
    routerPills.forEach(function (pill) {
      var k = pill.getAttribute('data-router-intent');
      pill.setAttribute('aria-pressed', k === activeRouterIntent ? 'true' : 'false');
    });
    if (routerWavePreviewEl) {
      routerWavePreviewEl.textContent = ROUTER_PREVIEWS[activeRouterIntent];
    }
    var nextLabel = activeRouterIntent === 'free-kit'
      ? 'Open Free 30-Day Kit'
      : 'Configure Tenant Architecture';
    if (routerBtnLabelEl) {
      routerBtnLabelEl.textContent = nextLabel;
    } else if (routerRouteBtn) {
      routerRouteBtn.textContent = nextLabel;
    }
    if (activeRouterIntent !== 'free-kit' && quoteTrackEl) {
      quoteTrackEl.value = activeRouterIntent;
      refreshQuotePreview();
    }
  }

  function executeRouterAction() {
    var goal = routerGoalInput ? routerGoalInput.value.trim() : '';
    if (activeRouterIntent === 'free-kit') {
      var studioSec = document.getElementById('act-studio');
      smoothScrollToEl(studioSec);
      return;
    }
    if (quoteTrackEl) {
      quoteTrackEl.value = activeRouterIntent;
    }
    if (goal && quoteBriefEl) {
      quoteBriefEl.value = goal;
    }
    quoteStatusMode = 'routed';
    if (quoteFormStatusEl) {
      quoteFormStatusEl.classList.remove('is-error');
    }
    var syn = refreshQuotePreview();
    var contactSec = document.getElementById('act-contact');
    smoothScrollToEl(contactSec);
    if (quoteFormStatusEl && syn) {
      syncLiveQuoteStatus(syn);
    }
    setTimeout(function () {
      var targetField = (quoteNameEl && !quoteNameEl.value.trim()) ? quoteNameEl : quoteBriefEl;
      if (targetField && typeof targetField.focus === 'function') {
        targetField.focus({ preventScroll: true });
      }
    }, reduceMotion ? 40 : 420);
  }

  routerPills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      selectRouterIntent(pill.getAttribute('data-router-intent') || 'offline-workspace');
    });
  });

  if (routerGoalInput) {
    routerGoalInput.addEventListener('input', function () {
      if (quoteBriefEl && !quoteBriefEl.value.trim()) {
        refreshQuotePreview();
      }
    });
    routerGoalInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.isComposing) {
        e.preventDefault();
        executeRouterAction();
      }
    });
  }

  if (routerRouteBtn) {
    routerRouteBtn.addEventListener('click', executeRouterAction);
  }

  document.querySelectorAll('[data-select-quote-track]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var track = btn.getAttribute('data-select-quote-track') || 'offline-workspace';
      if (quoteTrackEl) quoteTrackEl.value = track;
      quoteStatusMode = 'routed';
      if (quoteFormStatusEl) {
        quoteFormStatusEl.classList.remove('is-error');
      }
      var syn = refreshQuotePreview();
      smoothScrollToEl(document.getElementById('act-contact'));
      if (quoteFormStatusEl && syn) {
        syncLiveQuoteStatus(syn);
      }
    });
  });

  /* Accessible form validation (:user-invalid + ARIA sync + polite live announcer) */
  function initQuoteFormValidation() {
    if (!quoteForm) return;
    var dirtyMap = new WeakMap();
    var announcedSet = new WeakSet();
    var supportsUserInvalid = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('selector(:user-invalid)');

    var announcer = document.createElement('div');
    announcer.setAttribute('aria-live', 'polite');
    announcer.className = 'visually-hidden';
    document.body.appendChild(announcer);
    var announceTimer = 0;
    var announcedField = null;

    function linkFieldError(el, shown) {
      var errorId = el.getAttribute('data-error');
      if (!errorId) return;
      var raw = el.getAttribute('aria-describedby') || '';
      var parts = raw.split(/\s+/).filter(function (id) { return Boolean(id && id !== errorId); });
      if (shown) parts.push(errorId);
      if (parts.length) el.setAttribute('aria-describedby', parts.join(' '));
      else el.removeAttribute('aria-describedby');
    }

    function announceFieldError(el) {
      var errorId = el.getAttribute('data-error');
      var errEl = errorId ? document.getElementById(errorId) : null;
      if (!errEl) return;
      var labelText = el.labels && el.labels[0]
        ? el.labels[0].textContent.replace(/\*/g, '').replace(/\s+/g, ' ').trim() + ': '
        : '';
      var msgText = errEl.textContent.replace(/\s+/g, ' ').trim();
      clearTimeout(announceTimer);
      announcer.textContent = '';
      announcedField = el;
      announceTimer = setTimeout(function () {
        announcer.textContent = labelText + msgText;
      }, 450);
    }

    function syncFieldValidity(el, forceDirty, shouldAnnounce) {
      if (!el || !el.validity) return true;
      var st = dirtyMap.get(el) || { interacted: false, blurred: false };
      if (forceDirty) {
        st.interacted = true;
        st.blurred = true;
        dirtyMap.set(el, st);
      }
      var nativeUserInvalid = supportsUserInvalid && el.matches(':user-invalid');
      var showErr = !el.validity.valid && (nativeUserInvalid || (st.interacted && st.blurred));

      el.classList.toggle('user-invalid-fallback', showErr);
      el.classList.toggle('user-valid-fallback', el.validity.valid && st.interacted && Boolean(el.value.trim()));
      el.setAttribute('aria-invalid', showErr ? 'true' : 'false');
      linkFieldError(el, showErr);

      if (showErr) {
        if (shouldAnnounce && !announcedSet.has(el)) {
          announceFieldError(el);
          announcedSet.add(el);
        }
      } else {
        announcedSet.delete(el);
        if (announcedField === el) {
          clearTimeout(announceTimer);
          announcer.textContent = '';
        }
      }
      return el.validity.valid;
    }

    var controls = Array.prototype.slice.call(quoteForm.querySelectorAll('input, select, textarea'));
    controls.forEach(function (el) {
      if (el === quoteHpEl) return;
      el.setAttribute('aria-invalid', 'false');
      linkFieldError(el, false);

        el.addEventListener('input', function () {
        var st = dirtyMap.get(el) || { interacted: false, blurred: false };
        st.interacted = true;
        dirtyMap.set(el, st);
        if (st.blurred || el.getAttribute('aria-invalid') === 'true') {
          syncFieldValidity(el, false, false);
        }
        if (quoteStatusMode === 'error' && quoteFormStatusEl) {
          var allValidNow = controls.every(function (c) { return c === quoteHpEl || c.validity.valid; });
          if (allValidNow) {
            quoteStatusMode = 'routed';
            quoteFormStatusEl.classList.remove('is-error');
          }
        }
        refreshQuotePreview();
      });

      el.addEventListener('change', function () {
        var st = dirtyMap.get(el) || { interacted: true, blurred: true };
        st.interacted = true;
        dirtyMap.set(el, st);
        syncFieldValidity(el, false, true);
        if (quoteStatusMode === 'error' && quoteFormStatusEl) {
          var allValidNow = controls.every(function (c) { return c === quoteHpEl || c.validity.valid; });
          if (allValidNow) {
            quoteStatusMode = 'routed';
            quoteFormStatusEl.classList.remove('is-error');
          }
        }
        refreshQuotePreview();
      });

      el.addEventListener('blur', function () {
        var st = dirtyMap.get(el) || { interacted: false, blurred: false };
        st.blurred = true;
        dirtyMap.set(el, st);
        if (st.interacted) {
          syncFieldValidity(el, false, true);
        }
      });
    });

    quoteForm.addEventListener('reset', function () {
      setTimeout(function () {
        quoteStatusMode = 'idle';
        controls.forEach(function (el) {
          if (el === quoteHpEl) return;
          dirtyMap.delete(el);
          announcedSet.delete(el);
          el.classList.remove('user-invalid-fallback', 'user-valid-fallback');
          el.setAttribute('aria-invalid', 'false');
          linkFieldError(el, false);
        });
        if (quoteFormStatusEl) {
          quoteFormStatusEl.classList.remove('is-error');
          quoteFormStatusEl.textContent = '';
        }
        refreshQuotePreview();
      }, 0);
    });

    quoteForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (quoteHpEl && quoteHpEl.value.trim()) return;

      var firstInvalid = null;
      for (var i = 0; i < controls.length; i++) {
        var ctrl = controls[i];
        if (ctrl === quoteHpEl) continue;
        announcedSet.add(ctrl);
        var ok = syncFieldValidity(ctrl, true, false);
        if (!ok && !firstInvalid) firstInvalid = ctrl;
      }

      if (firstInvalid) {
        quoteStatusMode = 'error';
        if (quoteFormStatusEl) {
          quoteFormStatusEl.classList.add('is-error');
          quoteFormStatusEl.textContent = 'Please complete the highlighted fields above so your Wave 0..2 scope is accurate.';
        }
        firstInvalid.focus();
        return;
      }

      quoteStatusMode = 'locked';
      if (quoteFormStatusEl) {
        quoteFormStatusEl.classList.remove('is-error');
      }
      var syn = refreshQuotePreview();
      if (!syn) return;

      if (contactCfg.quoteWebhookUrl && window.AetherFunding.isSafeHttpsUrl(contactCfg.quoteWebhookUrl) && typeof window.fetch === 'function') {
        if (quoteSubmitBtn) quoteSubmitBtn.disabled = true;
        if (quoteFormStatusEl) {
          quoteFormStatusEl.classList.remove('is-error');
          quoteFormStatusEl.textContent = 'Submitting scope ' + syn.refId + '...';
        }
        window.fetch(contactCfg.quoteWebhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(syn.capsule)
        }).then(function (res) {
          if (quoteSubmitBtn) quoteSubmitBtn.disabled = false;
          if (quoteFormStatusEl) {
            quoteFormStatusEl.classList.remove('is-error');
            quoteFormStatusEl.textContent = res && res.ok
              ? ('Quote ' + syn.refId + ' delivered. You can also save a local copy or email ' + contactCfg.publicEmail + ' directly.')
              : ('Scope ' + syn.refId + ' locked. Click Email Quote Request to ' + contactCfg.publicEmail + ' or copy the brief on the right.');
          }
        }).catch(function () {
          if (quoteSubmitBtn) quoteSubmitBtn.disabled = false;
          if (quoteFormStatusEl) {
            quoteFormStatusEl.classList.remove('is-error');
            quoteFormStatusEl.textContent = 'Scope ' + syn.refId + ' locked locally. Click Email Quote Request to ' + contactCfg.publicEmail + ' or copy the brief.';
          }
        });
        return;
      }

      if (quoteFormStatusEl) {
        quoteFormStatusEl.classList.remove('is-error');
        quoteFormStatusEl.textContent = 'Scope ' + syn.refId + ' locked. Click Email Quote Request to ' + contactCfg.publicEmail + ', Copy Brief, or Download Capsule (.json).';
      }
      if (quoteMailtoEl && typeof quoteMailtoEl.focus === 'function') {
        quoteMailtoEl.focus({ preventScroll: true });
      }
    });
  }

  if (quoteCopyBtn) {
    quoteCopyBtn.addEventListener('click', function () {
      var syn = lastSynthesized || refreshQuotePreview();
      if (!syn) return;
      copyTextSafe(syn.plainBrief, function (ok) {
        if (quotePreviewFeedbackEl) {
          quotePreviewFeedbackEl.textContent = ok
            ? ('Copied ' + syn.refId + ' brief to clipboard. Paste into an email to ' + contactCfg.publicEmail + '.')
            : ('Select and copy your scope above, or email ' + contactCfg.publicEmail + '.');
        }
      });
    });
  }

  if (quoteDownloadBtn) {
    quoteDownloadBtn.addEventListener('click', function () {
      var syn = lastSynthesized || refreshQuotePreview();
      if (!syn) return;
      var payload = JSON.stringify(syn.capsule, null, 2) + '\n';
      var blob = new Blob([payload], { type: 'application/json;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'aether-quote-' + syn.refId.toLowerCase() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
      if (quotePreviewFeedbackEl) {
        quotePreviewFeedbackEl.textContent = 'Downloaded quote capsule aether-quote-' + syn.refId.toLowerCase() + '.json.';
      }
    });
  }

  var copyEmailBtn = document.querySelector('[data-copy-email]');
  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', function () {
      copyTextSafe(contactCfg.publicEmail, function (ok) {
        copyEmailBtn.textContent = ok ? ('Copied ' + contactCfg.publicEmail) : contactCfg.publicEmail;
        setTimeout(function () {
          copyEmailBtn.textContent = 'Copy email address';
        }, 2400);
      });
    });
  }

  function initContactManifest() {
    refreshQuotePreview();
    if (window.location && window.location.protocol === 'file:') return;
    if (typeof window.fetch !== 'function' || !window.AetherFunding) return;
    window.fetch('./context/contact.json', { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (manifest) {
        if (!manifest) return;
        contactCfg = window.AetherFunding.resolveContactConfig(manifest);
        document.querySelectorAll('[data-contact-email-link]').forEach(function (el) {
          el.setAttribute('href', 'mailto:' + contactCfg.publicEmail);
        });
        document.querySelectorAll('[data-contact-email-text]').forEach(function (el) {
          el.textContent = contactCfg.publicEmail;
        });
        document.querySelectorAll('[data-contact-window]').forEach(function (el) {
          el.textContent = 'Response window: ' + contactCfg.responseWindow;
        });
        refreshQuotePreview();
      })
      .catch(function () {});
  }

  initQuoteFormValidation();
  initContactManifest();
  syncScrollChoreography(true);

  /* ---- 6. Interactive floorplan-codex inline preview in Act 2 ------------- */
  var CODEX_SAMPLES = {
    household: 'WAVE 0 -> Fixed bills snapshot + due dates\nWAVE 1 -> 10-meal pantry loop (depends: Wave 0)\nWAVE 2 -> $25 buffer jar + offline HTML export',
    workshop:  'WAVE 0 -> 90-minute signature flat-rate offer\nWAVE 1 -> 4-question text intake + tool checklist\nWAVE 2 -> Neighbor card + offline phone tracker',
    creator:   'WAVE 0 -> Voice rules + 5 real reader questions\nWAVE 1 -> 25-minute first draft from bench notes\nWAVE 2 -> 25-Turn Pass-Down Capsule + SHA-256'
  };

  var codexOut = document.getElementById('codex-preview-out');
  var codexBtns = Array.prototype.slice.call(document.querySelectorAll('[data-codex-sample]'));
  codexBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-codex-sample') || 'household';
      codexBtns.forEach(function (b) {
        b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
      });
      if (codexOut && CODEX_SAMPLES[key]) {
        codexOut.textContent = CODEX_SAMPLES[key];
      }
    });
  });

  /* ---- 7. Pinned Act & Pan Corridor keyboard focus safety ----------------- */
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!el || !el.closest) return;

    if (cleaveAct && cleaveAct.contains(el)) {
      var cCue = el.closest('[data-sc-cue]');
      if (cCue && parseFloat(getComputedStyle(cCue).opacity || '1') < 0.85) {
        var cTop = cleaveAct.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: Math.round(cTop), behavior: 'instant' });
      }
      return;
    }

    if (artifactAct && artifactAct.contains(el)) {
      var aCue = el.closest('[data-sc-cue]');
      if (aCue && parseFloat(getComputedStyle(aCue).opacity || '1') < 0.85) {
        var aTop = artifactAct.getBoundingClientRect().top + window.scrollY;
        var aTravel = Math.max(artifactAct.offsetHeight - window.innerHeight, 1);
        window.scrollTo({ top: Math.round(aTop + aTravel * 0.45), behavior: 'instant' });
      }
      return;
    }

    if (corridorAct && corridorRail && corridorAct.contains(el) && !reduceMotion) {
      var plate = el.closest('.corridor-plate');
      if (!plate) return;
      var over = corridorRail.scrollWidth - window.innerWidth;
      if (over <= 0) return;
      var extra = over * (parseFloat(corridorRail.getAttribute('data-sc-pan')) || 0);
      var totalTravelX = over + extra;
      var targetLeft = plate.offsetLeft - Math.max((window.innerWidth - plate.offsetWidth) / 2, 24);
      var targetP = clamp01(targetLeft / Math.max(totalTravelX, 1));
      var mTop = corridorAct.getBoundingClientRect().top + window.scrollY;
      var mTravelY = Math.max(corridorAct.offsetHeight - window.innerHeight, 1);
      window.scrollTo({ top: Math.round(mTop + mTravelY * targetP), behavior: 'instant' });
    }
  });

  /* ---- 8. Cross-Act 30-Day Synchronization (Header, Ledger, Colophon) ----- */
  function applyDayUi(detail) {
    if (!detail) return;
    var day = Number(detail.day || detail.activeDay) || 1;
    var week = Number(detail.week) || Math.min(4, Math.max(1, Math.ceil(day / 7.5)));
    var phase = detail.phase || 'Voice & Personal Lexicon';
    var title = detail.title || ('Day ' + day + ' Practice');
    var prompt = detail.prompt || '';
    var deliverable = detail.deliverable || '';

    if (navDayEl) navDayEl.textContent = 'Day ' + day + ' · Wk ' + week;
    if (ledgerDayEl) ledgerDayEl.textContent = 'Active: Day ' + day + ' · Week ' + week;

    if (colophonBadgeEl) {
      colophonBadgeEl.textContent = ('DAY ' + day + ' · WEEK ' + week + ' · ' + phase).toUpperCase();
    }
    if (colophonTitleEl) colophonTitleEl.textContent = title;
    if (colophonPromptEl && prompt) colophonPromptEl.textContent = prompt;
    if (colophonDeliverableEl && deliverable) {
      colophonDeliverableEl.textContent = 'Deliverable: ' + deliverable;
    }

    document.querySelectorAll('.aw-ledger-week[data-week-row]').forEach(function (row) {
      var w = Number(row.getAttribute('data-week-row'));
      row.classList.toggle('is-active-week', w === week);
    });

    document.querySelectorAll('.aw-ledger-day-btn[data-select-day]').forEach(function (btn) {
      var d = Number(btn.getAttribute('data-select-day'));
      btn.setAttribute('aria-pressed', String(d === day));
    });
  }

  document.addEventListener('aether:day-select', function (ev) {
    applyDayUi(ev.detail);
  });

  document.querySelectorAll('.aw-ledger-day-btn[data-select-day]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var d = Number(btn.getAttribute('data-select-day')) || 1;
      if (window.AetherRefractory && typeof window.AetherRefractory.selectDay === 'function') {
        window.AetherRefractory.selectDay(d, { switchKit: true });
      } else {
        var row = btn.closest('[data-week-row]');
        var wk = row ? Number(row.getAttribute('data-week-row')) : 1;
        var label = (btn.getAttribute('aria-label') || '').replace(/^D\d+:\s*/i, '');
        document.dispatchEvent(new CustomEvent('aether:day-select', {
          bubbles: true,
          detail: { day: d, week: wk, title: label }
        }));
      }
    });
  });

  if (window.AetherRefractory && typeof window.AetherRefractory.getState === 'function') {
    applyDayUi(window.AetherRefractory.getState());
  }

  /* ---- 9. Dynamic funding channel wiring (#act-support <- context/funding.json) --- */
  function initFundingSupport() {
    if (window.location && window.location.protocol === 'file:') return;
    if (typeof window.fetch !== 'function' || !window.AetherFunding) return;
    var supportAct = document.getElementById('act-support');
    if (!supportAct) return;
    var slot = supportAct.querySelector('[data-funding-slot="backing"]');
    if (!slot) return;

    window.fetch('./context/funding.json', { cache: 'no-store' })
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (manifest) {
        if (!manifest) return;
        var resolved = window.AetherFunding.resolveFundingChannels(manifest);
        if (!resolved.active) return;

        var labelEl = slot.querySelector('.support-path__label');
        var noteEl = document.getElementById('funding-note');
        var disabledBtn = slot.querySelector('button[aria-disabled="true"]');
        if (labelEl) labelEl.textContent = 'Open now';
        if (noteEl) {
          noteEl.textContent = resolved.posture && !/no payment account/i.test(resolved.posture)
            ? resolved.posture
            : 'Direct backing is open. Choose a verified channel below.';
        }

        var wrap = document.createElement('div');
        wrap.className = 'support-path__actions';
        for (var i = 0; i < resolved.actions.length; i++) {
          var act = resolved.actions[i];
          var a = document.createElement('a');
          a.className = i === 0 ? 'btn btn--primary' : 'btn btn--ghost';
          a.href = act.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.textContent = act.label;
          wrap.appendChild(a);
        }
        if (disabledBtn && disabledBtn.parentNode === slot) {
          slot.replaceChild(wrap, disabledBtn);
        } else {
          slot.appendChild(wrap);
        }

        var ledgerStatus = supportAct.querySelector('.support-ledger span:first-child');
        if (ledgerStatus) {
          ledgerStatus.textContent = '';
          var strong = document.createElement('strong');
          strong.textContent = 'Funding:';
          ledgerStatus.appendChild(strong);
          ledgerStatus.appendChild(document.createTextNode(' live channel verified via context/funding.json.'));
        }

        if (resolved.statsEndpoint) {
          window.fetch(resolved.statsEndpoint, { cache: 'no-store' })
            .then(function (sr) { return sr.ok ? sr.json() : null; })
            .then(function (stats) {
              if (!stats || typeof stats.backers !== 'number' || !ledgerStatus) return;
              var summary = ' ' + stats.backers + (stats.backers === 1 ? ' backer recorded.' : ' backers recorded.');
              if (typeof stats.one_time_cents === 'number' && stats.one_time_cents > 0) {
                summary += ' $' + (stats.one_time_cents / 100).toFixed(2) + ' USD one-time total.';
              }
              ledgerStatus.appendChild(document.createTextNode(summary));
            })
            .catch(function () {});
        }
      })
      .catch(function () {});
  }

  initFundingSupport();

  /* ---- 10. Post-LCP idle texture pre-decoder (zero click-time decode stall) */
  function predecodeStageMedia() {
    var imgs = document.querySelectorAll('.cleave-backdrop--detonated, .cleave-shard, .mirror-impact');
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i];
      if (img.loading === 'lazy') img.loading = 'eager';
      if (typeof img.decode === 'function') {
        img.decode().catch(function () {});
      }
    }
  }

  function schedulePredecode() {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(predecodeStageMedia, { timeout: 600 });
    } else {
      window.setTimeout(predecodeStageMedia, 250);
    }
  }

  if (document.readyState === 'complete') {
    schedulePredecode();
  } else {
    window.addEventListener('load', schedulePredecode, { once: true });
  }
})();
