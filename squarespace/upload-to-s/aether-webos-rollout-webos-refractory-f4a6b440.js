/* ==========================================================================
   Aether WebOS Refractory Studio (Zero External Dependencies, UMD)
   Author: Eloquent (@mjeanhudson-dev)
   Contract:
     - Mounts into #aether-webos-mount (auto-mounts on DOMContentLoaded +
       idempotent window.AetherRefractory.mount('#aether-webos-mount')).
     - Uses window.AetherCapsules (webos/capsules.js) for 6-aspect + Master
       Bundle Rehydration Capsules & JSON v2/v1 restore (graceful fallback if
       omitted).
     - Requires window.AetherExporter (webos/exporter.js) for offline .html export
       (gracefully degrades to JSON/Markdown helper if omitted).
     - Exposes window.AetherRefractory:
       { mount, selectDay, selectKit, selectTab, setSurface, exportKit,
         exportHtml, copyShareNote, reloadContext, importContextJson,
         getCapsule, rehydrateCapsule, selectCapsuleAspect,
         selectCapsuleFormat, getState, version }
     - Listens & dispatches CustomEvent('aether:day-select', { detail: {
         day, week, phase, title, prompt, deliverable, kitId } }).
   ========================================================================== */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    var exporter = null;
    try { exporter = require('./exporter.js'); } catch (e) {}
    var capsules = null;
    try { capsules = require('./capsules.js'); } catch (e) {}
    module.exports = factory(exporter, capsules);
  } else {
    root.AetherRefractory = factory(root.AetherExporter || null, root.AetherCapsules || null);
  }
}(typeof globalThis !== 'undefined' ? globalThis : window, function (ExporterDep, CapsulesDep) {
  'use strict';

  var DEFAULT_META = {
    version: '2.1.0',
    updatedAt: '2026-11-24T13:30:00Z',
    author: 'Eloquent (@mjeanhudson-dev)',
    kitName: 'Aether WebOS Kit',
    ctaLabel: 'Start Day 1: Free',
    capsuleSchemaVersion: 'aether.rehydration.capsule.v2',
    routingMode: 'Stage-0 -> Stage-Apex (FLASH_SHUNT_ENGAGED)',
    compactionGate: '25:1 Exodia',
    pinnedToolsCount: 15,
    equationsCount: 19,
    zeroInstall: true
  };

  var DEFAULT_KITS = [
    {
      id: 'household-clarity',
      title: 'Household & Cashflow Clarity',
      audience: 'Families, renters, caretakers, and solo earners organizing bills, errands, and weekly savings without paid software.',
      outcome: 'Turns scattered notes and calendar reminders into one calm offline floorplan with bill anchors, meal prep rhythm, and a rainy-day buffer.',
      markdown: '# Household & Cashflow Clarity\n\nPlain-English operating map for keeping home bills, groceries, and weekly family commitments calm on any basic laptop or phone.\n\n## Wave 0: Baseline Snapshot\n- [ ] List every fixed monthly bill with due date and autopay status [Wave 0]\n- [ ] Write down actual take-home pay after taxes and deductions [Wave 0] (depends: List every fixed monthly bill)\n- [ ] Mark one quiet 20-minute Sunday check-in slot on the fridge calendar [Wave 0]\n\n## Wave 1: Weekly Rhythm & Groceries\n- [ ] Group recurring errands into two neighborhood loops per week [Wave 1] (depends: Mark one quiet 20-minute Sunday check-in slot)\n- [ ] Build a 10-meal rotating pantry list using ingredients already on hand [Wave 1] (depends: Write down actual take-home pay)\n- [ ] Flag two sneaky subscriptions to pause or cancel this month [Wave 1] (depends: List every fixed monthly bill)\n\n## Wave 2: Rainy-Day Buffer & Shared Handoff\n- [ ] Move first $25 per paycheck into a separate no-card buffer jar or account [Wave 2] (depends: Flag two sneaky subscriptions)\n- [ ] Export this floorplan as a single HTML file saved onto a shared family folder [Wave 2] (depends: Group recurring errands)\n\n## Lexicon\n- **Paycheck Anchor**: The exact amount left for food, fuel, and flexibility after fixed rent and utilities clear.\n- **Zero-Spend Day**: A planned weekday with no card swipes, cooked from pantry staples.\n- **Sunday Reset**: A 20-minute weekly glance at upcoming due dates and fridge inventory.\n- **Buffer Floor**: One month of core rent and groceries kept separate from daily spending.\n\n## Wiki\n### Bill Calendar Rule\nSplit fixed bills into First-Half (days 1 to 14) and Second-Half (days 15 to 31) buckets so no single paycheck absorbs every utility at once.\n### Fridge Inventory Habit\nBefore shopping, list three items that spoil fastest and pick two dinners built around them first.\n\n## Soul\n- Invariant: Plain numbers beat complex spreadsheets that nobody opens after week two.\n- Invariant: Money plans exist to buy quiet evenings, not to create guilt over small coffees.\n- Invariant: Everything stays readable offline without logins, bank links, or monthly fees.'
    },
    {
      id: 'local-service-launch',
      title: 'Local Service & Workshop Launch',
      audience: 'Mobile mechanics, cleaners, tutors, handypeople, neighborhood bakers, and local repair pros launching on zero ad spend.',
      outcome: 'Converts practical trade know-how into a one-page booking intake, honest quote script, and repeatable weekend job floorplan.',
      markdown: '# Local Service & Workshop Launch\n\nZero-budget operating kit for an everyday craftsperson or neighborhood service pro starting with referrals and a phone.\n\n## Wave 0: Clear Offer & Boundaries\n- [ ] Define one signature 90-minute job you can finish reliably every time [Wave 0]\n- [ ] Set a transparent flat rate plus parts rule in plain English [Wave 0] (depends: Define one signature 90-minute job)\n- [ ] List your exact service radius in driving minutes rather than vague zones [Wave 0]\n\n## Wave 1: Customer Intake & Field Checklist\n- [ ] Write a 4-question text intake script for photo, address, urgency, and access [Wave 1] (depends: Set a transparent flat rate)\n- [ ] Pack a pre-departure tool checklist so no repeat hardware-store trips steal profit [Wave 1] (depends: Define one signature 90-minute job)\n- [ ] Prepare a 3-sentence arrival and wrap-up message for neighbors [Wave 1] (depends: Write a 4-question text intake script)\n\n## Wave 2: Referrals & Offline Proof\n- [ ] Ask every delighted neighbor for one photo permission and one neighborhood intro [Wave 2] (depends: Prepare a 3-sentence arrival and wrap-up message)\n- [ ] Export your portable quote and job tracker HTML onto your phone home screen [Wave 2] (depends: Pack a pre-departure tool checklist)\n\n## Lexicon\n- **Scope Lock**: Agreeing in writing on what is included and what triggers a fresh quote before tools leave the truck.\n- **Drive Radius Cap**: Maximum minutes from home base so fuel and traffic never erase hourly margin.\n- **Wrap Receipt**: A short plain-text summary sent after completion with before/after care tips.\n- **Neighbor Card**: One offline referral note shared person-to-person instead of paying ad networks.\n\n## Wiki\n### Why Flat-Rate Diagnostics Win Trust\nHomeowners fear open-ended hourly clocks. Naming a fixed inspection fee that credits toward the repair earns immediate calm.\n### Repeat Maintenance Reminders\nLog seasonal follow-ups (filters, gutters, tune-ups) at 6 months so existing customers keep your calendar full.\n\n## Soul\n- Invariant: Show up on time, leave the workspace cleaner than found, and explain options without jargon.\n- Invariant: Zero paid ads until 10 local customers refer a neighbor organically.\n- Invariant: Keep customer names and schedules under your own control, never locked inside a platform.'
    },
    {
      id: 'creator-30day-system',
      title: '30-Day Creator & Newsletter System',
      audience: 'First-time writers, teachers, makers, and independent builders sharing honest notes without chasing algorithms.',
      outcome: 'Builds a repeatable weekly writing habit with a living topic map, personal voice anchor, and zero-loss 25-turn AI handoff capsule.',
      markdown: '# 30-Day Creator & Newsletter System\n\nLightweight publishing floorplan for ordinary makers who want to write useful essays, guides, or dispatches in under 4 hours a week.\n\n## Wave 0: Voice Anchor & Reader Promise\n- [ ] Name the exact kind of neighbor or beginner you are writing to [Wave 0]\n- [ ] Capture 5 real questions friends asked you in the last 30 days [Wave 0] (depends: Name the exact kind of neighbor)\n- [ ] Write 3 tone rules describing how you talk in real life [Wave 0]\n\n## Wave 1: Idea Map & Drafting Loop\n- [ ] Turn one real question into a 3-step plain-English outline [Wave 1] (depends: Capture 5 real questions)\n- [ ] Collect one real example, number, or photo from your own bench or notebook [Wave 1] (depends: Turn one real question into a 3-step plain-English outline)\n- [ ] Draft messy first pass in 25 uninterrupted minutes before editing a word [Wave 1] (depends: Write 3 tone rules)\n\n## Wave 2: Package, Ship & Rehydrate\n- [ ] Strip buzzwords and verify zero inflated claims or filler intros [Wave 2] (depends: Draft messy first pass)\n- [ ] Generate a 25-Turn Pass-Down capsule so next week\'s AI assistant remembers your voice [Wave 2] (depends: Strip buzzwords)\n\n## Lexicon\n- **Bench Note**: A short firsthand observation from doing real work rather than summarizing someone else\'s thread.\n- **Voice Guardrail**: Three concrete words you use and three cliches you ban from every draft.\n- **Pass-Down Capsule**: A compact plain-text digest preserving decisions and open threads before context fills up.\n- **One-Click Keep**: Exporting your finished guide as a portable HTML kit readers can save offline.\n\n## Wiki\n### The 3-Beat Dispatch Structure\nStart with a concrete friction you actually ran into, walk through the small fix step by step, and end with one printable action.\n### Context Hygiene Across Sessions\nNever paste 40 pages of old chat logs into a fresh AI session. Paste only your Soul rules, Lexicon, and current active outline.\n\n## Soul\n- Invariant: Write like a helpful neighbor across a kitchen table, never like a corporate press release.\n- Invariant: Teach one real thing you tested yourself instead of repackaging hype.\n- Invariant: Own your subscriber list and notes as plain files on your own drive.'
    },
    {
      id: 'community-teaching-hub',
      title: 'Community & Teaching Hub',
      audience: 'Study group hosts, library volunteers, parent organizers, and local workshop mentors teaching practical skills offline.',
      outcome: 'Packages a 4-week peer curriculum, shared beginner glossary, and hands-on lab board that runs off a USB stick or single browser tab.',
      markdown: '# Community & Teaching Hub\n\nZero-install peer workshop blueprint so small local groups can learn together on donated Chromebooks, older laptops, or library Wi-Fi.\n\n## Wave 0: Room Setup & Shared Vocabulary\n- [ ] Define the plain-English starter glossary with zero unexplained acronyms [Wave 0]\n- [ ] Pick one 45-minute hands-on project every attendee can finish in session one [Wave 0] (depends: Define the plain-English starter glossary)\n- [ ] Test offline file sharing via USB drive or local HTML file before class [Wave 0]\n\n## Wave 1: Peer Stations & Live Floorplan\n- [ ] Pair beginners with returning helpers using 2-person buddy checklists [Wave 1] (depends: Pick one 45-minute hands-on project)\n- [ ] Run a 15-minute live walkthrough converting a paper note into a visual mind-map [Wave 1] (depends: Test offline file sharing)\n- [ ] Collect honest stuck-points in a shared friction log at the end of class [Wave 1] (depends: Pair beginners with returning helpers)\n\n## Wave 2: Graduation & Viral Kit Pass-On\n- [ ] Have every participant export their personal kit HTML to bring home [Wave 2] (depends: Run a 15-minute live walkthrough)\n- [ ] Invite graduates to co-host Day 1 next month for two new neighbors [Wave 2] (depends: Have every participant export their personal kit HTML)\n\n## Lexicon\n- **USB-Ready**: Any guide or tool that opens directly in a browser without accounts, cloud billing, or npm installs.\n- **Friction Log**: A list of exact moments beginners hesitated so week two gets clearer.\n- **Buddy Checklist**: Two learners verifying each milestone together before moving on.\n- **Pass-On Kit**: An exported offline studio file containing the attribution badge to invite the next cohort.\n\n## Wiki\n### Why Offline-First Matters in Local Workshops\nPublic rooms drop Wi-Fi right when 12 people click download. Single-file HTML kits keep the workshop flowing even in airplane mode.\n### Measuring Real Learning\nSkip attendance vanity metrics. Count how many attendees walk out holding a working plan they actually understand.\n\n## Soul\n- Invariant: Nobody gets left behind because they cannot afford a subscription or a newer laptop.\n- Invariant: Curiosity thrives when learners can inspect, edit, and break their own notes safely.\n- Invariant: Every free learner becomes a capable teacher for their own household or block.'
    }
  ];

  var DEFAULT_WEEKS = [
    { week: 1, phase: 'Voice & Personal Lexicon', title: 'Name Your World in Plain Words', daysRange: 'Days 1 to 7', kitId: 'household-clarity' },
    { week: 2, phase: 'Visual Mind-Maps & Floorplans', title: 'Turn Messy Notes Into Spatial Maps', daysRange: 'Days 8 to 15', kitId: 'local-service-launch' },
    { week: 3, phase: 'Zero-Code Agentic Sprints', title: 'Run Repeat Work Without Losing Context', daysRange: 'Days 16 to 23', kitId: 'creator-30day-system' },
    { week: 4, phase: 'Ship & Share Offline Kit', title: 'Own Your System and Pass It On', daysRange: 'Days 24 to 30', kitId: 'community-teaching-hub' }
  ];

  var DEFAULT_DAYS = [
    { day: 1, week: 1, phase: 'Voice & Personal Lexicon', title: 'Empty the Kitchen-Table Brain Dump', prompt: 'Write 10 messy bullet points about the one weekly headache eating your peace right now. Do not polish grammar yet; just name bills, tasks, or unfinished promises.', deliverable: 'Raw 10-line plain-English note loaded inside the Refractory editor.', kitId: 'household-clarity' },
    { day: 2, week: 1, phase: 'Voice & Personal Lexicon', title: 'Write Three Soul Rules You Refuse to Break', prompt: 'List 3 plain rules for how your time and money must be treated (for example: no complex spreadsheets, protect Sunday evenings, zero hidden fees).', deliverable: '3 Soul invariants pinned under ## Soul.', kitId: 'household-clarity' },
    { day: 3, week: 1, phase: 'Voice & Personal Lexicon', title: 'Build Your First Five-Word Lexicon', prompt: 'Pick 5 words you and your household actually say and give each a crisp 1-sentence meaning under ## Lexicon so any assistant uses your real words.', deliverable: '5 defined plain-English terms visible in the Lexicon tab.', kitId: 'household-clarity' },
    { day: 4, week: 1, phase: 'Voice & Personal Lexicon', title: 'Separate Facts From Guesses', prompt: 'Tag every line in your Day 1 note as either a hard fact (a due date, rate, or address) or an open guess you still need to check.', deliverable: 'Verified Wave 0 facts list with guesses quarantined.', kitId: 'household-clarity' },
    { day: 5, week: 1, phase: 'Voice & Personal Lexicon', title: 'Ban Five Hollow Phrases From Your Voice', prompt: 'Write down 5 corporate or robotic phrases you never say out loud so you can strip them whenever drafting emails, quotes, or guides.', deliverable: 'Voice filter block saved in ## Soul.', kitId: 'creator-30day-system' },
    { day: 6, week: 1, phase: 'Voice & Personal Lexicon', title: 'Create One Pocket Wiki Entry', prompt: 'Write a 4-line how-to note under ## Wiki explaining one recurring chore or fix the way you would teach a younger cousin.', deliverable: 'First structured Wiki entry tested in Dual-View Reader.', kitId: 'household-clarity' },
    { day: 7, week: 1, phase: 'Voice & Personal Lexicon', title: 'Week 1 Review & Clean SHA-256 Snapshot', prompt: 'Open the 25-Turn Capsule tab, verify your first SHA-256 fingerprint, and save a clean Week 1 offline backup HTML file.', deliverable: 'Signed Week 1 offline HTML kit stored locally.', kitId: 'household-clarity' },
    { day: 8, week: 2, phase: 'Visual Mind-Maps & Floorplans', title: 'Split Today From Next Week (Wave 0 vs Wave 1)', prompt: 'Reorganize your headings into ## Wave 0 (must happen first) and ## Wave 1 (only starts after Wave 0 clears) and watch the Mind-Map draw two clear tiers.', deliverable: 'Two-wave Floorplan tree with zero tangled priorities.', kitId: 'local-service-launch' },
    { day: 9, week: 2, phase: 'Visual Mind-Maps & Floorplans', title: 'Wire Explicit Task Dependencies', prompt: 'Add (depends: ...) tags to 4 tasks that truly wait on another step, then click nodes in the SVG Mind-Map to trace what unlocks what.', deliverable: 'Connected dependency edges in Floorplan view.', kitId: 'local-service-launch' },
    { day: 10, week: 2, phase: 'Visual Mind-Maps & Floorplans', title: 'Turn a Scattered Offer Into a One-Page Scope', prompt: 'Load the Local Service & Workshop Launch kit and rewrite the Wave 0 offer lines to fit one actual service or skill you could offer neighbors.', deliverable: 'Clear 90-minute scope and transparent rate block.', kitId: 'local-service-launch' },
    { day: 11, week: 2, phase: 'Visual Mind-Maps & Floorplans', title: 'Build a Four-Question Customer or Family Intake', prompt: 'Draft 4 short intake questions anyone can answer by text message in 60 seconds without downloading an app.', deliverable: 'Copy-ready 4-question text intake under ## Wiki.', kitId: 'local-service-launch' },
    { day: 12, week: 2, phase: 'Visual Mind-Maps & Floorplans', title: 'Design Your Wave 2 Finish Line', prompt: 'Add a ## Wave 2 section naming what "done for the week" looks like so work stops expanding endlessly.', deliverable: 'Three-wave Floorplan (Wave 0, Wave 1, Wave 2) rendered cleanly.', kitId: 'local-service-launch' },
    { day: 13, week: 2, phase: 'Visual Mind-Maps & Floorplans', title: 'Audit Dual-View Readability at Arm\'s Length', prompt: 'Switch to Dual-View Reader and trim any sentence longer than 22 words until every step reads clearly on a phone screen.', deliverable: 'Trimmed Dual-View editorial guide under 3-minute reading time.', kitId: 'local-service-launch' },
    { day: 14, week: 2, phase: 'Visual Mind-Maps & Floorplans', title: 'Map Hidden Failure Modes Into Checklists', prompt: 'Think of the last time a job or errand ran late, and turn the root cause into a single - [ ] pre-check item.', deliverable: 'Pre-departure failure-prevention checklist.', kitId: 'local-service-launch' },
    { day: 15, week: 2, phase: 'Visual Mind-Maps & Floorplans', title: 'Week 2 Floorplan Lock & Visual Export', prompt: 'Inspect every node in your SVG Floorplan, verify dependencies make sense at a glance, and save your Week 2 HTML snapshot.', deliverable: 'Verified Week 2 Floorplan HTML archive.', kitId: 'local-service-launch' },
    { day: 16, week: 3, phase: 'Zero-Code Agentic Sprints', title: 'Build Your First 25-Turn Pass-Down Capsule', prompt: 'Generate a compact Rehydration Capsule in Tab 4 and see how a 300-word brief carries your entire project into a fresh chat window.', deliverable: 'Compact Pass-Down Markdown brief with SHA-256 receipt.', kitId: 'creator-30day-system' },
    { day: 17, week: 3, phase: 'Zero-Code Agentic Sprints', title: 'Separate Durable Rules From Disposable Chatter', prompt: 'Move any permanent rule out of your daily scratchpad and into ## Soul or ## Lexicon so transient tasks never bloat your core prompt.', deliverable: 'Lean LOD-1 Soul + Lexicon layer under 400 words.', kitId: 'creator-30day-system' },
    { day: 18, week: 3, phase: 'Zero-Code Agentic Sprints', title: 'Run a 25-Minute Sprint Without Editing Mid-Flow', prompt: 'Pick one Wave 1 task from the Creator System kit and execute it straight through in 25 minutes using only your Pass-Down Capsule.', deliverable: 'One complete unpolished first draft or task outcome.', kitId: 'creator-30day-system' },
    { day: 19, week: 3, phase: 'Zero-Code Agentic Sprints', title: 'Test Hot-Swapping a Terminal Context Manifest', prompt: 'Inspect or edit a local synthesis JSON snapshot and use Reload Terminal Context / Import JSON to swap curated prompts without touching code.', deliverable: 'Verified JSON hot-swap roundtrip inside Refractory Tab 4.', kitId: 'creator-30day-system' },
    { day: 20, week: 3, phase: 'Zero-Code Agentic Sprints', title: 'Convert Repetition Into One Reusable Prompt Card', prompt: 'Identify one task you repeated 3 times this month and save its exact inputs, output shape, and voice constraints under ## Wiki.', deliverable: 'Zero-code repeatable workflow card in Wiki.', kitId: 'creator-30day-system' },
    { day: 21, week: 3, phase: 'Zero-Code Agentic Sprints', title: 'Verify Every Claim Against Real Observation', prompt: 'Review your draft or service guide and strike every unverified stat, replacing hype with one real example or honest boundary.', deliverable: 'Truth-checked draft with zero fabricated claims.', kitId: 'creator-30day-system' },
    { day: 22, week: 3, phase: 'Zero-Code Agentic Sprints', title: 'Practice Mid-Project Handoff Across Tools', prompt: 'Copy your 25-Turn Pass-Down Capsule into a completely blank notebook or fresh AI tab and confirm it resumes at the exact next task.', deliverable: 'Zero-drift cold-start handoff verification.', kitId: 'creator-30day-system' },
    { day: 23, week: 3, phase: 'Zero-Code Agentic Sprints', title: 'Week 3 Compaction Gate & Digest Audit', prompt: 'Prune finished Wave 0 and Wave 1 clutter into concise archived lessons, keeping only active Wave 2 tasks and core Soul rules.', deliverable: 'Compacted Sprint Markdown with updated SHA-256 stamp.', kitId: 'creator-30day-system' },
    { day: 24, week: 4, phase: 'Ship & Share Offline Kit', title: 'Package a Beginner-Safe Teaching Version', prompt: 'Load Community & Teaching Hub and simplify your own guide so a neighbor with zero technical background can follow Wave 0 in 10 minutes.', deliverable: 'Beginner-tested plain-English starter floorplan.', kitId: 'community-teaching-hub' },
    { day: 25, week: 4, phase: 'Ship & Share Offline Kit', title: 'Run the Airplane-Mode Independence Test', prompt: 'Click Export My Kit (.html), turn off Wi-Fi or open the saved file directly from disk, and verify every heading, map node, and checklist still works.', deliverable: 'Verified offline single-file HTML WebOS bundle.', kitId: 'community-teaching-hub' },
    { day: 26, week: 4, phase: 'Ship & Share Offline Kit', title: 'Write Your Honest One-Sentence Share Note', prompt: 'Use Copy Share Note to craft a 2-sentence explanation telling one friend what your personal kit actually solved this month.', deliverable: 'Authentic peer-to-peer share note ready for text or chat.', kitId: 'community-teaching-hub' },
    { day: 27, week: 4, phase: 'Ship & Share Offline Kit', title: 'Host a 20-Minute Kitchen-Table Walkthrough', prompt: 'Walk one friend, partner, or coworker through your live Floorplan and record the single spot where they asked a clarifying question.', deliverable: 'Real-user friction note patched directly in ## Lexicon.', kitId: 'community-teaching-hub' },
    { day: 28, week: 4, phase: 'Ship & Share Offline Kit', title: 'Create a Monthly Refresh Ritual', prompt: 'Schedule one 30-minute end-of-month calendar block to export a fresh archive and roll open Wave 2 tasks into next month\'s Wave 0.', deliverable: 'Sustainable monthly maintenance anchor.', kitId: 'community-teaching-hub' },
    { day: 29, week: 4, phase: 'Ship & Share Offline Kit', title: 'Bundle Your Final 30-Day Capstone Kit', prompt: 'Combine your sharpest Soul rules, active Floorplan, Lexicon, and best Wiki notes into one clean master snapshot.', deliverable: 'Final Capstone WebOS HTML kit with verified digest.', kitId: 'community-teaching-hub' },
    { day: 30, week: 4, phase: 'Ship & Share Offline Kit', title: 'Ship It Forward: Pass the Offline Kit', prompt: 'Send your exported HTML kit or Start Day 1: Free link to one person who feels buried in tabs and watch them map their first note in 5 minutes.', deliverable: 'Completed 30-Day Kit shipped and passed on at zero cost.', kitId: 'community-teaching-hub' }
  ];

  var TABS = [
    { id: 'mindmap', label: 'Mind-Map Floorplan' },
    { id: 'dualview', label: 'Dual-View Reader' },
    { id: 'lexicon', label: 'Lexicon · Wiki · Soul' },
    { id: 'capsule', label: 'Rehydration Capsules' }
  ];

  /* ----------------------------------------------------------- utilities -- */
  function stripEmDashes(value) {
    return String(value == null ? '' : value)
      .replace(new RegExp('&' + 'mdash;', 'gi'), ', ')
      .replace(/\s*\u2014\s*/g, ', ');
  }

  function clampDay(day) {
    var n = parseInt(day, 10);
    if (isNaN(n) || n < 1) return 1;
    if (n > 30) return 30;
    return n;
  }

  function truncateLabel(text, maxLen) {
    var clean = String(text || '').trim();
    if (clean.length <= maxLen) return clean;
    return clean.slice(0, Math.max(4, maxLen - 3)).trim() + '...';
  }

  function slugId(text) {
    var s = String(text || 'sec').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    return s || 'sec';
  }

  function cloneJson(val) {
    return JSON.parse(JSON.stringify(val));
  }

  function yieldToMain() {
    if (typeof globalThis !== 'undefined' && globalThis.scheduler && typeof globalThis.scheduler.yield === 'function') {
      return globalThis.scheduler.yield();
    }
    return new Promise(function (resolve) {
      setTimeout(resolve, 0);
    });
  }

  /* --------------------------------------------------- pure-JS SHA-256 -- */
  function sha256FallbackHex(input) {
    var utf8 = unescape(encodeURIComponent(String(input || '')));
    var bytes = [];
    for (var i = 0; i < utf8.length; i++) bytes.push(utf8.charCodeAt(i));

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

  function computeSha256Hex(text) {
    var str = String(text || '');
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle && typeof TextEncoder !== 'undefined') {
      try {
        var data = new TextEncoder().encode(str);
        return globalThis.crypto.subtle.digest('SHA-256', data).then(function (buf) {
          var arr = Array.from(new Uint8Array(buf));
          return arr.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        }).catch(function () {
          return sha256FallbackHex(str);
        });
      } catch (e) {
        return Promise.resolve(sha256FallbackHex(str));
      }
    }
    return Promise.resolve(sha256FallbackHex(str));
  }

  /* ---------------------------------------------- manifest normalization -- */
  function normalizeManifest(raw) {
    var meta = Object.assign({}, DEFAULT_META, (raw && raw.meta) || {});
    Object.keys(meta).forEach(function (k) {
      if (typeof meta[k] === 'string') meta[k] = stripEmDashes(meta[k]);
    });

    var rawKits = (raw && Array.isArray(raw.kits) && raw.kits.length) ? raw.kits : DEFAULT_KITS;
    var kits = rawKits.map(function (k, idx) {
      var fallback = DEFAULT_KITS[idx % DEFAULT_KITS.length];
      return {
        id: stripEmDashes(k.id || fallback.id),
        title: stripEmDashes(k.title || fallback.title),
        audience: stripEmDashes(k.audience || fallback.audience),
        outcome: stripEmDashes(k.outcome || fallback.outcome),
        markdown: stripEmDashes(k.markdown || fallback.markdown)
      };
    });

    var mObj = (raw && raw.mentorship) || {};
    var rawWeeks = Array.isArray(mObj.weeks) && mObj.weeks.length ? mObj.weeks : DEFAULT_WEEKS;
    var weeks = rawWeeks.map(function (w, idx) {
      var fw = DEFAULT_WEEKS[idx % DEFAULT_WEEKS.length];
      return {
        week: Number(w.week) || (idx + 1),
        phase: stripEmDashes(w.phase || fw.phase),
        title: stripEmDashes(w.title || fw.title),
        daysRange: stripEmDashes(w.daysRange || fw.daysRange),
        kitId: stripEmDashes(w.kitId || fw.kitId)
      };
    });

    var rawDays = Array.isArray(mObj) ? mObj : (Array.isArray(mObj.days) ? mObj.days : []);
    var byDayNum = {};
    rawDays.forEach(function (d) {
      var n = clampDay(d && d.day);
      byDayNum[n] = d;
    });

    var days = DEFAULT_DAYS.map(function (fd) {
      var d = byDayNum[fd.day] || fd;
      var weekNum = Number(d.week) || fd.week;
      return {
        day: fd.day,
        week: weekNum,
        phase: stripEmDashes(d.phase || fd.phase),
        title: stripEmDashes(d.title || fd.title),
        prompt: stripEmDashes(d.prompt || fd.prompt),
        deliverable: stripEmDashes(d.deliverable || fd.deliverable),
        kitId: stripEmDashes(d.kitId || fd.kitId)
      };
    });

    return {
      meta: meta,
      kits: kits,
      weeks: weeks,
      days: days
    };
  }

  /* --------------------------------------------- plain-English + MD parser -- */
  function detectWaveTag(text, fallbackWave) {
    var m = String(text || '').match(/\[wave\s*([0-2])\]/i);
    if (m) return Number(m[1]);
    var h = String(text || '').match(/\bwave\s*([0-2])\b/i);
    if (h) return Number(h[1]);
    return typeof fallbackWave === 'number' ? fallbackWave : 1;
  }

  function extractDependsTag(text) {
    var m = String(text || '').match(/\(depends:\s*([^)]+)\)/i);
    return m ? m[1].trim() : '';
  }

  function cleanItemDisplay(text) {
    return String(text || '')
      .replace(/\[wave\s*[0-2]\]/gi, '')
      .replace(/\(depends:\s*[^)]+\)/gi, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  }

  function parseNote(rawMarkdown, fallbackTitle) {
    var text = stripEmDashes(rawMarkdown || '');
    var lines = text.split(/\r?\n/);
    var docTitle = '';
    var introLines = [];
    var sections = [];
    var currentSection = null;
    var currentSubtopic = null;

    function ensureDefaultSection(titleText) {
      if (!currentSection) {
        currentSection = {
          id: slugId(titleText || 'core-notes'),
          title: titleText || 'Core Notes',
          wave: 1,
          paragraphs: [],
          items: [],
          subtopics: []
        };
        sections.push(currentSection);
      }
      return currentSection;
    }

    for (var i = 0; i < lines.length; i++) {
      var rawLine = lines[i];
      var trimmed = rawLine.trim();
      if (!trimmed) {
        currentSubtopic = null;
        continue;
      }

      var h1 = trimmed.match(/^#\s+(.+)$/);
      if (h1 && !docTitle) {
        docTitle = h1[1].trim();
        continue;
      }

      var h2 = trimmed.match(/^##\s+(.+)$/);
      if (h2) {
        currentSubtopic = null;
        var secTitle = h2[1].trim();
        var secWave = detectWaveTag(secTitle, /soul|lexicon/i.test(secTitle) ? 0 : (/wiki/i.test(secTitle) ? 2 : 1));
        currentSection = {
          id: slugId(secTitle) + '-' + (sections.length + 1),
          title: secTitle,
          wave: secWave,
          paragraphs: [],
          items: [],
          subtopics: []
        };
        sections.push(currentSection);
        continue;
      }

      var h3 = trimmed.match(/^###\s+(.+)$/);
      if (h3) {
        var sec = ensureDefaultSection('Topics');
        currentSubtopic = { title: h3[1].trim(), lines: [] };
        sec.subtopics.push(currentSubtopic);
        continue;
      }

      var checkMatch = trimmed.match(/^[-*]\s+\[([ xX])\]\s+(.+)$/);
      if (checkMatch) {
        var targetSec = ensureDefaultSection('Action Floorplan');
        var dep = extractDependsTag(checkMatch[2]);
        var wave = detectWaveTag(checkMatch[2], targetSec.wave);
        var cleanText = cleanItemDisplay(checkMatch[2]);
        targetSec.items.push({
          text: cleanText,
          raw: checkMatch[2],
          isTask: true,
          done: checkMatch[1].toLowerCase() === 'x',
          lineIndex: i,
          wave: wave,
          dependsOn: dep
        });
        continue;
      }

      var bulletMatch = trimmed.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
      if (bulletMatch) {
        var bSec = ensureDefaultSection('Key Points');
        var bDep = extractDependsTag(bulletMatch[1]);
        var bWave = detectWaveTag(bulletMatch[1], bSec.wave);
        bSec.items.push({
          text: cleanItemDisplay(bulletMatch[1]),
          raw: bulletMatch[1],
          isTask: false,
          done: false,
          lineIndex: i,
          wave: bWave,
          dependsOn: bDep
        });
        continue;
      }

      if (!currentSection) {
        if (!docTitle && trimmed.length <= 72 && !/[.!?]$/.test(trimmed)) {
          docTitle = trimmed;
        } else {
          introLines.push(trimmed);
        }
      } else if (currentSubtopic) {
        currentSubtopic.lines.push(trimmed);
      } else {
        currentSection.paragraphs.push(trimmed);
      }
    }

    if (!docTitle) docTitle = fallbackTitle || 'Plain-English Mind-Map Note';

    /* Graceful promotion when user writes pure plain English with no ## headings */
    if (!sections.length) {
      var fallbackSec = {
        id: 'wave-0-draft-1',
        title: 'Wave 0: Plain-English Capture',
        wave: 0,
        paragraphs: [],
        items: [],
        subtopics: []
      };
      introLines.forEach(function (ln, idx) {
        if (ln.indexOf(':') > 1 && !/^https?:/i.test(ln)) {
          fallbackSec.items.push({ text: ln, raw: ln, isTask: false, done: false, lineIndex: idx, wave: 1, dependsOn: '' });
        } else {
          fallbackSec.paragraphs.push(ln);
          ln.split(/(?<=[.!?])\s+/).forEach(function (sent) {
            var s = sent.trim();
            if (s.length > 6) {
              fallbackSec.items.push({ text: s, raw: s, isTask: true, done: false, lineIndex: -1, wave: 1, dependsOn: '' });
            }
          });
        }
      });
      if (fallbackSec.paragraphs.length || fallbackSec.items.length) {
        sections.push(fallbackSec);
      }
    }

    /* Extract Checklist Steps, Lexicon, Wiki, Soul */
    var steps = [];
    var lexicon = [];
    var seenTerms = {};
    var wiki = [];
    var soul = [];
    var seenSoul = {};

    function addLexicon(term, def, source) {
      var t = String(term || '').replace(/\*\*/g, '').trim();
      var d = String(def || '').trim();
      if (!t || !d || t.length > 48) return;
      var key = t.toLowerCase();
      if (seenTerms[key]) return;
      seenTerms[key] = true;
      lexicon.push({ term: t, definition: d, source: source || 'Note' });
    }

    function addSoul(label, rule) {
      var r = String(rule || '').trim();
      if (!r) return;
      var key = r.toLowerCase();
      if (seenSoul[key]) return;
      seenSoul[key] = true;
      soul.push({ label: label || 'Invariant', rule: r });
    }

    sections.forEach(function (sec) {
      var isLexSec = /lexicon|glossary|terms/i.test(sec.title);
      var isSoulSec = /soul|voice|invariant|rules/i.test(sec.title);
      var isWikiSec = /wiki|guide|reference/i.test(sec.title);

      sec.items.forEach(function (it) {
        if (it.isTask) {
          steps.push({
            text: it.text,
            done: it.done,
            lineIndex: it.lineIndex,
            wave: it.wave,
            sectionTitle: sec.title,
            dependsOn: it.dependsOn
          });
        }

        var boldTerm = it.text.match(/^\*\*([^*]+)\*\*\s*:\s*(.+)$/);
        var plainColon = it.text.match(/^([A-Za-z0-9 &/'-]{2,42})\s*:\s*(.+)$/);
        if (isSoulSec) {
          var sLabel = plainColon ? plainColon[1].trim() : 'Voice Rule';
          var sBody = plainColon ? plainColon[2].trim() : it.text;
          addSoul(sLabel, sBody);
        } else if (boldTerm) {
          addLexicon(boldTerm[1], boldTerm[2], sec.title);
        } else if (isLexSec && plainColon) {
          addLexicon(plainColon[1], plainColon[2], sec.title);
        } else if (plainColon && /^(always|never|rule|voice|soul|invariant|principle)$/i.test(plainColon[1].trim())) {
          addSoul(plainColon[1].trim(), plainColon[2].trim());
        } else if (plainColon && !/^https?$/i.test(plainColon[1].trim())) {
          addLexicon(plainColon[1], plainColon[2], sec.title);
        } else if (/^(Always|Never)\s+/i.test(it.text)) {
          addSoul('Guardrail', it.text);
        }
      });

      sec.subtopics.forEach(function (sub) {
        wiki.push({
          title: sub.title,
          summary: sub.lines.join(' ') || sec.title,
          section: sec.title
        });
      });

      if (!sec.subtopics.length && !isSoulSec && !isLexSec) {
        var summaryText = sec.paragraphs.join(' ') ||
          (sec.items.slice(0, 2).map(function (x) { return x.text; }).join(' · '));
        if (summaryText) {
          wiki.push({
            title: isWikiSec ? sec.title : cleanItemDisplay(sec.title),
            summary: summaryText,
            section: sec.title
          });
        }
      }
    });

    /* Plain-English fallback so Lexicon/Soul are helpful even on minimalist notes */
    if (!lexicon.length) {
      sections.forEach(function (sec) {
        if (sec.items.length) {
          addLexicon(truncateLabel(sec.title, 28), sec.items[0].text, 'Inferred');
        }
      });
    }
    if (!soul.length) {
      var firstSoul = introLines[0] || (steps[0] && steps[0].text) || 'Keep every note clear enough to act on offline.';
      addSoul('Core Intent', firstSoul);
    }

    /* Build Spatial SVG Mind-Map Tree */
    var nodes = [];
    var edges = [];
    var rootId = 'node-root';
    var boxW = 218;
    var boxH = 44;
    var colX = [24, 294, 566];
    var rowGap = 10;

    var branchSections = sections.filter(function (s) {
      return s.items.length || s.subtopics.length || s.paragraphs.length;
    });
    if (!branchSections.length) {
      branchSections = [{ id: 'empty', title: 'Write bullets or headings', wave: 1, items: [], subtopics: [], paragraphs: [] }];
    }

    var cursorY = 28;
    var branchCenters = [];

    branchSections.forEach(function (sec, sIdx) {
      var leafSpecs = [];
      sec.items.forEach(function (it) {
        leafSpecs.push({
          label: cleanItemDisplay(it.text.replace(/\*\*/g, '')),
          wave: typeof it.wave === 'number' ? it.wave : Math.min(2, sec.wave + 1),
          detail: (it.done ? '[Done] ' : '') + it.text + (it.dependsOn ? ' | Depends on: ' + it.dependsOn : ''),
          dependsOn: it.dependsOn || '',
          sectionId: sec.id
        });
      });
      sec.subtopics.forEach(function (sub) {
        leafSpecs.push({
          label: sub.title,
          wave: 2,
          detail: sub.lines.join(' ') || sub.title,
          dependsOn: '',
          sectionId: sec.id
        });
      });
      if (!leafSpecs.length) {
        leafSpecs.push({
          label: sec.paragraphs[0] || sec.title,
          wave: Math.min(2, sec.wave + 1),
          detail: sec.paragraphs.join(' ') || sec.title,
          dependsOn: '',
          sectionId: sec.id
        });
      }

      var blockStartY = cursorY;
      var leafNodes = [];
      leafSpecs.forEach(function (leaf, lIdx) {
        var leafId = 'node-b' + sIdx + '-l' + lIdx;
        var nodeObj = {
          id: leafId,
          wave: leaf.wave,
          label: leaf.label,
          shortLabel: truncateLabel(leaf.label, 25),
          detail: leaf.detail,
          parentLabel: sec.title,
          dependsOn: leaf.dependsOn,
          sectionId: leaf.sectionId,
          x: colX[2],
          y: cursorY,
          w: boxW,
          h: boxH
        };
        nodes.push(nodeObj);
        leafNodes.push(nodeObj);
        cursorY += boxH + rowGap;
      });

      var blockEndY = cursorY - rowGap;
      var branchY = Math.round((blockStartY + blockEndY - boxH) / 2);
      var branchId = 'node-b' + sIdx;
      var branchNode = {
        id: branchId,
        wave: sec.wave,
        label: sec.title,
        shortLabel: truncateLabel(sec.title, 25),
        detail: sec.paragraphs.join(' ') || (leafSpecs.length + ' items inside ' + sec.title),
        parentLabel: docTitle,
        dependsOn: '',
        sectionId: sec.id,
        x: colX[1],
        y: branchY,
        w: boxW,
        h: boxH
      };
      nodes.push(branchNode);
      branchCenters.push(branchY + boxH / 2);

      edges.push({ from: rootId, to: branchId, kind: 'tree' });
      leafNodes.forEach(function (ln) {
        edges.push({ from: branchId, to: ln.id, kind: 'tree' });
      });

      cursorY += 12;
    });

    var midY = branchCenters.length
      ? Math.round((branchCenters[0] + branchCenters[branchCenters.length - 1] - boxH) / 2)
      : 120;

    var rootNode = {
      id: rootId,
      wave: 0,
      label: docTitle,
      shortLabel: truncateLabel(docTitle, 24),
      detail: introLines.join(' ') || ('Central floorplan with ' + branchSections.length + ' branches and ' + steps.length + ' action steps.'),
      parentLabel: 'Aether Root',
      dependsOn: '',
      sectionId: '',
      x: colX[0],
      y: Math.min(168, Math.max(28, midY)),
      w: boxW,
      h: boxH + 6
    };
    nodes.unshift(rootNode);

    /* Wire semantic (depends: ...) links between matching nodes */
    nodes.forEach(function (n) {
      if (!n.dependsOn) return;
      var needle = n.dependsOn.toLowerCase();
      var target = nodes.find(function (cand) {
        return cand.id !== n.id && cand.label.toLowerCase().indexOf(needle) !== -1;
      });
      if (target) {
        edges.push({ from: target.id, to: n.id, kind: 'depends' });
      }
    });

    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    var headingCount = sections.length + 1;
    var readingMinutes = Math.max(1, Math.ceil(words / 180));
    var doneCount = steps.filter(function (s) { return s.done; }).length;

    return {
      title: docTitle,
      intro: introLines.join(' '),
      sections: sections.map(function (s) {
        return {
          id: s.id,
          title: s.title,
          wave: s.wave,
          paragraphs: s.paragraphs,
          items: s.items.map(function (it) { return it.text; }),
          subtopics: s.subtopics
        };
      }),
      steps: steps,
      lexicon: lexicon,
      wiki: wiki,
      soul: soul,
      nodes: nodes,
      edges: edges,
      mapWidth: colX[2] + boxW + 56,
      mapHeight: Math.max(320, cursorY + 24),
      metrics: {
        words: words,
        lines: lines.length,
        headings: headingCount,
        readingMinutes: readingMinutes,
        doneCount: doneCount,
        totalSteps: steps.length
      }
    };
  }

  /* ----------------------------------------------- 25-turn capsule builder -- */
  var FALLBACK_CAPSULE_SCHEMA = 'aether.rehydration.capsule.v2';
  var FALLBACK_LEGACY_SCHEMA = 'aether.compaction.passdown.v1';
  var FALLBACK_ASPECTS = [
    { id: 'session-passdown', order: 1, label: 'Session Pass-Down', shortLabel: 'Pass-Down', kind: 'specialized', tokenBudget: 900, summary: 'Executive resume state, Day/Week milestone, git/build invariants, and immediate next steps.' },
    { id: 'floorplan-waves', order: 2, label: 'Floorplan Waves', shortLabel: 'Waves 0-2', kind: 'specialized', tokenBudget: 1000, summary: 'Wave 0/1/2 dependency tree, critical path, and completed vs pending checklist tasks.' },
    { id: 'lexicon-soul', order: 3, label: 'Lexicon & Soul', shortLabel: 'Lexicon · Soul', kind: 'specialized', tokenBudget: 850, summary: 'Domain vocabulary terms, Wiki reference rules, and voice/design Soul invariants.' },
    { id: 'swarm-handoff', order: 4, label: 'Swarm Handoff', shortLabel: 'Swarm', kind: 'specialized', tokenBudget: 900, summary: 'Multi-worker ownership boundaries, pinned models/quotas, and board coordination protocol.' },
    { id: 'offline-portability', order: 5, label: 'Offline Portability', shortLabel: 'Offline HTML', kind: 'specialized', tokenBudget: 800, summary: 'Standalone HTML capsule rules, WebCrypto SHA-256 parity, and zero-CDN offline guarantee.' },
    { id: 'compact-prompt', order: 6, label: 'Compact Prompt', shortLabel: 'Compact <500t', kind: 'specialized', tokenBudget: 480, summary: 'Dense single-turn drop-in prompt (< 500 tokens) ready to paste into any cold AI session after turn 25.' },
    { id: 'master-bundle', order: 7, label: 'Master Bundle', shortLabel: 'Master Bundle', kind: 'bundle', tokenBudget: 3600, summary: 'Complete unified multi-aspect rehydration envelope combining all 6 specialized aspects.' }
  ];

  function fallbackNormalizeAspectId(aspectId) {
    var raw = String(aspectId || '').toLowerCase().trim();
    for (var i = 0; i < FALLBACK_ASPECTS.length; i++) {
      if (FALLBACK_ASPECTS[i].id === raw) return FALLBACK_ASPECTS[i].id;
    }
    if (raw === 'master' || raw === 'bundle' || raw === 'all') return 'master-bundle';
    if (raw === 'waves' || raw === 'floorplan') return 'floorplan-waves';
    if (raw === 'lexicon' || raw === 'soul') return 'lexicon-soul';
    if (raw === 'swarm') return 'swarm-handoff';
    if (raw === 'offline' || raw === 'html') return 'offline-portability';
    if (raw === 'compact' || raw === 'prompt') return 'compact-prompt';
    return 'session-passdown';
  }

  function fallbackGetAspect(aspectId) {
    var id = fallbackNormalizeAspectId(aspectId);
    for (var i = 0; i < FALLBACK_ASPECTS.length; i++) {
      if (FALLBACK_ASPECTS[i].id === id) return FALLBACK_ASPECTS[i];
    }
    return FALLBACK_ASPECTS[0];
  }

  function fallbackByteLength(text) {
    var s = String(text == null ? '' : text);
    if (!s) return 0;
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(s).byteLength;
    }
    return unescape(encodeURIComponent(s)).length;
  }

  function fallbackEstimateTokens(text) {
    var s = String(text == null ? '' : text).trim();
    if (!s) return 0;
    var words = s.split(/\s+/).filter(Boolean).length;
    var punct = (s.match(/[{}[\](),.:;#*`"'/-]/g) || []).length;
    return Math.max(1, Math.ceil(((s.length / 4) + (words * 1.32 + punct * 0.24)) / 2));
  }

  function formatByteCount(bytes) {
    var n = Math.max(0, Math.round(Number(bytes) || 0));
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + ' B';
  }

  function buildCapsuleMarkdown(state, parsed, meta) {
    var m = meta || DEFAULT_META;
    var dayObj = state.activeDayObj;
    var soulLines = (parsed.soul || []).slice(0, 5).map(function (s) {
      return '- ' + s.label + ': ' + s.rule;
    });
    var lexLines = (parsed.lexicon || []).slice(0, 6).map(function (l) {
      return '- ' + l.term + ': ' + l.definition;
    });
    var waveBuckets = { 0: [], 1: [], 2: [] };
    (parsed.nodes || []).forEach(function (n) {
      if (n.id === 'node-root') return;
      var w = (n.wave === 0 || n.wave === 1 || n.wave === 2) ? n.wave : 1;
      if (waveBuckets[w].length < 4) waveBuckets[w].push(n.shortLabel || n.label);
    });
    var openSteps = (parsed.steps || []).filter(function (s) { return !s.done; }).slice(0, 6).map(function (s) {
      return '- [ ] ' + s.text + ' [Wave ' + s.wave + ']';
    });

    return stripEmDashes([
      '# 25-Turn Rehydration Capsule (Aether WebOS)',
      '- Kit: ' + parsed.title + ' (' + state.activeKitId + ')',
      '- Mentorship: Day ' + dayObj.day + ' (Week ' + dayObj.week + ' · ' + dayObj.phase + ')',
      '- Active Prompt: ' + dayObj.title,
      '- SHA-256 Digest (16): ' + (state.digestHex ? state.digestHex.slice(0, 16) : 'pending'),
      '- Routing Mode: ' + m.routingMode,
      '- Compaction Gate: ' + m.compactionGate + ' (' + m.pinnedToolsCount + ' tools · ' + m.equationsCount + ' equations)',
      '',
      '## Soul (Voice Invariants)',
      soulLines.length ? soulLines.join('\n') : '- Core Intent: Keep all guidance clear and offline-capable.',
      '',
      '## Lexicon Snapshot',
      lexLines.length ? lexLines.join('\n') : '- Plain Anchor: Define domain words explicitly.',
      '',
      '## Floorplan Waves',
      '- Wave 0: ' + (waveBuckets[0].join(', ') || 'Baseline setup'),
      '- Wave 1: ' + (waveBuckets[1].join(', ') || 'Active execution'),
      '- Wave 2: ' + (waveBuckets[2].join(', ') || 'Verification and export'),
      '',
      '## Next Open Actions',
      openSteps.length ? openSteps.join('\n') : '- [ ] Review completed milestones and export updated kit HTML.',
      '',
      'Built with the Free Aether 30-Day Kit · Start Day 1: Free · Author: ' + m.author
    ].join('\n'));
  }

  function buildFallbackCapsuleJson(aspectId, state, parsed, meta) {
    var desc = fallbackGetAspect(aspectId);
    var md = buildCapsuleMarkdown(state, parsed, meta);
    var srcHex = state.digestHex || sha256FallbackHex(state.markdown || '');
    var capHex = sha256FallbackHex(md);
    var dayObj = state.activeDayObj || DEFAULT_DAYS[0];
    return {
      schema: FALLBACK_CAPSULE_SCHEMA,
      schemaVersion: FALLBACK_CAPSULE_SCHEMA,
      meta: Object.assign({}, DEFAULT_META, meta || {}),
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
        kitId: state.activeKitId,
        title: parsed.title,
        day: dayObj.day,
        week: dayObj.week,
        phase: dayObj.phase,
        dayTitle: dayObj.title,
        dayPrompt: dayObj.prompt,
        deliverable: dayObj.deliverable,
        surface: state.surface,
        markdown: state.markdown
      },
      integrity: {
        algorithm: 'SHA-256',
        sourceDigestHex: srcHex,
        sourceDigest16: srcHex.slice(0, 16),
        capsuleDigestHex: capHex,
        capsuleDigest16: capHex.slice(0, 16)
      },
      payload: { fallback: true },
      capsuleMarkdown: md
    };
  }

  function fallbackParseCapsuleForRehydrate(rawInput) {
    if (rawInput == null || (typeof rawInput === 'string' && !rawInput.trim())) {
      return {
        ok: false,
        error: 'Paste a Capsule JSON payload or select a .json file before rehydrating.',
        normalized: null
      };
    }
    var obj = null;
    if (typeof rawInput === 'string') {
      var trimmed = rawInput.trim().replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, '$1').trim();
      try {
        obj = JSON.parse(trimmed);
      } catch (err) {
        return {
          ok: false,
          error: 'Malformed JSON capsule: ' + stripEmDashes(err && err.message ? err.message : 'syntax error'),
          normalized: null
        };
      }
    } else if (typeof rawInput === 'object' && !Array.isArray(rawInput)) {
      obj = rawInput;
    } else {
      return { ok: false, error: 'Capsule input must be a JSON object or JSON string.', normalized: null };
    }
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
      return { ok: false, error: 'Capsule root must be a JSON object.', normalized: null };
    }
    var schema = String(obj.schema || obj.schemaVersion || '').trim();
    if (schema !== FALLBACK_CAPSULE_SCHEMA && schema !== FALLBACK_LEGACY_SCHEMA) {
      return {
        ok: false,
        error: schema
          ? ('Unsupported capsule schema "' + stripEmDashes(schema) + '". Expected ' + FALLBACK_CAPSULE_SCHEMA + ' or ' + FALLBACK_LEGACY_SCHEMA + '.')
          : ('Missing "schema" field. Expected "' + FALLBACK_CAPSULE_SCHEMA + '" or "' + FALLBACK_LEGACY_SCHEMA + '".'),
        normalized: null
      };
    }
    var ws = (obj.workspace && typeof obj.workspace === 'object') ? obj.workspace : {};
    var md = (typeof ws.markdown === 'string' && ws.markdown.trim())
      ? stripEmDashes(ws.markdown)
      : ((typeof obj.markdown === 'string' && obj.markdown.trim())
        ? stripEmDashes(obj.markdown)
        : ((typeof obj.capsuleMarkdown === 'string' && obj.capsuleMarkdown.trim()) ? stripEmDashes(obj.capsuleMarkdown) : ''));
    if (!md) {
      return { ok: false, error: 'Capsule JSON is missing workspace markdown content.', normalized: null };
    }
    var aspectId = fallbackNormalizeAspectId((obj.aspect && obj.aspect.id) || obj.aspectId || 'session-passdown');
    var day = clampDay(ws.day || obj.day || 1);
    var surface = String(ws.surface || obj.surface || 'obsidian').toLowerCase() === 'paper' ? 'paper' : 'obsidian';
    var kitId = stripEmDashes(ws.kitId || obj.kitId || 'household-clarity');
    var title = stripEmDashes(ws.title || obj.title || (obj.project && obj.project.name) || 'Rehydrated Workspace');
    return {
      ok: true,
      error: null,
      normalized: {
        schemaVersion: schema,
        aspectId: aspectId,
        kitId: kitId,
        title: title,
        markdown: md,
        day: day,
        surface: surface,
        note: 'Rehydrated ' + title + ' (' + schema + ') · Day ' + day + ' (' + surface + ').'
      }
    };
  }

  /* --------------------------------------------------- SVG DOM constructor -- */
  function svgEl(tag, attrs) {
    var el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        el.setAttribute(k, String(attrs[k]));
      });
    }
    return el;
  }

  /* ---------------------------------------------------- controller factory -- */
  function createController() {
    var manifest = normalizeManifest(null);
    var state = {
      mountEl: null,
      surface: 'obsidian',
      activeKitId: manifest.kits[0].id,
      activeTab: 'mindmap',
      activeDay: 1,
      activeDayObj: manifest.days[0],
      markdown: manifest.kits[0].markdown,
      isDirty: false,
      needsReparse: false,
      digestHex: sha256FallbackHex(manifest.kits[0].markdown),
      parsed: parseNote(manifest.kits[0].markdown, manifest.kits[0].title),
      selectedNodeId: 'node-root',
      mapZoom: 1,
      mapPanX: 16,
      mapPanY: 16,
      activeCapsuleAspect: 'session-passdown',
      activeCapsuleFormat: 'markdown',
      activeCapsuleText: '',
      activeCapsuleDigestHex: '',
      activeCapsuleTokens: 0,
      activeCapsuleBytes: 0,
      rehydrateState: 'idle',
      rehydrateStatus: '',
      synthesisSource: 'Offline Seed Ready · Local Fallback',
      synthesisConnected: false,
      statusMessage: 'Ready · Select a Starter Kit or edit any line in plain English.'
    };

    var hashSeq = 0;
    var capsuleHashSeq = 0;
    var renderSeq = 0;
    var dirtyPanels = { mindmap: false, dualview: false, lexicon: false, capsule: false };
    var dom = {};
    var handledEvents = typeof WeakSet !== 'undefined' ? new WeakSet() : null;
    var boundGlobalListeners = false;
    var lazyObserver = null;
    var lazyArmed = false;

    function getCapsulesEngine() {
      return CapsulesDep || (typeof globalThis !== 'undefined' ? globalThis.AetherCapsules : null) || null;
    }

    function getCapsuleAspects() {
      var eng = getCapsulesEngine();
      if (eng && Array.isArray(eng.ASPECTS) && eng.ASPECTS.length) {
        return eng.ASPECTS;
      }
      return FALLBACK_ASPECTS;
    }

    function normalizeAspect(aspectId) {
      var eng = getCapsulesEngine();
      if (eng && typeof eng.normalizeAspectId === 'function') {
        return eng.normalizeAspectId(aspectId);
      }
      return fallbackNormalizeAspectId(aspectId);
    }

    function getAspectMeta(aspectId) {
      var eng = getCapsulesEngine();
      if (eng && typeof eng.getAspect === 'function') {
        return eng.getAspect(aspectId);
      }
      return fallbackGetAspect(aspectId);
    }

    function normalizeCapsuleFormat(format) {
      var raw = String(format || state.activeCapsuleFormat || 'markdown').toLowerCase().trim();
      if (raw === 'json' || raw === 'json-v2' || raw === 'jsonv2' || raw === 'v2') {
        return 'json';
      }
      return 'markdown';
    }

    function getCapsule(aspectId, format) {
      var normAspect = normalizeAspect(aspectId || state.activeCapsuleAspect);
      var normFormat = normalizeCapsuleFormat(format || state.activeCapsuleFormat);
      var desc = getAspectMeta(normAspect);
      var parsed = ensureParsed();
      var eng = getCapsulesEngine();

      var text = '';
      var jsonObj = null;
      if (eng && typeof eng.buildCapsuleJson === 'function' && typeof eng.buildCapsuleMarkdown === 'function') {
        if (normFormat === 'json') {
          jsonObj = eng.buildCapsuleJson(normAspect, state, parsed, manifest.meta);
          text = typeof eng.serializeCapsuleJson === 'function'
            ? eng.serializeCapsuleJson(normAspect, state, parsed, manifest.meta)
            : stripEmDashes(JSON.stringify(jsonObj, null, 2));
        } else {
          text = eng.buildCapsuleMarkdown(normAspect, state, parsed, manifest.meta);
        }
      } else {
        if (normFormat === 'json') {
          jsonObj = buildFallbackCapsuleJson(normAspect, state, parsed, manifest.meta);
          text = stripEmDashes(JSON.stringify(jsonObj, null, 2));
        } else {
          text = buildCapsuleMarkdown(state, parsed, manifest.meta);
        }
      }

      var tokens = (eng && typeof eng.estimateTokens === 'function')
        ? eng.estimateTokens(text)
        : fallbackEstimateTokens(text);
      var bytes = (eng && typeof eng.computeByteLength === 'function')
        ? eng.computeByteLength(text)
        : fallbackByteLength(text);
      var digestHex = (eng && typeof eng.computeCapsuleDigestSync === 'function')
        ? eng.computeCapsuleDigestSync(text)
        : sha256FallbackHex(text);

      return {
        aspectId: desc.id,
        aspectLabel: desc.label,
        shortLabel: desc.shortLabel || desc.label,
        kind: desc.kind || 'specialized',
        tokenBudget: desc.tokenBudget || 900,
        summary: desc.summary || '',
        format: normFormat,
        schemaVersion: (eng && eng.SCHEMA_VERSION) || FALLBACK_CAPSULE_SCHEMA,
        filename: 'aether-capsule-' + desc.id + '-day-' + state.activeDay + (normFormat === 'json' ? '.json' : '.md'),
        mimeType: normFormat === 'json' ? 'application/json;charset=utf-8' : 'text/markdown;charset=utf-8',
        text: text,
        content: text,
        json: jsonObj,
        tokens: tokens,
        bytes: bytes,
        digestHex: digestHex,
        digest16: digestHex.slice(0, 16)
      };
    }

    function computeCapsuleDigestAsync(text) {
      var eng = getCapsulesEngine();
      if (eng && typeof eng.computeCapsuleDigest === 'function') {
        return eng.computeCapsuleDigest(text);
      }
      return computeSha256Hex(text);
    }

    function getKitById(kitId) {
      return manifest.kits.find(function (k) { return k.id === kitId; }) || manifest.kits[0];
    }

    function getDayObj(dayNum) {
      var d = clampDay(dayNum);
      return manifest.days.find(function (x) { return x.day === d; }) || manifest.days[0];
    }

    function ensureParsed() {
      if (!state.needsReparse && state.parsed) return state.parsed;
      var activeKit = getKitById(state.activeKitId);
      state.parsed = parseNote(state.markdown, activeKit.title);
      state.needsReparse = false;
      return state.parsed;
    }

    function setStatus(msg) {
      state.statusMessage = stripEmDashes(msg);
      if (dom.statusMsg) dom.statusMsg.textContent = state.statusMessage;
    }

    function setRehydrateFeedback(kind, message) {
      state.rehydrateState = kind || 'idle';
      state.rehydrateStatus = stripEmDashes(message || '');
      if (!dom.rehydrateFeedback) return;
      dom.rehydrateFeedback.textContent = state.rehydrateStatus;
      dom.rehydrateFeedback.className = 'aw-rehydrate-feedback' +
        (kind === 'ok' ? ' aw-rehydrate-feedback--ok' : (kind === 'error' ? ' aw-rehydrate-feedback--error' : ''));
      dom.rehydrateFeedback.hidden = !state.rehydrateStatus;
    }

    function setSurface(nextSurface, opts) {
      var options = opts || {};
      state.surface = nextSurface === 'paper' ? 'paper' : 'obsidian';
      if (state.mountEl) {
        state.mountEl.setAttribute('data-aw-surface', state.surface);
      }
      if (dom.surfaceToggleBtn) {
        dom.surfaceToggleBtn.setAttribute('aria-pressed', state.surface === 'paper' ? 'true' : 'false');
      }
      if (!options.skipCapsuleRefresh) {
        updateCapsuleDisplay();
      }
      if (!options.silentStatus) {
        setStatus(
          state.surface === 'paper'
            ? 'Studio surface switched to Warm Paper (#F2EFE8).'
            : 'Studio surface switched to Deep Obsidian (#080A0E).'
        );
      }
      return state.surface;
    }

    function updateCapsuleDisplay() {
      var cap = getCapsule(state.activeCapsuleAspect, state.activeCapsuleFormat);
      state.activeCapsuleAspect = cap.aspectId;
      state.activeCapsuleFormat = cap.format;
      state.activeCapsuleText = cap.text;
      state.activeCapsuleDigestHex = cap.digestHex;
      state.activeCapsuleTokens = cap.tokens;
      state.activeCapsuleBytes = cap.bytes;

      if (dom.capsuleAspectGrid) {
        var aspectBtns = dom.capsuleAspectGrid.querySelectorAll('.aw-aspect-btn');
        for (var i = 0; i < aspectBtns.length; i++) {
          var aId = aspectBtns[i].getAttribute('data-capsule-aspect');
          aspectBtns[i].setAttribute('aria-pressed', aId === cap.aspectId ? 'true' : 'false');
        }
      }
      if (dom.formatMdBtn) {
        dom.formatMdBtn.setAttribute('aria-pressed', cap.format === 'markdown' ? 'true' : 'false');
      }
      if (dom.formatJsonBtn) {
        dom.formatJsonBtn.setAttribute('aria-pressed', cap.format === 'json' ? 'true' : 'false');
      }
      if (dom.capsuleAspectLabel) {
        dom.capsuleAspectLabel.textContent = cap.aspectLabel + ' (' + (cap.format === 'json' ? 'JSON v2' : 'Markdown') + ')';
      }
      if (dom.capsuleAspectSummary) {
        dom.capsuleAspectSummary.textContent = cap.summary;
      }
      if (dom.capsuleTokensChip) {
        dom.capsuleTokensChip.textContent = '~' + cap.tokens + ' tokens';
        dom.capsuleTokensChip.className = 'aw-chip ' + (
          cap.aspectId === 'compact-prompt' && cap.format === 'markdown' && cap.tokens < 500
            ? 'aw-chip--ok'
            : 'aw-chip--amber'
        );
      }
      if (dom.capsuleBytesChip) {
        dom.capsuleBytesChip.textContent = formatByteCount(cap.bytes);
      }
      if (dom.capsuleDigestChip) {
        dom.capsuleDigestChip.textContent = 'sha256: ' + cap.digest16;
      }
      if (dom.dlCapBtn) {
        dom.dlCapBtn.textContent = cap.format === 'json' ? 'Download .json' : 'Download .md';
      }
      if (dom.capsuleBox) {
        dom.capsuleBox.value = cap.text;
      }

      var myCapSeq = ++capsuleHashSeq;
      computeCapsuleDigestAsync(cap.text).then(function (hex) {
        if (myCapSeq !== capsuleHashSeq) return;
        state.activeCapsuleDigestHex = hex;
        if (dom.capsuleDigestChip) {
          dom.capsuleDigestChip.textContent = 'sha256: ' + hex.slice(0, 16);
        }
      });

      return cap;
    }

    function selectCapsuleAspect(aspectId) {
      state.activeCapsuleAspect = normalizeAspect(aspectId);
      var cap = updateCapsuleDisplay();
      setStatus('Capsule aspect: ' + cap.aspectLabel + ' (~' + cap.tokens + ' tokens · ' + cap.digest16 + ').');
      return cap;
    }

    function selectCapsuleFormat(format) {
      state.activeCapsuleFormat = normalizeCapsuleFormat(format);
      var cap = updateCapsuleDisplay();
      setStatus('Capsule format: ' + (cap.format === 'json' ? 'JSON v2' : 'Markdown') + ' (~' + cap.tokens + ' tokens).');
      return cap;
    }

    function refreshDigestAndCapsule() {
      var currentSeq = ++hashSeq;
      var payloadForHash = state.markdown + '\n::day=' + state.activeDay + '::kit=' + state.activeKitId;
      computeSha256Hex(payloadForHash).then(function (hex) {
        if (currentSeq !== hashSeq) return;
        state.digestHex = hex;
        if (dom.digestChip) dom.digestChip.textContent = 'sha256: ' + hex.slice(0, 16);
        updateCapsuleDisplay();
      });
    }

    function renderPanelById(tabId) {
      if (tabId === 'mindmap') {
        renderMindMap();
        renderNodeInspector();
        dirtyPanels.mindmap = false;
      } else if (tabId === 'dualview') {
        renderDualView();
        dirtyPanels.dualview = false;
      } else if (tabId === 'lexicon') {
        renderLexiconWikiSoul();
        dirtyPanels.lexicon = false;
      } else if (tabId === 'capsule') {
        renderCapsuleTab();
        dirtyPanels.capsule = false;
      }
    }

    function reparseAndRender(keepSelection) {
      ++renderSeq;
      state.needsReparse = true;
      ensureParsed();
      if (!keepSelection || !state.parsed.nodes.some(function (n) { return n.id === state.selectedNodeId; })) {
        state.selectedNodeId = state.parsed.nodes[0] ? state.parsed.nodes[0].id : 'node-root';
      }
      renderMetrics();
      renderMindMap();
      renderNodeInspector();
      renderDualView();
      renderLexiconWikiSoul();
      renderCapsuleTab();
      dirtyPanels.mindmap = false;
      dirtyPanels.dualview = false;
      dirtyPanels.lexicon = false;
      dirtyPanels.capsule = false;
      refreshDigestAndCapsule();
    }

    function reparseAndRenderAsync(keepSelection, doneStatus) {
      var mySeq = ++renderSeq;
      state.needsReparse = true;
      dirtyPanels.mindmap = true;
      dirtyPanels.dualview = true;
      dirtyPanels.lexicon = true;
      dirtyPanels.capsule = true;

      return yieldToMain().then(function () {
        if (mySeq !== renderSeq) return false;
        ensureParsed();
        if (!keepSelection || !state.parsed.nodes.some(function (n) { return n.id === state.selectedNodeId; })) {
          state.selectedNodeId = state.parsed.nodes[0] ? state.parsed.nodes[0].id : 'node-root';
        }
        renderMetrics();
        renderPanelById(state.activeTab);
        return yieldToMain();
      }).then(function (ok) {
        if (ok === false || mySeq !== renderSeq) return false;
        if (dirtyPanels.mindmap) renderPanelById('mindmap');
        if (dirtyPanels.dualview) renderPanelById('dualview');
        return yieldToMain();
      }).then(function (ok) {
        if (ok === false || mySeq !== renderSeq) return false;
        if (dirtyPanels.lexicon) renderPanelById('lexicon');
        if (dirtyPanels.capsule) renderPanelById('capsule');
        refreshDigestAndCapsule();
        if (doneStatus) setStatus(doneStatus);
        return true;
      });
    }

    function renderMetrics() {
      if (!dom.editorMeta) return;
      var m = ensureParsed().metrics;
      dom.editorMeta.textContent = m.words + ' words · ' + m.lines + ' lines · ' + m.headings + ' headings';
    }

    function renderKitButtons(forceRebuild) {
      if (!dom.kitGrid) return;
      var existing = dom.kitGrid.querySelectorAll('.aw-kit-card');
      if (!forceRebuild && existing.length === manifest.kits.length) {
        for (var i = 0; i < existing.length; i++) {
          var kId = existing[i].getAttribute('data-kit-id');
          existing[i].setAttribute('aria-pressed', kId === state.activeKitId ? 'true' : 'false');
        }
        return;
      }

      dom.kitGrid.innerHTML = '';
      manifest.kits.forEach(function (kit) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'aw-kit-card';
        btn.setAttribute('aria-pressed', kit.id === state.activeKitId ? 'true' : 'false');
        btn.setAttribute('data-kit-id', kit.id);

        var t = document.createElement('span');
        t.className = 'aw-kit-card__title';
        t.textContent = kit.title;

        var a = document.createElement('span');
        a.className = 'aw-kit-card__audience';
        a.textContent = kit.audience;

        btn.appendChild(t);
        btn.appendChild(a);
        btn.addEventListener('click', function () {
          selectKit(kit.id, { async: true });
        });
        dom.kitGrid.appendChild(btn);
      });
    }

    function renderMentorshipBar(forceRebuild) {
      if (!dom.weekPills || !dom.dayScroller) return;
      var activeDay = state.activeDayObj;

      var existingWeeks = dom.weekPills.querySelectorAll('.aw-pill-btn');
      if (!forceRebuild && existingWeeks.length === manifest.weeks.length) {
        for (var wi = 0; wi < existingWeeks.length; wi++) {
          var wkVal = Number(existingWeeks[wi].getAttribute('data-week-num'));
          existingWeeks[wi].setAttribute('aria-pressed', wkVal === activeDay.week ? 'true' : 'false');
        }
      } else {
        dom.weekPills.innerHTML = '';
        manifest.weeks.forEach(function (wk) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'aw-pill-btn';
          btn.setAttribute('data-week-num', String(wk.week));
          btn.setAttribute('aria-pressed', wk.week === activeDay.week ? 'true' : 'false');
          btn.textContent = 'Week ' + wk.week + ' · ' + wk.daysRange;
          btn.addEventListener('click', function () {
            var firstInWeek = manifest.days.find(function (d) { return d.week === wk.week; });
            selectDay(firstInWeek ? firstInWeek.day : 1, { switchKit: !state.isDirty, async: true });
          });
          dom.weekPills.appendChild(btn);
        });
      }

      var existingDays = dom.dayScroller.querySelectorAll('.aw-day-btn');
      var activeBtn = null;
      if (!forceRebuild && existingDays.length === manifest.days.length) {
        for (var di = 0; di < existingDays.length; di++) {
          var dayVal = Number(existingDays[di].getAttribute('data-day-num'));
          var isCur = dayVal === activeDay.day;
          existingDays[di].setAttribute('aria-pressed', isCur ? 'true' : 'false');
          if (isCur) activeBtn = existingDays[di];
        }
      } else {
        dom.dayScroller.innerHTML = '';
        manifest.days.forEach(function (d) {
          var db = document.createElement('button');
          db.type = 'button';
          db.className = 'aw-day-btn';
          var isCurrent = d.day === activeDay.day;
          db.setAttribute('data-day-num', String(d.day));
          db.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
          db.setAttribute('aria-label', 'D' + d.day + ': ' + d.title);
          db.textContent = 'D' + d.day;
          db.addEventListener('click', function () {
            selectDay(d.day, { switchKit: !state.isDirty, async: true });
          });
          dom.dayScroller.appendChild(db);
          if (isCurrent) activeBtn = db;
        });
      }

      if (activeBtn && dom.dayScroller.clientWidth > 0) {
        dom.dayScroller.scrollLeft = Math.max(
          0,
          activeBtn.offsetLeft - (dom.dayScroller.clientWidth / 2) + (activeBtn.offsetWidth / 2)
        );
      }

      if (dom.dayBannerTitle) {
        dom.dayBannerTitle.innerHTML = '';
        var badge = document.createElement('span');
        badge.className = 'aw-chip aw-chip--amber';
        badge.textContent = 'Day ' + activeDay.day + ' · Week ' + activeDay.week + ' · ' + activeDay.phase;
        var titleSpan = document.createElement('span');
        titleSpan.textContent = activeDay.title;
        dom.dayBannerTitle.appendChild(badge);
        dom.dayBannerTitle.appendChild(titleSpan);
      }

      if (dom.dayBannerPrompt) {
        dom.dayBannerPrompt.textContent = activeDay.prompt + ' Deliverable: ' + activeDay.deliverable;
      }
    }

    function updateMindMapViewBox() {
      if (!dom.mapSvg) return;
      var svg = dom.mapSvg;
      var box = svg.parentElement;
      var vw = (box && box.clientWidth > 200) ? box.clientWidth : 840;
      var vh = (box && box.clientHeight > 180) ? box.clientHeight : 360;
      var vbW = Math.max(840, vw);
      var vbH = Math.round(vbW * (vh / vw));
      var nextVb = '0 0 ' + vbW + ' ' + vbH;
      if (svg.getAttribute('viewBox') !== nextVb) {
        svg.setAttribute('viewBox', nextVb);
      }
    }

    function updateMindMapTransform(syncViewBox) {
      if (!dom.mapRootG || !dom.mapSvg || !dom.mapSvg.contains(dom.mapRootG)) {
        renderMindMap(true);
        return;
      }
      if (syncViewBox) {
        updateMindMapViewBox();
      }
      dom.mapRootG.setAttribute(
        'transform',
        'translate(' + state.mapPanX + ',' + state.mapPanY + ') scale(' + state.mapZoom + ')'
      );
    }

    function updateMindMapSelection() {
      if (!dom.mapNodeMap || !dom.mapRootG || !dom.mapSvg || !dom.mapSvg.contains(dom.mapRootG)) {
        renderMindMap(true);
        return;
      }
      if (dom.mapSelectedId && dom.mapNodeMap[dom.mapSelectedId]) {
        dom.mapNodeMap[dom.mapSelectedId].setAttribute('aria-pressed', 'false');
      }
      if (state.selectedNodeId && dom.mapNodeMap[state.selectedNodeId]) {
        dom.mapNodeMap[state.selectedNodeId].setAttribute('aria-pressed', 'true');
      }
      dom.mapSelectedId = state.selectedNodeId;
    }

    function renderMindMap(forceRebuild) {
      if (!dom.mapSvg) return;
      var svg = dom.mapSvg;
      var parsed = ensureParsed();

      if (!forceRebuild && dom.mapRootG && dom.mapGraphRef === parsed && svg.contains(dom.mapRootG)) {
        updateMindMapTransform(true);
        if (dom.mapSelectedId !== state.selectedNodeId) {
          updateMindMapSelection();
        }
        return;
      }

      while (svg.firstChild) svg.removeChild(svg.firstChild);
      updateMindMapViewBox();
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Mind-Map Floorplan with ' + parsed.nodes.length + ' nodes');

      var gRoot = svgEl('g', {
        transform: 'translate(' + state.mapPanX + ',' + state.mapPanY + ') scale(' + state.mapZoom + ')'
      });

      var byId = {};
      parsed.nodes.forEach(function (n) { byId[n.id] = n; });

      /* Render edges first so nodes sit cleanly on top */
      parsed.edges.forEach(function (edge) {
        var a = byId[edge.from];
        var b = byId[edge.to];
        if (!a || !b) return;
        var isDep = edge.kind === 'depends';
        var x1 = a.x + a.w;
        var y1 = a.y + a.h / 2;
        var x2 = b.x;
        var y2 = b.y + b.h / 2;
        var cx = (x1 + x2) / 2;
        var dPath;
        if (isDep && Math.abs(a.x - b.x) < 20) {
          var rx1 = a.x + a.w;
          var ry1 = a.y + a.h / 2;
          var rx2 = b.x + b.w;
          var ry2 = b.y + b.h / 2;
          var ctrlX = rx1 + 42;
          dPath = 'M ' + rx1 + ' ' + ry1 + ' C ' + ctrlX + ' ' + ry1 + ', ' + ctrlX + ' ' + ry2 + ', ' + rx2 + ' ' + ry2;
        } else if (isDep) {
          dPath = 'M ' + (a.x + a.w / 2) + ' ' + (a.y + a.h) + ' Q ' + ((a.x + b.x) / 2) + ' ' + (Math.max(a.y, b.y) + a.h + 26) + ', ' + (b.x + b.w / 2) + ' ' + (b.y + b.h);
        } else {
          dPath = 'M ' + x1 + ' ' + y1 + ' C ' + cx + ' ' + y1 + ', ' + cx + ' ' + y2 + ', ' + x2 + ' ' + y2;
        }

        gRoot.appendChild(svgEl('path', {
          d: dPath,
          class: 'aw-map-edge ' + (isDep ? 'aw-map-edge--dep' : 'aw-map-edge--tree')
        }));
      });

      /* Render nodes */
      var nodeMap = {};
      parsed.nodes.forEach(function (node) {
        var selected = node.id === state.selectedNodeId;
        var g = svgEl('g', {
          class: 'aw-map-node',
          'data-node-id': node.id,
          'data-wave': String(node.wave),
          role: 'button',
          tabindex: '0',
          'aria-pressed': selected ? 'true' : 'false',
          'aria-label': 'Wave ' + node.wave + ': ' + node.label
        });

        g.appendChild(svgEl('rect', {
          x: node.x,
          y: node.y,
          width: node.w,
          height: node.h,
          rx: 0,
          class: 'aw-map-node__box',
          'aria-hidden': 'true'
        }));

        var waveTag = svgEl('text', {
          x: node.x + 11,
          y: node.y + 15,
          class: 'aw-map-node__wave',
          'aria-hidden': 'true'
        });
        waveTag.textContent = 'WAVE ' + node.wave;
        g.appendChild(waveTag);

        var labelTxt = svgEl('text', {
          x: node.x + 11,
          y: node.y + 32,
          class: 'aw-map-node__label',
          'aria-hidden': 'true'
        });
        labelTxt.textContent = node.shortLabel;
        g.appendChild(labelTxt);

        function handleSelect(ev) {
          ev.stopPropagation();
          state.selectedNodeId = node.id;
          updateMindMapSelection();
          renderNodeInspector();
        }
        g.addEventListener('click', handleSelect);
        g.addEventListener('keydown', function (ev) {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            handleSelect(ev);
          }
        });
        nodeMap[node.id] = g;
        gRoot.appendChild(g);
      });

      svg.appendChild(gRoot);
      dom.mapRootG = gRoot;
      dom.mapNodeMap = nodeMap;
      dom.mapGraphRef = parsed;
      dom.mapSelectedId = state.selectedNodeId;
    }

    function renderNodeInspector() {
      if (!dom.inspectorTitle || !dom.inspectorBody || !dom.inspectorWave) return;
      var parsed = ensureParsed();
      var node = parsed.nodes.find(function (n) { return n.id === state.selectedNodeId; }) || parsed.nodes[0];
      if (!node) return;

      dom.inspectorWave.textContent = 'Wave ' + node.wave + ' · ' + node.parentLabel;
      dom.inspectorTitle.textContent = node.label;
      dom.inspectorBody.textContent = node.detail || node.label;

      if (dom.inspectorJumpBtn) {
        dom.inspectorJumpBtn.hidden = !node.sectionId;
        dom.inspectorJumpBtn.onclick = function () {
          selectTab('dualview');
          if (node.sectionId && dom.readerPanel) {
            var target = dom.readerPanel.querySelector('[data-sec-id="' + node.sectionId + '"]');
            var reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (target && target.scrollIntoView) target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
          }
        };
      }
    }

    function renderDualView() {
      if (!dom.readerPanel) return;
      var p = ensureParsed();
      var m = p.metrics;
      dom.readerPanel.innerHTML = '';

      /* Editorial header hierarchy */
      var hero = document.createElement('header');
      hero.className = 'aw-reader__hero';

      var h3 = document.createElement('h3');
      h3.className = 'aw-reader__title';
      h3.textContent = p.title;

      var meta = document.createElement('p');
      meta.className = 'aw-reader__meta';
      meta.textContent = m.readingMinutes + ' min read · ' + m.words + ' words · ' + p.sections.length + ' sections · Day ' + state.activeDay + ' active';

      var callout = document.createElement('div');
      callout.className = 'aw-reader__callout';
      callout.textContent = 'Give this to your AI -> 25-Turn Rehydration Capsule (' + m.doneCount + '/' + m.totalSteps + ' steps done)';

      hero.appendChild(h3);
      hero.appendChild(meta);
      hero.appendChild(callout);
      dom.readerPanel.appendChild(hero);

      /* Section anchors strip */
      if (p.sections.length) {
        var anchors = document.createElement('div');
        anchors.className = 'aw-anchor-list';
        p.sections.forEach(function (sec) {
          var ab = document.createElement('button');
          ab.type = 'button';
          ab.className = 'aw-anchor-btn';
          ab.textContent = sec.title;
          ab.addEventListener('click', function () {
            var secEl = dom.readerPanel.querySelector('[data-sec-id="' + sec.id + '"]');
            var reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (secEl && secEl.scrollIntoView) secEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
          });
          anchors.appendChild(ab);
        });
        dom.readerPanel.appendChild(anchors);
      }

      /* Interactive Plain-English Step Checklist */
      if (p.steps.length) {
        var checkBox = document.createElement('div');
        checkBox.className = 'aw-checklist';
        var chHead = document.createElement('div');
        chHead.className = 'aw-section-head';
        var chTitle = document.createElement('strong');
        chTitle.textContent = 'Plain-English Action Checklist';
        var chCount = document.createElement('span');
        chCount.className = 'aw-chip';
        chCount.textContent = m.doneCount + ' / ' + m.totalSteps + ' complete';
        chHead.appendChild(chTitle);
        chHead.appendChild(chCount);
        checkBox.appendChild(chHead);

        p.steps.forEach(function (step, idx) {
          var cbId = 'aw-step-check-' + idx;
          var lbl = document.createElement('label');
          lbl.className = 'aw-check-item' + (step.done ? ' aw-check-item--done' : '');
          lbl.setAttribute('for', cbId);
          var cb = document.createElement('input');
          cb.type = 'checkbox';
          cb.id = cbId;
          cb.name = cbId;
          cb.checked = !!step.done;
          cb.addEventListener('change', function () {
            toggleChecklistStep(step.lineIndex, cb.checked);
          });
          var span = document.createElement('span');
          span.textContent = step.text + ' [Wave ' + step.wave + ']';
          lbl.appendChild(cb);
          lbl.appendChild(span);
          checkBox.appendChild(lbl);
        });
        dom.readerPanel.appendChild(checkBox);
      }

      if (!p.sections.length && !p.steps.length) {
        var emptyReader = document.createElement('p');
        emptyReader.className = 'aw-empty-note';
        emptyReader.textContent = 'Add a heading or - [ ] action step on the left to populate Dual-View sections.';
        dom.readerPanel.appendChild(emptyReader);
        return;
      }

      /* Editorial sections */
      p.sections.forEach(function (sec) {
        var secCard = document.createElement('article');
        secCard.className = 'aw-reader-sec';
        secCard.setAttribute('data-sec-id', sec.id);

        var sh = document.createElement('h4');
        sh.textContent = sec.title;
        secCard.appendChild(sh);

        sec.paragraphs.forEach(function (pg) {
          var para = document.createElement('p');
          para.textContent = pg;
          secCard.appendChild(para);
        });

        sec.subtopics.forEach(function (sub) {
          var subH = document.createElement('p');
          var subStrong = document.createElement('strong');
          subStrong.textContent = sub.title + ': ';
          subH.appendChild(subStrong);
          subH.appendChild(document.createTextNode(sub.lines.join(' ')));
          secCard.appendChild(subH);
        });

        if (sec.items.length) {
          var ul = document.createElement('ul');
          sec.items.forEach(function (itemText) {
            var li = document.createElement('li');
            li.textContent = itemText.replace(/\*\*/g, '');
            ul.appendChild(li);
          });
          secCard.appendChild(ul);
        }
        dom.readerPanel.appendChild(secCard);
      });
    }

    function toggleChecklistStep(lineIndex, nextDone) {
      if (lineIndex < 0) return;
      var lines = state.markdown.split(/\r?\n/);
      if (typeof lines[lineIndex] !== 'string') return;
      lines[lineIndex] = nextDone
        ? lines[lineIndex].replace(/^(\s*[-*]\s+\[)[ xX](\])/, '$1x$2')
        : lines[lineIndex].replace(/^(\s*[-*]\s+\[)[ xX](\])/, '$1 $2');
      state.markdown = lines.join('\n');
      state.isDirty = true;
      if (dom.textarea) dom.textarea.value = state.markdown;
      reparseAndRenderAsync(true, nextDone ? 'Step checked off and floorplan updated.' : 'Step reopened.');
    }

    function renderLexiconWikiSoul() {
      if (!dom.lwsGrid) return;
      dom.lwsGrid.innerHTML = '';
      var parsed = ensureParsed();

      function makeCard(title, badgeText, entries, fullWidth, mapper, isSoul, emptyCopy) {
        var card = document.createElement('section');
        card.className = 'aw-lws-card' + (fullWidth ? ' aw-lws-card--full' : '');
        var h4 = document.createElement('h4');
        var tSpan = document.createElement('span');
        tSpan.textContent = title;
        var countChip = document.createElement('span');
        countChip.className = 'aw-chip';
        countChip.textContent = badgeText;
        h4.appendChild(tSpan);
        h4.appendChild(countChip);
        card.appendChild(h4);

        if (!entries.length) {
          var emptyEl = document.createElement('p');
          emptyEl.className = 'aw-empty-note';
          emptyEl.textContent = emptyCopy;
          card.appendChild(emptyEl);
          dom.lwsGrid.appendChild(card);
          return;
        }

        var ul = document.createElement('ul');
        ul.className = 'aw-lws-list';
        entries.forEach(function (item) {
          var li = document.createElement('li');
          li.className = 'aw-lws-entry' + (isSoul ? ' aw-lws-entry--soul' : '');
          var mapped = mapper(item);
          var strong = document.createElement('strong');
          strong.textContent = mapped.head + ': ';
          li.appendChild(strong);
          li.appendChild(document.createTextNode(mapped.body));
          ul.appendChild(li);
        });
        card.appendChild(ul);
        dom.lwsGrid.appendChild(card);
      }

      makeCard(
        'Soul · Core Voice Invariants',
        parsed.soul.length + ' pinned',
        parsed.soul,
        true,
        function (s) { return { head: s.label, body: s.rule }; },
        true,
        'Add lines under ## Soul or start a bullet with Always/Never to pin invariants.'
      );

      makeCard(
        'Lexicon · Defined Terms',
        parsed.lexicon.length + ' terms',
        parsed.lexicon,
        false,
        function (l) { return { head: l.term, body: l.definition }; },
        false,
        'Write Term: meaning lines in your note to build your shared vocabulary.'
      );

      makeCard(
        'Wiki · Topic Floorplan',
        parsed.wiki.length + ' entries',
        parsed.wiki,
        false,
        function (w) { return { head: w.title, body: w.summary }; },
        false,
        'Add ## Wiki headings or ### subtopics to store reusable reference cards.'
      );
    }

    function renderCapsuleAspects(forceRebuild) {
      if (!dom.capsuleAspectGrid) return;
      var aspects = getCapsuleAspects();
      var existing = dom.capsuleAspectGrid.querySelectorAll('.aw-aspect-btn');
      if (!forceRebuild && existing.length === aspects.length) {
        for (var i = 0; i < existing.length; i++) {
          var aId = existing[i].getAttribute('data-capsule-aspect');
          existing[i].setAttribute('aria-pressed', aId === state.activeCapsuleAspect ? 'true' : 'false');
        }
        return;
      }

      dom.capsuleAspectGrid.innerHTML = '';
      aspects.forEach(function (asp, idx) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'aw-aspect-btn' + (asp.kind === 'bundle' ? ' aw-aspect-btn--bundle' : '');
        btn.setAttribute('data-capsule-aspect', asp.id);
        btn.setAttribute('aria-pressed', asp.id === state.activeCapsuleAspect ? 'true' : 'false');
        btn.setAttribute('title', asp.label + ': ' + asp.summary);

        var idxSpan = document.createElement('span');
        idxSpan.className = 'aw-aspect-btn__index';
        idxSpan.textContent = asp.kind === 'bundle' ? 'ALL' : ('0' + (idx + 1));

        var lblSpan = document.createElement('span');
        lblSpan.className = 'aw-aspect-btn__label';
        lblSpan.textContent = asp.shortLabel || asp.label;

        btn.appendChild(idxSpan);
        btn.appendChild(lblSpan);
        btn.addEventListener('click', function () {
          selectCapsuleAspect(asp.id);
        });
        dom.capsuleAspectGrid.appendChild(btn);
      });
    }

    function renderCapsuleTab() {
      if (dom.synthStatusTitle) {
        dom.synthStatusTitle.innerHTML = '';
        var badge = document.createElement('span');
        badge.className = 'aw-chip ' + (state.synthesisConnected ? 'aw-chip--ok' : 'aw-chip--live');
        badge.textContent = state.synthesisConnected ? 'Connected' : 'Offline Seed';
        var label = document.createElement('span');
        label.textContent = state.synthesisSource;
        dom.synthStatusTitle.appendChild(badge);
        dom.synthStatusTitle.appendChild(label);
      }
      if (dom.synthStatusSub) {
        var m = manifest.meta;
        dom.synthStatusSub.textContent =
          'v' + m.version + ' · ' + m.routingMode + ' · Gate: ' + m.compactionGate +
          ' · ' + m.pinnedToolsCount + ' pinned tools · ' + m.equationsCount + ' equations';
      }
      renderCapsuleAspects(false);
      updateCapsuleDisplay();
      if (dom.rehydrateFeedback) {
        dom.rehydrateFeedback.textContent = state.rehydrateStatus;
        dom.rehydrateFeedback.className = 'aw-rehydrate-feedback' +
          (state.rehydrateState === 'ok' ? ' aw-rehydrate-feedback--ok' : (state.rehydrateState === 'error' ? ' aw-rehydrate-feedback--error' : ''));
        dom.rehydrateFeedback.hidden = !state.rehydrateStatus;
      }
    }

    function rehydrateCapsule(input, opts) {
      var options = opts || {};
      try {
        var eng = getCapsulesEngine();
        var res = (eng && typeof eng.parseCapsuleForRehydrate === 'function')
          ? eng.parseCapsuleForRehydrate(input)
          : fallbackParseCapsuleForRehydrate(input);

        if (!res || !res.ok || !res.normalized) {
          var errMsg = stripEmDashes((res && res.error) || 'Invalid capsule JSON payload.');
          setRehydrateFeedback('error', errMsg);
          setStatus('Rehydrate failed: ' + errMsg);
          return { ok: false, error: errMsg, restored: null };
        }

        var n = res.normalized;
        var matchedKit = manifest.kits.find(function (k) { return k.id === n.kitId; });
        if (matchedKit) {
          state.activeKitId = matchedKit.id;
        } else if (n.kitId) {
          state.activeKitId = stripEmDashes(n.kitId);
        }

        var dayObj = getDayObj(n.day);
        state.activeDay = dayObj.day;
        state.activeDayObj = dayObj;

        setSurface(n.surface, { skipCapsuleRefresh: true, silentStatus: true });

        state.markdown = stripEmDashes(n.markdown);
        state.isDirty = true;
        state.needsReparse = true;
        state.activeCapsuleAspect = normalizeAspect(n.aspectId || state.activeCapsuleAspect);

        if (dom.textarea) {
          dom.textarea.value = state.markdown;
        }

        renderKitButtons(false);
        renderMentorshipBar(false);
        reparseAndRender(false);

        if (!options.silent && typeof document !== 'undefined' && typeof CustomEvent === 'function') {
          document.dispatchEvent(new CustomEvent('aether:day-select', {
            bubbles: true,
            detail: {
              day: dayObj.day,
              week: dayObj.week,
              phase: dayObj.phase,
              title: dayObj.title,
              prompt: dayObj.prompt,
              deliverable: dayObj.deliverable,
              kitId: state.activeKitId,
              _origin: 'aether-refractory'
            }
          }));
        }

        var okMsg = stripEmDashes(
          n.note || ('Rehydrated ' + state.parsed.title + ' · Day ' + dayObj.day + ' (' + state.surface + ').')
        );
        setRehydrateFeedback('ok', okMsg);
        setStatus(okMsg);

        return {
          ok: true,
          error: null,
          restored: {
            schemaVersion: n.schemaVersion,
            aspectId: state.activeCapsuleAspect,
            kitId: state.activeKitId,
            title: state.parsed.title,
            day: state.activeDay,
            week: state.activeDayObj.week,
            surface: state.surface,
            digest16: (state.digestHex || '').slice(0, 16),
            note: okMsg
          }
        };
      } catch (err) {
        var safeErr = stripEmDashes((err && err.message) ? err.message : 'Unexpected capsule validation error.');
        setRehydrateFeedback('error', safeErr);
        setStatus('Rehydrate failed: ' + safeErr);
        return { ok: false, error: safeErr, restored: null };
      }
    }

    /* ---------------------------------------------------- public commands -- */
    function selectKit(kitId, opts) {
      var options = opts || {};
      var kit = getKitById(kitId);
      state.activeKitId = kit.id;
      state.markdown = kit.markdown;
      state.isDirty = false;
      state.needsReparse = true;
      if (dom.textarea) dom.textarea.value = state.markdown;
      renderKitButtons(false);

      if (options.async) {
        setStatus('Loading starter kit: ' + kit.title + '...');
        reparseAndRenderAsync(false, 'Loaded starter kit: ' + kit.title);
      } else {
        reparseAndRender(false);
        setStatus('Loaded starter kit: ' + kit.title);
      }
    }

    function selectTab(tabId) {
      var valid = TABS.some(function (t) { return t.id === tabId; });
      state.activeTab = valid ? tabId : 'mindmap';
      if (dom.tabButtons) {
        dom.tabButtons.forEach(function (btn) {
          var isSel = btn.getAttribute('data-tab') === state.activeTab;
          btn.setAttribute('aria-selected', isSel ? 'true' : 'false');
        });
      }
      if (dom.tabPanels) {
        Object.keys(dom.tabPanels).forEach(function (id) {
          dom.tabPanels[id].hidden = id !== state.activeTab;
        });
      }
      if (dirtyPanels[state.activeTab] || state.needsReparse) {
        renderPanelById(state.activeTab);
      } else if (state.activeTab === 'mindmap') {
        renderMindMap();
      }
    }

    function selectDay(dayNum, opts) {
      var options = opts || {};
      if (!state.mountEl && typeof document !== 'undefined' && !options.deferMount) {
        var lazyTarget = document.getElementById('aether-webos-mount');
        if (lazyTarget && !lazyTarget.querySelector('[data-aether-studio="true"]')) {
          mount(lazyTarget, { asyncTabs: !!options.async });
        }
      }

      var dayObj = getDayObj(dayNum);
      var changedDay = state.activeDay !== dayObj.day;
      state.activeDay = dayObj.day;
      state.activeDayObj = dayObj;

      if (options.switchKit === true || (options.switchKit !== false && !state.isDirty && changedDay)) {
        if (dayObj.kitId && dayObj.kitId !== state.activeKitId) {
          var targetKit = getKitById(dayObj.kitId);
          state.activeKitId = targetKit.id;
          state.markdown = targetKit.markdown;
          state.isDirty = false;
          if (dom.textarea) dom.textarea.value = state.markdown;
          renderKitButtons(false);
        }
      }

      state.needsReparse = true;
      renderMentorshipBar(false);
      setStatus('Day ' + dayObj.day + ' (Week ' + dayObj.week + '): ' + dayObj.title);

      if (!options.silent && typeof document !== 'undefined' && typeof CustomEvent === 'function') {
        document.dispatchEvent(new CustomEvent('aether:day-select', {
          bubbles: true,
          detail: {
            day: dayObj.day,
            week: dayObj.week,
            phase: dayObj.phase,
            title: dayObj.title,
            prompt: dayObj.prompt,
            deliverable: dayObj.deliverable,
            kitId: dayObj.kitId,
            _origin: 'aether-refractory'
          }
        }));
      }

      if (options.async) {
        reparseAndRenderAsync(true, 'Day ' + dayObj.day + ' (Week ' + dayObj.week + '): ' + dayObj.title);
      } else {
        reparseAndRender(true);
      }

      return cloneJson(dayObj);
    }

    function buildExportPayload() {
      var dayObj = state.activeDayObj;
      var parsed = ensureParsed();
      var eng = getCapsulesEngine();
      var allCapsules = (eng && typeof eng.buildAllCapsules === 'function')
        ? eng.buildAllCapsules(state, parsed, manifest.meta)
        : null;
      return {
        title: parsed.title,
        kitId: state.activeKitId,
        surface: state.surface,
        day: dayObj.day,
        week: dayObj.week,
        phase: dayObj.phase,
        dayTitle: dayObj.title,
        dayPrompt: dayObj.prompt,
        deliverable: dayObj.deliverable,
        digestHex: state.digestHex,
        digest16: (state.digestHex || '').slice(0, 16),
        markdown: state.markdown,
        capsule: getCapsule('session-passdown', 'markdown').text,
        capsules: allCapsules,
        meta: cloneJson(manifest.meta),
        parsed: parsed
      };
    }

    function copyTextToClipboard(text, successLabel) {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(function () {
          setStatus(successLabel + ' copied to clipboard.');
          return true;
        }).catch(function () {
          return fallbackCopyText(text, successLabel);
        });
      }
      return Promise.resolve(fallbackCopyText(text, successLabel));
    }

    function fallbackCopyText(text, successLabel) {
      if (typeof document === 'undefined') return false;
      var ta = document.createElement('textarea');
      ta.id = 'aw-clipboard-scratch';
      ta.name = 'aw-clipboard-scratch';
      ta.setAttribute('aria-hidden', 'true');
      ta.setAttribute('tabindex', '-1');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      setStatus(ok ? (successLabel + ' copied.') : ('Ready to copy ' + successLabel + ' from Capsule panel.'));
      return ok;
    }

    function copyShareNote() {
      var exporter = ExporterDep || (typeof globalThis !== 'undefined' ? globalThis.AetherExporter : null);
      var payload = buildExportPayload();
      var note = exporter && exporter.buildShareNote
        ? exporter.buildShareNote({
          title: payload.title,
          day: payload.day,
          week: payload.week,
          dayTitle: payload.dayTitle,
          digest16: payload.digest16,
          nodeCount: payload.parsed.nodes.length,
          stepCount: payload.parsed.steps.length
        })
        : ('Aether WebOS Kit: ' + payload.title + '\nBuilt with the Free Aether 30-Day Kit · Start Day 1: Free');
      return copyTextToClipboard(note, 'Share note');
    }

    function exportKit() {
      var exporter = ExporterDep || (typeof globalThis !== 'undefined' ? globalThis.AetherExporter : null);
      var payload = buildExportPayload();
      if (!exporter || !exporter.downloadKitHtml) {
        setStatus('Exporter module unavailable.');
        return null;
      }
      var res = exporter.downloadKitHtml(payload);
      setStatus('Exported offline kit: ' + res.filename + ' (' + Math.round(res.bytes / 1024) + ' KB)');
      return res;
    }

    function applyManifestObject(obj, sourceLabel, opts) {
      var options = opts || {};
      manifest = normalizeManifest(obj);
      state.synthesisConnected = true;
      state.synthesisSource = stripEmDashes(sourceLabel || 'Imported Synthesis Manifest');
      if (!manifest.kits.some(function (k) { return k.id === state.activeKitId; })) {
        state.activeKitId = manifest.kits[0].id;
      }
      if (!state.isDirty) {
        state.markdown = getKitById(state.activeKitId).markdown;
        if (dom.textarea) dom.textarea.value = state.markdown;
      }
      state.activeDayObj = getDayObj(state.activeDay);
      state.needsReparse = true;
      renderKitButtons(true);
      renderMentorshipBar(true);

      if (options.async) {
        return reparseAndRenderAsync(true, 'Terminal context synced (' + state.synthesisSource + ').');
      }
      reparseAndRender(true);
      setStatus('Terminal context synced (' + state.synthesisSource + ').');
      return Promise.resolve(true);
    }

    function importContextJson(jsonInput, sourceLabel, opts) {
      try {
        var obj = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
        if (!obj || typeof obj !== 'object') throw new Error('Invalid synthesis manifest JSON');
        applyManifestObject(obj, sourceLabel, opts);
        return true;
      } catch (err) {
        setStatus('Could not import synthesis JSON: ' + err.message);
        return false;
      }
    }

    function reloadContext(allowFileOrigin) {
      if (typeof fetch !== 'function') {
        setStatus('Using offline default synthesis manifest.');
        return Promise.resolve(false);
      }
      var isFile = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
      if (isFile && !allowFileOrigin) {
        state.synthesisConnected = false;
        state.synthesisSource = 'Offline Seed Ready (file:// mode · Import JSON anytime)';
        renderCapsuleTab();
        return Promise.resolve(false);
      }
      if (isFile && allowFileOrigin) {
        setStatus('Browser blocks fetch on file:// · Use Import JSON to load terminal-synthesis.json.');
        return Promise.resolve(false);
      }
      var isSqs = typeof document !== 'undefined' && Boolean(document.querySelector('[data-sc-sqs-page], [data-sc-embed]'));
      if (isSqs) {
        state.synthesisConnected = false;
        state.synthesisSource = 'Offline Seed Ready (Squarespace /s/ mode · Import JSON anytime)';
        renderCapsuleTab();
        if (allowFileOrigin) {
          setStatus('Squarespace /s/ mode runs from the embedded manifest · Use Import JSON to load a custom file.');
        }
        return Promise.resolve(false);
      }
      return fetch('./context/terminal-synthesis.json', { cache: 'no-store' })
        .then(function (resp) {
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          return resp.json();
        })
        .then(function (data) {
          return yieldToMain().then(function () {
            if (!data || typeof data !== 'object') return false;
            return applyManifestObject(data, './context/terminal-synthesis.json', { async: true });
          });
        })
        .catch(function () {
          state.synthesisConnected = false;
          state.synthesisSource = 'Offline Seed Ready · Local Fallback';
          renderCapsuleTab();
          setStatus('Using offline embedded manifest (./context/terminal-synthesis.json unavailable).');
          return false;
        });
    }

    /* -------------------------------------------------------- DOM mounting -- */
    function buildStudioDom(mountEl) {
      mountEl.innerHTML = '';
      var shell = document.createElement('div');
      shell.className = 'aw-shell';
      shell.setAttribute('data-aether-studio', 'true');

      /* 1. Top Bar */
      var topbar = document.createElement('header');
      topbar.className = 'aw-topbar';

      var brand = document.createElement('div');
      brand.className = 'aw-topbar__brand';

      var titleEl = document.createElement('h3');
      titleEl.className = 'aw-title';
      titleEl.textContent = 'Aether WebOS Refractory';

      var digestChip = document.createElement('span');
      digestChip.className = 'aw-chip aw-chip--live';
      digestChip.textContent = 'sha256: ' + state.digestHex.slice(0, 16);
      dom.digestChip = digestChip;

      brand.appendChild(titleEl);
      brand.appendChild(digestChip);

      var actions = document.createElement('div');
      actions.className = 'aw-topbar__actions';

      var surfaceToggleBtn = document.createElement('button');
      surfaceToggleBtn.type = 'button';
      surfaceToggleBtn.className = 'aw-btn aw-btn--sm aw-btn--surface';
      surfaceToggleBtn.setAttribute('data-aw-surface-toggle', '');
      surfaceToggleBtn.setAttribute('aria-pressed', state.surface === 'paper' ? 'true' : 'false');
      surfaceToggleBtn.setAttribute('title', 'Switch studio between Deep Obsidian (#080A0E) and Warm Paper (#F2EFE8)');
      surfaceToggleBtn.textContent = 'Paper Surface';
      surfaceToggleBtn.addEventListener('click', function () {
        setSurface(state.surface === 'paper' ? 'obsidian' : 'paper');
      });
      dom.surfaceToggleBtn = surfaceToggleBtn;

      var shareBtn = document.createElement('button');
      shareBtn.type = 'button';
      shareBtn.className = 'aw-btn';
      shareBtn.textContent = 'Copy Share Note';
      shareBtn.addEventListener('click', copyShareNote);

      var exportBtn = document.createElement('button');
      exportBtn.type = 'button';
      exportBtn.className = 'aw-btn aw-btn--primary';
      exportBtn.textContent = 'Export My Kit (.html)';
      exportBtn.addEventListener('click', exportKit);

      actions.appendChild(surfaceToggleBtn);
      actions.appendChild(shareBtn);
      actions.appendChild(exportBtn);
      topbar.appendChild(brand);
      topbar.appendChild(actions);
      shell.appendChild(topbar);

      /* 2. Starter Kits Bar */
      var kitsBar = document.createElement('section');
      kitsBar.className = 'aw-kits-bar';
      kitsBar.setAttribute('aria-label', 'Starter Kits');
      var kitsHead = document.createElement('div');
      kitsHead.className = 'aw-section-head';
      var kitsEyebrow = document.createElement('p');
      kitsEyebrow.className = 'aw-eyebrow';
      kitsEyebrow.textContent = '1-Click Starter Kits · Pick a real-world template or write plain English';
      kitsHead.appendChild(kitsEyebrow);

      var kitGrid = document.createElement('div');
      kitGrid.className = 'aw-kit-grid';
      kitGrid.setAttribute('role', 'group');
      kitGrid.setAttribute('aria-label', 'Common-Man Starter Kits');
      dom.kitGrid = kitGrid;

      kitsBar.appendChild(kitsHead);
      kitsBar.appendChild(kitGrid);
      shell.appendChild(kitsBar);

      /* 3. 30-Day Mentorship Bar */
      var mentBar = document.createElement('section');
      mentBar.className = 'aw-mentorship-bar';
      mentBar.setAttribute('aria-label', '30-Day Mentorship Switcher');

      var weekRow = document.createElement('div');
      weekRow.className = 'aw-week-row';
      var mentEyebrow = document.createElement('p');
      mentEyebrow.className = 'aw-eyebrow';
      mentEyebrow.textContent = '30-Day Mentorship Sync · Linked with Weeks & Resolve';
      var weekPills = document.createElement('div');
      weekPills.className = 'aw-week-pills';
      weekPills.setAttribute('role', 'group');
      weekPills.setAttribute('aria-label', 'Mentorship Weeks');
      dom.weekPills = weekPills;
      weekRow.appendChild(mentEyebrow);
      weekRow.appendChild(weekPills);

      var dayScroller = document.createElement('div');
      dayScroller.className = 'aw-day-scroller';
      dayScroller.setAttribute('role', 'group');
      dayScroller.setAttribute('aria-label', 'Days 1 to 30');
      dom.dayScroller = dayScroller;

      var dayBanner = document.createElement('div');
      dayBanner.className = 'aw-day-banner';
      var dayCopy = document.createElement('div');
      dayCopy.className = 'aw-day-banner__copy';
      var dayTitle = document.createElement('p');
      dayTitle.className = 'aw-day-banner__title';
      dom.dayBannerTitle = dayTitle;
      var dayPrompt = document.createElement('p');
      dayPrompt.className = 'aw-day-banner__prompt';
      dom.dayBannerPrompt = dayPrompt;
      dayCopy.appendChild(dayTitle);
      dayCopy.appendChild(dayPrompt);

      var dayActions = document.createElement('div');
      dayActions.className = 'aw-day-banner__actions';
      var applyKitBtn = document.createElement('button');
      applyKitBtn.type = 'button';
      applyKitBtn.className = 'aw-btn aw-btn--sm';
      applyKitBtn.textContent = 'Load Day Kit';
      applyKitBtn.addEventListener('click', function () {
        selectKit(state.activeDayObj.kitId, { async: true });
      });
      var insertPromptBtn = document.createElement('button');
      insertPromptBtn.type = 'button';
      insertPromptBtn.className = 'aw-btn aw-btn--sm aw-btn--amber';
      insertPromptBtn.textContent = 'Add Day Task';
      insertPromptBtn.addEventListener('click', function () {
        var d = state.activeDayObj;
        var snippet = '\n- [ ] Day ' + d.day + ': ' + d.title + ' [Wave 0]';
        state.markdown = state.markdown.trimEnd() + snippet;
        state.isDirty = true;
        if (dom.textarea) dom.textarea.value = state.markdown;
        reparseAndRenderAsync(true, 'Added Day ' + d.day + ' task to your note.');
      });
      dayActions.appendChild(applyKitBtn);
      dayActions.appendChild(insertPromptBtn);

      dayBanner.appendChild(dayCopy);
      dayBanner.appendChild(dayActions);

      mentBar.appendChild(weekRow);
      mentBar.appendChild(dayScroller);
      mentBar.appendChild(dayBanner);
      shell.appendChild(mentBar);

      /* 4. Split Workspace */
      var workspace = document.createElement('div');
      workspace.className = 'aw-workspace';

      /* 4a. Left Editor Pane */
      var editorPane = document.createElement('div');
      editorPane.className = 'aw-editor-pane';
      var edHead = document.createElement('div');
      edHead.className = 'aw-pane-head';
      var edLabel = document.createElement('label');
      edLabel.className = 'aw-eyebrow aw-label';
      edLabel.setAttribute('for', 'aw-note-input');
      edLabel.textContent = 'Plain-English & Markdown Input';
      var edMeta = document.createElement('span');
      edMeta.className = 'aw-pane-head__meta';
      dom.editorMeta = edMeta;
      edHead.appendChild(edLabel);
      edHead.appendChild(edMeta);

      var textarea = document.createElement('textarea');
      textarea.className = 'aw-textarea';
      textarea.id = 'aw-note-input';
      textarea.name = 'aw-note-input';
      textarea.placeholder = 'Write plain English, # headings, - [ ] steps, Term: definition, or Soul: rules...';
      textarea.value = state.markdown;
      textarea.addEventListener('input', function () {
        state.markdown = stripEmDashes(textarea.value);
        state.isDirty = true;
        state.needsReparse = true;
        reparseAndRenderAsync(true);
      });
      dom.textarea = textarea;

      var edFoot = document.createElement('div');
      edFoot.className = 'aw-editor-foot';
      var edTip = document.createElement('span');
      edTip.textContent = 'Supports # sections, - [ ] tasks, (depends: ...), Term: meaning, Soul: rule.';
      var edBtns = document.createElement('div');
      edBtns.className = 'aw-map-controls';

      var resetKitBtn = document.createElement('button');
      resetKitBtn.type = 'button';
      resetKitBtn.className = 'aw-btn aw-btn--sm aw-btn--ghost';
      resetKitBtn.textContent = 'Reset Kit';
      resetKitBtn.addEventListener('click', function () { selectKit(state.activeKitId, { async: true }); });

      var clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'aw-btn aw-btn--sm aw-btn--ghost';
      clearBtn.textContent = 'Clear';
      clearBtn.addEventListener('click', function () {
        state.markdown = '# My Plain-English Plan\n\n## Wave 0: First Step\n- [ ] Write down one clear goal today [Wave 0]\n\n## Soul\n- Invariant: Keep this plan simple enough to finish this week.';
        state.isDirty = true;
        textarea.value = state.markdown;
        reparseAndRenderAsync(false, 'Loaded blank starter scaffold.');
      });

      edBtns.appendChild(resetKitBtn);
      edBtns.appendChild(clearBtn);
      edFoot.appendChild(edTip);
      edFoot.appendChild(edBtns);

      editorPane.appendChild(edHead);
      editorPane.appendChild(textarea);
      editorPane.appendChild(edFoot);
      workspace.appendChild(editorPane);

      /* 4b. Right Output Pane */
      var outputPane = document.createElement('div');
      outputPane.className = 'aw-output-pane';

      var tablist = document.createElement('div');
      tablist.className = 'aw-tablist';
      tablist.setAttribute('role', 'tablist');
      tablist.setAttribute('aria-label', 'Refractory Live Output Views');

      dom.tabButtons = [];
      dom.tabPanels = {};

      TABS.forEach(function (tab, idx) {
        var tb = document.createElement('button');
        tb.type = 'button';
        tb.className = 'aw-tab';
        tb.id = 'aw-tab-' + tab.id;
        tb.setAttribute('role', 'tab');
        tb.setAttribute('data-tab', tab.id);
        tb.setAttribute('aria-controls', 'aw-panel-' + tab.id);
        tb.setAttribute('aria-selected', tab.id === state.activeTab ? 'true' : 'false');
        tb.textContent = tab.label;

        tb.addEventListener('click', function () { selectTab(tab.id); });
        tb.addEventListener('keydown', function (ev) {
          var nextIdx = idx;
          if (ev.key === 'ArrowRight') nextIdx = (idx + 1) % TABS.length;
          else if (ev.key === 'ArrowLeft') nextIdx = (idx - 1 + TABS.length) % TABS.length;
          else if (ev.key === 'Home') nextIdx = 0;
          else if (ev.key === 'End') nextIdx = TABS.length - 1;
          else return;
          ev.preventDefault();
          selectTab(TABS[nextIdx].id);
          dom.tabButtons[nextIdx].focus();
        });

        tablist.appendChild(tb);
        dom.tabButtons.push(tb);
      });
      outputPane.appendChild(tablist);

      /* Panel 1: Mind-Map Floorplan */
      var mapPanel = document.createElement('section');
      mapPanel.className = 'aw-tabpanel';
      mapPanel.id = 'aw-panel-mindmap';
      mapPanel.setAttribute('role', 'tabpanel');
      mapPanel.setAttribute('aria-labelledby', 'aw-tab-mindmap');

      var mapToolbar = document.createElement('div');
      mapToolbar.className = 'aw-map-toolbar';
      var mapLegend = document.createElement('div');
      mapLegend.className = 'aw-legend';
      mapLegend.innerHTML =
        '<span class="aw-legend__item"><span class="aw-swatch aw-swatch--w0"></span>Wave 0</span>' +
        '<span class="aw-legend__item"><span class="aw-swatch aw-swatch--w1"></span>Wave 1</span>' +
        '<span class="aw-legend__item"><span class="aw-swatch aw-swatch--w2"></span>Wave 2</span>';

      var mapControls = document.createElement('div');
      mapControls.className = 'aw-map-controls';

      function makeMapBtn(label, fn) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'aw-btn aw-btn--sm';
        b.textContent = label;
        b.addEventListener('click', fn);
        return b;
      }
      mapControls.appendChild(makeMapBtn('Zoom -', function () {
        state.mapZoom = Math.max(0.45, +(state.mapZoom - 0.15).toFixed(2));
        updateMindMapTransform();
      }));
      mapControls.appendChild(makeMapBtn('100%', function () {
        state.mapZoom = 1;
        state.mapPanX = 16;
        state.mapPanY = 16;
        updateMindMapTransform();
      }));
      mapControls.appendChild(makeMapBtn('Zoom +', function () {
        state.mapZoom = Math.min(2.2, +(state.mapZoom + 0.15).toFixed(2));
        updateMindMapTransform();
      }));
      mapControls.appendChild(makeMapBtn('Fit', function () {
        var box = dom.mapSvg && dom.mapSvg.parentElement;
        var vw = (box && box.clientWidth > 200) ? box.clientWidth : 840;
        var vh = (box && box.clientHeight > 180) ? box.clientHeight : 360;
        var vbW = Math.max(840, vw);
        var vbH = Math.round(vbW * (vh / vw));
        var parsed = ensureParsed();
        var fitScale = Math.min(vbW / (parsed.mapWidth || 860), vbH / (parsed.mapHeight || 360), 1.0);
        state.mapZoom = Math.max(0.32, +fitScale.toFixed(2));
        state.mapPanX = 12;
        state.mapPanY = 10;
        updateMindMapTransform(true);
      }));

      mapToolbar.appendChild(mapLegend);
      mapToolbar.appendChild(mapControls);

      var mapViewport = document.createElement('div');
      mapViewport.className = 'aw-map-viewport';
      var mapSvg = svgEl('svg', { class: 'aw-map-svg' });
      dom.mapSvg = mapSvg;
      dom.mapRootG = null;
      dom.mapNodeMap = null;
      dom.mapGraphRef = null;
      dom.mapSelectedId = null;
      mapViewport.appendChild(mapSvg);

      /* Pointer pan on background without hijacking node clicks or page scroll */
      var dragging = false;
      var dragStartX = 0;
      var dragStartY = 0;
      var basePanX = 0;
      var basePanY = 0;
      mapViewport.addEventListener('pointerdown', function (ev) {
        if (ev.target && ev.target.closest && ev.target.closest('.aw-map-node')) return;
        dragging = true;
        dragStartX = ev.clientX;
        dragStartY = ev.clientY;
        basePanX = state.mapPanX;
        basePanY = state.mapPanY;
        if (mapViewport.setPointerCapture && ev.pointerId != null) {
          try { mapViewport.setPointerCapture(ev.pointerId); } catch (e) {}
        }
      });
      mapViewport.addEventListener('pointermove', function (ev) {
        if (!dragging) return;
        state.mapPanX = Math.round(basePanX + (ev.clientX - dragStartX));
        state.mapPanY = Math.round(basePanY + (ev.clientY - dragStartY));
        updateMindMapTransform();
      });
      var endDrag = function () { dragging = false; };
      mapViewport.addEventListener('pointerup', endDrag);
      mapViewport.addEventListener('pointercancel', endDrag);

      var inspector = document.createElement('div');
      inspector.className = 'aw-inspector';
      var insHead = document.createElement('div');
      insHead.className = 'aw-inspector__head';
      var insTitle = document.createElement('h4');
      insTitle.className = 'aw-inspector__title';
      dom.inspectorTitle = insTitle;
      var insMeta = document.createElement('div');
      insMeta.className = 'aw-map-controls';
      var insWave = document.createElement('span');
      insWave.className = 'aw-chip aw-chip--amber';
      dom.inspectorWave = insWave;
      var insJump = document.createElement('button');
      insJump.type = 'button';
      insJump.className = 'aw-btn aw-btn--sm';
      insJump.textContent = 'Jump in Reader';
      dom.inspectorJumpBtn = insJump;
      insMeta.appendChild(insWave);
      insMeta.appendChild(insJump);
      insHead.appendChild(insTitle);
      insHead.appendChild(insMeta);

      var insBody = document.createElement('p');
      insBody.className = 'aw-inspector__body';
      dom.inspectorBody = insBody;
      inspector.appendChild(insHead);
      inspector.appendChild(insBody);

      mapPanel.appendChild(mapToolbar);
      mapPanel.appendChild(mapViewport);
      mapPanel.appendChild(inspector);
      dom.tabPanels.mindmap = mapPanel;
      outputPane.appendChild(mapPanel);

      /* Panel 2: Dual-View Reader */
      var readerWrap = document.createElement('section');
      readerWrap.className = 'aw-tabpanel';
      readerWrap.id = 'aw-panel-dualview';
      readerWrap.setAttribute('role', 'tabpanel');
      readerWrap.setAttribute('aria-labelledby', 'aw-tab-dualview');
      readerWrap.hidden = true;
      var readerBox = document.createElement('div');
      readerBox.className = 'aw-reader';
      dom.readerPanel = readerBox;
      readerWrap.appendChild(readerBox);
      dom.tabPanels.dualview = readerWrap;
      outputPane.appendChild(readerWrap);

      /* Panel 3: Lexicon · Wiki · Soul */
      var lwsWrap = document.createElement('section');
      lwsWrap.className = 'aw-tabpanel';
      lwsWrap.id = 'aw-panel-lexicon';
      lwsWrap.setAttribute('role', 'tabpanel');
      lwsWrap.setAttribute('aria-labelledby', 'aw-tab-lexicon');
      lwsWrap.hidden = true;
      var lwsGrid = document.createElement('div');
      lwsGrid.className = 'aw-lws-grid';
      dom.lwsGrid = lwsGrid;
      lwsWrap.appendChild(lwsGrid);
      dom.tabPanels.lexicon = lwsWrap;
      outputPane.appendChild(lwsWrap);

      /* Panel 4: Multi-Aspect Rehydration Capsules & Terminal Synthesis Slot */
      var capWrap = document.createElement('section');
      capWrap.className = 'aw-tabpanel';
      capWrap.id = 'aw-panel-capsule';
      capWrap.setAttribute('role', 'tabpanel');
      capWrap.setAttribute('aria-labelledby', 'aw-tab-capsule');
      capWrap.hidden = true;

      var synthBar = document.createElement('div');
      synthBar.className = 'aw-synth-bar';
      var synthMeta = document.createElement('div');
      synthMeta.className = 'aw-synth-meta';
      var synthTitle = document.createElement('div');
      synthTitle.className = 'aw-synth-meta__title';
      dom.synthStatusTitle = synthTitle;
      var synthSub = document.createElement('div');
      synthSub.className = 'aw-synth-meta__sub';
      dom.synthStatusSub = synthSub;
      synthMeta.appendChild(synthTitle);
      synthMeta.appendChild(synthSub);

      var synthActions = document.createElement('div');
      synthActions.className = 'aw-synth-actions';
      var reloadBtn = document.createElement('button');
      reloadBtn.type = 'button';
      reloadBtn.className = 'aw-btn aw-btn--sm';
      reloadBtn.textContent = 'Reload Terminal Context';
      reloadBtn.addEventListener('click', function () { reloadContext(true); });

      var fileLabel = document.createElement('label');
      fileLabel.className = 'aw-sr-only';
      fileLabel.setAttribute('for', 'aw-import-json-input');
      fileLabel.textContent = 'Import terminal synthesis JSON file';

      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json,application/json';
      fileInput.className = 'aw-file-input';
      fileInput.id = 'aw-import-json-input';
      fileInput.name = 'aw-import-json-input';
      fileInput.setAttribute('tabindex', '-1');
      fileInput.addEventListener('change', function () {
        var f = fileInput.files && fileInput.files[0];
        if (!f || typeof FileReader === 'undefined') return;
        var reader = new FileReader();
        reader.onload = function () {
          importContextJson(String(reader.result || ''), 'Imported: ' + f.name, { async: true });
        };
        reader.readAsText(f);
        fileInput.value = '';
      });

      var importBtn = document.createElement('button');
      importBtn.type = 'button';
      importBtn.className = 'aw-btn aw-btn--sm';
      importBtn.textContent = 'Import JSON';
      importBtn.addEventListener('click', function () { fileInput.click(); });

      synthActions.appendChild(reloadBtn);
      synthActions.appendChild(importBtn);
      synthActions.appendChild(fileLabel);
      synthActions.appendChild(fileInput);
      synthBar.appendChild(synthMeta);
      synthBar.appendChild(synthActions);

      /* Aspect Selector Grid (6 Specialized + Master Bundle) */
      var aspectBar = document.createElement('div');
      aspectBar.className = 'aw-aspect-section';
      var aspectHead = document.createElement('div');
      aspectHead.className = 'aw-section-head';
      var aspectEyebrow = document.createElement('p');
      aspectEyebrow.className = 'aw-eyebrow';
      aspectEyebrow.textContent = 'Capsule Aspect (6 Specialized + Master Bundle)';

      var formatGroup = document.createElement('div');
      formatGroup.className = 'aw-format-toggle';
      formatGroup.setAttribute('role', 'group');
      formatGroup.setAttribute('aria-label', 'Capsule Output Format');

      var formatMdBtn = document.createElement('button');
      formatMdBtn.type = 'button';
      formatMdBtn.className = 'aw-format-btn';
      formatMdBtn.setAttribute('data-capsule-format', 'markdown');
      formatMdBtn.setAttribute('aria-pressed', state.activeCapsuleFormat === 'markdown' ? 'true' : 'false');
      formatMdBtn.textContent = 'Markdown';
      formatMdBtn.addEventListener('click', function () { selectCapsuleFormat('markdown'); });
      dom.formatMdBtn = formatMdBtn;

      var formatJsonBtn = document.createElement('button');
      formatJsonBtn.type = 'button';
      formatJsonBtn.className = 'aw-format-btn';
      formatJsonBtn.setAttribute('data-capsule-format', 'json');
      formatJsonBtn.setAttribute('aria-pressed', state.activeCapsuleFormat === 'json' ? 'true' : 'false');
      formatJsonBtn.textContent = 'JSON v2';
      formatJsonBtn.addEventListener('click', function () { selectCapsuleFormat('json'); });
      dom.formatJsonBtn = formatJsonBtn;

      formatGroup.appendChild(formatMdBtn);
      formatGroup.appendChild(formatJsonBtn);
      aspectHead.appendChild(aspectEyebrow);
      aspectHead.appendChild(formatGroup);

      var aspectGrid = document.createElement('div');
      aspectGrid.className = 'aw-aspect-grid';
      aspectGrid.setAttribute('role', 'group');
      aspectGrid.setAttribute('aria-label', 'Rehydration Capsule Aspects');
      dom.capsuleAspectGrid = aspectGrid;

      aspectBar.appendChild(aspectHead);
      aspectBar.appendChild(aspectGrid);

      /* Active Aspect Header + Telemetry Chips + Copy/Download Actions */
      var capHead = document.createElement('div');
      capHead.className = 'aw-capsule-head';

      var capInfo = document.createElement('div');
      capInfo.className = 'aw-capsule-info';
      var capLabel = document.createElement('label');
      capLabel.className = 'aw-eyebrow aw-label';
      capLabel.setAttribute('for', 'aw-capsule-output');
      capLabel.textContent = 'Session Pass-Down (Markdown)';
      dom.capsuleAspectLabel = capLabel;
      var capSummary = document.createElement('p');
      capSummary.className = 'aw-capsule-summary';
      dom.capsuleAspectSummary = capSummary;
      capInfo.appendChild(capLabel);
      capInfo.appendChild(capSummary);

      var capMetaRow = document.createElement('div');
      capMetaRow.className = 'aw-capsule-meta-row';

      var capChips = document.createElement('div');
      capChips.className = 'aw-map-controls';

      var capTokensChip = document.createElement('span');
      capTokensChip.className = 'aw-chip aw-chip--amber';
      capTokensChip.setAttribute('data-capsule-tokens', '');
      capTokensChip.textContent = '~0 tokens';
      dom.capsuleTokensChip = capTokensChip;

      var capBytesChip = document.createElement('span');
      capBytesChip.className = 'aw-chip';
      capBytesChip.setAttribute('data-capsule-bytes', '');
      capBytesChip.textContent = '0 B';
      dom.capsuleBytesChip = capBytesChip;

      var capDigestChip = document.createElement('span');
      capDigestChip.className = 'aw-chip aw-chip--live';
      capDigestChip.setAttribute('data-capsule-digest', '');
      capDigestChip.textContent = 'sha256: ' + state.digestHex.slice(0, 16);
      dom.capsuleDigestChip = capDigestChip;

      capChips.appendChild(capTokensChip);
      capChips.appendChild(capBytesChip);
      capChips.appendChild(capDigestChip);

      var capBtns = document.createElement('div');
      capBtns.className = 'aw-map-controls';
      var copyCapBtn = document.createElement('button');
      copyCapBtn.type = 'button';
      copyCapBtn.className = 'aw-btn aw-btn--sm aw-btn--primary';
      copyCapBtn.setAttribute('data-capsule-copy', '');
      copyCapBtn.textContent = 'Copy Capsule';
      copyCapBtn.addEventListener('click', function () {
        var cap = getCapsule(state.activeCapsuleAspect, state.activeCapsuleFormat);
        copyTextToClipboard(
          cap.text,
          cap.aspectLabel + ' (' + (cap.format === 'json' ? 'JSON v2' : 'Markdown') + ')'
        );
      });
      dom.copyCapBtn = copyCapBtn;

      var dlCapBtn = document.createElement('button');
      dlCapBtn.type = 'button';
      dlCapBtn.className = 'aw-btn aw-btn--sm';
      dlCapBtn.setAttribute('data-capsule-download', '');
      dlCapBtn.textContent = 'Download .md';
      dlCapBtn.addEventListener('click', function () {
        var cap = getCapsule(state.activeCapsuleAspect, state.activeCapsuleFormat);
        if (typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
          var blob = new Blob([cap.text], { type: cap.mimeType });
          var url = URL.createObjectURL(blob);
          var a = document.createElement('a');
          a.href = url;
          a.download = cap.filename;
          document.body.appendChild(a);
          a.click();
          setTimeout(function () {
            if (a.parentNode) a.parentNode.removeChild(a);
            URL.revokeObjectURL(url);
          }, 200);
          setStatus('Downloaded ' + cap.filename + ' (' + formatByteCount(cap.bytes) + ').');
        }
      });
      dom.dlCapBtn = dlCapBtn;

      capBtns.appendChild(copyCapBtn);
      capBtns.appendChild(dlCapBtn);
      capMetaRow.appendChild(capChips);
      capMetaRow.appendChild(capBtns);

      capHead.appendChild(capInfo);
      capHead.appendChild(capMetaRow);

      var capBox = document.createElement('textarea');
      capBox.className = 'aw-capsule-box';
      capBox.id = 'aw-capsule-output';
      capBox.name = 'aw-capsule-output';
      capBox.readOnly = true;
      dom.capsuleBox = capBox;

      /* Rehydrate / Restore Workspace Panel */
      var rehydratePanel = document.createElement('div');
      rehydratePanel.className = 'aw-rehydrate-panel';
      rehydratePanel.setAttribute('aria-label', 'Rehydrate or Restore Capsule');

      var rehHead = document.createElement('div');
      rehHead.className = 'aw-section-head';
      var rehLabel = document.createElement('label');
      rehLabel.className = 'aw-eyebrow aw-label';
      rehLabel.setAttribute('for', 'aw-rehydrate-input');
      rehLabel.textContent = 'Rehydrate / Restore From Capsule JSON';
      var rehSchemaChip = document.createElement('span');
      rehSchemaChip.className = 'aw-chip';
      rehSchemaChip.textContent = 'JSON v2 / v1';
      rehHead.appendChild(rehLabel);
      rehHead.appendChild(rehSchemaChip);

      var rehInput = document.createElement('textarea');
      rehInput.className = 'aw-rehydrate-box';
      rehInput.id = 'aw-rehydrate-input';
      rehInput.name = 'aw-rehydrate-input';
      rehInput.placeholder = 'Paste Aether Capsule JSON v2 (or legacy pass-down v1) here, or load a local .json capsule file...';
      dom.rehydrateInput = rehInput;

      var rehActions = document.createElement('div');
      rehActions.className = 'aw-rehydrate-actions';

      var rehApplyBtn = document.createElement('button');
      rehApplyBtn.type = 'button';
      rehApplyBtn.className = 'aw-btn aw-btn--sm aw-btn--amber';
      rehApplyBtn.setAttribute('data-aw-rehydrate-apply', '');
      rehApplyBtn.textContent = 'Rehydrate / Restore';
      rehApplyBtn.addEventListener('click', function () {
        rehydrateCapsule(rehInput.value);
      });

      var rehFileLabel = document.createElement('label');
      rehFileLabel.className = 'aw-sr-only';
      rehFileLabel.setAttribute('for', 'aw-rehydrate-file-input');
      rehFileLabel.textContent = 'Choose local capsule JSON file to rehydrate';

      var rehFileInput = document.createElement('input');
      rehFileInput.type = 'file';
      rehFileInput.accept = '.json,application/json';
      rehFileInput.className = 'aw-file-input';
      rehFileInput.id = 'aw-rehydrate-file-input';
      rehFileInput.name = 'aw-rehydrate-file-input';
      rehFileInput.setAttribute('tabindex', '-1');
      rehFileInput.addEventListener('change', function () {
        var f = rehFileInput.files && rehFileInput.files[0];
        if (!f || typeof FileReader === 'undefined') return;
        var reader = new FileReader();
        reader.onload = function () {
          var rawText = String(reader.result || '');
          rehInput.value = rawText;
          rehydrateCapsule(rawText);
        };
        reader.readAsText(f);
        rehFileInput.value = '';
      });

      var rehUploadBtn = document.createElement('button');
      rehUploadBtn.type = 'button';
      rehUploadBtn.className = 'aw-btn aw-btn--sm';
      rehUploadBtn.setAttribute('data-aw-rehydrate-upload', '');
      rehUploadBtn.textContent = 'Load Capsule .json';
      rehUploadBtn.addEventListener('click', function () { rehFileInput.click(); });

      var rehClearBtn = document.createElement('button');
      rehClearBtn.type = 'button';
      rehClearBtn.className = 'aw-btn aw-btn--sm aw-btn--ghost';
      rehClearBtn.setAttribute('data-aw-rehydrate-clear', '');
      rehClearBtn.textContent = 'Clear Input';
      rehClearBtn.addEventListener('click', function () {
        rehInput.value = '';
        setRehydrateFeedback('idle', '');
      });

      rehActions.appendChild(rehApplyBtn);
      rehActions.appendChild(rehUploadBtn);
      rehActions.appendChild(rehClearBtn);
      rehActions.appendChild(rehFileLabel);
      rehActions.appendChild(rehFileInput);

      var rehFeedback = document.createElement('div');
      rehFeedback.className = 'aw-rehydrate-feedback';
      rehFeedback.id = 'aw-rehydrate-feedback';
      rehFeedback.setAttribute('role', 'status');
      rehFeedback.setAttribute('aria-live', 'polite');
      rehFeedback.setAttribute('aria-atomic', 'true');
      rehFeedback.hidden = true;
      dom.rehydrateFeedback = rehFeedback;

      rehydratePanel.appendChild(rehHead);
      rehydratePanel.appendChild(rehInput);
      rehydratePanel.appendChild(rehActions);
      rehydratePanel.appendChild(rehFeedback);

      capWrap.appendChild(synthBar);
      capWrap.appendChild(aspectBar);
      capWrap.appendChild(capHead);
      capWrap.appendChild(capBox);
      capWrap.appendChild(rehydratePanel);
      dom.tabPanels.capsule = capWrap;
      outputPane.appendChild(capWrap);

      workspace.appendChild(outputPane);
      shell.appendChild(workspace);

      /* 5. Studio Footer */
      var footer = document.createElement('footer');
      footer.className = 'aw-footer';
      var attr = document.createElement('span');
      attr.textContent = 'Built with the Free Aether 30-Day Kit · Start Day 1: Free · Author: ' + manifest.meta.author;
      var statusMsg = document.createElement('span');
      statusMsg.className = 'aw-status-msg';
      statusMsg.setAttribute('aria-live', 'polite');
      statusMsg.textContent = state.statusMessage;
      dom.statusMsg = statusMsg;

      footer.appendChild(attr);
      footer.appendChild(statusMsg);
      shell.appendChild(footer);

      mountEl.appendChild(shell);
    }

    function bindGlobalSync() {
      if (boundGlobalListeners || typeof window === 'undefined' || typeof document === 'undefined') return;
      boundGlobalListeners = true;

      function onExternalDaySelect(ev) {
        if (handledEvents) {
          if (handledEvents.has(ev)) return;
          handledEvents.add(ev);
        }
        var d = (ev && ev.detail) || {};
        if (d._origin === 'aether-refractory') return;

        var mountTarget = document.getElementById('aether-webos-mount');
        if (mountTarget && !mountTarget.querySelector('[data-aether-studio="true"]')) {
          mount(mountTarget, { asyncTabs: true });
        }

        var targetDay = d.day;
        if (!targetDay && d.week) {
          var wkNum = Number(d.week) || 1;
          var firstDay = manifest.days.find(function (x) { return x.week === wkNum; });
          targetDay = firstDay ? firstDay.day : 1;
        }
        if (targetDay) {
          selectDay(targetDay, {
            silent: true,
            switchKit: typeof d.switchKit === 'boolean' ? d.switchKit : !state.isDirty,
            async: true
          });
        }
      }

      window.addEventListener('aether:day-select', onExternalDaySelect);
      document.addEventListener('aether:day-select', onExternalDaySelect);

      document.addEventListener('click', function (ev) {
        var target = ev.target && ev.target.closest ? ev.target : null;
        if (!target) return;

        var startEl = target.closest('[data-aether-start]');
        if (startEl) {
          var mountTarget = document.getElementById('aether-webos-mount');
          if (mountTarget && !mountTarget.querySelector('[data-aether-studio="true"]')) {
            mount(mountTarget, { asyncTabs: true });
          }
        }

        var exportEl = target.closest('[data-aether-export]');
        if (exportEl && (!state.mountEl || !state.mountEl.contains(exportEl))) {
          ev.preventDefault();
          var res = exportKit();
          var fbExport = document.getElementById('resolve-feedback') || document.querySelector('[data-aether-feedback]');
          if (fbExport && res) {
            fbExport.textContent = 'Exported offline WebOS HTML kit: ' + res.filename + ' (' + Math.round(res.bytes / 1024) + ' KB).';
          }
          return;
        }

        var shareEl = target.closest('[data-aether-share]');
        if (shareEl && (!state.mountEl || !state.mountEl.contains(shareEl))) {
          ev.preventDefault();
          if (!shareEl.getAttribute('data-aether-orig-label')) {
            shareEl.setAttribute('data-aether-orig-label', shareEl.textContent);
          }
          var origLabel = shareEl.getAttribute('data-aether-orig-label');
          Promise.resolve(copyShareNote()).then(function (ok) {
            var fbShare = document.getElementById('resolve-feedback') || document.querySelector('[data-aether-feedback]');
            if (fbShare) {
              fbShare.textContent = ok
                ? '472px share brief copied for Day ' + state.activeDay + '.'
                : 'Share brief ready inside Capsule panel for Day ' + state.activeDay + '.';
            }
            if (ok) {
              if (shareEl._copyTimer) clearTimeout(shareEl._copyTimer);
              shareEl.textContent = 'Copied 472px Brief';
              shareEl._copyTimer = setTimeout(function () {
                shareEl.textContent = origLabel;
              }, 2200);
            }
          });
        }
      });

      window.addEventListener('aether:export-request', function () {
        exportKit();
      });
    }

    function mount(target, mountOpts) {
      if (typeof document === 'undefined') return null;
      var el = typeof target === 'string'
        ? document.querySelector(target)
        : (target || document.getElementById('aether-webos-mount'));

      if (!el) return null;
      if (lazyObserver) {
        lazyObserver.disconnect();
        lazyObserver = null;
      }
      if (state.mountEl === el && el.querySelector('[data-aether-studio="true"]')) {
        return api;
      }

      var presetSurface = el.getAttribute('data-aw-surface');
      if (presetSurface === 'paper' || presetSurface === 'obsidian') {
        state.surface = presetSurface;
      } else {
        el.setAttribute('data-aw-surface', state.surface);
      }
      el.setAttribute('data-aw-hydrated', 'true');

      state.mountEl = el;
      buildStudioDom(el);
      renderKitButtons(true);
      renderMentorshipBar(true);
      bindGlobalSync();

      if (mountOpts && mountOpts.asyncTabs) {
        ensureParsed();
        renderMetrics();
        renderPanelById(state.activeTab);
        dirtyPanels.mindmap = state.activeTab !== 'mindmap';
        dirtyPanels.dualview = state.activeTab !== 'dualview';
        dirtyPanels.lexicon = state.activeTab !== 'lexicon';
        dirtyPanels.capsule = state.activeTab !== 'capsule';
        selectTab(state.activeTab);
        var hydrateSeq = renderSeq;
        yieldToMain().then(function () {
          if (hydrateSeq !== renderSeq) return;
          if (dirtyPanels.mindmap) renderPanelById('mindmap');
          if (dirtyPanels.dualview) renderPanelById('dualview');
          return yieldToMain();
        }).then(function () {
          if (hydrateSeq !== renderSeq) return;
          if (dirtyPanels.lexicon) renderPanelById('lexicon');
          if (dirtyPanels.capsule) renderPanelById('capsule');
          refreshDigestAndCapsule();
          reloadContext(false);
        });
      } else {
        reparseAndRender(false);
        selectTab(state.activeTab);
        reloadContext(false);
      }
      return api;
    }

    function armLazyMount(mountEl) {
      if (!mountEl || lazyArmed) return;
      lazyArmed = true;
      var preset = mountEl.getAttribute('data-aw-surface');
      if (preset !== 'paper' && preset !== 'obsidian') {
        mountEl.setAttribute('data-aw-surface', state.surface);
      } else {
        state.surface = preset;
      }
      bindGlobalSync();

      if (mountEl.querySelector('[data-aether-studio="true"]')) return;

      if (typeof IntersectionObserver === 'function') {
        lazyObserver = new IntersectionObserver(function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting || entries[i].intersectionRatio > 0) {
              if (lazyObserver) {
                lazyObserver.disconnect();
                lazyObserver = null;
              }
              mount(mountEl, { asyncTabs: true });
              break;
            }
          }
        }, { rootMargin: '450px 0px' });
        lazyObserver.observe(mountEl);
      } else {
        mount(mountEl, { asyncTabs: true });
      }
    }

    function initFromDom() {
      if (typeof document === 'undefined') return;
      bindGlobalSync();
      var mountEl = document.getElementById('aether-webos-mount');
      if (!mountEl) return;
      if (mountEl.getAttribute('data-aw-lazy') === 'true') {
        armLazyMount(mountEl);
      } else {
        mount(mountEl);
      }
    }

    function getState() {
      var parsed = ensureParsed();
      return {
        surface: state.surface,
        activeKitId: state.activeKitId,
        activeTab: state.activeTab,
        activeDay: state.activeDay,
        week: state.activeDayObj.week,
        phase: state.activeDayObj.phase,
        title: state.activeDayObj.title,
        prompt: state.activeDayObj.prompt,
        deliverable: state.activeDayObj.deliverable,
        kitId: state.activeDayObj.kitId,
        markdown: state.markdown,
        digestHex: state.digestHex,
        digest16: (state.digestHex || '').slice(0, 16),
        activeCapsuleAspect: state.activeCapsuleAspect,
        activeCapsuleFormat: state.activeCapsuleFormat,
        capsuleDigest16: (state.activeCapsuleDigestHex || state.digestHex || '').slice(0, 16),
        capsuleTokens: state.activeCapsuleTokens,
        capsuleBytes: state.activeCapsuleBytes,
        synthesisSource: state.synthesisSource,
        synthesisConnected: state.synthesisConnected,
        meta: cloneJson(manifest.meta),
        parsed: cloneJson(parsed)
      };
    }

    var api = {
      version: '2.1.0',
      mount: mount,
      selectDay: selectDay,
      selectKit: selectKit,
      selectTab: selectTab,
      setSurface: setSurface,
      exportKit: exportKit,
      exportHtml: exportKit,
      copyShareNote: copyShareNote,
      reloadContext: reloadContext,
      importContextJson: importContextJson,
      getCapsule: getCapsule,
      rehydrateCapsule: rehydrateCapsule,
      selectCapsuleAspect: selectCapsuleAspect,
      selectCapsuleFormat: selectCapsuleFormat,
      getState: getState,
      _parseNote: parseNote,
      _sha256Hex: computeSha256Hex,
      _initFromDom: initFromDom
    };

    return api;
  }

  var controller = createController();

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () {
        controller._initFromDom();
      });
    } else {
      controller._initFromDom();
    }
  }

  return controller;
}));
