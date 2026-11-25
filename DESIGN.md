---
name: "Aether WebOS Kit"
description: "Concentric sculpted mineral widget and freeze-frame meteorite detonation design system for Aether WebOS Kit v2.4 by Eloquent (@mjeanhudson-dev)."
colors:
  troilite-amber: "#E27A2C"
  troilite-amber-hover: "#EC8B40"
  troilite-amber-studio-hover: "#ED8C42"
  troilite-amber-ink: "#111214"
  troilite-amber-text-obsidian: "#F08A38"
  troilite-amber-text-paper: "#964205"
  mirror-void: "#030508"
  peak-stage: "#05070B"
  obsidian: "#07090D"
  obsidian-surface: "#090C12"
  obsidian-dock: "#0D1119"
  obsidian-card: "#0E131D"
  obsidian-studio-card: "#10151F"
  obsidian-deep: "#0C1018"
  obsidian-elevated: "#131A27"
  obsidian-active: "#171F2E"
  warm-alabaster: "#F4F0E8"
  paper-card: "#FFFFFF"
  warm-alabaster-deep: "#EAE4D8"
  warm-alabaster-active: "#E2DBD0"
  alabaster-ink: "#121417"
  alabaster-ink-soft: "#484D56"
  platinum: "#F4F1EA"
  steel: "#B4BCC8"
  hairline-obsidian: "rgba(244, 241, 234, 0.13)"
  hairline-obsidian-strong: "rgba(244, 241, 234, 0.26)"
  hairline-paper: "rgba(18, 20, 23, 0.13)"
  hairline-paper-strong: "rgba(18, 20, 23, 0.28)"
  wave-1-titanium: "#E2CCA8"
  wave-2-celadon: "#7AD1AE"
  error-cinnabar: "#F48C72"
  wave-1-slate-paper: "#2B4C63"
  wave-2-pine-paper: "#165B40"
  error-crimson-paper: "#A6261A"
typography:
  display:
    fontFamily: "BricolageGrotesque, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(2.25rem, 1.45rem + 3.1vw, 5.15rem)"
    fontWeight: 700
    lineHeight: 0.96
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "BricolageGrotesque, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.75rem, 1.25rem + 2vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.028em"
  title:
    fontFamily: "BricolageGrotesque, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1.32rem, 1.1rem + 0.95vw, 2.15rem)"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  body:
    fontFamily: "BricolageGrotesque, system-ui, -apple-system, sans-serif"
    fontSize: "clamp(1rem, 0.94rem + 0.3vw, 1.2rem)"
    fontWeight: 400
    lineHeight: 1.58
    letterSpacing: "-0.005em"
  label:
    fontFamily: "RedHatMono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0.05em"
  mono:
    fontFamily: "RedHatMono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.85rem"
    fontWeight: 400
    lineHeight: 1.62
    letterSpacing: "0em"
rounded:
  shell: "28px"
  card-lg: "26px"
  card: "24px"
  pod: "22px"
  studio-card: "20px"
  panel: "18px"
  well: "16px"
  ctrl: "14px"
  studio-ctrl: "12px"
  pill: "999px"
spacing:
  xs: "0.25rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2.5rem"
  gutter: "clamp(1.1rem, 4vw, 4.5rem)"
  section: "clamp(3.5rem, 6.5vw, 6rem)"
  bar-height: "56px"
  measure-dispatch: "472px"
  measure-maxw: "min(92vw, 96rem)"
components:
  button-primary:
    backgroundColor: "{colors.troilite-amber}"
    textColor: "{colors.troilite-amber-ink}"
    rounded: "{rounded.pill}"
    padding: "0.62rem 1.3rem"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.troilite-amber-hover}"
    textColor: "{colors.troilite-amber-ink}"
  button-ghost:
    backgroundColor: "{colors.obsidian-card}"
    textColor: "{colors.platinum}"
    rounded: "{rounded.pill}"
    padding: "0.62rem 1.3rem"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.obsidian-elevated}"
    textColor: "{colors.platinum}"
  nav-bar:
    backgroundColor: "{colors.obsidian-dock}"
    textColor: "{colors.platinum}"
    rounded: "{rounded.pill}"
    height: "56px"
    padding: "0.38rem 0.48rem 0.38rem 1.15rem"
  studio-shell:
    backgroundColor: "{colors.obsidian-surface}"
    textColor: "{colors.platinum}"
    rounded: "{rounded.shell}"
    width: "100%"
  studio-kit-card:
    backgroundColor: "{colors.obsidian-studio-card}"
    textColor: "{colors.platinum}"
    rounded: "{rounded.studio-card}"
    padding: "0.95rem 1.05rem"
  studio-kit-card-active:
    backgroundColor: "{colors.obsidian-active}"
    textColor: "{colors.platinum}"
  studio-chip:
    backgroundColor: "{colors.obsidian-studio-card}"
    textColor: "{colors.steel}"
    rounded: "{rounded.pill}"
    padding: "0.24rem 0.65rem"
  studio-tab:
    backgroundColor: "transparent"
    textColor: "{colors.steel}"
    rounded: "{rounded.pill}"
    padding: "0.44rem 0.88rem"
    height: "36px"
  studio-input:
    backgroundColor: "{colors.obsidian-deep}"
    textColor: "{colors.platinum}"
    rounded: "{rounded.studio-ctrl}"
    padding: "1rem 1.1rem"
  colophon-measure:
    backgroundColor: "{colors.obsidian-card}"
    textColor: "{colors.platinum}"
    rounded: "{rounded.card-lg}"
    width: "472px"
---

# Design System: Aether WebOS Kit

<!-- impeccable:design-map -->
Name: Aether WebOS Kit
Colors: primary: troilite-amber #E27A2C; secondary: wave-1-titanium #E2CCA8; secondary: wave-2-celadon #7AD1AE; neutral: mirror-void #030508; primary: troilite-amber-hover #EC8B40; primary: troilite-amber-studio-hover #ED8C42 (+27 more in the sidecar)
Fonts: BricolageGrotesque (display, headline, title, body); RedHatMono (label, mono)
Spacing: xs 0.25rem, sm 0.5rem, md 1rem, lg 1.5rem, xl 2.5rem, gutter clamp(1.1rem, 4vw, 4.5rem), section clamp(3.5rem, 6.5vw, 6rem), bar-height 56px, measure-dispatch 472px, measure-maxw min(92vw, 96rem)
Radius: shell 28px, card-lg 26px, card 24px, pod 22px, studio-card 20px, panel 18px, well 16px, ctrl 14px, studio-ctrl 12px, pill 999px
North Star: "Concentric Sculpted Mineral Precision"
Rules:
- The Concentric Sculpted Widget Rule. Shape outer shells at `28px` (`26px` on large stage cards), bento/pane cards at `20px` to `24px`, dossier/preview panels at `16px` to `18px`, controls and SVG mind-map nodes at `12px` to `14px`, and floating docks/CTAs/chips/tabs at `999px` (`R_outer = R_inner + padding`), eliminating legacy `0px`/`2px` sharp boxes and `1px` spreadsheet cages.
- The Perceptual Mineral Contrast Rule. Maintain `>= 4.5:1` WCAG AA contrast across Deep Obsidian (`#07090D` / `#090C12`, `#F4F1EA` ink, `#B4BCC8` soft ink) and Warm Alabaster Paper (`#F4F0E8` / `#FFFFFF`, `#121417` ink, `#484D56` soft ink), pairing Wave 0 Molten Troilite Amber (`#F08A38` / `#964205`), Wave 1 Burnished Champagne-Titanium (`#E2CCA8` / `#2B4C63`), Wave 2 Mineral Celadon-Jade (`#7AD1AE` / `#165B40`), and Error Terracotta Cinnabar (`#F48C72` / `#A6261A`).
- The Freeze-Frame Detonation Rule. Open Act 1 in pre-impact freeze-frame tension (`data-impact-state="frozen"`, `assets/meteor-preimpact.webp` + suspended `assets/meteorite-crust.webp` bolide at `T - 0.04s`) while keeping vertical scrolling unlocked; on clicking `#cleave-detonate-btn` or `#cleave-meteor`, transition via GPU `transform` + `opacity` into `data-impact-state="detonated"` (`assets/meteor-detonation.webp`) and reveal the Smart AI Intent & Free Quote Router (`[data-quote-router]`).
- The Scoped Dual-Surface Rule. Confine `[data-aw-surface="obsidian"|"paper"]` toggling to `#aether-webos-mount` so narrative acts hold fixed atmospheric lighting.
- The Two-Voice Self-Hosted Rule. Serve only self-hosted `BricolageGrotesque` (preloaded) and `RedHatMono` WOFF2 fonts from `./fonts/` with `font-optical-sizing: auto` and `font-synthesis-weight: none`; never add third-party font stylesheets.
- (+5 more)
Don't:
- Don't add `[data-sc-progress]` bars, `01 / 06` section counters, `2px`/`0px` sharp button boxes, `1px` spreadsheet divider cages, or stock generic `#67CEFA`/`#4ADE80`/`#F87171` colors.
- Don't add kickers or eyebrows above stage headings, synthetic weights outside `400`/`700`, or remote font CDN links.
- Don't run multiple WebGL contexts or leave `requestAnimationFrame` active offscreen or under `prefers-reduced-motion: reduce`.
- Don't mask mineral cutouts with CSS `clip-path` geometry instead of true RGBA alpha mattes.
- Don't edit `./scrollcraft.js` or `./scrollcraft.css`, leak local OS usernames or personal Gmail addresses, or use em/en dashes.
Full: docs/DESIGN_SYSTEM_RULES.md (complete 7-section Figma MCP design system specification)

---

## v2.4 Runtime, Freeze-Frame Detonation, Sculpted Studio & Quote System Parity

- **Author, Public Contact & Primary CTA:** Sole author `Eloquent (@mjeanhudson-dev)`; public quote contact `eloquent@eloquentwin.com` (`./context/contact.json`, zero personal Gmail literals in code); primary CTA locked verbatim across floating capsule dock, hero, studio, colophon, and offline exports as `Start Day 1: Free`.
- **Self-Hosted Optical Fluid Typography (`./fonts/`):** 4 WOFF2 faces (`BricolageGrotesque-Bold.woff2` `37,656` B, `BricolageGrotesque-Regular.woff2` `38,064` B, `RedHatMono-Regular.woff2` `13,568` B, `RedHatMono-Bold.woff2` `13,716` B; `103,004` bytes total, zero external font requests) scaled with `font-optical-sizing: auto` and WCAG 1.4.4 `clamp()` fluid ramps from `360px` mobile to `2560px` QHD and `3840px` 4K (`--sc-maxw: min(92vw, 96rem)`).
- **HiDPI / QHD / 4K Geological Media & Single-Pass Sobel PBR Shader (`./assets/`, `./webgl/artifact-shader.js`):** 9 macro WebP assets totaling `2,987,352` bytes (`meteor-preimpact.webp` `2560x1440`, `meteor-detonation.webp` `2560x1440`, `meteorite-crust.webp` `2048x2048` RGBA, `shard-01.webp` `1600x1600` RGBA, `shard-02.webp` `1600x1600` RGBA, `impact-void.webp` `2560x1600`, `artifact-poster.webp` `2560x1600`, `artifact-mercury.webp` `2560x1440`, `artifact-crystal.webp` `2560x1440`) with `.webp.json` provenance sidecars (`SCAN: 9 rasters, 0 missing`), paired with `./webgl/artifact-shader.js` (`MAX_DPR = 1.75` up to `2560x1440` native texture backing store, 4-frame adaptive governor, offscreen `IntersectionObserver` pause, and WCAG 2.2.2 `Pause shader` / `Resume shader`).
- **Act 1 Freeze-Frame Detonation & `#act-contact` Smart Quote Synthesizer (`./scripts/stage-choreography.js`, `./context/contact.json`):**
  - Cold load opens in `data-impact-state="frozen"` (`T - 0.04s · IMPACT SUSPENDED`). Clicking `#cleave-detonate-btn` or `#cleave-meteor` triggers a compositor-only (`transform` + `opacity`, `cubic-bezier(0.16, 1, 0.3, 1)`) transition to `data-impact-state="detonated"`, revealing sculpted mineral cards and the Smart AI Intent & Free Quote Router (`[data-quote-router]`, 4 intent pills + optional 1-line goal + `Route My Free Quote ->` + `Replay freeze-frame`).
  - `#act-contact` pairs `#aether-quote-form` (`:user-invalid` + ARIA polite error announcement, `spellcheck="true"` on project brief) with `#aether-quote-preview` (`AetherFunding.synthesizeQuoteScope`), deterministically generating an `AEQ-XXXX-XXXX` Quote Reference ID and Wave 0 / Wave 1 / Wave 2 Proposed Build Scope with 1-click `mailto:eloquent@eloquentwin.com`, Copy Brief, Download Quote Capsule (`.json`), and optional `https://` webhook `POST`.
- **Sculpted Refractory Studio, Bezier Mind-Map & Live Spellcheck (`./webos/refractory.css`, `./webos/refractory.js`, `./webos/exporter.js`):**
  - Concentric sculpted radii (`28px` `.aw-shell`, `20px` `.aw-kit-card` / `.aw-editor-pane` / `.aw-output-pane` / `.aw-map-viewport`, `18px` `.aw-lws-card` 2x2 Agenda/Soul/Lexicon/Wiki Dossier, `16px` capsule wells, `14px` SVG mind-map `<rect rx="14" ry="14">` nodes with `M ... C ...` cubic-bezier curves, `12px` controls, `999px` segmented `.aw-tablist` and chips).
  - Live native spellcheck enabled by default (`spellcheck="true"`) on `#aw-note-input` with `[data-aw-spellcheck-toggle]` (`Spellcheck: On` / `Spellcheck: Off`, `aria-pressed="true"|"false"`, `AetherRefractory.setSpellcheck`) while keeping `spellcheck="false"` on raw JSON/digest buffers.
- **Squarespace `/s/` Bundle & Hardening Suite (`./scripts/pack-squarespace.mjs`, `./scripts/test-v23-hardening.mjs`):** `26` hashed upload files under `./squarespace/upload-to-s/` mapped in `./squarespace/manifest.json` with WOFF2 `url()` rewrites, scoped `[data-sc-embed]` isolation, and `29/29` deterministic `node:test` hardening checks passing.
