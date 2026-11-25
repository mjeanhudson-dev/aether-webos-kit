/* ==========================================================================
   Aether WebOS Rollout v2.0 Stage Choreography
   Author: Eloquent (@mjeanhudson-dev)
   Contract: Mounts ScrollCraft, drives GPU-composited leaf transforms for
             Act 1 meteorite cleavage and Act 3 natural obsidian impact ->
             reflective mirror dissolve, forwards pointer/progress directly
             to AetherArtifactShader with zero ancestor CSS-var style thrash,
             tracks data-sc-verify-state, ensures keyboard focus safety in
             pinned/pan acts, drives inline floorplan-codex specimen preview,
             syncs aether:day-select across header, ledger, and colophon,
             and wires optional context/funding.json channels into #act-support.
   ========================================================================== */
(function (root, factory) {
  var funding = factory();
  if (typeof module === 'object' && module.exports) module.exports = funding;
  if (root) root.AetherFunding = funding;
}(typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : null), function () {
  'use strict';

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

  return {
    isSafeHttpsUrl: isSafeHttpsUrl,
    resolveFundingChannels: resolveFundingChannels
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

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var mobileMq = window.matchMedia('(max-width: 760px)');

  var cleaveAct = document.getElementById('act-cleave');
  var cleaveStage = document.getElementById('cleave-stage');
  var cleaveMeteor = document.getElementById('cleave-meteor');
  var cleaveReadout = document.getElementById('cleave-readout');

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

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v;
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
  var lastCleaveP = 0;
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
    if (!cleaveMeteor || reduceMotion) return;
    var isMob = mobileMq.matches;
    if (isMob) {
      var mobY = (lastCleaveP * -10).toFixed(2);
      cleaveMeteor.style.transform = 'translate3d(0,' + mobY + 'px,0)';
      return;
    }
    var dxPx = ((ptrCurX - 0.5) * 16).toFixed(2);
    var dyPx = (lastCleaveP * -28 + (ptrCurY - 0.5) * 11).toFixed(2);
    var sc = (1 + lastCleaveP * 0.045).toFixed(4);
    cleaveMeteor.style.transform = 'translate3d(calc(-12% + ' + dxPx + 'px),' + dyPx + 'px,0) scale(' + sc + ')';
  }

  function applyMirrorSheenTransform() {
    if (!mirrorSheen || reduceMotion) return;
    var vw = window.innerWidth || 1440;
    var vh = window.innerHeight || 900;
    var tx = ((ptrCurX - 0.5) * vw * 0.72).toFixed(1);
    var ty = ((ptrCurY - 0.5) * vh * 0.72).toFixed(1);
    mirrorSheen.style.transform = 'translate3d(' + tx + 'px,' + ty + 'px,0)';
  }

  function syncScrollChoreography(forceAll) {
    if (cleaveAct && cleaveStage && (forceAll || inView.cleave)) {
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
        var cLabel = cp < 0.35
          ? 'CLEAVAGE SEAM · 4 STARTER KITS · 30 DAYS'
          : cp < 0.70
            ? 'PLANS FRACTURING -> WAVE 0..2 STRUCTURE'
            : 'CORRIDOR AHEAD · TRAVERSE THE AUTOPSY';
        if (cLabel !== lastCleaveLabel) {
          lastCleaveLabel = cLabel;
          cleaveReadout.textContent = cLabel;
        }
      }
    }

    if (mirrorAct && mirrorStage && (forceAll || inView.mirror)) {
      var mp = parseFloat(mirrorAct.style.getPropertyValue('--sc-p')) || 0;
      var beat = mp >= 0.22 ? 2 : 1;
      var mSig = 'mirror:' + mp.toFixed(2) + '|beat:' + beat;
      if (mSig !== lastMirrorSig) {
        lastMirrorSig = mSig;
        mirrorStage.setAttribute('data-sc-verify-state', mSig);
      }
      // Natural obsidian impact basin settles smoothly into near-total #030508 optical mirror void
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

    if (inView.cleave) {
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
  syncScrollChoreography(true);

  /* ---- 4. Interactive floorplan-codex inline preview in Act 2 ------------- */
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

  /* ---- 5. Pinned Act & Pan Corridor keyboard focus safety ----------------- */
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

  /* ---- 6. Cross-Act 30-Day Synchronization (Header, Ledger, Colophon) ----- */
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

  /* ---- 7. Dynamic funding channel wiring (#act-support <- context/funding.json) --- */
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
})();
