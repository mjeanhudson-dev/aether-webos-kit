/* ==========================================================================
   Aether WebOS Multi-Aspect Rehydration Capsules (Zero External Dependencies)
   Author: Eloquent (@mjeanhudson-dev)
   Schema: aether.rehydration.capsule.v2 (+ legacy aether.compaction.passdown.v1)
   Contract:
     - Exposes window.AetherCapsules (browser) and module.exports (CommonJS/Node):
       {
         version,
         SCHEMA_VERSION,
         LEGACY_SCHEMA_VERSION,
         DEFAULT_ASPECT_ID,
         ASPECTS,
         getAspect,
         normalizeAspectId,
         stripEmDashes,
         computeByteLength,
         estimateTokens,
         computeCapsuleDigest,
         computeCapsuleDigestSync,
         buildCapsuleMarkdown,
         buildCapsuleJson,
         serializeCapsuleJson,
         buildAllCapsules,
         parseCapsuleForRehydrate
       }
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.AetherCapsules = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : window, function () {
  'use strict';

  var SCHEMA_VERSION = 'aether.rehydration.capsule.v2';
  var LEGACY_SCHEMA_VERSION = 'aether.compaction.passdown.v1';
  var DEFAULT_ASPECT_ID = 'session-passdown';

  var DEFAULT_META = {
    version: '2.1.0',
    updatedAt: '2026-11-24T13:30:00Z',
    author: 'Eloquent (@mjeanhudson-dev)',
    kitName: 'Aether WebOS Kit',
    ctaLabel: 'Start Day 1: Free',
    capsuleSchemaVersion: SCHEMA_VERSION,
    routingMode: 'Stage-0 -> Stage-Apex (FLASH_SHUNT_ENGAGED)',
    compactionGate: '25:1 Exodia',
    pinnedToolsCount: 15,
    equationsCount: 19,
    zeroInstall: true
  };

  var SPECIALIZED_IDS = [
    'session-passdown',
    'floorplan-waves',
    'lexicon-soul',
    'swarm-handoff',
    'offline-portability',
    'compact-prompt'
  ];

  var ASPECTS = [
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
      includes: SPECIALIZED_IDS.slice(),
      summary: 'Complete unified multi-aspect rehydration envelope combining all 6 specialized aspects.'
    }
  ];

  var DEFAULT_WEEK_PHASES = {
    1: 'Voice & Personal Lexicon',
    2: 'Visual Mind-Maps & Floorplans',
    3: 'Zero-Code Agentic Sprints',
    4: 'Ship & Share Offline Kit'
  };

  /* --------------------------------------------------- string hygiene -- */
  var EM_DASH_CHAR = String.fromCharCode(0x2014);
  var EM_DASH_ENTITY_RE = new RegExp('&' + 'mdash;', 'gi');
  var EM_DASH_CHAR_RE = new RegExp('\\s*' + EM_DASH_CHAR + '\\s*', 'g');
  var WIN_HOME_RE = new RegExp('[A-Za-z]:\\\\' + 'Users\\\\[^\\\\/"\'\\s]+', 'g');
  var WIN_HOME_SLASH_RE = new RegExp('[A-Za-z]:/' + 'Users/[^/"\'\\s]+', 'g');
  var POSIX_HOME_RE = new RegExp('/' + 'Users/[^/"\'\\s]+', 'g');

  function stripEmDashes(value) {
    return String(value == null ? '' : value)
      .replace(EM_DASH_ENTITY_RE, ', ')
      .replace(EM_DASH_CHAR_RE, ', ');
  }

  function sanitizePortableText(value) {
    return stripEmDashes(value)
      .replace(WIN_HOME_RE, '~')
      .replace(WIN_HOME_SLASH_RE, '~')
      .replace(POSIX_HOME_RE, '~');
  }

  function truncateClean(text, maxLen) {
    var clean = sanitizePortableText(text).replace(/\s+/g, ' ').trim();
    if (clean.length <= maxLen) return clean;
    return clean.slice(0, Math.max(4, maxLen - 3)).trim() + '...';
  }

  function clampDay(day) {
    var n = parseInt(day, 10);
    if (isNaN(n) || n < 1) return 1;
    if (n > 30) return 30;
    return n;
  }

  function clampWeek(week, day) {
    var w = parseInt(week, 10);
    if (!isNaN(w) && w >= 1 && w <= 4) return w;
    if (day <= 7) return 1;
    if (day <= 15) return 2;
    if (day <= 23) return 3;
    return 4;
  }

  function normalizeSurface(surface) {
    var s = String(surface || '').toLowerCase().trim();
    return s === 'paper' ? 'paper' : 'obsidian';
  }

  function normalizeAspectId(aspectId) {
    var raw = String(aspectId || '').toLowerCase().trim();
    for (var i = 0; i < ASPECTS.length; i++) {
      if (ASPECTS[i].id === raw) return ASPECTS[i].id;
    }
    if (raw === 'master' || raw === 'bundle' || raw === 'all') return 'master-bundle';
    if (raw === 'passdown' || raw === 'session') return 'session-passdown';
    if (raw === 'waves' || raw === 'floorplan') return 'floorplan-waves';
    if (raw === 'lexicon' || raw === 'soul') return 'lexicon-soul';
    if (raw === 'swarm') return 'swarm-handoff';
    if (raw === 'offline' || raw === 'html') return 'offline-portability';
    if (raw === 'compact' || raw === 'prompt') return 'compact-prompt';
    return DEFAULT_ASPECT_ID;
  }

  function getAspect(aspectId) {
    var id = normalizeAspectId(aspectId);
    for (var i = 0; i < ASPECTS.length; i++) {
      if (ASPECTS[i].id === id) return ASPECTS[i];
    }
    return ASPECTS[0];
  }

  /* -------------------------------------------- UTF-8 + SHA-256 + tokens -- */
  function toTextInput(input) {
    if (input == null) return '';
    if (typeof input === 'string') return input;
    if (typeof input === 'object') {
      try { return JSON.stringify(input, null, 2); } catch (e) { return String(input); }
    }
    return String(input);
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

  function computeByteLength(text) {
    var s = toTextInput(text);
    if (!s) return 0;
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(s).byteLength;
    }
    return encodeUtf8Bytes(s).length;
  }

  function computeCapsuleDigestSync(text) {
    var bytes = encodeUtf8Bytes(toTextInput(text));
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

  function computeCapsuleDigest(text) {
    var str = toTextInput(text);
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle && typeof TextEncoder !== 'undefined') {
      try {
        var data = new TextEncoder().encode(str);
        return globalThis.crypto.subtle.digest('SHA-256', data).then(function (buf) {
          var arr = Array.from(new Uint8Array(buf));
          return arr.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        }).catch(function () {
          return computeCapsuleDigestSync(str);
        });
      } catch (e) {
        return Promise.resolve(computeCapsuleDigestSync(str));
      }
    }
    return Promise.resolve(computeCapsuleDigestSync(str));
  }

  function estimateTokens(text) {
    var str = toTextInput(text).trim();
    if (!str) return 0;
    var chars = str.length;
    var words = str.split(/\s+/).filter(Boolean).length;
    var punct = (str.match(/[{}[\](),.:;#*`"'/-]/g) || []).length;
    var byChars = chars / 4;
    var byLexical = words * 1.32 + punct * 0.24;
    return Math.max(1, Math.ceil((byChars + byLexical) / 2));
  }

  /* -------------------------------------- input & markdown synthesis -- */
  function synthesizeMarkdownFromParsed(docTitle, parsed) {
    var p = parsed || {};
    var out = ['# ' + sanitizePortableText(docTitle || p.title || 'Aether Floorplan')];
    if (p.intro) {
      out.push('', sanitizePortableText(p.intro));
    }
    var steps = Array.isArray(p.steps) ? p.steps : [];
    if (steps.length) {
      [0, 1, 2].forEach(function (w) {
        var wSteps = steps.filter(function (st) {
          return (typeof st.wave === 'number' ? st.wave : 1) === w;
        });
        if (!wSteps.length) return;
        out.push('', '## Wave ' + w + ': ' + (w === 0 ? 'Baseline' : (w === 1 ? 'Core Execution' : 'Verification & Export')));
        wSteps.forEach(function (st) {
          var depSuffix = st.dependsOn ? ' (depends: ' + sanitizePortableText(st.dependsOn) + ')' : '';
          out.push('- [' + (st.done ? 'x' : ' ') + '] ' + sanitizePortableText(st.text) + ' [Wave ' + w + ']' + depSuffix);
        });
      });
    } else if (Array.isArray(p.sections) && p.sections.length) {
      p.sections.forEach(function (sec) {
        out.push('', '## ' + sanitizePortableText(sec.title || 'Section'));
        (sec.paragraphs || []).forEach(function (pg) {
          out.push(sanitizePortableText(pg));
        });
        (sec.items || []).forEach(function (it) {
          out.push('- ' + sanitizePortableText(typeof it === 'string' ? it : (it && it.text) || ''));
        });
      });
    }
    if (Array.isArray(p.lexicon) && p.lexicon.length) {
      out.push('', '## Lexicon');
      p.lexicon.forEach(function (lx) {
        out.push('- **' + sanitizePortableText(lx.term) + '**: ' + sanitizePortableText(lx.definition));
      });
    }
    if (Array.isArray(p.wiki) && p.wiki.length) {
      out.push('', '## Wiki');
      p.wiki.forEach(function (wk) {
        out.push('### ' + sanitizePortableText(wk.title));
        out.push(sanitizePortableText(wk.summary));
      });
    }
    if (Array.isArray(p.soul) && p.soul.length) {
      out.push('', '## Soul');
      p.soul.forEach(function (sl) {
        out.push('- ' + sanitizePortableText(sl.label || 'Invariant') + ': ' + sanitizePortableText(sl.rule));
      });
    }
    return out.join('\n');
  }

  function normalizeContext(state, parsed, meta) {
    var s = state || {};
    var p = parsed || s.parsed || {};
    var rawMeta = meta || s.meta || {};
    var m = Object.assign({}, DEFAULT_META, rawMeta);
    Object.keys(m).forEach(function (k) {
      if (typeof m[k] === 'string') m[k] = sanitizePortableText(m[k]);
    });
    m.author = 'Eloquent (@mjeanhudson-dev)';

    var dayObj = s.activeDayObj || {};
    var day = clampDay(dayObj.day || s.activeDay || s.day || 1);
    var week = clampWeek(dayObj.week || s.week, day);
    var phase = sanitizePortableText(dayObj.phase || s.phase || DEFAULT_WEEK_PHASES[week]);
    var dayTitle = sanitizePortableText(
      dayObj.title ||
      s.dayTitle ||
      (s.prompt && s.title ? s.title : '') ||
      ('Day ' + day + ' Mentorship Practice')
    );
    var dayPrompt = sanitizePortableText(
      dayObj.prompt ||
      s.dayPrompt ||
      s.prompt ||
      'Capture the next concrete plain-English step in your Floorplan.'
    );
    var deliverable = sanitizePortableText(
      dayObj.deliverable ||
      s.deliverable ||
      'Verified offline Floorplan and SHA-256 capsule receipt.'
    );
    var kitId = sanitizePortableText(s.activeKitId || s.kitId || dayObj.kitId || 'household-clarity');
    var docTitle = sanitizePortableText(
      p.title ||
      (!s.prompt && s.title ? s.title : '') ||
      'Aether WebOS Floorplan'
    );
    var surface = normalizeSurface(s.surface);
    var markdown = (typeof s.markdown === 'string' && s.markdown.trim())
      ? sanitizePortableText(s.markdown)
      : synthesizeMarkdownFromParsed(docTitle, p);

    var sourceDigestHex = (typeof s.digestHex === 'string' && /^[a-f0-9]{64}$/i.test(s.digestHex))
      ? s.digestHex.toLowerCase()
      : computeCapsuleDigestSync(markdown);
    var sourceDigest16 = sourceDigestHex.slice(0, 16);

    var steps = Array.isArray(p.steps) ? p.steps.map(function (st) {
      var w = (st.wave === 0 || st.wave === 1 || st.wave === 2) ? st.wave : 1;
      return {
        text: sanitizePortableText(st.text || ''),
        done: Boolean(st.done),
        wave: w,
        sectionTitle: sanitizePortableText(st.sectionTitle || ('Wave ' + w)),
        dependsOn: sanitizePortableText(st.dependsOn || '')
      };
    }).filter(function (st) { return Boolean(st.text); }) : [];

    var nodes = Array.isArray(p.nodes) ? p.nodes : [];
    var edges = Array.isArray(p.edges) ? p.edges : [];

    var waveBuckets = { 0: [], 1: [], 2: [] };
    nodes.forEach(function (n) {
      if (!n || n.id === 'node-root') return;
      var w = (n.wave === 0 || n.wave === 1 || n.wave === 2) ? n.wave : 1;
      var lbl = sanitizePortableText(n.label || n.shortLabel || '');
      if (lbl && waveBuckets[w].indexOf(lbl) === -1) {
        waveBuckets[w].push(lbl);
      }
    });
    steps.forEach(function (st) {
      if (waveBuckets[st.wave].indexOf(st.text) === -1) {
        waveBuckets[st.wave].push(st.text);
      }
    });

    var lexicon = Array.isArray(p.lexicon) ? p.lexicon.map(function (lx) {
      return {
        term: sanitizePortableText(lx.term || ''),
        definition: sanitizePortableText(lx.definition || ''),
        source: sanitizePortableText(lx.source || 'Floorplan')
      };
    }).filter(function (lx) { return Boolean(lx.term && lx.definition); }) : [];

    var wiki = Array.isArray(p.wiki) ? p.wiki.map(function (wk) {
      return {
        title: sanitizePortableText(wk.title || ''),
        summary: sanitizePortableText(wk.summary || ''),
        section: sanitizePortableText(wk.section || 'Wiki')
      };
    }).filter(function (wk) { return Boolean(wk.title && wk.summary); }) : [];

    var soul = Array.isArray(p.soul) ? p.soul.map(function (sl) {
      return {
        label: sanitizePortableText(sl.label || 'Invariant'),
        rule: sanitizePortableText(sl.rule || '')
      };
    }).filter(function (sl) { return Boolean(sl.rule); }) : [];

    var nodeById = {};
    nodes.forEach(function (n) {
      if (n && n.id) nodeById[n.id] = sanitizePortableText(n.label || n.shortLabel || n.id);
    });

    var criticalPath = [];
    edges.forEach(function (ed) {
      if (ed && ed.kind === 'depends' && nodeById[ed.from] && nodeById[ed.to]) {
        criticalPath.push({
          from: nodeById[ed.from],
          to: nodeById[ed.to],
          edge: nodeById[ed.from] + ' -> ' + nodeById[ed.to]
        });
      }
    });
    steps.forEach(function (st) {
      if (!st.dependsOn) return;
      var pair = st.dependsOn + ' -> ' + st.text;
      var exists = criticalPath.some(function (cp) {
        return cp.to === st.text;
      });
      if (!exists) {
        criticalPath.push({
          from: st.dependsOn,
          to: st.text,
          edge: pair
        });
      }
    });

    var doneSteps = steps.filter(function (st) { return st.done; });
    var openSteps = steps.filter(function (st) { return !st.done; });
    var words = markdown.trim() ? markdown.trim().split(/\s+/).length : 0;

    return {
      meta: m,
      kitId: kitId,
      docTitle: docTitle,
      day: day,
      week: week,
      phase: phase,
      dayTitle: dayTitle,
      dayPrompt: dayPrompt,
      deliverable: deliverable,
      surface: surface,
      markdown: markdown,
      sourceDigestHex: sourceDigestHex,
      sourceDigest16: sourceDigest16,
      steps: steps,
      doneSteps: doneSteps,
      openSteps: openSteps,
      waveBuckets: waveBuckets,
      lexicon: lexicon,
      wiki: wiki,
      soul: soul,
      criticalPath: criticalPath,
      metrics: {
        words: (p.metrics && Number(p.metrics.words)) || words,
        nodes: nodes.length,
        edges: edges.length,
        dependencies: criticalPath.length,
        doneCount: doneSteps.length,
        pendingCount: openSteps.length,
        totalSteps: steps.length
      }
    };
  }

  /* ------------------------------------------ specialized aspect builders -- */
  function footerLine(ctx) {
    return 'Built with the Free Aether 30-Day Kit · ' + ctx.meta.ctaLabel + ' · Author: ' + ctx.meta.author;
  }

  function buildSessionPassdownSpec(ctx) {
    var gitInvariants = [
      'Sole public author identity: Eloquent (@mjeanhudson-dev) <mjeanhudson@users.noreply.github.com>',
      'Zero OS usernames, zero local home paths, and zero em dashes anywhere in code, docs, or exports',
      'Syntax verification (node --check) and public hygiene check required before commit or bundle publish'
    ];
    var buildInvariants = [
      'Routing Mode: ' + ctx.meta.routingMode,
      'Compaction Gate: ' + ctx.meta.compactionGate + ' (' + ctx.meta.pinnedToolsCount + ' pinned tools · ' + ctx.meta.equationsCount + ' equations)',
      'Active Surface: ' + ctx.surface + ' (borderless 1px-hairline geometry, zero box-shadow, zero backdrop-filter)'
    ];
    var nextStepLines = ctx.openSteps.slice(0, 6).map(function (st) {
      var dep = st.dependsOn ? ' (depends: ' + st.dependsOn + ')' : '';
      return '- [ ] ' + st.text + ' [Wave ' + st.wave + ']' + dep;
    });
    var doneLines = ctx.doneSteps.slice(0, 5).map(function (st) {
      return '- [x] ' + st.text + ' [Wave ' + st.wave + ']';
    });

    var bodyLines = [
      '## Executive Resume State',
      '- Kit: ' + ctx.docTitle + ' (' + ctx.kitId + ')',
      '- Milestone: Day ' + ctx.day + ' of 30 (Week ' + ctx.week + ' · ' + ctx.phase + ')',
      '- Active Focus: ' + ctx.dayTitle,
      '- Prompt Brief: ' + ctx.dayPrompt,
      '- Target Deliverable: ' + ctx.deliverable,
      '- Progress Snapshot: ' + ctx.metrics.doneCount + '/' + ctx.metrics.totalSteps + ' tasks complete · ' + ctx.metrics.nodes + ' floorplan nodes · ' + ctx.metrics.words + ' words',
      '- Source SHA-256 (16): ' + ctx.sourceDigest16,
      '',
      '## Git & Build Invariants',
      gitInvariants.map(function (x) { return '- ' + x; }).join('\n'),
      buildInvariants.map(function (x) { return '- ' + x; }).join('\n'),
      '',
      '## Completed Milestones',
      doneLines.length ? doneLines.join('\n') : '- [ ] Wave 0 baseline tasks are ready to start.',
      '',
      '## Immediate Next Steps',
      nextStepLines.length ? nextStepLines.join('\n') : '- [ ] All listed steps complete; export updated single-file HTML archive.'
    ];

    var markdown = sanitizePortableText([
      '# Session Pass-Down Capsule (Aether WebOS v2.1)',
      bodyLines.join('\n'),
      '',
      footerLine(ctx)
    ].join('\n'));

    return {
      body: bodyLines.join('\n'),
      markdown: markdown,
      payload: {
        milestone: {
          day: ctx.day,
          week: ctx.week,
          phase: ctx.phase,
          dayTitle: ctx.dayTitle,
          dayPrompt: ctx.dayPrompt,
          deliverable: ctx.deliverable
        },
        resumeMetrics: ctx.metrics,
        gitInvariants: gitInvariants,
        buildInvariants: buildInvariants,
        completedTasks: ctx.doneSteps,
        nextSteps: ctx.openSteps.slice(0, 8)
      }
    };
  }

  function formatWaveTaskList(ctx, waveNum, fallbackLabel) {
    var waveSteps = ctx.steps.filter(function (st) { return st.wave === waveNum; });
    if (waveSteps.length) {
      return waveSteps.map(function (st) {
        var dep = st.dependsOn ? ' (depends: ' + st.dependsOn + ')' : '';
        return '- [' + (st.done ? 'x' : ' ') + '] ' + st.text + dep;
      }).join('\n');
    }
    var bucket = ctx.waveBuckets[waveNum] || [];
    if (bucket.length) {
      return bucket.slice(0, 6).map(function (lbl) {
        return '- [ ] ' + lbl;
      }).join('\n');
    }
    return '- [ ] ' + fallbackLabel;
  }

  function buildFloorplanWavesSpec(ctx) {
    var cpLines = ctx.criticalPath.slice(0, 10).map(function (cp, idx) {
      return (idx + 1) + '. ' + cp.edge;
    });

    var bodyLines = [
      '## Topology Summary',
      '- Kit: ' + ctx.docTitle + ' (' + ctx.kitId + ') · Day ' + ctx.day + ' (Week ' + ctx.week + ')',
      '- Graph: ' + ctx.metrics.nodes + ' spatial nodes · ' + ctx.metrics.edges + ' total edges · ' + ctx.metrics.dependencies + ' explicit dependency gates',
      '- Task Ledger: ' + ctx.metrics.doneCount + ' completed · ' + ctx.metrics.pendingCount + ' pending (' + ctx.metrics.totalSteps + ' total)',
      '',
      '## Wave 0: Baseline & Foundation',
      formatWaveTaskList(ctx, 0, 'Establish Wave 0 baseline facts and constraints'),
      '',
      '## Wave 1: Core Execution',
      formatWaveTaskList(ctx, 1, 'Execute primary Wave 1 workflow deliverables'),
      '',
      '## Wave 2: Verification & Ship Gate',
      formatWaveTaskList(ctx, 2, 'Verify SHA-256 parity and export portable HTML kit'),
      '',
      '## Critical Path Dependencies',
      cpLines.length ? cpLines.join('\n') : '1. Sequential wave progression: Wave 0 -> Wave 1 -> Wave 2 (no blocking sub-task overrides declared).'
    ];

    var markdown = sanitizePortableText([
      '# Floorplan Waves & Critical Path Capsule (Aether WebOS v2.1)',
      bodyLines.join('\n'),
      '',
      footerLine(ctx)
    ].join('\n'));

    return {
      body: bodyLines.join('\n'),
      markdown: markdown,
      payload: {
        summary: ctx.metrics,
        waves: {
          wave0: ctx.steps.filter(function (st) { return st.wave === 0; }),
          wave1: ctx.steps.filter(function (st) { return st.wave === 1; }),
          wave2: ctx.steps.filter(function (st) { return st.wave === 2; }),
          branchLabels: ctx.waveBuckets
        },
        criticalPath: ctx.criticalPath,
        completedTasks: ctx.doneSteps,
        pendingTasks: ctx.openSteps
      }
    };
  }

  function buildLexiconSoulSpec(ctx) {
    var designInvariants = [
      'Plain-English neighbor voice; ban robotic filler, hype claims, and em dashes',
      'Dual surface parity: Obsidian (#07090D) and Warm Paper (#F2EFE8) with Troilite Amber (#E27A2C)',
      'Borderless 1px-hairline precision (0px/2px corners, zero box-shadow, zero backdrop-filter, zero #000000)'
    ];
    var lexLines = ctx.lexicon.map(function (lx) {
      return '- **' + lx.term + '**: ' + lx.definition + ' [' + lx.source + ']';
    });
    var wikiLines = ctx.wiki.map(function (wk) {
      return '- **' + wk.title + '**: ' + wk.summary;
    });
    var soulLines = ctx.soul.map(function (sl) {
      return '- ' + sl.label + ': ' + sl.rule;
    });

    var bodyLines = [
      '## Domain Lexicon (' + ctx.lexicon.length + ' Terms)',
      lexLines.length ? lexLines.join('\n') : '- **Plain Anchor**: Define every recurring household or project term in one plain sentence.',
      '',
      '## Pocket Wiki Rules (' + ctx.wiki.length + ' Entries)',
      wikiLines.length ? wikiLines.join('\n') : '- **3-Beat Note**: Name the concrete friction, walk through the fix step by step, and end with one offline action.',
      '',
      '## Voice & Project Soul Invariants',
      soulLines.length ? soulLines.join('\n') : '- Core Intent: Keep all guidance honest, actionable, and readable offline.',
      '',
      '## Aether Surface & Craft Invariants',
      designInvariants.map(function (d) { return '- Design Rule: ' + d; }).join('\n')
    ];

    var markdown = sanitizePortableText([
      '# Lexicon, Wiki & Soul Capsule (Aether WebOS v2.1)',
      '- Kit: ' + ctx.docTitle + ' (' + ctx.kitId + ') · Surface: ' + ctx.surface + ' · Digest(16): ' + ctx.sourceDigest16,
      '',
      bodyLines.join('\n'),
      '',
      footerLine(ctx)
    ].join('\n'));

    return {
      body: bodyLines.join('\n'),
      markdown: markdown,
      payload: {
        lexicon: ctx.lexicon,
        wiki: ctx.wiki,
        soulInvariants: ctx.soul,
        designInvariants: designInvariants
      }
    };
  }

  function buildSwarmHandoffSpec(ctx) {
    var ownershipSlices = [
      { worker: 'capsule-schema', owns: ['context/terminal-synthesis.json', 'webos/capsules.js'] },
      { worker: 'capsule-studio', owns: ['webos/refractory.js', 'webos/refractory.css'] },
      { worker: 'exporter-capsules', owns: ['webos/exporter.js'] },
      { worker: 'stage-integration', owns: ['index.html', 'styles/site.css', 'scripts/stage-choreography.js', 'webgl/artifact-shader.js'] },
      { worker: 'squarespace-packager', owns: ['scripts/pack-squarespace.mjs', 'squarespace/*'] }
    ];
    var modelPolicy = {
      routingMode: ctx.meta.routingMode,
      minimumFloor: 'gemini-4-hydrogen-xhigh',
      frontierDefaultCeiling: ['gemini-4-neon-high', 'gemini-4-argon-high', 'gemini-4-carbon-high'],
      bannedTiers: ['flash', 'lite', 'mini', 'haiku', 'nano', 'gemini-flash-worker-agy']
    };
    var quotaSentinel = {
      dailyTokenAlertThreshold: 10000000,
      compactionGate: ctx.meta.compactionGate,
      http429Policy: 'Pause downstream launches immediately; log trajectory; zero tight retry loops'
    };
    var boardProtocol = [
      'Enforce single-writer file locks: never modify files outside your assigned slice',
      'Read board incrementally via since=lastSeenSeq and park via swarm_wait (never poll in loops)',
      'Tag @peer only when waking the next actor; reserve @coordinator [done] for verified deliverables'
    ];
    var handoffQueue = ctx.openSteps.slice(0, 5).map(function (st, idx) {
      return {
        slot: idx + 1,
        wave: st.wave,
        task: st.text,
        dependsOn: st.dependsOn || null
      };
    });

    var bodyLines = [
      '## Multi-Worker Ownership Boundaries',
      ownershipSlices.map(function (s) {
        return '- `@' + s.worker + '`: `' + s.owns.join('`, `') + '`';
      }).join('\n'),
      '',
      '## Pinned Models & Token Quotas',
      '- Routing Invariant: ' + modelPolicy.routingMode,
      '- Agent Model Floor: `' + modelPolicy.minimumFloor + '` and up (explicit `model` required on every `swarm add`)',
      '- Default Frontier Cap: `' + modelPolicy.frontierDefaultCeiling.join('`, `') + '`',
      '- Daily Token Sentinel: `10,000,000` tokens alert banner · Compaction Gate: ' + quotaSentinel.compactionGate,
      '- HTTP 429 Circuit Breaker: ' + quotaSentinel.http429Policy,
      '',
      '## Board Coordination Protocol',
      boardProtocol.map(function (r) { return '- ' + r; }).join('\n'),
      '',
      '## Active Floorplan Handoff Queue',
      handoffQueue.length
        ? handoffQueue.map(function (q) {
            return q.slot + '. [Wave ' + q.wave + '] ' + q.task + (q.dependsOn ? ' (after: ' + q.dependsOn + ')' : '');
          }).join('\n')
        : '1. All active checklist slices verified; ready for packaging and parity sign-off.'
    ];

    var markdown = sanitizePortableText([
      '# Swarm Handoff & Ownership Capsule (Aether WebOS v2.1)',
      '- Kit: ' + ctx.docTitle + ' (' + ctx.kitId + ') · Day ' + ctx.day + ' · Digest(16): ' + ctx.sourceDigest16,
      '',
      bodyLines.join('\n'),
      '',
      footerLine(ctx)
    ].join('\n'));

    return {
      body: bodyLines.join('\n'),
      markdown: markdown,
      payload: {
        ownershipSlices: ownershipSlices,
        modelPolicy: modelPolicy,
        quotaSentinel: quotaSentinel,
        boardProtocol: boardProtocol,
        handoffQueue: handoffQueue
      }
    };
  }

  function buildOfflinePortabilitySpec(ctx) {
    var standaloneRules = [
      'Single-file .html bundle embeds SVG Mind-Map, Dual-View Reader, Lexicon/Wiki/Soul, 472px Dispatch, and all 7 Rehydration Capsules',
      'Operates directly over file://, USB sticks, and airplane mode with zero local servers or cloud accounts',
      'Persists checklist completion state locally per kit digest while preserving clean printable fallbacks',
      'Escapes <, >, &, U+2028, and U+2029 across embedded JSON payloads for strict XSS immunity'
    ];
    var zeroCdnRules = [
      'Zero external runtime scripts, stylesheets, Google Fonts CDNs, or analytics beacons',
      'Squarespace /s/ embeds bypass ./context/terminal-synthesis.json network fetches cleanly via embedded seed state',
      'Self-hosted WOFF2 typography on live stages with clean system geometric/monospace stacks inside standalone exports'
    ];

    var bodyLines = [
      '## Standalone HTML Capsule Rules',
      standaloneRules.map(function (r) { return '- ' + r; }).join('\n'),
      '',
      '## WebCrypto SHA-256 Parity',
      '- Algorithm: SHA-256 (WebCrypto `crypto.subtle.digest` primary + deterministic pure-JS FIPS 180-4 fallback)',
      '- Source Markdown SHA-256 (64): `' + ctx.sourceDigestHex + '`',
      '- Source Markdown Receipt (16): `' + ctx.sourceDigest16 + '`',
      '- Active Surface Preset: `' + ctx.surface + '` · UTF-8 Bytes: `' + computeByteLength(ctx.markdown) + '`',
      '',
      '## Zero-CDN Offline Guarantee',
      zeroCdnRules.map(function (r) { return '- ' + r; }).join('\n')
    ];

    var markdown = sanitizePortableText([
      '# Offline Portability & Integrity Capsule (Aether WebOS v2.1)',
      '- Kit: ' + ctx.docTitle + ' (' + ctx.kitId + ') · Day ' + ctx.day + ' · Zero-Install: true',
      '',
      bodyLines.join('\n'),
      '',
      footerLine(ctx)
    ].join('\n'));

    return {
      body: bodyLines.join('\n'),
      markdown: markdown,
      payload: {
        standaloneHtmlRules: standaloneRules,
        sha256Parity: {
          algorithm: 'SHA-256',
          sourceDigestHex: ctx.sourceDigestHex,
          sourceDigest16: ctx.sourceDigest16,
          markdownBytes: computeByteLength(ctx.markdown),
          webCryptoPrimary: true,
          pureJsFallback: true
        },
        zeroCdnGuarantee: zeroCdnRules
      }
    };
  }

  function buildCompactPromptSpec(ctx) {
    var soulShort = ctx.soul.slice(0, 3).map(function (sl) {
      return truncateClean(sl.rule, 88);
    });
    if (!soulShort.length) {
      soulShort.push('Keep guidance plain-English, honest, and 100% offline-capable.');
    }

    var termShort = ctx.lexicon.slice(0, 4).map(function (lx) {
      return truncateClean(lx.term, 24) + '=' + truncateClean(lx.definition, 64);
    });
    if (!termShort.length) {
      termShort.push('Floorplan=3-wave action map');
    }

    var w0 = (ctx.waveBuckets[0] || []).slice(0, 2).map(function (x) { return truncateClean(x, 42); }).join('; ') || 'Baseline snapshot';
    var w1 = (ctx.waveBuckets[1] || []).slice(0, 2).map(function (x) { return truncateClean(x, 42); }).join('; ') || 'Core execution';
    var w2 = (ctx.waveBuckets[2] || []).slice(0, 2).map(function (x) { return truncateClean(x, 42); }).join('; ') || 'Verify & export HTML';

    var nextActions = ctx.openSteps.slice(0, 3).map(function (st, idx) {
      return (idx + 1) + '. [W' + st.wave + '] ' + truncateClean(st.text, 92);
    });
    if (!nextActions.length) {
      nextActions.push('1. [W2] Verify SHA-256 receipt and export final offline HTML kit.');
    }

    function composePrompt(maxTerms, maxActions) {
      var lines = [
        '# Cold-Start Drop-In Prompt (Post-Turn-25 Rehydration)',
        'Resume "' + truncateClean(ctx.docTitle, 48) + '" (' + truncateClean(ctx.kitId, 32) + ') at Day ' + ctx.day + '/30 (W' + ctx.week + ': ' + truncateClean(ctx.phase, 34) + ' · ' + truncateClean(ctx.dayTitle, 48) + ').',
        'SHA-256(16): ' + ctx.sourceDigest16 + ' | Surface: ' + ctx.surface + ' | Gate: 25:1 Exodia | Author: Eloquent (@mjeanhudson-dev).',
        '',
        'Guardrails:',
        '- Plain-English neighbor voice; zero corporate filler, zero em dashes, zero local OS paths.',
        '- Soul: ' + soulShort.join(' | '),
        '- Terms: ' + termShort.slice(0, maxTerms).join(' ; '),
        '',
        'Waves: W0=' + w0 + ' -> W1=' + w1 + ' -> W2=' + w2,
        '',
        'Next Open Actions:',
        nextActions.slice(0, maxActions).join('\n'),
        '',
        'Execute Action 1 concretely right now while honoring every Soul guardrail and Term above.'
      ];
      return sanitizePortableText(lines.join('\n'));
    }

    var promptMd = composePrompt(4, 3);
    if (estimateTokens(promptMd) >= 460) {
      promptMd = composePrompt(2, 2);
    }
    if (estimateTokens(promptMd) >= 480) {
      promptMd = composePrompt(1, 1);
    }

    var tokenEst = estimateTokens(promptMd);

    return {
      body: promptMd,
      markdown: promptMd,
      payload: {
        maxTokenBudget: 500,
        estimatedTokens: tokenEst,
        underBudget: tokenEst < 500,
        dropInPrompt: promptMd,
        activeAction: ctx.openSteps[0] ? ctx.openSteps[0].text : 'Verify SHA-256 receipt and export offline HTML kit.',
        soulGuardrails: soulShort,
        keyTerms: termShort
      }
    };
  }

  function buildSingleSpecializedSpec(aspectId, ctx) {
    switch (aspectId) {
      case 'session-passdown':
        return buildSessionPassdownSpec(ctx);
      case 'floorplan-waves':
        return buildFloorplanWavesSpec(ctx);
      case 'lexicon-soul':
        return buildLexiconSoulSpec(ctx);
      case 'swarm-handoff':
        return buildSwarmHandoffSpec(ctx);
      case 'offline-portability':
        return buildOfflinePortabilitySpec(ctx);
      case 'compact-prompt':
        return buildCompactPromptSpec(ctx);
      default:
        return buildSessionPassdownSpec(ctx);
    }
  }

  function buildMasterBundleSpec(ctx) {
    var aspectMap = {};
    var mdSections = [
      '# Master Multi-Aspect Rehydration Bundle (Aether WebOS v2.1)',
      '- Schema: ' + SCHEMA_VERSION,
      '- Kit: ' + ctx.docTitle + ' (' + ctx.kitId + ')',
      '- Milestone: Day ' + ctx.day + ' of 30 (Week ' + ctx.week + ' · ' + ctx.phase + ' · ' + ctx.dayTitle + ')',
      '- Surface: ' + ctx.surface + ' · Source SHA-256(16): ' + ctx.sourceDigest16,
      '- Included Aspects (6): ' + SPECIALIZED_IDS.join(', ')
    ];

    SPECIALIZED_IDS.forEach(function (id, idx) {
      var desc = getAspect(id);
      var built = buildSingleSpecializedSpec(id, ctx);
      var mdDigest = computeCapsuleDigestSync(built.markdown);
      aspectMap[id] = {
        id: id,
        label: desc.label,
        tokenBudget: desc.tokenBudget,
        estimatedTokens: estimateTokens(built.markdown),
        digest16: mdDigest.slice(0, 16),
        payload: built.payload,
        markdown: built.markdown
      };
      mdSections.push(
        '',
        '## [' + (idx + 1) + '/6] ' + desc.label + ' (' + id + ')',
        built.body
      );
    });

    mdSections.push('', footerLine(ctx));
    var fullMd = sanitizePortableText(mdSections.join('\n'));

    return {
      body: fullMd,
      markdown: fullMd,
      payload: {
        includedAspects: SPECIALIZED_IDS.slice(),
        aspects: aspectMap
      }
    };
  }

  /* ------------------------------------------------ public build exports -- */
  function buildCapsuleMarkdown(aspectId, state, parsed, meta) {
    var normId = normalizeAspectId(aspectId);
    var ctx = normalizeContext(state, parsed, meta);
    if (normId === 'master-bundle') {
      return buildMasterBundleSpec(ctx).markdown;
    }
    return buildSingleSpecializedSpec(normId, ctx).markdown;
  }

  function buildCapsuleJson(aspectId, state, parsed, meta) {
    var normId = normalizeAspectId(aspectId);
    var desc = getAspect(normId);
    var ctx = normalizeContext(state, parsed, meta);
    var spec = normId === 'master-bundle'
      ? buildMasterBundleSpec(ctx)
      : buildSingleSpecializedSpec(normId, ctx);

    var capDigestHex = computeCapsuleDigestSync(spec.markdown);

    return {
      schema: SCHEMA_VERSION,
      schemaVersion: SCHEMA_VERSION,
      meta: {
        version: ctx.meta.version || '2.1.0',
        updatedAt: ctx.meta.updatedAt || DEFAULT_META.updatedAt,
        author: 'Eloquent (@mjeanhudson-dev)',
        kitName: ctx.meta.kitName || DEFAULT_META.kitName,
        ctaLabel: ctx.meta.ctaLabel || DEFAULT_META.ctaLabel,
        routingMode: ctx.meta.routingMode || DEFAULT_META.routingMode,
        compactionGate: ctx.meta.compactionGate || DEFAULT_META.compactionGate,
        pinnedToolsCount: Number(ctx.meta.pinnedToolsCount) || 15,
        equationsCount: Number(ctx.meta.equationsCount) || 19,
        zeroInstall: true
      },
      aspect: {
        id: desc.id,
        label: desc.label,
        shortLabel: desc.shortLabel,
        kind: desc.kind,
        tokenBudget: desc.tokenBudget,
        estimatedTokens: estimateTokens(spec.markdown),
        summary: desc.summary
      },
      workspace: {
        kitId: ctx.kitId,
        title: ctx.docTitle,
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
        sourceDigestHex: ctx.sourceDigestHex,
        sourceDigest16: ctx.sourceDigest16,
        capsuleDigestHex: capDigestHex,
        capsuleDigest16: capDigestHex.slice(0, 16)
      },
      payload: spec.payload,
      capsuleMarkdown: spec.markdown
    };
  }

  function serializeCapsuleJson(aspectId, state, parsed, meta) {
    var envelope = buildCapsuleJson(aspectId, state, parsed, meta);
    return sanitizePortableText(JSON.stringify(envelope, null, 2));
  }

  function buildAllCapsules(state, parsed, meta) {
    var ctx = normalizeContext(state, parsed, meta);
    var map = {};
    ASPECTS.forEach(function (desc) {
      var env = buildCapsuleJson(desc.id, state, parsed, ctx.meta);
      var jsonStr = sanitizePortableText(JSON.stringify(env, null, 2));
      var jsonDigestHex = computeCapsuleDigestSync(jsonStr);
      map[desc.id] = {
        id: desc.id,
        label: desc.label,
        shortLabel: desc.shortLabel,
        kind: desc.kind,
        tokenBudget: desc.tokenBudget,
        summary: desc.summary,
        markdown: env.capsuleMarkdown,
        markdownTokens: env.aspect.estimatedTokens,
        markdownBytes: computeByteLength(env.capsuleMarkdown),
        markdownDigestHex: env.integrity.capsuleDigestHex,
        markdownDigest16: env.integrity.capsuleDigest16,
        jsonObject: env,
        jsonText: jsonStr,
        jsonTokens: estimateTokens(jsonStr),
        jsonBytes: computeByteLength(jsonStr),
        jsonDigestHex: jsonDigestHex,
        jsonDigest16: jsonDigestHex.slice(0, 16)
      };
    });
    return map;
  }

  /* ------------------------------------- rehydration validation & parser -- */
  function unwrapCodeFence(str) {
    var trimmed = String(str || '').trim();
    var fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return fenceMatch ? fenceMatch[1].trim() : trimmed;
  }

  function buildMarkdownFromPassdownObject(obj, schemaTag) {
    var proj = (obj && obj.project) || {};
    var runtime = (obj && obj.runtime) || {};
    var receipts = (obj && obj.verification_receipts) || {};
    var invariants = Array.isArray(obj && obj.invariants) ? obj.invariants : [];
    var pending = Array.isArray(obj && obj.resumption_steps)
      ? obj.resumption_steps
      : (Array.isArray(obj && obj.pending_optional_items) ? obj.pending_optional_items : []);
    var digests = (obj && obj.file_digests && typeof obj.file_digests === 'object') ? obj.file_digests : {};
    var digestKeys = Object.keys(digests);

    var title = sanitizePortableText(proj.name || obj.title || 'Aether Pass-Down Project');
    var branch = sanitizePortableText(proj.branch || 'main');
    var gitHead = sanitizePortableText(proj.git_head ? String(proj.git_head).slice(0, 12) : 'working-tree');
    var studioUrl = sanitizePortableText(runtime.live_studio_url || 'offline-file-mode');

    var lines = [
      '# ' + title,
      '',
      'Rehydrated from ' + schemaTag + ' pass-down manifest (branch: ' + branch + ' · head: ' + gitHead + ' · runtime: ' + studioUrl + ').',
      '',
      '## Wave 0: Verified Baseline & Receipts'
    ];

    if (typeof receipts.tests_passed === 'number') {
      lines.push('- [x] Automated test suite verified (' + receipts.tests_passed + ' passed, ' + (Number(receipts.tests_failed) || 0) + ' failed) [Wave 0]');
    } else {
      lines.push('- [x] Pass-down baseline manifest validated [Wave 0]');
    }
    if (receipts.hygiene_gate) {
      lines.push('- [x] Hygiene gate: ' + sanitizePortableText(receipts.hygiene_gate) + ' [Wave 0]');
    }
    if (receipts.cli_inspect) {
      lines.push('- [x] Structural snapshot: ' + sanitizePortableText(receipts.cli_inspect) + ' [Wave 0]');
    }

    lines.push('', '## Wave 1: Resumption Steps');
    if (pending.length) {
      pending.slice(0, 8).forEach(function (item) {
        var text = typeof item === 'string' ? item : (item && (item.step || item.title || item.text)) || '';
        if (text) {
          lines.push('- [ ] ' + sanitizePortableText(text) + ' [Wave 1]');
        }
      });
    } else {
      lines.push('- [ ] Review active Floorplan branches and execute next sprint milestone [Wave 1]');
    }

    lines.push('', '## Wave 2: Parity & Offline Export');
    lines.push('- [ ] Verify SHA-256 parity across ' + (digestKeys.length || 'all') + ' tracked project files [Wave 2]');
    lines.push('- [ ] Export updated single-file offline WebOS HTML kit [Wave 2]');

    lines.push(
      '',
      '## Lexicon',
      '- **Source Schema**: ' + schemaTag,
      '- **Repository**: ' + sanitizePortableText(proj.github_url || proj.name || 'Local Workspace'),
      '- **Git Revision**: ' + gitHead,
      '- **Tracked Digests**: ' + digestKeys.length + ' SHA-256 verified file entries'
    );

    lines.push(
      '',
      '## Wiki',
      '### Verification Summary',
      sanitizePortableText(
        (receipts.tests_command ? ('Command `' + receipts.tests_command + '` passed. ') : '') +
        (digestKeys.length ? ('Tracked artifacts include ' + digestKeys.slice(0, 5).join(', ') + '.') : 'Ready for offline studio editing.')
      )
    );

    lines.push('', '## Soul');
    if (invariants.length) {
      invariants.slice(0, 6).forEach(function (inv) {
        lines.push('- Invariant: ' + sanitizePortableText(inv));
      });
    } else {
      lines.push('- Invariant: Preserve zero OS usernames, zero em dashes, and offline HTML portability.');
    }

    return sanitizePortableText(lines.join('\n'));
  }

  function parseCapsuleForRehydrate(rawInput) {
    if (rawInput == null || (typeof rawInput === 'string' && !rawInput.trim())) {
      return {
        ok: false,
        error: 'Paste a Capsule JSON payload or select a .json file before rehydrating.',
        normalized: null
      };
    }

    var obj = null;
    if (typeof rawInput === 'string') {
      var cleaned = unwrapCodeFence(rawInput);
      try {
        obj = JSON.parse(cleaned);
      } catch (err) {
        return {
          ok: false,
          error: 'Malformed JSON capsule: ' + sanitizePortableText(err && err.message ? err.message : 'syntax error'),
          normalized: null
        };
      }
    } else if (typeof rawInput === 'object' && !Array.isArray(rawInput)) {
      obj = rawInput;
    } else {
      return {
        ok: false,
        error: 'Capsule input must be a JSON object or JSON string.',
        normalized: null
      };
    }

    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return {
        ok: false,
        error: 'Capsule root must be a JSON object.',
        normalized: null
      };
    }

    var schema = String(obj.schema || obj.schemaVersion || '').trim();

    if (schema === SCHEMA_VERSION) {
      var ws = (obj.workspace && typeof obj.workspace === 'object') ? obj.workspace : {};
      var aspectRaw = (obj.aspect && obj.aspect.id) || obj.aspectId || (obj.capsule_aspects ? 'master-bundle' : DEFAULT_ASPECT_ID);
      var aspectId = normalizeAspectId(aspectRaw);
      var aspectDesc = getAspect(aspectId);

      var hasWorkspaceMd = typeof ws.markdown === 'string' && ws.markdown.trim().length > 0;
      var hasTopMd = typeof obj.markdown === 'string' && obj.markdown.trim().length > 0;
      var hasCapMd = typeof obj.capsuleMarkdown === 'string' && obj.capsuleMarkdown.trim().length > 0;
      var hasProjectEnvelope = Boolean(obj.project || obj.invariants || obj.capsule_aspects || obj.resumption_steps);

      if (!hasWorkspaceMd && !hasTopMd && !hasCapMd && !hasProjectEnvelope) {
        return {
          ok: false,
          error: 'Invalid ' + SCHEMA_VERSION + ' capsule: missing workspace.markdown or project state.',
          normalized: null
        };
      }

      var restoredMd = hasWorkspaceMd
        ? sanitizePortableText(ws.markdown)
        : (hasTopMd
            ? sanitizePortableText(obj.markdown)
            : (hasProjectEnvelope
                ? buildMarkdownFromPassdownObject(obj, SCHEMA_VERSION)
                : sanitizePortableText(obj.capsuleMarkdown)));

      var kitId = sanitizePortableText(ws.kitId || obj.kitId || (hasProjectEnvelope ? 'creator-30day-system' : 'household-clarity'));
      var title = sanitizePortableText(
        ws.title ||
        obj.title ||
        (obj.project && obj.project.name) ||
        aspectDesc.label
      );
      var day = clampDay(ws.day || obj.day || (hasProjectEnvelope ? 19 : 1));
      var surface = normalizeSurface(ws.surface || obj.surface || 'obsidian');

      return {
        ok: true,
        error: null,
        normalized: {
          schemaVersion: SCHEMA_VERSION,
          aspectId: aspectId,
          kitId: kitId,
          title: title,
          markdown: restoredMd,
          day: day,
          surface: surface,
          note: sanitizePortableText(
            'Rehydrated ' + aspectDesc.label + ' (' + SCHEMA_VERSION + ') for ' + title + ' · Day ' + day + ' (' + surface + ').'
          )
        }
      };
    }

    if (schema === LEGACY_SCHEMA_VERSION) {
      var hasLegacyContent = Boolean(
        (typeof obj.markdown === 'string' && obj.markdown.trim()) ||
        (obj.project && typeof obj.project === 'object') ||
        (Array.isArray(obj.invariants) && obj.invariants.length) ||
        (Array.isArray(obj.pending_optional_items) && obj.pending_optional_items.length)
      );
      if (!hasLegacyContent) {
        return {
          ok: false,
          error: 'Invalid ' + LEGACY_SCHEMA_VERSION + ' payload: missing project, invariants, or markdown fields.',
          normalized: null
        };
      }

      var legacyTitle = sanitizePortableText(
        (obj.project && obj.project.name) ||
        obj.title ||
        'Legacy Pass-Down Snapshot'
      );
      var legacyMd = (typeof obj.markdown === 'string' && obj.markdown.trim())
        ? sanitizePortableText(obj.markdown)
        : buildMarkdownFromPassdownObject(obj, LEGACY_SCHEMA_VERSION);
      var legacyDay = clampDay(obj.day || 19);
      var legacySurface = normalizeSurface(obj.surface || 'obsidian');
      var legacyKitId = sanitizePortableText(obj.kitId || 'creator-30day-system');
      var digestCount = (obj.file_digests && typeof obj.file_digests === 'object')
        ? Object.keys(obj.file_digests).length
        : 0;
      var invCount = Array.isArray(obj.invariants) ? obj.invariants.length : 0;

      return {
        ok: true,
        error: null,
        normalized: {
          schemaVersion: LEGACY_SCHEMA_VERSION,
          aspectId: 'session-passdown',
          kitId: legacyKitId,
          title: legacyTitle,
          markdown: legacyMd,
          day: legacyDay,
          surface: legacySurface,
          note: sanitizePortableText(
            'Rehydrated legacy pass-down (' + LEGACY_SCHEMA_VERSION + ') for ' + legacyTitle +
            ' (' + invCount + ' invariants · ' + digestCount + ' file digests).'
          )
        }
      };
    }

    return {
      ok: false,
      error: schema
        ? ('Unsupported capsule schema "' + sanitizePortableText(schema) + '". Expected ' + SCHEMA_VERSION + ' or ' + LEGACY_SCHEMA_VERSION + '.')
        : ('Missing "schema" field. Expected "' + SCHEMA_VERSION + '" or "' + LEGACY_SCHEMA_VERSION + '".'),
      normalized: null
    };
  }

  return {
    version: '2.1.0',
    SCHEMA_VERSION: SCHEMA_VERSION,
    LEGACY_SCHEMA_VERSION: LEGACY_SCHEMA_VERSION,
    DEFAULT_ASPECT_ID: DEFAULT_ASPECT_ID,
    ASPECTS: ASPECTS,
    getAspect: getAspect,
    normalizeAspectId: normalizeAspectId,
    stripEmDashes: stripEmDashes,
    computeByteLength: computeByteLength,
    estimateTokens: estimateTokens,
    computeCapsuleDigest: computeCapsuleDigest,
    computeCapsuleDigestSync: computeCapsuleDigestSync,
    buildCapsuleMarkdown: buildCapsuleMarkdown,
    buildCapsuleJson: buildCapsuleJson,
    serializeCapsuleJson: serializeCapsuleJson,
    buildAllCapsules: buildAllCapsules,
    parseCapsuleForRehydrate: parseCapsuleForRehydrate
  };
}));
