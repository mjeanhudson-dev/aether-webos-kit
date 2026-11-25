---
name: "Aether WebOS Kit"
description: "Cleaved warm alabaster and reflective obsidian design system for Aether WebOS Kit v2.1 by Eloquent (@mjeanhudson-dev)."
colors:
  troilite-amber: "#E27A2C"
  troilite-amber-hover: "#EA8E47"
  troilite-amber-studio-hover: "#ED8C42"
  troilite-amber-ink: "#111214"
  troilite-amber-text-obsidian: "#EA8D44"
  troilite-amber-text-paper: "#984306"
  mirror-void: "#030508"
  peak-stage: "#05070B"
  obsidian: "#07090D"
  obsidian-surface: "#080A0E"
  obsidian-deep: "#0B0E14"
  obsidian-elevated: "#0D1017"
  obsidian-hover: "#10141C"
  obsidian-active: "#141922"
  warm-alabaster: "#F2EFE8"
  warm-alabaster-deep: "#ECE7DE"
  warm-alabaster-elevated: "#EAE5DB"
  warm-alabaster-active: "#E2DDD1"
  alabaster-ink: "#111214"
  alabaster-ink-soft: "#4A4D55"
  platinum: "#ECEAE4"
  steel: "#A8B0BC"
  hairline-obsidian: "rgba(236, 234, 228, 0.14)"
  hairline-obsidian-strong: "rgba(236, 234, 228, 0.28)"
  hairline-paper: "rgba(17, 18, 20, 0.16)"
  hairline-paper-strong: "rgba(17, 18, 20, 0.34)"
  wave-1-cyan: "#67CEFA"
  wave-2-emerald: "#4ADE80"
  wave-1-slate-paper: "#1A5276"
  wave-2-pine-paper: "#145A32"
typography:
  display:
    fontFamily: "BricolageGrotesque, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.4rem, 5.2vw, 4.6rem)"
    fontWeight: 700
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "BricolageGrotesque, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.8rem, 3.2vw, 2.9rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.028em"
  title:
    fontFamily: "BricolageGrotesque, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.45rem, 2.5vw, 2.15rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: "BricolageGrotesque, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1rem, 0.96rem + 0.22vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.56
    letterSpacing: "-0.005em"
  label:
    fontFamily: "RedHatMono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.76rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0.06em"
  mono:
    fontFamily: "RedHatMono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "0em"
rounded:
  none: "0px"
  ctrl: "2px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
  gutter: "clamp(1.25rem, 5vw, 5.5rem)"
  section: "clamp(3.5rem, 6.5vw, 6rem)"
  bar-height: "60px"
  measure-dispatch: "472px"
  measure-maxw: "82rem"
components:
  button-primary:
    backgroundColor: "{colors.troilite-amber}"
    textColor: "{colors.troilite-amber-ink}"
    rounded: "{rounded.ctrl}"
    padding: "0.62rem 1.25rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.troilite-amber-hover}"
    textColor: "{colors.troilite-amber-ink}"
  button-ghost:
    backgroundColor: "{colors.obsidian}"
    textColor: "{colors.platinum}"
    rounded: "{rounded.ctrl}"
    padding: "0.62rem 1.25rem"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.obsidian-hover}"
    textColor: "{colors.platinum}"
  nav-bar:
    backgroundColor: "{colors.obsidian}"
    textColor: "{colors.platinum}"
    height: "60px"
    padding: "0 clamp(1.25rem, 5vw, 5.5rem)"
  studio-shell:
    backgroundColor: "{colors.obsidian-surface}"
    textColor: "{colors.platinum}"
    rounded: "{rounded.none}"
    width: "100%"
  studio-kit-card:
    backgroundColor: "{colors.obsidian-surface}"
    textColor: "{colors.platinum}"
    rounded: "{rounded.none}"
    padding: "0.85rem 1rem"
  studio-kit-card-active:
    backgroundColor: "{colors.obsidian-active}"
    textColor: "{colors.platinum}"
  studio-chip:
    backgroundColor: "{colors.obsidian-elevated}"
    textColor: "{colors.steel}"
    rounded: "{rounded.ctrl}"
    padding: "0.22rem 0.55rem"
  studio-tab:
    backgroundColor: "transparent"
    textColor: "{colors.steel}"
    rounded: "{rounded.none}"
    padding: "0.55rem 0.75rem"
    height: "40px"
  studio-input:
    backgroundColor: "{colors.obsidian-deep}"
    textColor: "{colors.platinum}"
    rounded: "{rounded.none}"
    padding: "1rem 1.1rem"
  colophon-measure:
    backgroundColor: "{colors.obsidian}"
    textColor: "{colors.platinum}"
    width: "472px"
---

# Design System: Aether WebOS Kit

<!-- impeccable:design-map -->
Name: Aether WebOS Kit
Colors: primary: troilite-amber #E27A2C; secondary: wave-1-cyan #67CEFA; neutral: mirror-void #030508; primary: troilite-amber-hover #EA8E47; primary: troilite-amber-studio-hover #ED8C42 (+25 more in the sidecar)
Fonts: BricolageGrotesque (display, headline, title, body); RedHatMono (label, mono)
Spacing: xs 0.25rem, sm 0.5rem, md 1rem, lg 1.5rem, xl 2.5rem, gutter clamp(1.25rem, 5vw, 5.5rem), section clamp(3.5rem, 6.5vw, 6rem), bar-height 60px, measure-dispatch 472px, measure-maxw 82rem
Radius: none 0px, ctrl 2px
North Star: "Cleaved Mineral Precision"
Rules:
- The Cleaved Polarity Rule. Pair Warm Alabaster (`#F2EFE8`, `#111214`) directly against Obsidian (`#07090D`, `#ECEAE4`, `#A8B0BC`) along 1px seams rather than blending mid-grays.
- The Molten Troilite Reserve Rule. Restrict `#E27A2C` strictly to primary actions, active landmarks, and mineral glints; pair solid fills with `#111214` ink and shift inline amber text to `#EA8D44` (obsidian) or `#984306` (paper).
- The Scoped Dual-Surface Rule. Confine `[data-aw-surface="obsidian"|"paper"]` toggling to `#aether-webos-mount` so narrative acts hold fixed lighting.
- The Two-Voice Self-Hosted Rule. Serve only self-hosted `BricolageGrotesque` (preloaded) and `RedHatMono` WOFF2 fonts from `./fonts/` with `font-synthesis-weight: none`; never add third-party font stylesheets or unnecessary above-fold preload stalls.
- The Monospace Measurement Rule. Reserve `RedHatMono` (`tabular-nums`) for digests, day indices, coordinates, and Markdown/capsule text editors rather than decorative prose.
- (+5 more)
Don't:
- Don't add `[data-sc-progress]` bars, `01 / 06` section counters, `backdrop-filter` blur, `box-shadow` glows, or `border-radius` above `2px`.
- Don't add kickers or eyebrows above headings, synthetic weights outside `400`/`700`, or remote font CDN links.
- Don't run multiple WebGL contexts or leave `requestAnimationFrame` active offscreen or under `prefers-reduced-motion: reduce`.
- Don't mask mineral cutouts with CSS `clip-path` geometry instead of true RGBA alpha mattes.
- Don't edit `./scrollcraft.js` or `./scrollcraft.css`, leak local OS usernames, or fabricate user quotes or metrics.
Full: .impeccable/design-full.md (read a section when you need its detail)

---

## v2.1 Runtime, Rehydration Capsules & Packaging Parity

- **Author & Primary CTA:** Sole author `Eloquent (@mjeanhudson-dev)`; primary CTA locked verbatim across nav, hero, studio, colophon, and offline exports as `Start Day 1: Free`.
- **Self-Hosted Typography (`./fonts/`):** 4 WOFF2 faces (`BricolageGrotesque-Bold.woff2` `37,656` B, `BricolageGrotesque-Regular.woff2` `38,064` B, `RedHatMono-Regular.woff2` `13,568` B, `RedHatMono-Bold.woff2` `13,716` B; `103,004` bytes total, zero external font requests).
- **Geological Media & Single-Pass Sobel PBR Shader:** 7 macro WebP assets (`meteorite-crust.webp` `1200x1200`, `shard-01.webp` `640x640`, `shard-02.webp` `640x640`, `impact-void.webp` `1440x900`, `artifact-poster.webp` `1440x900`, `artifact-mercury.webp` `1280x720`, `artifact-crystal.webp` `1280x720`) paired with `./webgl/artifact-shader.js` (single-pass, loop-free Sobel PBR relighting with `fitCover` cursor meniscus, static paused redraws via `Pause shader` / `Resume shader`, and 3-plate CSS cross-fade fallback).
- **Tab 4 Rehydration Capsules UI (`./webos/capsules.js`, `./webos/refractory.js`, `./webos/refractory.css`, `./context/terminal-synthesis.json` `v2.1.0`):**
  - Borderless 1px-hairline 4-column desktop / 2-column mobile aspect grid (`.aw-aspect-grid`, `.aw-aspect-btn`, `.aw-aspect-btn--bundle`) across 6 specialized aspects (`session-passdown`, `floorplan-waves`, `lexicon-soul`, `swarm-handoff`, `offline-portability`, `compact-prompt` under `500` tokens) + `master-bundle` (`aria-pressed`), segmented `Markdown` / `JSON v2` toggle (`.aw-format-toggle`, `aether.rehydration.capsule.v2` + legacy `aether.compaction.passdown.v1`), live SHA-256 + `~N tokens` + UTF-8 byte telemetry chips, Copy/Download handlers, and 1-click Rehydrate/Restore panel (`.aw-rehydrate-panel`, `.aw-rehydrate-feedback--ok` `#4ADE80` obsidian / `#145A32` paper, `.aw-rehydrate-feedback--error` `#F87171` obsidian / `#B42318` paper).
- **Offline Export Capsules (`./webos/exporter.js` `v2.1.0`):** Standalone single-file `.html` exports embed all 6 aspects + Master Bundle (`Markdown` & `JSON v2`) in an interactive offline Capsules tab with `aria-pressed` selectors, clipboard fallback, `.md`/`.json` `Blob` downloads, zero-rebuild SVG pan + `Fit`, Obsidian/Paper surface switch, and `472px` transactional email dispatch.
- **Squarespace `/s/` Bundle (`./scripts/pack-squarespace.mjs`, `./squarespace/`):** `22` hashed upload files under `./squarespace/upload-to-s/` totaling `1,058,554` bytes mapped in `./squarespace/manifest.json` with WOFF2 `url()` rewrites, scoped `[data-sc-embed]` isolation, stylesheet cascade `scrollcraft*.css -> webos-refractory-*.css -> styles-site*.css`, and deferred script order `capsules -> exporter -> refractory -> artifact-shader -> stage-choreography`.
