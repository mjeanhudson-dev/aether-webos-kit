# Aether WebOS Kit (`Aether`)

Zero-budget Common-Man Agentic Setup Kit and 30-Day Mentorship studio built by **Eloquent (`@mjeanhudson-dev`)**.

Turn plain-English everyday notes into a spatial SVG Mind-Map, clean Dual-View reading plan, structured Lexicon/Wiki/Soul memory, multi-aspect Rehydration Capsules (`Markdown` and `JSON v2`), and a portable single-file offline `.html` operating kit right in your browser (`Start Day 1: Free`).

---

## Architecture & Repository Layout

| Path | Purpose |
|---|---|
| `index.html` | Six-act Scroll-Craft experience (`pin[2.1] > pan[4.2] > pin[1.7] > pin[3.6, dwell=0.40] > flow > flow`), Warm Alabaster vs. Obsidian cleavage opening, unboxed 6-plate corridor, Mirror Void pause, Sobel PBR WebGL Peak, borderless studio (`Start Day 1: Free`), and 472px colophon |
| `styles/site.css` | Cleaved Mineral Precision palette tokens (`#F2EFE8`, `#07090D`, `#080A0E`, `#030508`, `#05070B`, `#ECEAE4`, `#A8B0BC`, `#E27A2C`), self-hosted `BricolageGrotesque` + `RedHatMono` WOFF2 `@font-face` rules, and responsive framing down to `360x640` |
| `webgl/artifact-shader.js` | Single-pass, loop-free Sobel PBR WebGL image-relighting shader over three macro mineral plates (`artifact-mercury.webp`, `artifact-poster.webp`, `artifact-crystal.webp`) with `fitCover` cursor meniscus, static paused redraws (`Pause shader` / `Resume shader`), and 3-plate CSS cross-fade fallback |
| `scripts/stage-choreography.js` | Scroll-Craft mount (`sqs-edit-mode-active` and double-mount guarded), GPU-composited Act 1/3/4 transforms and pointer routing, inline `floorplan-codex` preview, focus safety, and `aether:day-select` synchronization |
| `webos/capsules.js` | Zero-dependency UMD Rehydration Capsule engine (`window.AetherCapsules` / `module.exports`, `v2.1.0`) supporting schema `aether.rehydration.capsule.v2` (+ legacy `aether.compaction.passdown.v1`), 6 specialized aspects (`session-passdown`, `floorplan-waves`, `lexicon-soul`, `swarm-handoff`, `offline-portability`, `compact-prompt` under `500` tokens) + `master-bundle`, `Markdown` & `JSON v2` builders, deterministic FIPS 180-4 / WebCrypto SHA-256 digests, token estimation, and 1-click `parseCapsuleForRehydrate` |
| `webos/refractory.css` | Scoped borderless 1px hairline styles for `#aether-webos-mount` with Deep Obsidian (`#080A0E`) and Warm Paper (`#F2EFE8`) contrast surfaces, Tab 4 aspect grid, format toggle, and accessible Rehydrate feedback states |
| `webos/refractory.js` | Lazy-hydrated plain-English parser, in-place SVG Mind-Map Floorplan, Dual-View Reader, Lexicon/Wiki/Soul extractor, Tab 4 `Rehydration Capsules` (6-aspect + Master Bundle selector, `Markdown`/`JSON v2` toggle, live SHA-256 + `~N tokens` + byte telemetry, 1-click `Rehydrate / Restore` via paste or `.json` file upload), and `aether:day-select` sync (`mount`, `selectDay`, `selectKit`, `selectTab`, `setSurface`, `exportKit`, `exportHtml`, `copyShareNote`, `reloadContext`, `importContextJson`, `getCapsule`, `rehydrateCapsule`, `selectCapsuleAspect`, `selectCapsuleFormat`, `getState`) |
| `webos/exporter.js` | Single-file offline `.html` WebOS kit packager (`v2.1.0`) embedding an interactive 6-aspect + Master Bundle Capsules tab (`Markdown` & `JSON v2`, `aria-pressed` aspect switches, clipboard fallback, `.md`/`.json` `Blob` downloads), Obsidian & Warm Paper surfaces, zero-rebuild SVG pan + `Fit`, `472px` HTML email dispatch, and plain-text share-note generator |
| `context/terminal-synthesis.json` | Hot-swappable `v2.1.0` manifest (`meta`, `4` Starter Kits, `4` Weeks, `30` Daily Prompts, `7` `capsuleAspects` descriptors) loaded dynamically by the studio |
| `scripts/build-assets.mjs` | Deterministic studio asset pipeline rendering 7 macro geological WebP plates (`meteorite-crust.webp` `1200x1200`, `shard-01.webp` `640x640`, `shard-02.webp` `640x640`, `impact-void.webp` `1440x900`, `artifact-poster.webp` `1440x900`, `artifact-mercury.webp` `1280x720`, `artifact-crystal.webp` `1280x720`) with `./assets/*.webp.json` provenance sidecars |
| `scripts/pack-squarespace.mjs` | Deterministic Squarespace `/s/` packager enforcing CSS cascade order (`scrollcraft*.css -> webos-refractory-*.css -> styles-site*.css`), deferred script order (`capsules -> exporter -> refractory -> artifact-shader -> stage-choreography`), WOFF2 `url()` rewrites, scoped embed isolation, and exact SHA-256 `manifest.json` parity |
| `fonts/` | Self-hosted WOFF2 typography (`BricolageGrotesque-Regular.woff2`, `BricolageGrotesque-Bold.woff2`, `RedHatMono-Regular.woff2`, `RedHatMono-Bold.woff2`, `103,004` bytes total across 4 WOFF2 faces) |
| `squarespace/` | Pre-packaged Squarespace `/s/` upload bundle (`blank-page-head.html`, `blank-page-body.html`, `code-block-embed.html`, `iframe-embed.html`, `manifest.json`, and `upload-to-s/` with `22` hashed upload files totaling `1,058,554` bytes) |
| `BRIEF.md` | Scroll-Craft creative brief, 6-act feeling curve (`11.6vh` pinned/panned), visual world synthesis, `v2.1.0` capsule architecture, and hygiene invariants |
| `DESIGN.md` | Canonical v2.1 Cleaved Mineral Precision design system specification |
| `FINGERPRINTS.md` | Append-only Scroll-Craft uniqueness ledger |
| `PRODUCT.md` | Product scope, user positioning, capabilities, and v2.1.0 constraints |

---

## Running Locally

Because browsers restrict `fetch("./context/terminal-synthesis.json")` and WebGL `texImage2D` over `file://`, serve the workspace root with any static HTTP server (embedded fallback data, synchronous FIPS 180-4 SHA-256 digests, and the 3-plate CSS cross-fade fallback still keep the Refractory, Rehydration Capsules, and Act 4 stage interactive offline via `file://`):

```bash
cd ~/.gemini/antigravity/scratch/aether-webos-rollout
node ~/.gemini/config/plugins/scroll-craft/skills/scroll-craft/scripts/serve.mjs --root . --port 4500
```

Then open `http://127.0.0.1:4500/` in Chrome or any modern browser and click **Start Day 1: Free**.

---

## Rehydration Capsules & Hot-Swapping `context/terminal-synthesis.json`

1. Edit `./context/terminal-synthesis.json` (matching the `v2.1.0` schema: `meta`, `kits[4]`, `mentorship.weeks[4]`, `mentorship.days[30]`, `capsuleAspects[7]`).
2. Open Tab 4 (`Rehydration Capsules`) in the embedded WebOS Refractory to switch across the 6 specialized aspects (`session-passdown`, `floorplan-waves`, `lexicon-soul`, `swarm-handoff`, `offline-portability`, `compact-prompt` under `500` tokens) plus `master-bundle`, toggle between `Markdown` and `JSON v2` (`aether.rehydration.capsule.v2`), inspect live `~N tokens` + byte counts + SHA-256 digests, copy or download `.md`/`.json`, or click **Rehydrate / Restore** (paste JSON or choose a local `.json` capsule file) alongside **Reload Terminal Context** and **Import JSON**.
3. Click **Export My Kit (.html)** to generate a standalone single-file offline `.html` kit carrying all 6 aspects and Master Bundle (`Markdown` & `JSON v2`) in airplane mode.

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

Confirm public push hygiene before publishing:

```bash
node ~/tools/verify-public-push.mjs ~/.gemini/antigravity/scratch/aether-webos-rollout
```

---

## License

MIT License. Copyright (c) 2026 **Eloquent (`@mjeanhudson-dev`)**. See [LICENSE](./LICENSE).

## v2.2.0 additions

- **`#act-solutions`**: three plain rows for offline workspaces, private AI assistants that run on your machine, and websites and tools you own, with a public scoping-request button.
- **`#act-support`**: honest backing paths. The sponsor button is a disabled control until a real payment page exists.
- **Funding files**: `.github/FUNDING.yml` (all channels commented out, GitHub Sponsors listing not approved on 2026-11-25), `context/funding.json` (static manifest, nothing connected), `workers/funding-webhook.js` and `workers/wrangler.toml` (optional Cloudflare Worker, untested against live deliveries), and the research brief at `docs/MONETIZATION_AND_PAYMENTS.md`.
- **Deploy**: `.github/workflows/deploy-pages.yml` (set repo Settings, Pages, Source to GitHub Actions once), `.github/workflows/deploy-cloudflare.yml` (skips itself until `CLOUDFLARE_API_TOKEN` exists), `_headers`, and the Squarespace `/s/` pack from `node scripts/pack-squarespace.mjs`.
- **Imagery**: unchanged from v2.1. The image generator available today tops out near 1024 to 1376 pixels, below the existing plates, so no upscaled "2x" files are shipped.
