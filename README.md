# Aether WebOS Kit (`Aether`)

Zero-budget Common-Man Agentic Setup Kit and 30-Day Mentorship studio built by **Eloquent (`@mjeanhudson-dev`)**.

Turn plain-English everyday notes into a spatial SVG Mind-Map, clean Dual-View reading plan, structured Lexicon/Wiki/Soul memory, and a portable single-file offline `.html` operating kit right in your browser.

---

## Architecture & Repository Layout

| Path | Purpose |
|---|---|
| `index.html` | Six-act Scroll-Craft experience (`pin[2.1] > pan[4.2] > pin[1.7] > pin[3.6, dwell=0.40] > flow > flow`), Warm Alabaster vs. Obsidian cleavage opening, unboxed 6-plate corridor, Mirror Void pause, Sobel PBR WebGL Peak, borderless studio, and 472px colophon |
| `styles/site.css` | Cleaved Mineral Precision palette tokens (`#F2EFE8`, `#07090D`, `#080A0E`, `#030508`, `#05070B`, `#ECEAE4`, `#A8B0BC`, `#E27A2C`), self-hosted `BricolageGrotesque` + `RedHatMono` WOFF2 `@font-face` rules, and responsive framing down to `360x640` |
| `webgl/artifact-shader.js` | Single-pass, loop-free Sobel PBR WebGL image-relighting shader over three macro mineral plates (`artifact-mercury.webp`, `artifact-poster.webp`, `artifact-crystal.webp`) with staggered uploads, static paused redraws, and 3-plate CSS cross-fade fallback |
| `scripts/stage-choreography.js` | Scroll-Craft mount, GPU-composited Act 1/3/4 transforms and pointer routing, inline `floorplan-codex` preview, focus safety, and `aether:day-select` synchronization |
| `webos/refractory.css` | Scoped borderless hairline styles for `#aether-webos-mount` with Deep Obsidian (`#080A0E`) and Warm Paper (`#F2EFE8`) contrast surfaces |
| `webos/refractory.js` | Lazy-hydrated plain-English parser, in-place SVG Mind-Map Floorplan, Dual-View Reader, Lexicon/Wiki/Soul extractor, SHA-256 25-Turn Capsule, and `aether:day-select` sync |
| `webos/exporter.js` | Single-file offline `.html` WebOS kit packager (Obsidian & Warm Paper surfaces), `472px` HTML email dispatch, and plain-text share-note generator |
| `context/terminal-synthesis.json` | Hot-swappable manifest (`meta`, `4` Starter Kits, `4` Weeks, `30` Daily Prompts) loaded dynamically by the studio |
| `scripts/build-assets.mjs` | Deterministic studio asset pipeline rendering 7 macro geological WebP plates (RGBA alpha cutouts + `#030508`/`#05070B` obsidian plates) with `./assets/*.webp.json` provenance sidecars |
| `scripts/pack-squarespace.mjs` | Deterministic Squarespace `/s/` packager enforcing CSS cascade order, WOFF2 `url()` rewrites, scoped embed styles, and exact SHA-256 `manifest.json` parity |
| `fonts/` | Self-hosted WOFF2 typography (`BricolageGrotesque` Regular/Bold + `RedHatMono` Regular/Bold, `103.0 KB` total) with archival TTF sources |
| `squarespace/` | Pre-packaged Squarespace `/s/` upload bundle (`blank-page-head.html`, `blank-page-body.html`, `code-block-embed.html`, `iframe-embed.html`, `manifest.json`) |
| `BRIEF.md` | Scroll-Craft creative brief, 6-act feeling curve (`11.6vh` pinned/panned), visual world synthesis, and hygiene invariants |
| `DESIGN.md` | Canonical v2.1 Cleaved Mineral Precision design system specification |
| `FINGERPRINTS.md` | Append-only Scroll-Craft uniqueness ledger |

---

## Running Locally

Because browsers restrict `fetch("./context/terminal-synthesis.json")` and WebGL `texImage2D` over `file://`, serve the workspace root with any static HTTP server (embedded fallback data and the 3-plate CSS cross-fade fallback still keep the Refractory and Act 4 stage interactive offline via `file://`):

```bash
cd ~/.gemini/antigravity/scratch/aether-webos-rollout
node ~/.gemini/config/plugins/scroll-craft/skills/scroll-craft/scripts/serve.mjs --root . --port 4500
```

Then open `http://127.0.0.1:4500/` in Chrome or any modern browser.

---

## Hot-Swapping `context/terminal-synthesis.json`

1. Edit `./context/terminal-synthesis.json` (or drop in an updated manifest matching the `meta`, `kits[4]`, `mentorship.weeks[4]`, `mentorship.days[30]` schema).
2. Click **Reload Terminal Context** or **Import JSON** inside Tab 4 (`25-Turn Rehydration Capsule`) of the embedded WebOS Refractory to refresh kits and daily mentorship prompts without modifying source code.

---

## Starter Kits & 30-Day Curriculum

- **4 Everyday Starter Kits:** `household-clarity`, `local-service-launch`, `creator-30day-system`, `community-teaching-hub`.
- **4 Weekly Phases (30 Days):**
  - **Week 1 (Days 1 to 7):** Voice & Personal Lexicon
  - **Week 2 (Days 8 to 15):** Visual Mind-Maps & Floorplans
  - **Week 3 (Days 16 to 23):** Zero-Code Agentic Sprints
  - **Week 4 (Days 24 to 30):** Ship & Share Offline Kit

---

## Verification & Public Hygiene Gate

Run Scroll-Craft visual verification across desktop, mobile (`390x844`), compact (`360x640`), and reduced-motion states, then confirm public push hygiene before publishing:

```bash
node ~/tools/verify-public-push.mjs ~/.gemini/antigravity/scratch/aether-webos-rollout
```

---

## License

MIT License. Copyright (c) 2026 **Eloquent (`@mjeanhudson-dev`)**. See [LICENSE](./LICENSE).
