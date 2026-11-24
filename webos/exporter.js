/* ==========================================================================
   Aether WebOS Offline Exporter (Zero External Dependencies)
   Author: Eloquent (@mjeanhudson-dev)
   Purpose: Generates a self-contained single-file offline .html WebOS
            mind-map + editorial reader + lexicon + 25-turn capsule package
            and builds viral plain-text share notes.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AetherExporter = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  function stripEmDashes(text) {
    return String(text == null ? '' : text)
      .replace(new RegExp('&' + 'mdash;', 'gi'), ', ')
      .replace(/\s*\u2014\s*/g, ', ');
  }

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function safeJsonForHtml(obj) {
    var json = JSON.stringify(obj);
    return stripEmDashes(json)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029');
  }

  function slugify(value) {
    var s = String(value || 'aether-kit')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return s || 'aether-kit';
  }

  function buildShareNote(payload) {
    var p = payload || {};
    var title = stripEmDashes(p.title || 'Aether Personal WebOS Kit');
    var day = Number(p.day) || 1;
    var week = Number(p.week) || 1;
    var dayTitle = stripEmDashes(p.dayTitle || 'Day ' + day + ' Mentorship Practice');
    var digest = stripEmDashes(p.digest16 || 'pending-sha256');
    var nodeCount = Number(p.nodeCount) || 0;
    var stepCount = Number(p.stepCount) || 0;

    return [
      'Aether WebOS Kit: ' + title,
      'Mentorship Focus: Day ' + day + ' (Week ' + week + ') · ' + dayTitle,
      'Structure: ' + nodeCount + ' floorplan nodes · ' + stepCount + ' plain-English steps',
      'SHA-256 Digest: ' + digest,
      '',
      'Built with the Free Aether 30-Day Kit · Start Day 1: Free',
      'Created with Aether by Eloquent (@mjeanhudson-dev)'
    ].join('\n');
  }

  function buildPlainLetterDispatch(payload) {
    var p = payload || {};
    var title = stripEmDashes(p.title || 'Aether WebOS Kit');
    var day = Number(p.day) || 1;
    var week = Number(p.week) || 1;
    var dayTitle = stripEmDashes(p.dayTitle || 'Start Day 1');
    var dayPrompt = stripEmDashes(p.dayPrompt || 'Write one plain-English outcome for today.');
    var digest = stripEmDashes(p.digest16 || 'pending-sha256');
    var parsed = p.parsed || {};
    var steps = Array.isArray(parsed.steps) ? parsed.steps.slice(0, 5) : [];
    var stepLines = steps.length
      ? steps.map(function (st, idx) {
          return (idx + 1) + '. ' + stripEmDashes(st.text || '');
        })
      : ['1. Open your offline Floorplan tab and verify Wave 0 priorities.'];

    return [
      'Subject: Day ' + day + ' Floorplan Dispatch: ' + title,
      '',
      'Here is your clean ' + title + ' snapshot for Day ' + day + ' (Week ' + week + ').',
      '',
      'Today Focus: ' + dayTitle,
      dayPrompt,
      '',
      'First Steps in Motion:',
      stepLines.join('\n'),
      '',
      'SHA-256 State Receipt: ' + digest,
      'Format note: Plain-letter voice inspired by 47 Best Email Designs (#7 Hyggekrog / #22 Tracksmith / #30 Stripe 472px discipline).',
      '',
      'Built with the Free Aether 30-Day Kit · Start Day 1: Free',
      'Author: Eloquent (@mjeanhudson-dev)'
    ].join('\n');
  }

  function buildEmailDispatchHtml(payload) {
    var p = payload || {};
    var title = stripEmDashes(p.title || 'Aether WebOS Kit');
    var day = Number(p.day) || 1;
    var week = Number(p.week) || 1;
    var dayTitle = stripEmDashes(p.dayTitle || 'Start Day 1');
    var dayPrompt = stripEmDashes(p.dayPrompt || 'Write one plain-English outcome for today.');
    var digest16 = stripEmDashes(p.digest16 || '0000000000000000');
    var parsed = p.parsed || {};
    var nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    var steps = Array.isArray(parsed.steps) ? parsed.steps.slice(0, 4) : [];
    var soul = Array.isArray(parsed.soul) ? parsed.soul.slice(0, 2) : [];

    var stepRowsHtml = steps.length
      ? steps.map(function (st, i) {
          return '<li style="margin:0 0 8px 0;color:#ECEAE4;font-size:14px;line-height:1.5;">' +
            '<strong style="color:#EA8D44;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">0' + (i + 1) + '.</strong> ' +
            escapeHtml(stripEmDashes(st.text || '')) + '</li>';
        }).join('')
      : '<li style="margin:0;color:#ECEAE4;font-size:14px;line-height:1.5;">Open your Floorplan tab to start Wave 0.</li>';

    var soulNote = soul.length
      ? escapeHtml(stripEmDashes(soul[0].rule || ''))
      : 'Every step stays readable offline with zero subscriptions or bloat.';

    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width,initial-scale=1">',
      '<title>' + escapeHtml(title) + ' : Day ' + day + ' Dispatch</title>',
      '</head>',
      '<body style="margin:0;padding:24px 12px;background:#07090D;color:#ECEAE4;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">',
      '<div style="max-width:472px;margin:0 auto;background:#080A0E;border:1px solid #262A31;border-radius:0;overflow:hidden;">',
      '  <div style="padding:20px 22px;background:#0B0E14;border-bottom:1px solid #262A31;">',
      '    <p style="margin:0 0 8px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#EA8D44;">DAY ' + day + ' · WEEK ' + week + ' · 472PX DISPATCH</p>',
      '    <h1 style="margin:0;font-size:21px;line-height:1.25;letter-spacing:-0.025em;color:#ECEAE4;">' + escapeHtml(title) + '</h1>',
      '    <p style="margin:8px 0 0 0;font-size:13px;color:#A8B0BC;">Receipt digest <code style="color:#67CEFA;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">' + escapeHtml(digest16) + '</code> · ' + nodes.length + ' mapped nodes</p>',
      '  </div>',
      '  <div style="padding:20px 22px;">',
      '    <p style="margin:0 0 6px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#EA8D44;">Active Prompt</p>',
      '    <h2 style="margin:0 0 8px 0;font-size:16px;color:#ECEAE4;">' + escapeHtml(dayTitle) + '</h2>',
      '    <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#A8B0BC;">' + escapeHtml(dayPrompt) + '</p>',
      '    <div style="padding:14px 16px;background:#0B0E14;border:1px solid #262A31;border-radius:0;margin:0 0 18px 0;">',
      '      <p style="margin:0 0 10px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#ECEAE4;">Wave Checklist Preview</p>',
      '      <ol style="margin:0;padding:0;list-style:none;">' + stepRowsHtml + '</ol>',
      '    </div>',
      '    <p style="margin:0 0 16px 0;padding:12px 14px;border-left:2px solid #E27A2C;background:#0D1017;font-size:13px;line-height:1.55;color:#ECEAE4;"><strong style="color:#EA8D44;">Soul Invariant:</strong> ' + soulNote + '</p>',
      '    <p style="margin:0;font-size:14px;font-weight:700;color:#111214;background:#E27A2C;padding:11px 16px;border-radius:2px;text-align:center;">Start Day 1: Free</p>',
      '  </div>',
      '  <div style="padding:14px 22px;background:#0B0E14;border-top:1px solid #262A31;font-size:12px;line-height:1.5;color:#A8B0BC;">',
      '    Built with the Free Aether 30-Day Kit · Start Day 1: Free<br>',
      '    By Eloquent (@mjeanhudson-dev) · Zero installs required',
      '  </div>',
      '</div>',
      '</body>',
      '</html>'
    ].join('\n');
  }

  function buildOfflineHtml(payload) {
    var p = payload || {};
    var title = stripEmDashes(p.title || 'Aether WebOS Kit');
    var kitId = stripEmDashes(p.kitId || 'custom-kit');
    var day = Number(p.day) || 1;
    var week = Number(p.week) || 1;
    var dayTitle = stripEmDashes(p.dayTitle || 'Start Day 1');
    var dayPrompt = stripEmDashes(p.dayPrompt || 'Write one plain-English outcome for today.');
    var digest16 = stripEmDashes(p.digest16 || '0000000000000000');
    var markdown = stripEmDashes(p.markdown || '');
    var capsule = stripEmDashes(p.capsule || '');
    var parsed = p.parsed || {};
    var shareNote = buildShareNote({
      title: title,
      day: day,
      week: week,
      dayTitle: dayTitle,
      digest16: digest16,
      nodeCount: (parsed.nodes && parsed.nodes.length) || 0,
      stepCount: (parsed.steps && parsed.steps.length) || 0
    });
    var dispatchPayload = {
      title: title,
      day: day,
      week: week,
      dayTitle: dayTitle,
      dayPrompt: dayPrompt,
      digest16: digest16,
      parsed: parsed
    };
    var plainLetterDispatch = buildPlainLetterDispatch(dispatchPayload);
    var emailDispatchHtml = buildEmailDispatchHtml(dispatchPayload);

    var statePackage = {
      title: title,
      kitId: kitId,
      day: day,
      week: week,
      dayTitle: dayTitle,
      dayPrompt: dayPrompt,
      digest16: digest16,
      exportedAt: new Date().toISOString(),
      author: 'Eloquent (@mjeanhudson-dev)',
      attribution: 'Built with the Free Aether 30-Day Kit · Start Day 1: Free',
      markdown: markdown,
      capsule: capsule,
      shareNote: shareNote,
      plainLetterDispatch: plainLetterDispatch,
      emailDispatchHtml: emailDispatchHtml,
      parsed: parsed
    };

    var safeJson = safeJsonForHtml(statePackage);

    return [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1">',
      '  <title>' + escapeHtml(title) + ' · Aether Offline WebOS Kit</title>',
      '  <style>',
      '    :root,',
      '    [data-surface="obsidian"] {',
      '      --bg: #07090D;',
      '      --surface: #080A0E;',
      '      --surface-2: #0D1017;',
      '      --surface-deep: #0B0E14;',
      '      --surface-active: #141922;',
      '      --ink: #ECEAE4;',
      '      --ink-soft: #A8B0BC;',
      '      --accent: #E27A2C;',
      '      --accent-hover: #EA8E47;',
      '      --accent-ink: #111214;',
      '      --accent-text: #EA8D44;',
      '      --accent-tint: rgba(226, 122, 44, 0.14);',
      '      --accent-line: rgba(226, 122, 44, 0.48);',
      '      --wave-1: #67CEFA;',
      '      --wave-1-tint: rgba(103, 206, 250, 0.12);',
      '      --wave-1-line: rgba(103, 206, 250, 0.42);',
      '      --wave-2: #4ADE80;',
      '      --edge-tree: rgba(168, 176, 188, 0.44);',
      '      --edge-dep: rgba(234, 141, 68, 0.80);',
      '      --line: rgba(236, 234, 228, 0.14);',
      '      --line-strong: rgba(236, 234, 228, 0.28);',
      '      --mono: "RedHatMono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;',
      '      --sans: "BricolageGrotesque", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;',
      '    }',
      '    [data-surface="paper"] {',
      '      --bg: #F2EFE8;',
      '      --surface: #F2EFE8;',
      '      --surface-2: #EAE5DB;',
      '      --surface-deep: #ECE7DE;',
      '      --surface-active: #E2DDD1;',
      '      --ink: #111214;',
      '      --ink-soft: #4A4D55;',
      '      --accent: #E27A2C;',
      '      --accent-hover: #EA8E47;',
      '      --accent-ink: #111214;',
      '      --accent-text: #984306;',
      '      --accent-tint: rgba(226, 122, 44, 0.14);',
      '      --accent-line: rgba(152, 67, 6, 0.45);',
      '      --wave-1: #1A5276;',
      '      --wave-1-tint: rgba(26, 82, 118, 0.10);',
      '      --wave-1-line: rgba(26, 82, 118, 0.40);',
      '      --wave-2: #145A32;',
      '      --edge-tree: rgba(74, 77, 85, 0.50);',
      '      --edge-dep: rgba(152, 67, 6, 0.80);',
      '      --line: rgba(17, 18, 20, 0.16);',
      '      --line-strong: rgba(17, 18, 20, 0.34);',
      '    }',
      '    * { box-sizing: border-box; }',
      '    body {',
      '      margin: 0;',
      '      background: var(--bg);',
      '      color: var(--ink);',
      '      font-family: var(--sans);',
      '      line-height: 1.56;',
      '      padding: 1rem;',
      '    }',
      '    .wrap { max-width: 1080px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }',
      '    .card { background: var(--surface); border-top: 1px solid var(--line-strong); border-bottom: 1px solid var(--line-strong); border-left: 1px solid var(--line); border-right: 1px solid var(--line); border-radius: 0; overflow: hidden; }',
      '    .head { padding: 1rem 1.25rem; background: var(--surface); border-bottom: 1px solid var(--line); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; }',
      '    .title { margin: 0; font-size: 1.35rem; font-weight: 700; letter-spacing: -0.025em; }',
      '    .badges { display: flex; flex-wrap: wrap; gap: 0.45rem; align-items: center; margin-top: 0.4rem; }',
      '    .badge { display: inline-flex; align-items: center; padding: 0.22rem 0.55rem; border-radius: 2px; border: 1px solid var(--line); background: var(--surface-2); color: var(--ink-soft); font-family: var(--mono); font-size: 0.74rem; font-variant-numeric: tabular-nums; }',
      '    .badge--amber { border-color: var(--accent-line); background: var(--accent-tint); color: var(--accent-text); }',
      '    .badge--cyan { border-color: var(--wave-1-line); background: var(--wave-1-tint); color: var(--wave-1); }',
      '    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; }',
      '    .btn { appearance: none; border: 1px solid var(--line-strong); background: var(--surface-2); color: var(--ink); border-radius: 2px; padding: 0.48rem 0.85rem; font-family: var(--sans); font-size: 0.84rem; font-weight: 700; cursor: pointer; text-decoration: none; transition: border-color 120ms cubic-bezier(0.23, 1, 0.32, 1), background-color 120ms cubic-bezier(0.23, 1, 0.32, 1); }',
      '    .btn:hover { border-color: var(--accent); background: var(--surface-active); }',
      '    .btn--primary, .btn--amber { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }',
      '    .btn--primary:hover, .btn--amber:hover { background: var(--accent-hover); border-color: var(--accent-hover); color: var(--accent-ink); }',
      '    .btn--surface { background: transparent; font-family: var(--mono); font-size: 0.76rem; }',
      '    .btn--surface[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: var(--surface); }',
      '    .btn:focus-visible, .tab:focus-visible, input:focus-visible, textarea:focus-visible, [tabindex="0"]:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }',
      '    .tabs { display: flex; flex-wrap: wrap; gap: 0.25rem; padding: 0 1.25rem; background: var(--surface); border-bottom: 1px solid var(--line); }',
      '    .tab { appearance: none; min-height: 40px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--ink-soft); border-radius: 0; padding: 0.55rem 0.8rem; font-family: var(--sans); font-size: 0.85rem; font-weight: 400; cursor: pointer; transition: border-color 120ms cubic-bezier(0.23, 1, 0.32, 1), color 120ms cubic-bezier(0.23, 1, 0.32, 1); }',
      '    .tab:hover { color: var(--ink); }',
      '    .tab[aria-selected="true"] { border-bottom-color: var(--accent); color: var(--ink); font-weight: 700; }',
      '    .panel { padding: 1.1rem 1.25rem; }',
      '    .panel[hidden] { display: none; }',
      '    .map-box { width: 100%; height: 380px; border-radius: 0; border: 1px solid var(--line); background: var(--surface-deep); overflow: hidden; touch-action: none; cursor: grab; }',
      '    .map-box:active { cursor: grabbing; }',
      '    .map-toolbar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }',
      '    .inspector { margin-top: 0.75rem; padding: 0.85rem 1rem; border-radius: 0; border: 1px solid var(--line); background: var(--surface-deep); }',
      '    .sec { padding: 0.85rem 1rem; border-radius: 0; border: 1px solid var(--line); background: var(--surface-deep); margin-top: 0.75rem; }',
      '    .sec h3 { margin: 0 0 0.4rem; font-size: 1rem; }',
      '    .sec p, .sec li { color: var(--ink-soft); font-size: 0.9rem; }',
      '    .step { display: flex; gap: 0.55rem; align-items: flex-start; margin: 0.35rem 0; cursor: pointer; }',
      '    .step--done span { text-decoration: line-through; color: var(--ink-soft); }',
      '    .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }',
      '    pre.code, textarea.note { width: 100%; min-height: 240px; padding: 0.9rem; border-radius: 0; border: 1px solid var(--line); background: var(--surface-deep); color: var(--ink); font-family: var(--mono); font-size: 0.8rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; }',
      '    .foot { padding: 0.9rem 1.25rem; background: var(--surface); border-top: 1px solid var(--line); display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; font-family: var(--mono); font-size: 0.76rem; color: var(--ink-soft); }',
      '    .dispatch-wrap { display: grid; grid-template-columns: minmax(0, 472px) minmax(0, 1fr); gap: 1rem; align-items: start; }',
      '    .dispatch-card { max-width: 472px; width: 100%; border-radius: 0; border: 1px solid var(--line); background: var(--surface-deep); overflow: hidden; }',
      '    .dispatch-card__head { padding: 1rem 1.15rem; background: var(--surface-2); border-bottom: 1px solid var(--line); }',
      '    .dispatch-card__body { padding: 1rem 1.15rem; }',
      '    .dispatch-card__foot { padding: 0.85rem 1.15rem; background: var(--surface-2); border-top: 1px solid var(--line); font-size: 0.78rem; color: var(--ink-soft); }',
      '    .aw-edge { fill: none; stroke-width: 1.5; }',
      '    .aw-edge--tree { stroke: var(--edge-tree); }',
      '    .aw-edge--dep { stroke: var(--edge-dep); stroke-dasharray: 5 4; }',
      '    .aw-node { cursor: pointer; --n-col: var(--wave-1); }',
      '    .aw-node[data-wave="0"] { --n-col: var(--accent-text); }',
      '    .aw-node[data-wave="1"] { --n-col: var(--wave-1); }',
      '    .aw-node[data-wave="2"] { --n-col: var(--wave-2); }',
      '    .aw-node__rect { fill: var(--surface-2); stroke: var(--n-col); stroke-width: 1.25; }',
      '    .aw-node[aria-pressed="true"] .aw-node__rect { fill: var(--surface-active); stroke: var(--accent-text); stroke-width: 2.2; }',
      '    .aw-node__wave { fill: var(--n-col); font-size: 9.5px; font-weight: 700; font-family: var(--mono); }',
      '    .aw-node__lbl { fill: var(--ink); font-size: 12px; font-weight: 700; font-family: var(--sans); }',
      '    @media (max-width: 820px) { .dispatch-wrap { grid-template-columns: 1fr; } }',
      '    @media (max-width: 680px) { .grid2 { grid-template-columns: 1fr; } .map-box { height: 300px; } }',
      '  </style>',
      '</head>',
      '<body data-surface="obsidian">',
      '  <main class="wrap">',
      '    <section class="card" aria-label="Aether Offline WebOS Package">',
      '      <header class="head">',
      '        <div>',
      '          <h1 class="title">' + escapeHtml(title) + '</h1>',
      '          <div class="badges">',
      '            <span class="badge badge--amber">Built with the Free Aether 30-Day Kit · Start Day 1: Free</span>',
      '            <span class="badge badge--cyan">Day ' + day + ' · Week ' + week + '</span>',
      '            <span class="badge">sha256: ' + escapeHtml(digest16) + '</span>',
      '          </div>',
      '        </div>',
      '        <div class="actions">',
      '          <button type="button" class="btn btn--surface" id="btn-surface" aria-pressed="false">Paper Surface</button>',
      '          <button type="button" class="btn" id="btn-share">Copy Share Note</button>',
      '          <button type="button" class="btn btn--primary" id="btn-copy-capsule">Copy 25-Turn Capsule</button>',
      '        </div>',
      '      </header>',
      '      <nav class="tabs" role="tablist" aria-label="Offline WebOS Views">',
      '        <button type="button" class="tab" role="tab" id="tab-map" aria-selected="true" aria-controls="panel-map">Mind-Map Floorplan</button>',
      '        <button type="button" class="tab" role="tab" id="tab-reader" aria-selected="false" aria-controls="panel-reader">Dual-View Reader</button>',
      '        <button type="button" class="tab" role="tab" id="tab-lws" aria-selected="false" aria-controls="panel-lws">Lexicon · Wiki · Soul</button>',
      '        <button type="button" class="tab" role="tab" id="tab-capsule" aria-selected="false" aria-controls="panel-capsule">25-Turn Capsule & Notes</button>',
      '        <button type="button" class="tab" role="tab" id="tab-dispatch" aria-selected="false" aria-controls="panel-dispatch">472px Email Dispatch</button>',
      '      </nav>',
      '      <section class="panel" id="panel-map" role="tabpanel" aria-labelledby="tab-map">',
      '        <div class="map-toolbar">',
      '          <span class="badge">Interactive Offline Floorplan (Drag to pan · Click any node to inspect)</span>',
      '          <div class="actions">',
      '            <button type="button" class="btn" id="z-out">Zoom -</button>',
      '            <button type="button" class="btn" id="z-reset">100%</button>',
      '            <button type="button" class="btn" id="z-in">Zoom +</button>',
      '            <button type="button" class="btn" id="z-fit">Fit</button>',
      '          </div>',
      '        </div>',
      '        <div class="map-box" id="map-box"><svg id="map-svg" width="100%" height="100%"></svg></div>',
      '        <div class="inspector" id="node-inspector">Select a node above to inspect its branch and steps.</div>',
      '      </section>',
      '      <section class="panel" id="panel-reader" role="tabpanel" aria-labelledby="tab-reader" hidden>',
      '        <div id="reader-mount"></div>',
      '      </section>',
      '      <section class="panel" id="panel-lws" role="tabpanel" aria-labelledby="tab-lws" hidden>',
      '        <div class="grid2" id="lws-mount"></div>',
      '      </section>',
      '      <section class="panel" id="panel-capsule" role="tabpanel" aria-labelledby="tab-capsule" hidden>',
      '        <p style="margin-top:0;color:var(--ink-soft);">Paste this compact capsule into any AI session to resume your exact floorplan without losing context.</p>',
      '        <pre class="code" id="capsule-pre">' + escapeHtml(capsule) + '</pre>',
      '        <h3 style="margin:1rem 0 0.4rem;font-size:0.95rem;">Source Plain-English Note</h3>',
      '        <textarea class="note" readonly aria-label="Source note">' + escapeHtml(markdown) + '</textarea>',
      '      </section>',
      '      <section class="panel" id="panel-dispatch" role="tabpanel" aria-labelledby="tab-dispatch" hidden>',
      '        <div class="map-toolbar">',
      '          <span class="badge badge--cyan">472px Stripe-Restraint Dispatch + Founder Plain-Letter Voice</span>',
      '          <div class="actions">',
      '            <button type="button" class="btn btn--primary" id="btn-copy-email-html">Copy 472px Email HTML</button>',
      '            <button type="button" class="btn" id="btn-copy-plain-letter">Copy Plain-Text Letter</button>',
      '          </div>',
      '        </div>',
      '        <div class="dispatch-wrap">',
      '          <div class="dispatch-card" id="dispatch-preview">',
      '            <div class="dispatch-card__head">',
      '              <span class="badge badge--amber">DAY ' + day + ' · WEEK ' + week + ' · 472PX DISPATCH</span>',
      '              <h3 style="margin:0.55rem 0 0.25rem;font-size:1.1rem;">' + escapeHtml(title) + '</h3>',
      '              <p style="margin:0;font-size:0.82rem;color:var(--ink-soft);">Receipt digest: ' + escapeHtml(digest16) + '</p>',
      '            </div>',
      '            <div class="dispatch-card__body">',
      '              <p style="margin:0 0 0.35rem;font-family:var(--mono);font-size:0.74rem;color:var(--accent-text);font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">Active Prompt</p>',
      '              <h4 style="margin:0 0 0.45rem;font-size:0.98rem;">' + escapeHtml(dayTitle) + '</h4>',
      '              <p style="margin:0 0 0.9rem;font-size:0.88rem;color:var(--ink-soft);">' + escapeHtml(dayPrompt) + '</p>',
      '              <p style="margin:0;padding:0.65rem 0.9rem;border-radius:2px;background:var(--accent);color:var(--accent-ink);font-weight:700;font-size:0.86rem;text-align:center;">Start Day 1: Free</p>',
      '            </div>',
      '            <div class="dispatch-card__foot">Built with the Free Aether 30-Day Kit · By Eloquent (@mjeanhudson-dev)</div>',
      '          </div>',
      '          <div>',
      '            <h3 style="margin:0 0 0.45rem;font-size:0.95rem;">Plain-Text Founder Letter</h3>',
      '            <pre class="code" id="letter-pre">' + escapeHtml(plainLetterDispatch) + '</pre>',
      '          </div>',
      '        </div>',
      '      </section>',
      '      <footer class="foot">',
      '        <span>Built with the Free Aether 30-Day Kit · Start Day 1: Free · By Eloquent (@mjeanhudson-dev)</span>',
      '        <span id="live-status" aria-live="polite">100% Offline Ready · Zero network calls required</span>',
      '      </footer>',
      '    </section>',
      '  </main>',
      '  <script id="aether-kit-data" type="application/json">' + safeJson + '</script>',
      '  <script>',
      '    (function () {',
      '      var data = JSON.parse(document.getElementById("aether-kit-data").textContent || "{}");',
      '      var statusEl = document.getElementById("live-status");',
      '      function setStatus(msg) { if (statusEl) statusEl.textContent = msg; }',
      '      var btnSurface = document.getElementById("btn-surface");',
      '      if (btnSurface) {',
      '        btnSurface.addEventListener("click", function () {',
      '          var next = document.body.getAttribute("data-surface") === "paper" ? "obsidian" : "paper";',
      '          document.body.setAttribute("data-surface", next);',
      '          btnSurface.setAttribute("aria-pressed", next === "paper" ? "true" : "false");',
      '          setStatus(next === "paper" ? "Warm Paper (#F2EFE8) active." : "Deep Obsidian (#080A0E) active.");',
      '        });',
      '      }',
      '      function copyText(text, label) {',
      '        if (navigator.clipboard && navigator.clipboard.writeText) {',
      '          navigator.clipboard.writeText(text).then(function () { setStatus(label + " copied to clipboard."); }).catch(function () { fallbackCopy(text, label); });',
      '        } else { fallbackCopy(text, label); }',
      '      }',
      '      function fallbackCopy(text, label) {',
      '        var ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";',
      '        document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); setStatus(label + " copied."); } catch (e) { setStatus("Select and copy manually."); }',
      '        document.body.removeChild(ta);',
      '      }',
      '      document.getElementById("btn-share").addEventListener("click", function () { copyText(data.shareNote || "", "Share note"); });',
      '      document.getElementById("btn-copy-capsule").addEventListener("click", function () { copyText(data.capsule || "", "25-Turn Capsule"); });',
      '      var btnEmailHtml = document.getElementById("btn-copy-email-html");',
      '      if (btnEmailHtml) btnEmailHtml.addEventListener("click", function () { copyText(data.emailDispatchHtml || "", "472px Email HTML"); });',
      '      var btnPlainLetter = document.getElementById("btn-copy-plain-letter");',
      '      if (btnPlainLetter) btnPlainLetter.addEventListener("click", function () { copyText(data.plainLetterDispatch || "", "Plain-Text Letter"); });',
      '      var tabs = Array.prototype.slice.call(document.querySelectorAll("[role=tab]"));',
      '      tabs.forEach(function (tab) {',
      '        tab.addEventListener("click", function () {',
      '          tabs.forEach(function (t) {',
      '            var active = t === tab;',
      '            t.setAttribute("aria-selected", active ? "true" : "false");',
      '            var p = document.getElementById(t.getAttribute("aria-controls"));',
      '            if (p) p.hidden = !active;',
      '          });',
      '        });',
      '      });',
      '      var parsed = data.parsed || {};',
      '      var nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];',
      '      var edges = Array.isArray(parsed.edges) ? parsed.edges : [];',
      '      var svg = document.getElementById("map-svg");',
      '      var inspector = document.getElementById("node-inspector");',
      '      var zoom = 1; var panX = 24; var panY = 24; var selectedId = nodes[0] ? nodes[0].id : null;',
      '      var rootG = null; var nodeEls = {};',
      '      function svgEl(tag, attrs) {',
      '        var el = document.createElementNS("http://www.w3.org/2000/svg", tag);',
      '        Object.keys(attrs || {}).forEach(function (k) { el.setAttribute(k, String(attrs[k])); });',
      '        return el;',
      '      }',
      '      function updateTransform() {',
      '        if (rootG) rootG.setAttribute("transform", "translate(" + panX + "," + panY + ") scale(" + zoom + ")");',
      '      }',
      '      function updateSelection() {',
      '        Object.keys(nodeEls).forEach(function (id) { nodeEls[id].setAttribute("aria-pressed", id === selectedId ? "true" : "false"); });',
      '      }',
      '      function buildMap() {',
      '        while (svg.firstChild) svg.removeChild(svg.firstChild);',
      '        nodeEls = {};',
      '        var w = Math.max(820, Number(parsed.mapWidth) || 860);',
      '        var h = Math.max(360, Number(parsed.mapHeight) || 400);',
      '        svg.setAttribute("viewBox", "0 0 " + w + " " + h);',
      '        rootG = svgEl("g", { transform: "translate(" + panX + "," + panY + ") scale(" + zoom + ")" });',
      '        var mapById = {}; nodes.forEach(function (n) { mapById[n.id] = n; });',
      '        edges.forEach(function (e) {',
      '          var a = mapById[e.from]; var b = mapById[e.to]; if (!a || !b) return;',
      '          var x1 = a.x + a.w; var y1 = a.y + a.h / 2; var x2 = b.x; var y2 = b.y + b.h / 2;',
      '          var cx = (x1 + x2) / 2;',
      '          rootG.appendChild(svgEl("path", {',
      '            d: "M " + x1 + " " + y1 + " C " + cx + " " + y1 + ", " + cx + " " + y2 + ", " + x2 + " " + y2,',
      '            class: "aw-edge " + (e.kind === "depends" ? "aw-edge--dep" : "aw-edge--tree")',
      '          }));',
      '        });',
      '        nodes.forEach(function (n) {',
      '          var isSel = n.id === selectedId;',
      '          var g = svgEl("g", { class: "aw-node", "data-wave": String(n.wave), tabindex: "0", role: "button", "aria-pressed": isSel ? "true" : "false", "aria-label": "Wave " + n.wave + ": " + n.label });',
      '          g.appendChild(svgEl("rect", { x: n.x, y: n.y, width: n.w, height: n.h, rx: 0, class: "aw-node__rect" }));',
      '          var badge = svgEl("text", { x: n.x + 10, y: n.y + 18, class: "aw-node__wave" });',
      '          badge.textContent = "WAVE " + n.wave;',
      '          g.appendChild(badge);',
      '          var txt = svgEl("text", { x: n.x + 10, y: n.y + 36, class: "aw-node__lbl" });',
      '          txt.textContent = n.shortLabel || n.label;',
      '          g.appendChild(txt);',
      '          function pick() { selectedId = n.id; updateSelection(); showNode(n); }',
      '          g.addEventListener("click", pick);',
      '          g.addEventListener("keydown", function (ev) { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); pick(); } });',
      '          nodeEls[n.id] = g;',
      '          rootG.appendChild(g);',
      '        });',
      '        svg.appendChild(rootG);',
      '      }',
      '      function showNode(n) {',
      '        if (!n) return;',
      '        inspector.innerHTML = "";',
      '        var h = document.createElement("strong"); h.textContent = "Wave " + n.wave + ": " + n.label;',
      '        var p = document.createElement("p"); p.style.margin = "0.35rem 0 0"; p.style.color = "var(--ink-soft)"; p.textContent = n.detail || n.label;',
      '        inspector.appendChild(h); inspector.appendChild(p);',
      '      }',
      '      document.getElementById("z-in").addEventListener("click", function () { zoom = Math.min(2.2, +(zoom + 0.15).toFixed(2)); updateTransform(); });',
      '      document.getElementById("z-out").addEventListener("click", function () { zoom = Math.max(0.45, +(zoom - 0.15).toFixed(2)); updateTransform(); });',
      '      document.getElementById("z-reset").addEventListener("click", function () { zoom = 1; panX = 24; panY = 24; updateTransform(); });',
      '      document.getElementById("z-fit").addEventListener("click", function () {',
      '        var mw = Math.max(Number(parsed.mapWidth) || 860, 1);',
      '        var mh = Math.max(Number(parsed.mapHeight) || 400, 1);',
      '        var w = Math.max(820, mw);',
      '        var h = Math.max(360, mh);',
      '        var fitScale = Math.min((w - 24) / mw, (h - 20) / mh, 0.96);',
      '        zoom = Math.max(0.32, +fitScale.toFixed(2)); panX = 12; panY = 10; updateTransform();',
      '      });',
      '      var mapBox = document.getElementById("map-box");',
      '      if (mapBox) {',
      '        var dragging = false; var dsx = 0; var dsy = 0; var bpx = 0; var bpy = 0;',
      '        mapBox.addEventListener("pointerdown", function (ev) {',
      '          if (ev.target && ev.target.closest && ev.target.closest(".aw-node")) return;',
      '          dragging = true; dsx = ev.clientX; dsy = ev.clientY; bpx = panX; bpy = panY;',
      '          if (mapBox.setPointerCapture && ev.pointerId != null) { try { mapBox.setPointerCapture(ev.pointerId); } catch (e) {} }',
      '        });',
      '        mapBox.addEventListener("pointermove", function (ev) {',
      '          if (!dragging) return;',
      '          panX = Math.round(bpx + (ev.clientX - dsx)); panY = Math.round(bpy + (ev.clientY - dsy)); updateTransform();',
      '        });',
      '        var endDrag = function () { dragging = false; };',
      '        mapBox.addEventListener("pointerup", endDrag);',
      '        mapBox.addEventListener("pointercancel", endDrag);',
      '      }',
      '      buildMap(); if (nodes[0]) showNode(nodes[0]);',
      '      var rMount = document.getElementById("reader-mount");',
      '      var storeKey = "aether_offline_" + (data.digest16 || "kit");',
      '      var savedChecks = {};',
      '      try { savedChecks = JSON.parse(localStorage.getItem(storeKey) || "{}"); } catch (e) {}',
      '      var meta = document.createElement("div"); meta.className = "sec"; meta.style.marginTop = "0";',
      '      var mh = document.createElement("h3"); mh.textContent = "Day " + (data.day || 1) + " Prompt: " + (data.dayTitle || "");',
      '      var mp = document.createElement("p"); mp.textContent = data.dayPrompt || "";',
      '      meta.appendChild(mh); meta.appendChild(mp); rMount.appendChild(meta);',
      '      var steps = Array.isArray(parsed.steps) ? parsed.steps : [];',
      '      if (steps.length) {',
      '        var sBox = document.createElement("div"); sBox.className = "sec";',
      '        var sh = document.createElement("h3"); sh.textContent = "Plain-English Action Checklist (" + steps.length + ")";',
      '        sBox.appendChild(sh);',
      '        steps.forEach(function (st, idx) {',
      '          var lbl = document.createElement("label"); lbl.className = "step";',
      '          var cb = document.createElement("input"); cb.type = "checkbox";',
      '          var checked = savedChecks.hasOwnProperty(idx) ? !!savedChecks[idx] : !!st.done;',
      '          cb.checked = checked;',
      '          if (checked) lbl.classList.add("step--done");',
      '          cb.addEventListener("change", function () {',
      '            lbl.classList.toggle("step--done", cb.checked);',
      '            savedChecks[idx] = cb.checked;',
      '            try { localStorage.setItem(storeKey, JSON.stringify(savedChecks)); } catch (e) {}',
      '          });',
      '          var sp = document.createElement("span"); sp.textContent = st.text;',
      '          lbl.appendChild(cb); lbl.appendChild(sp); sBox.appendChild(lbl);',
      '        });',
      '        rMount.appendChild(sBox);',
      '      }',
      '      (parsed.sections || []).forEach(function (sec) {',
      '        var card = document.createElement("div"); card.className = "sec";',
      '        var h3 = document.createElement("h3"); h3.textContent = sec.title;',
      '        card.appendChild(h3);',
      '        if (sec.paragraphs && sec.paragraphs.length) {',
      '          sec.paragraphs.forEach(function (pg) { var p = document.createElement("p"); p.textContent = pg; card.appendChild(p); });',
      '        }',
      '        if (sec.items && sec.items.length) {',
      '          var ul = document.createElement("ul");',
      '          sec.items.forEach(function (it) { var li = document.createElement("li"); li.textContent = it; ul.appendChild(li); });',
      '          card.appendChild(ul);',
      '        }',
      '        rMount.appendChild(card);',
      '      });',
      '      var lMount = document.getElementById("lws-mount");',
      '      function addLwsBox(title, list, getHead, getBody, colorVar) {',
      '        var box = document.createElement("div"); box.className = "sec"; box.style.marginTop = "0";',
      '        var h3 = document.createElement("h3"); h3.textContent = title + " (" + list.length + ")"; box.appendChild(h3);',
      '        list.forEach(function (item) {',
      '          var p = document.createElement("p"); p.style.margin = "0.45rem 0";',
      '          var st = document.createElement("strong"); st.style.color = colorVar; st.textContent = getHead(item) + ": ";',
      '          p.appendChild(st); p.appendChild(document.createTextNode(getBody(item))); box.appendChild(p);',
      '        });',
      '        lMount.appendChild(box);',
      '      }',
      '      addLwsBox("Lexicon", parsed.lexicon || [], function (x) { return x.term; }, function (x) { return x.definition; }, "var(--wave-1)");',
      '      addLwsBox("Soul Invariants", parsed.soul || [], function (x) { return x.label; }, function (x) { return x.rule; }, "var(--accent-text)");',
      '      addLwsBox("Wiki Topics", parsed.wiki || [], function (x) { return x.title; }, function (x) { return x.summary; }, "var(--wave-2)");',
      '    })();',
      '  </script>',
      '</body>',
      '</html>'
    ].join('\n');
  }

  function downloadKitHtml(payload, customFilename) {
    var html = buildOfflineHtml(payload);
    var day = Number((payload && payload.day) || 1);
    var kitSlug = slugify((payload && payload.kitId) || (payload && payload.title) || 'aether-kit');
    var filename = customFilename || ('aether-' + kitSlug + '-day-' + day + '.html');

    if (typeof document !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
      var blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      setTimeout(function () {
        if (a.parentNode) a.parentNode.removeChild(a);
        URL.revokeObjectURL(url);
      }, 250);
    }

    return {
      filename: filename,
      bytes: html.length,
      html: html
    };
  }

  return {
    version: '1.1.0',
    stripEmDashes: stripEmDashes,
    buildShareNote: buildShareNote,
    buildPlainLetterDispatch: buildPlainLetterDispatch,
    buildEmailDispatchHtml: buildEmailDispatchHtml,
    buildOfflineHtml: buildOfflineHtml,
    downloadKitHtml: downloadKitHtml
  };
}));
