/* ==========================================================================
   Aether WebOS Offline Exporter (Zero External Dependencies)
   Author: Eloquent (@mjeanhudson-dev)
   Purpose: Generates a self-contained single-file offline .html WebOS
            mind-map + editorial reader + lexicon + 7 multi-aspect
            rehydration capsules (Markdown & JSON v2) + 472px dispatch,
            and builds viral plain-text share notes.
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    var capsules = null;
    try { capsules = require('./capsules.js'); } catch (e) {}
    module.exports = factory(capsules);
  } else {
    root.AetherExporter = factory(root.AetherCapsules || null);
  }
}(typeof globalThis !== 'undefined' ? globalThis : window, function (CapsulesDep) {
  'use strict';

  var SCHEMA_VERSION = 'aether.rehydration.capsule.v2';
  var DEFAULT_ASPECT_ID = 'session-passdown';

  var EM_DASH_CHAR = String.fromCharCode(0x2014);
  var EM_DASH_ENTITY_RE = new RegExp('&' + 'mdash;', 'gi');
  var EM_DASH_CHAR_RE = new RegExp('\\s*' + EM_DASH_CHAR + '\\s*', 'g');

  var FALLBACK_ASPECTS = [
    {
      id: 'session-passdown',
      order: 1,
      label: 'Session Pass-Down',
      shortLabel: 'Pass-Down',
      kind: 'specialized',
      tokenBudget: 900,
      summary: 'Executive resume state, Day/Week milestone, git/build invariants, and immediate next steps.'
    },
    {
      id: 'floorplan-waves',
      order: 2,
      label: 'Floorplan Waves',
      shortLabel: 'Waves 0-2',
      kind: 'specialized',
      tokenBudget: 1000,
      summary: 'Wave 0/1/2 dependency tree, critical path, and completed vs pending checklist tasks.'
    },
    {
      id: 'lexicon-soul',
      order: 3,
      label: 'Lexicon & Soul',
      shortLabel: 'Lexicon · Soul',
      kind: 'specialized',
      tokenBudget: 850,
      summary: 'Domain vocabulary terms, Wiki reference rules, and voice/design Soul invariants.'
    },
    {
      id: 'swarm-handoff',
      order: 4,
      label: 'Swarm Handoff',
      shortLabel: 'Swarm',
      kind: 'specialized',
      tokenBudget: 900,
      summary: 'Multi-worker ownership boundaries, pinned models/quotas, and board coordination protocol.'
    },
    {
      id: 'offline-portability',
      order: 5,
      label: 'Offline Portability',
      shortLabel: 'Offline HTML',
      kind: 'specialized',
      tokenBudget: 800,
      summary: 'Standalone HTML capsule rules, WebCrypto SHA-256 parity, and zero-CDN offline guarantee.'
    },
    {
      id: 'compact-prompt',
      order: 6,
      label: 'Compact Prompt',
      shortLabel: 'Compact <500t',
      kind: 'specialized',
      tokenBudget: 480,
      summary: 'Dense single-turn drop-in prompt (< 500 tokens) ready to paste into any cold AI session after turn 25.'
    },
    {
      id: 'master-bundle',
      order: 7,
      label: 'Master Bundle',
      shortLabel: 'Master Bundle',
      kind: 'bundle',
      tokenBudget: 3600,
      includes: [
        'session-passdown',
        'floorplan-waves',
        'lexicon-soul',
        'swarm-handoff',
        'offline-portability',
        'compact-prompt'
      ],
      summary: 'Complete unified multi-aspect rehydration envelope combining all 6 specialized aspects.'
    }
  ];

  function getCapsulesApi() {
    if (CapsulesDep && typeof CapsulesDep.buildAllCapsules === 'function') {
      return CapsulesDep;
    }
    if (typeof globalThis !== 'undefined' && globalThis.AetherCapsules &&
        typeof globalThis.AetherCapsules.buildAllCapsules === 'function') {
      return globalThis.AetherCapsules;
    }
    return null;
  }

  function stripEmDashes(text) {
    return String(text == null ? '' : text)
      .replace(EM_DASH_ENTITY_RE, ', ')
      .replace(EM_DASH_CHAR_RE, ', ');
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

  function encodeUtf8Bytes(str) {
    var s = String(str == null ? '' : str);
    if (typeof TextEncoder !== 'undefined') {
      return Array.from(new TextEncoder().encode(s));
    }
    var bytes = [];
    for (var i = 0; i < s.length; i++) {
      var code = s.charCodeAt(i);
      if (code >= 0xd800 && code <= 0xdbff && i + 1 < s.length) {
        var next = s.charCodeAt(i + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          code = ((code - 0xd800) << 10) + (next - 0xdc00) + 0x10000;
          i++;
        }
      }
      if (code < 0x80) {
        bytes.push(code);
      } else if (code < 0x800) {
        bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
      } else if (code < 0x10000) {
        bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
      } else {
        bytes.push(
          0xf0 | (code >> 18),
          0x80 | ((code >> 12) & 0x3f),
          0x80 | ((code >> 6) & 0x3f),
          0x80 | (code & 0x3f)
        );
      }
    }
    return bytes;
  }

  function fallbackSha256Hex(text) {
    var bytes = encodeUtf8Bytes(text);
    var K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    var H = [
      0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
      0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ];

    var bitLen = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    var hi = Math.floor(bitLen / 0x100000000);
    var lo = bitLen >>> 0;
    bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255);
    bytes.push((lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);

    function rotr(x, n) { return (x >>> n) | (x << (32 - n)); }

    var w = new Array(64);
    for (var offset = 0; offset < bytes.length; offset += 64) {
      for (var t = 0; t < 16; t++) {
        var j = offset + t * 4;
        w[t] = (bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3];
      }
      for (t = 16; t < 64; t++) {
        var s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        var s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + s0 + w[t - 7] + s1) | 0;
      }
      var a = H[0], b = H[1], c = H[2], d = H[3];
      var e = H[4], f = H[5], g = H[6], h = H[7];
      for (t = 0; t < 64; t++) {
        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        var ch = (e & f) ^ ((~e) & g);
        var temp1 = (h + S1 + ch + K[t] + w[t]) | 0;
        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c);
        var temp2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + temp1) | 0;
        d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }
      H[0] = (H[0] + a) | 0; H[1] = (H[1] + b) | 0;
      H[2] = (H[2] + c) | 0; H[3] = (H[3] + d) | 0;
      H[4] = (H[4] + e) | 0; H[5] = (H[5] + f) | 0;
      H[6] = (H[6] + g) | 0; H[7] = (H[7] + h) | 0;
    }

    return H.map(function (word) {
      return (word >>> 0).toString(16).padStart(8, '0');
    }).join('');
  }

  function fallbackEstimateTokens(text) {
    var str = String(text || '').trim();
    if (!str) return 0;
    var chars = str.length;
    var words = str.split(/\s+/).filter(Boolean).length;
    var punct = (str.match(/[{}[\](),.:;#*`"'/-]/g) || []).length;
    return Math.max(1, Math.ceil(((chars / 4) + (words * 1.32 + punct * 0.24)) / 2));
  }

  function fallbackByteLength(text) {
    return encodeUtf8Bytes(text).length;
  }

  function hasCompleteCapsules(capMap) {
    if (!capMap || typeof capMap !== 'object') return false;
    for (var i = 0; i < FALLBACK_ASPECTS.length; i++) {
      var id = FALLBACK_ASPECTS[i].id;
      var entry = capMap[id];
      if (!entry || typeof entry.markdown !== 'string' || typeof entry.jsonText !== 'string') {
        return false;
      }
    }
    return true;
  }

  function buildFallbackAllCapsules(ctx) {
    var steps = Array.isArray(ctx.parsed && ctx.parsed.steps) ? ctx.parsed.steps : [];
    var lexicon = Array.isArray(ctx.parsed && ctx.parsed.lexicon) ? ctx.parsed.lexicon : [];
    var wiki = Array.isArray(ctx.parsed && ctx.parsed.wiki) ? ctx.parsed.wiki : [];
    var soul = Array.isArray(ctx.parsed && ctx.parsed.soul) ? ctx.parsed.soul : [];
    var sourceHex = ctx.digestHex || fallbackSha256Hex(ctx.markdown || '');
    var source16 = ctx.digest16 || sourceHex.slice(0, 16);
    var footer = 'Built with the Free Aether 30-Day Kit · Start Day 1: Free · Author: Eloquent (@mjeanhudson-dev)';

    function formatSteps(wave) {
      var list = steps.filter(function (s) { return (typeof s.wave === 'number' ? s.wave : 1) === wave; });
      if (!list.length) return '- [ ] Wave ' + wave + ' tasks ready in Floorplan.';
      return list.map(function (s) {
        return '- [' + (s.done ? 'x' : ' ') + '] ' + stripEmDashes(s.text || '') + (s.dependsOn ? ' (depends: ' + stripEmDashes(s.dependsOn) + ')' : '');
      }).join('\n');
    }

    var specializedMd = {
      'session-passdown': stripEmDashes([
        '# Session Pass-Down Capsule (Aether WebOS v2.1)',
        '- Kit: ' + ctx.title + ' (' + ctx.kitId + ')',
        '- Milestone: Day ' + ctx.day + ' of 30 (Week ' + ctx.week + ' · ' + ctx.phase + ')',
        '- Active Focus: ' + ctx.dayTitle,
        '- Source SHA-256 (16): ' + source16,
        '',
        '## Immediate Next Steps',
        steps.filter(function (s) { return !s.done; }).slice(0, 5).map(function (s) {
          return '- [ ] ' + stripEmDashes(s.text || '') + ' [Wave ' + (typeof s.wave === 'number' ? s.wave : 1) + ']';
        }).join('\n') || '- [ ] Review completed milestones and export updated kit.',
        '',
        footer
      ].join('\n')),
      'floorplan-waves': stripEmDashes([
        '# Floorplan Waves & Critical Path Capsule (Aether WebOS v2.1)',
        '## Wave 0: Baseline',
        formatSteps(0),
        '## Wave 1: Execution',
        formatSteps(1),
        '## Wave 2: Ship Gate',
        formatSteps(2),
        '',
        footer
      ].join('\n')),
      'lexicon-soul': stripEmDashes([
        '# Lexicon, Wiki & Soul Capsule (Aether WebOS v2.1)',
        '## Lexicon',
        lexicon.map(function (l) { return '- **' + stripEmDashes(l.term) + '**: ' + stripEmDashes(l.definition); }).join('\n') || '- **Plain Anchor**: Define words clearly.',
        '## Wiki',
        wiki.map(function (w) { return '- **' + stripEmDashes(w.title) + '**: ' + stripEmDashes(w.summary); }).join('\n') || '- **3-Beat Guide**: Keep notes practical.',
        '## Soul',
        soul.map(function (s) { return '- ' + stripEmDashes(s.label) + ': ' + stripEmDashes(s.rule); }).join('\n') || '- Core Intent: Keep all guidance offline-ready.',
        '',
        footer
      ].join('\n')),
      'swarm-handoff': stripEmDashes([
        '# Swarm Handoff & Ownership Capsule (Aether WebOS v2.1)',
        '- Author: Eloquent (@mjeanhudson-dev)',
        '- Routing Mode: Stage-0 -> Stage-Apex (FLASH_SHUNT_ENGAGED)',
        '- Compaction Gate: 25:1 Exodia',
        '- Active Kit: ' + ctx.title + ' (Day ' + ctx.day + ')',
        '',
        footer
      ].join('\n')),
      'offline-portability': stripEmDashes([
        '# Offline Portability & Integrity Capsule (Aether WebOS v2.1)',
        '- Zero-CDN single-file HTML bundle operating over file:// and airplane mode',
        '- Source SHA-256 (64): ' + sourceHex,
        '- Surface: ' + ctx.surface,
        '',
        footer
      ].join('\n')),
      'compact-prompt': stripEmDashes([
        '# Cold-Start Drop-In Prompt (Post-Turn-25 Rehydration)',
        'Resume "' + ctx.title + '" (' + ctx.kitId + ') at Day ' + ctx.day + '/30 (W' + ctx.week + ': ' + ctx.dayTitle + ').',
        'SHA-256(16): ' + source16 + ' | Surface: ' + ctx.surface + ' | Author: Eloquent (@mjeanhudson-dev).',
        'Soul: ' + (soul[0] ? stripEmDashes(soul[0].rule) : 'Plain-English neighbor voice; zero em dashes; offline-ready.'),
        'Next: ' + (steps[0] ? stripEmDashes(steps[0].text) : ctx.dayPrompt),
        '',
        footer
      ].join('\n'))
    };

    var masterParts = [
      '# Master Multi-Aspect Rehydration Bundle (Aether WebOS v2.1)',
      '- Schema: ' + SCHEMA_VERSION,
      '- Kit: ' + ctx.title + ' (' + ctx.kitId + ') · Day ' + ctx.day + ' · SHA-256(16): ' + source16
    ];
    Object.keys(specializedMd).forEach(function (k, idx) {
      masterParts.push('', '## [' + (idx + 1) + '/6] ' + k, specializedMd[k]);
    });
    specializedMd['master-bundle'] = stripEmDashes(masterParts.join('\n'));

    var out = {};
    FALLBACK_ASPECTS.forEach(function (desc) {
      var md = specializedMd[desc.id] || ctx.capsule || '';
      var mdHex = fallbackSha256Hex(md);
      var env = {
        schema: SCHEMA_VERSION,
        schemaVersion: SCHEMA_VERSION,
        meta: {
          version: '2.1.0',
          author: 'Eloquent (@mjeanhudson-dev)',
          kitName: 'Aether WebOS Kit',
          ctaLabel: 'Start Day 1: Free',
          zeroInstall: true
        },
        aspect: {
          id: desc.id,
          label: desc.label,
          shortLabel: desc.shortLabel,
          kind: desc.kind,
          tokenBudget: desc.tokenBudget,
          estimatedTokens: fallbackEstimateTokens(md),
          summary: desc.summary
        },
        workspace: {
          kitId: ctx.kitId,
          title: ctx.title,
          day: ctx.day,
          week: ctx.week,
          phase: ctx.phase,
          dayTitle: ctx.dayTitle,
          dayPrompt: ctx.dayPrompt,
          deliverable: ctx.deliverable,
          surface: ctx.surface,
          markdown: ctx.markdown
        },
        integrity: {
          algorithm: 'SHA-256',
          sourceDigestHex: sourceHex,
          sourceDigest16: source16,
          capsuleDigestHex: mdHex,
          capsuleDigest16: mdHex.slice(0, 16)
        },
        payload: desc.id === 'master-bundle'
          ? { includedAspects: desc.includes.slice() }
          : { summary: desc.summary },
        capsuleMarkdown: md
      };
      var jsonStr = stripEmDashes(JSON.stringify(env, null, 2));
      var jsonHex = fallbackSha256Hex(jsonStr);
      out[desc.id] = {
        id: desc.id,
        order: desc.order,
        label: desc.label,
        shortLabel: desc.shortLabel,
        kind: desc.kind,
        tokenBudget: desc.tokenBudget,
        includes: desc.includes ? desc.includes.slice() : undefined,
        summary: desc.summary,
        markdown: md,
        markdownTokens: fallbackEstimateTokens(md),
        markdownBytes: fallbackByteLength(md),
        markdownDigestHex: mdHex,
        markdownDigest16: mdHex.slice(0, 16),
        jsonText: jsonStr,
        jsonTokens: fallbackEstimateTokens(jsonStr),
        jsonBytes: fallbackByteLength(jsonStr),
        jsonDigestHex: jsonHex,
        jsonDigest16: jsonHex.slice(0, 16)
      };
    });
    return out;
  }

  function normalizeEmbeddedCapsules(rawCapsules, aspectDescriptors) {
    var orderById = {};
    var includesById = {};
    aspectDescriptors.forEach(function (desc) {
      orderById[desc.id] = desc.order;
      if (Array.isArray(desc.includes)) includesById[desc.id] = desc.includes.slice();
    });

    var normalized = {};
    aspectDescriptors.forEach(function (desc) {
      var entry = rawCapsules[desc.id] || {};
      var md = stripEmDashes(entry.markdown || '');
      var jsonText = stripEmDashes(entry.jsonText || '{}');
      var mdHex = entry.markdownDigestHex || fallbackSha256Hex(md);
      var jsonHex = entry.jsonDigestHex || fallbackSha256Hex(jsonText);

      normalized[desc.id] = {
        id: desc.id,
        order: desc.order,
        label: stripEmDashes(entry.label || desc.label),
        shortLabel: stripEmDashes(entry.shortLabel || desc.shortLabel),
        kind: entry.kind || desc.kind,
        tokenBudget: Number(entry.tokenBudget) || desc.tokenBudget,
        includes: Array.isArray(entry.includes) ? entry.includes.slice() : includesById[desc.id],
        summary: stripEmDashes(entry.summary || desc.summary),
        markdown: md,
        markdownTokens: Number(entry.markdownTokens) || fallbackEstimateTokens(md),
        markdownBytes: Number(entry.markdownBytes) || fallbackByteLength(md),
        markdownDigestHex: mdHex,
        markdownDigest16: entry.markdownDigest16 || mdHex.slice(0, 16),
        jsonText: jsonText,
        jsonTokens: Number(entry.jsonTokens) || fallbackEstimateTokens(jsonText),
        jsonBytes: Number(entry.jsonBytes) || fallbackByteLength(jsonText),
        jsonDigestHex: jsonHex,
        jsonDigest16: entry.jsonDigest16 || jsonHex.slice(0, 16)
      };
    });
    return normalized;
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
    var capsulesApi = getCapsulesApi();
    var title = stripEmDashes(p.title || 'Aether WebOS Kit');
    var kitId = stripEmDashes(p.kitId || 'custom-kit');
    var day = Number(p.day) || 1;
    var week = Number(p.week) || 1;
    var phase = stripEmDashes(p.phase || ('Week ' + week));
    var dayTitle = stripEmDashes(p.dayTitle || 'Start Day 1');
    var dayPrompt = stripEmDashes(p.dayPrompt || 'Write one plain-English outcome for today.');
    var deliverable = stripEmDashes(p.deliverable || 'Verified offline Floorplan and SHA-256 capsule receipt.');
    var initialSurface = (String(p.surface || '').toLowerCase().trim() === 'paper') ? 'paper' : 'obsidian';
    var markdown = stripEmDashes(p.markdown || '');
    var fullDigestHex = (typeof p.digestHex === 'string' && /^[a-f0-9]{64}$/i.test(p.digestHex))
      ? p.digestHex.toLowerCase()
      : '';
    var computedMdHex = capsulesApi
      ? capsulesApi.computeCapsuleDigestSync(markdown)
      : fallbackSha256Hex(markdown);
    var digest16 = stripEmDashes(p.digest16 || (fullDigestHex ? fullDigestHex.slice(0, 16) : computedMdHex.slice(0, 16)));
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

    var aspectDescriptors = (capsulesApi && Array.isArray(capsulesApi.ASPECTS) && capsulesApi.ASPECTS.length)
      ? capsulesApi.ASPECTS.map(function (a) {
          return {
            id: a.id,
            order: a.order,
            label: stripEmDashes(a.label),
            shortLabel: stripEmDashes(a.shortLabel),
            kind: a.kind,
            tokenBudget: a.tokenBudget,
            includes: Array.isArray(a.includes) ? a.includes.slice() : undefined,
            summary: stripEmDashes(a.summary)
          };
        })
      : FALLBACK_ASPECTS.map(function (a) { return Object.assign({}, a); });

    var rawAllCapsules = null;
    if (p.capsules && hasCompleteCapsules(p.capsules)) {
      rawAllCapsules = p.capsules;
    } else if (capsulesApi) {
      rawAllCapsules = capsulesApi.buildAllCapsules({
        title: title,
        kitId: kitId,
        day: day,
        week: week,
        phase: phase,
        dayTitle: dayTitle,
        dayPrompt: dayPrompt,
        deliverable: deliverable,
        surface: initialSurface,
        digestHex: fullDigestHex || undefined,
        markdown: markdown,
        parsed: parsed,
        meta: p.meta
      }, parsed, p.meta);
    } else {
      rawAllCapsules = buildFallbackAllCapsules({
        title: title,
        kitId: kitId,
        day: day,
        week: week,
        phase: phase,
        dayTitle: dayTitle,
        dayPrompt: dayPrompt,
        deliverable: deliverable,
        surface: initialSurface,
        digestHex: fullDigestHex || computedMdHex,
        digest16: digest16,
        markdown: markdown,
        capsule: stripEmDashes(p.capsule || ''),
        parsed: parsed
      });
    }

    var embeddedCapsules = normalizeEmbeddedCapsules(rawAllCapsules, aspectDescriptors);
    var activeAspectId = DEFAULT_ASPECT_ID;
    var defaultCapsule = embeddedCapsules[activeAspectId] || embeddedCapsules[aspectDescriptors[0].id];
    var capsule = stripEmDashes(p.capsule || (defaultCapsule && defaultCapsule.markdown) || '');

    var statePackage = {
      schemaVersion: SCHEMA_VERSION,
      title: title,
      kitId: kitId,
      day: day,
      week: week,
      phase: phase,
      dayTitle: dayTitle,
      dayPrompt: dayPrompt,
      deliverable: deliverable,
      surface: initialSurface,
      digest16: digest16,
      exportedAt: new Date().toISOString(),
      author: 'Eloquent (@mjeanhudson-dev)',
      attribution: 'Built with the Free Aether 30-Day Kit · Start Day 1: Free',
      markdown: markdown,
      capsule: capsule,
      activeAspectId: activeAspectId,
      capsuleAspects: aspectDescriptors,
      capsules: embeddedCapsules,
      shareNote: shareNote,
      plainLetterDispatch: plainLetterDispatch,
      emailDispatchHtml: emailDispatchHtml,
      parsed: parsed
    };

    var safeJson = safeJsonForHtml(statePackage);

    var aspectButtonsHtml = aspectDescriptors.map(function (asp) {
      var isSel = asp.id === activeAspectId;
      return '          <button type="button" class="btn btn--aspect" data-capsule-aspect="' + escapeHtml(asp.id) + '" aria-pressed="' + (isSel ? 'true' : 'false') + '">' + escapeHtml(asp.shortLabel || asp.label) + '</button>';
    }).join('\n');

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
      '    .actions { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; }',
      '    .btn { appearance: none; border: 1px solid var(--line-strong); background: var(--surface-2); color: var(--ink); border-radius: 2px; padding: 0.48rem 0.85rem; font-family: var(--sans); font-size: 0.84rem; font-weight: 700; cursor: pointer; text-decoration: none; transition: border-color 120ms cubic-bezier(0.23, 1, 0.32, 1), background-color 120ms cubic-bezier(0.23, 1, 0.32, 1); }',
      '    .btn:hover { border-color: var(--accent); background: var(--surface-active); }',
      '    .btn--primary, .btn--amber { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }',
      '    .btn--primary:hover, .btn--amber:hover { background: var(--accent-hover); border-color: var(--accent-hover); color: var(--accent-ink); }',
      '    .btn--surface { background: transparent; font-family: var(--mono); font-size: 0.76rem; }',
      '    .btn--surface[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: var(--surface); }',
      '    .btn--aspect { font-family: var(--mono); font-size: 0.75rem; padding: 0.42rem 0.7rem; }',
      '    .btn--aspect[aria-pressed="true"] { border-color: var(--accent); border-top: 2px solid var(--accent); background: var(--accent-tint); color: var(--ink); }',
      '    .btn--fmt { font-family: var(--mono); font-size: 0.76rem; padding: 0.42rem 0.75rem; }',
      '    .btn--fmt[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }',
      '    .btn:focus-visible, .tab:focus-visible, input:focus-visible, textarea:focus-visible, pre:focus-visible, [tabindex="0"]:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }',
      '    .tabs { display: flex; flex-wrap: wrap; gap: 0.25rem; padding: 0 1.25rem; background: var(--surface); border-bottom: 1px solid var(--line); }',
      '    .tab { appearance: none; min-height: 40px; border: 0; border-bottom: 2px solid transparent; background: transparent; color: var(--ink-soft); border-radius: 0; padding: 0.55rem 0.8rem; font-family: var(--sans); font-size: 0.85rem; font-weight: 400; cursor: pointer; transition: border-color 120ms cubic-bezier(0.23, 1, 0.32, 1), color 120ms cubic-bezier(0.23, 1, 0.32, 1); }',
      '    .tab:hover { color: var(--ink); }',
      '    .tab[aria-selected="true"] { border-bottom-color: var(--accent); color: var(--ink); font-weight: 700; }',
      '    .panel { padding: 1.1rem 1.25rem; }',
      '    .panel[hidden] { display: none; }',
      '    .map-box { width: 100%; height: 380px; border-radius: 0; border: 1px solid var(--line); background: var(--surface-deep); overflow: hidden; touch-action: none; cursor: grab; }',
      '    .map-box:active { cursor: grabbing; }',
      '    .map-toolbar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; }',
      '    .cap-meta { display: flex; flex-wrap: wrap; gap: 0.45rem; align-items: center; margin-bottom: 0.65rem; }',
      '    .cap-aspects { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.6rem; }',
      '    .cap-summary { margin: 0 0 0.75rem; font-size: 0.88rem; color: var(--ink-soft); }',
      '    .inspector { margin-top: 0.75rem; padding: 0.85rem 1rem; border-radius: 0; border: 1px solid var(--line); background: var(--surface-deep); }',
      '    .sec { padding: 0.85rem 1rem; border-radius: 0; border: 1px solid var(--line); background: var(--surface-deep); margin-top: 0.75rem; }',
      '    .sec h3 { margin: 0 0 0.4rem; font-size: 1rem; }',
      '    .sec p, .sec li { color: var(--ink-soft); font-size: 0.9rem; }',
      '    .step { display: flex; gap: 0.55rem; align-items: flex-start; margin: 0.35rem 0; cursor: pointer; }',
      '    .step--done span { text-decoration: line-through; color: var(--ink-soft); }',
      '    .grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }',
      '    pre.code, textarea.note { width: 100%; min-height: 240px; padding: 0.9rem; border-radius: 0; border: 1px solid var(--line); background: var(--surface-deep); color: var(--ink); font-family: var(--mono); font-size: 0.8rem; line-height: 1.55; white-space: pre-wrap; overflow-wrap: anywhere; margin: 0; }',
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
      '<body data-surface="' + escapeHtml(initialSurface) + '">',
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
      '          <button type="button" class="btn btn--surface" id="btn-surface" aria-pressed="' + (initialSurface === 'paper' ? 'true' : 'false') + '">Paper Surface</button>',
      '          <button type="button" class="btn" id="btn-share">Copy Share Note</button>',
      '          <button type="button" class="btn btn--primary" id="btn-copy-capsule">Copy 25-Turn Capsule</button>',
      '        </div>',
      '      </header>',
      '      <nav class="tabs" role="tablist" aria-label="Offline WebOS Views">',
      '        <button type="button" class="tab" role="tab" id="tab-map" aria-selected="true" aria-controls="panel-map">Mind-Map Floorplan</button>',
      '        <button type="button" class="tab" role="tab" id="tab-reader" aria-selected="false" aria-controls="panel-reader">Dual-View Reader</button>',
      '        <button type="button" class="tab" role="tab" id="tab-lws" aria-selected="false" aria-controls="panel-lws">Lexicon · Wiki · Soul</button>',
      '        <button type="button" class="tab" role="tab" id="tab-capsule" aria-selected="false" aria-controls="panel-capsule">Rehydration Capsules</button>',
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
      '        <p style="margin:0 0 0.65rem;color:var(--ink-soft);">All 6 specialized rehydration capsule aspects plus Master Bundle are embedded offline in Markdown and JSON v2.</p>',
      '        <div class="cap-meta" id="capsule-meta-row">',
      '          <span class="badge badge--amber" id="capsule-badge-aspect">' + escapeHtml(defaultCapsule.label) + '</span>',
      '          <span class="badge badge--cyan" id="capsule-badge-tokens">~' + escapeHtml(String(defaultCapsule.markdownTokens)) + ' tokens · Markdown</span>',
      '          <span class="badge" id="capsule-badge-bytes">' + escapeHtml(String(defaultCapsule.markdownBytes)) + ' bytes</span>',
      '          <span class="badge" id="capsule-digest-chip">sha256: ' + escapeHtml(defaultCapsule.markdownDigest16) + '</span>',
      '        </div>',
      '        <div class="cap-aspects" id="capsule-aspect-bar" role="group" aria-label="Rehydration Capsule Aspects">',
      aspectButtonsHtml,
      '        </div>',
      '        <p class="cap-summary" id="capsule-aspect-summary">' + escapeHtml(defaultCapsule.summary) + '</p>',
      '        <div class="map-toolbar">',
      '          <div class="actions" role="group" aria-label="Capsule Output Format">',
      '            <button type="button" class="btn btn--fmt" id="btn-fmt-markdown" data-capsule-format="markdown" aria-pressed="true">Markdown</button>',
      '            <button type="button" class="btn btn--fmt" id="btn-fmt-json" data-capsule-format="json" aria-pressed="false">JSON v2</button>',
      '          </div>',
      '          <div class="actions">',
      '            <button type="button" class="btn btn--primary" id="btn-copy-active-capsule">Copy Capsule</button>',
      '            <button type="button" class="btn" id="btn-dl-capsule-md">Download .md</button>',
      '            <button type="button" class="btn" id="btn-dl-capsule-json">Download .json</button>',
      '          </div>',
      '        </div>',
      '        <pre class="code" id="capsule-pre" tabindex="0" aria-label="Active Rehydration Capsule Preview">' + escapeHtml(defaultCapsule.markdown) + '</pre>',
      '        <h3 style="margin:1rem 0 0.4rem;font-size:0.95rem;">Source Plain-English Note</h3>',
      '        <textarea class="note" id="source-note-view" readonly aria-label="Source note">' + escapeHtml(markdown) + '</textarea>',
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
      '          setStatus(next === "paper" ? "Warm Paper (#F2EFE8) active." : "Deep Obsidian (#07090D) active.");',
      '        });',
      '      }',
      '      function copyText(text, label) {',
      '        if (navigator.clipboard && navigator.clipboard.writeText) {',
      '          navigator.clipboard.writeText(text).then(function () { setStatus(label + " copied to clipboard."); }).catch(function () { fallbackCopy(text, label); });',
      '        } else { fallbackCopy(text, label); }',
      '      }',
      '      function fallbackCopy(text, label) {',
      '        var prevFocus = document.activeElement;',
      '        var ta = document.createElement("textarea");',
      '        ta.value = text;',
      '        ta.setAttribute("aria-hidden", "true");',
      '        ta.setAttribute("tabindex", "-1");',
      '        ta.style.position = "fixed"; ta.style.left = "-9999px"; ta.style.opacity = "0";',
      '        document.body.appendChild(ta);',
      '        try { ta.focus({ preventScroll: true }); } catch (e) { try { ta.focus(); } catch (e2) {} }',
      '        ta.select();',
      '        try {',
      '          var ok = document.execCommand("copy");',
      '          setStatus(ok ? (label + " copied to clipboard.") : ("Select and copy " + label + " from preview."));',
      '        } catch (e) {',
      '          setStatus("Select and copy " + label + " from preview.");',
      '        }',
      '        document.body.removeChild(ta);',
      '        if (prevFocus && prevFocus.focus) { try { prevFocus.focus({ preventScroll: true }); } catch (e3) {} }',
      '      }',
      '      function downloadTextFile(filename, content, mimeType, label) {',
      '        if (typeof Blob === "undefined" || typeof URL === "undefined" || !URL.createObjectURL) {',
      '          setStatus("Copy " + label + " directly from the preview pane.");',
      '          return;',
      '        }',
      '        var blob = new Blob([content], { type: mimeType });',
      '        var url = URL.createObjectURL(blob);',
      '        var a = document.createElement("a");',
      '        a.href = url;',
      '        a.download = filename;',
      '        a.style.display = "none";',
      '        document.body.appendChild(a);',
      '        a.click();',
      '        setTimeout(function () {',
      '          if (a.parentNode) a.parentNode.removeChild(a);',
      '          URL.revokeObjectURL(url);',
      '        }, 250);',
      '        setStatus("Downloaded " + filename + " (" + label + ").");',
      '      }',
      '      var capsulesMap = data.capsules || {};',
      '      var activeAspectId = data.activeAspectId || "session-passdown";',
      '      if (!capsulesMap[activeAspectId]) {',
      '        var capKeys = Object.keys(capsulesMap);',
      '        activeAspectId = capKeys.length ? capKeys[0] : "session-passdown";',
      '      }',
      '      var activeFormat = "markdown";',
      '      var capPre = document.getElementById("capsule-pre");',
      '      var capBadgeAspect = document.getElementById("capsule-badge-aspect");',
      '      var capBadgeTokens = document.getElementById("capsule-badge-tokens");',
      '      var capBadgeBytes = document.getElementById("capsule-badge-bytes");',
      '      var capDigestChip = document.getElementById("capsule-digest-chip");',
      '      var capSummaryEl = document.getElementById("capsule-aspect-summary");',
      '      var aspectBtns = Array.prototype.slice.call(document.querySelectorAll("[data-capsule-aspect]"));',
      '      var fmtBtns = Array.prototype.slice.call(document.querySelectorAll("[data-capsule-format]"));',
      '      function getActiveCapsuleEntry() {',
      '        return capsulesMap[activeAspectId] || {',
      '          id: activeAspectId, label: "25-Turn Capsule", summary: "",',
      '          markdown: data.capsule || "", markdownTokens: 0, markdownBytes: 0, markdownDigest16: data.digest16 || "",',
      '          jsonText: "{}", jsonTokens: 0, jsonBytes: 0, jsonDigest16: data.digest16 || ""',
      '        };',
      '      }',
      '      function renderActiveCapsule(announce) {',
      '        var entry = getActiveCapsuleEntry();',
      '        var isJson = activeFormat === "json";',
      '        var text = isJson ? (entry.jsonText || "{}") : (entry.markdown || "");',
      '        var tokens = isJson ? (entry.jsonTokens || 0) : (entry.markdownTokens || 0);',
      '        var bytes = isJson ? (entry.jsonBytes || 0) : (entry.markdownBytes || 0);',
      '        var dig16 = isJson ? (entry.jsonDigest16 || "") : (entry.markdownDigest16 || "");',
      '        var fmtLabel = isJson ? "JSON v2" : "Markdown";',
      '        aspectBtns.forEach(function (btn) {',
      '          btn.setAttribute("aria-pressed", btn.getAttribute("data-capsule-aspect") === activeAspectId ? "true" : "false");',
      '        });',
      '        fmtBtns.forEach(function (btn) {',
      '          btn.setAttribute("aria-pressed", btn.getAttribute("data-capsule-format") === activeFormat ? "true" : "false");',
      '        });',
      '        if (capBadgeAspect) capBadgeAspect.textContent = entry.label || activeAspectId;',
      '        if (capBadgeTokens) capBadgeTokens.textContent = "~" + tokens + " tokens · " + fmtLabel;',
      '        if (capBadgeBytes) capBadgeBytes.textContent = bytes + " bytes";',
      '        if (capDigestChip) capDigestChip.textContent = "sha256: " + dig16;',
      '        if (capSummaryEl) capSummaryEl.textContent = entry.summary || "";',
      '        if (capPre) capPre.textContent = text;',
      '        if (announce) setStatus("Capsule: " + (entry.label || activeAspectId) + " (" + fmtLabel + " · ~" + tokens + " tokens).");',
      '      }',
      '      aspectBtns.forEach(function (btn) {',
      '        btn.addEventListener("click", function () {',
      '          activeAspectId = btn.getAttribute("data-capsule-aspect") || activeAspectId;',
      '          renderActiveCapsule(true);',
      '        });',
      '      });',
      '      fmtBtns.forEach(function (btn) {',
      '        btn.addEventListener("click", function () {',
      '          activeFormat = btn.getAttribute("data-capsule-format") === "json" ? "json" : "markdown";',
      '          renderActiveCapsule(true);',
      '        });',
      '      });',
      '      var kitSlug = String(data.kitId || "aether-kit").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "aether-kit";',
      '      var dayNum = Number(data.day) || 1;',
      '      var btnCopyActiveCap = document.getElementById("btn-copy-active-capsule");',
      '      if (btnCopyActiveCap) {',
      '        btnCopyActiveCap.addEventListener("click", function () {',
      '          var entry = getActiveCapsuleEntry();',
      '          var isJson = activeFormat === "json";',
      '          copyText(isJson ? (entry.jsonText || "") : (entry.markdown || ""), (entry.label || activeAspectId) + " (" + (isJson ? "JSON v2" : "Markdown") + ")");',
      '        });',
      '      }',
      '      var btnDlMd = document.getElementById("btn-dl-capsule-md");',
      '      if (btnDlMd) {',
      '        btnDlMd.addEventListener("click", function () {',
      '          var entry = getActiveCapsuleEntry();',
      '          downloadTextFile("aether-" + kitSlug + "-" + activeAspectId + "-day-" + dayNum + ".md", entry.markdown || "", "text/markdown;charset=utf-8", (entry.label || activeAspectId) + " Markdown");',
      '        });',
      '      }',
      '      var btnDlJson = document.getElementById("btn-dl-capsule-json");',
      '      if (btnDlJson) {',
      '        btnDlJson.addEventListener("click", function () {',
      '          var entry = getActiveCapsuleEntry();',
      '          downloadTextFile("aether-" + kitSlug + "-" + activeAspectId + "-day-" + dayNum + ".json", entry.jsonText || "{}", "application/json;charset=utf-8", (entry.label || activeAspectId) + " JSON v2");',
      '        });',
      '      }',
      '      renderActiveCapsule(false);',
      '      document.getElementById("btn-share").addEventListener("click", function () { copyText(data.shareNote || "", "Share note"); });',
      '      document.getElementById("btn-copy-capsule").addEventListener("click", function () { copyText(data.capsule || (getActiveCapsuleEntry().markdown || ""), "25-Turn Capsule"); });',
      '      var btnEmailHtml = document.getElementById("btn-copy-email-html");',
      '      if (btnEmailHtml) btnEmailHtml.addEventListener("click", function () { copyText(data.emailDispatchHtml || "", "472px Email HTML"); });',
      '      var btnPlainLetter = document.getElementById("btn-copy-plain-letter");',
      '      if (btnPlainLetter) btnPlainLetter.addEventListener("click", function () { copyText(data.plainLetterDispatch || "", "Plain-Text Letter"); });',
      '      var tabs = Array.prototype.slice.call(document.querySelectorAll("[role=tab]"));',
      '      function activateTab(tab) {',
      '        tabs.forEach(function (t) {',
      '          var active = t === tab;',
      '          t.setAttribute("aria-selected", active ? "true" : "false");',
      '          var p = document.getElementById(t.getAttribute("aria-controls"));',
      '          if (p) p.hidden = !active;',
      '        });',
      '      }',
      '      tabs.forEach(function (tab, idx) {',
      '        tab.addEventListener("click", function () { activateTab(tab); });',
      '        tab.addEventListener("keydown", function (ev) {',
      '          var nextIdx = idx;',
      '          if (ev.key === "ArrowRight") nextIdx = (idx + 1) % tabs.length;',
      '          else if (ev.key === "ArrowLeft") nextIdx = (idx - 1 + tabs.length) % tabs.length;',
      '          else if (ev.key === "Home") nextIdx = 0;',
      '          else if (ev.key === "End") nextIdx = tabs.length - 1;',
      '          else return;',
      '          ev.preventDefault();',
      '          activateTab(tabs[nextIdx]);',
      '          tabs[nextIdx].focus();',
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
    version: '2.1.0',
    stripEmDashes: stripEmDashes,
    escapeHtml: escapeHtml,
    safeJsonForHtml: safeJsonForHtml,
    buildShareNote: buildShareNote,
    buildPlainLetterDispatch: buildPlainLetterDispatch,
    buildEmailDispatchHtml: buildEmailDispatchHtml,
    buildOfflineHtml: buildOfflineHtml,
    downloadKitHtml: downloadKitHtml
  };
}));
