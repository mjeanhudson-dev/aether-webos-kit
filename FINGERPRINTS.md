# Fingerprints

Every site you build with **scroll-craft** gets one row here, appended after it
ships. The registry exists so your next build can prove it is a different page
rather than a re-skin of one you already made.

This file is **yours**. It starts empty on purpose: the gate is about not
repeating *yourself*, so it has nothing to say until you have built something.

The rules and the gate live in the skill's
`references/uniqueness.md`. Short version:

**A new build must differ from EVERY row below on at least 4 of the 6
dimensions.** Four against each row individually, not four on average across the
table. If a planned build fails, change the plan. Never edit a row to make room
for it.

The six dimensions are: **grammar**, **nav treatment**, **hero device**,
**act-sequence shape**, **close pattern**, **signature move**.

Dimension 6 is free, because a signature move is unique by definition. So the
gate really asks for three more out of the remaining five, and a build that
changes only grammar and world will fail it.

---

## The registry

| Build | Grammar | Nav treatment | Hero device | Act-sequence shape | Close pattern | Signature move | World | Port |
|---|---|---|---|---|---|---|---|---|
| `aether-webos-rollout` | `Live surface` (2.3, 5-plane optical entry) | Floating workbench anchor dock (`AETHER`, 4 jumps, synced Day badge, `Start Day 1: Free`) | `pin[2.8]` 5-plane nocturnal valley parallax framing rising live WebOS preview | 8 acts: `pin[2.8] > flow > scrub[2.4, dwell=0.35] > flow > pin[3.6, dwell=0.42] > flow > pan[2.9] > pin[1.35]` (`13.05vh` pinned/panned, `16.46vh` rendered desktop) | `pin[1.35]` live Day-Prompt Hold synced via `aether:day-select` + `Export My Kit (.html)` + internal colophon | **The Refractory Unfold**: `--sc-p` 4-plane Z-axis note fracture feeding live `#aether-webos-mount` & `.html` export | Nocturnal studio workbench (`#070A10` / `#0F1623`, `#38BDF8`, `#F59E0B`, Outfit + Geist) | `4500` (`Status: superseded`) |
| `aether-webos-rollout-v2` | **Cleaved Split + Live Surface Horizon** (Split opening into heavy horizontal `pan`, mirror silence, single WebGL Peak, and borderless Operate studio) | `60px` bare opaque hairline top bar (`AETHER` left, 4 one-word anchors center, `Start Day 1: Free` right; zero `[data-sc-progress]` spoiler bar and zero `backdrop-filter`) | `pin[2.1]` warm alabaster `#F2EFE8` vs. deep obsidian `#07090D` diagonal cleavage framing organic RGBA meteorite cutout `meteorite-crust.webp` | 6 acts: `pin[2.1] > pan[4.2] > pin[1.7] > pin[3.6, dwell=0.40] > flow > flow` (`11.6vh` pinned/panned + borderless Operate + ledger close) | Non-fading architectural hairline colophon with synced Day prompt, `Start Day 1: Free`, `Export My Kit (.html)`, unlocked `Artifact 01` Git link, and clean colophon | **Liquid-Mercury Widmanstatten Cleavage**: single-pass Sobel PBR WebGL shader (`webgl/artifact-shader.js`, 3 plates) cleaving out of quiet obsidian reflection (`#030508`) into Floorplan geometry & multi-aspect Rehydration Capsules (`webos/capsules.js`, `Markdown` & `JSON v2`) | Warm alabaster `#F2EFE8` to obsidian mirror `#030508`/`#080A0E`, troilite amber `#E27A2C`, 7 geological WebP plates, 4 WOFF2 fonts (`103,004` B), `v2.1.0` manifest, `22` `/s/` uploads (`1,058,554` B) | `4500` (`Status: verified` v2.0 baseline; `v2.1.0` capsules + `22`-file / `1,058,554` B Squarespace bundle packaged) |

*(Row 1 seeded cleanly; future builds must differ from this row on at least 4 of the 6 structural dimensions.)*

---

## What is taken

Add a bullet here whenever a build claims something a later build should avoid
reusing: a grammar, a nav treatment, a close pattern, a signature move, an
act-count-and-length band. The shared columns are what the next build inherits
as a constraint, so writing them down is the whole point.

- **`aether-webos-rollout` (`Status: superseded`):** Claims **`Live surface` (2.3)** grammar, workbench anchor dock with live Day badge, `pin[2.8]` 5-plane nocturnal valley parallax with rising app window, **8 acts (`13.05vh` pinned/panned)** in shape `pin > flow > scrub > flow > pin > flow > pan > pin`, live Day-Prompt Hold close with `.html` kit export, and **The Refractory Unfold** (`--sc-p` 4-plane Z-axis note fracture). Shares nothing with prior rows (first row in local registry).
- **`aether-webos-rollout-v2` (`Status: verified`):** Claims **Cleaved Split + Live Surface Horizon**, `60px` bare opaque hairline bar with zero `[data-sc-progress]` spoiler bar and zero `backdrop-filter`, `pin[2.1]` warm alabaster vs. obsidian cleavage framing organic `meteorite-crust.webp`, **6 acts (`11.6vh` pinned/panned)** in shape `pin[2.1] > pan[4.2] > pin[1.7] > pin[3.6, dwell=0.40] > flow > flow`, non-fading architectural hairline colophon close, and **Liquid-Mercury Widmanstatten Cleavage** (1 GPU-budgeted interactive single-pass Sobel PBR WebGL image-relighting shader over 7 macro geological WebP assets and 4 self-hosted WOFF2 fonts `103,004` B awakening out of Mirror Void reflection into `floorplan-codex` + borderless `#aether-webos-mount` powered by `webos/capsules.js` + `context/terminal-synthesis.json` `v2.1.0` 6-aspect + Master Bundle Rehydration Capsules in `Markdown` & `JSON v2` with live SHA-256 + token counts, 1-click Rehydrate/Restore, offline `.html` export capsules, `Start Day 1: Free` CTA, sole author `Eloquent (@mjeanhudson-dev)`, and `22`-file / `1,058,554`-byte `squarespace/` `/s/` deployment bundle). Differs from `aether-webos-rollout` v1.0 across all 6 structural dimensions.

---

## Appending a row

After shipping, add one line to the table and one bullet to **What is taken** if
the build claimed something new. Fill every column. Say what the build shares
with existing rows.

Rows are append-only. A build that has been superseded stays in the table,
because the space it occupies is still occupied.

---

## Worked example

The skill's author kept a registry of twelve builds across eight page grammars.
If you want to see what a filled-in table looks like, and which shapes tend to
collide, read `EXAMPLES.md` in the scroll-craft repository. Treat it as
illustration only: those rows are somebody else's builds and they do **not**
constrain yours.
