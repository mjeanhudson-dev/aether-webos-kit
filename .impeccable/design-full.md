---
name: "Aether WebOS Kit"
description: "Cleaved warm alabaster and reflective obsidian design system for Aether WebOS Kit v2.0 by Eloquent (@mjeanhudson-dev)."
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

## Overview

**Creative North Star: "Cleaved Mineral Precision"**

Aether WebOS Kit v2.0 turns unstructured plain-English notes into Wave 0 to Wave 2 floorplans through meteorite cleavage and hairline editorial clarity. Built by Eloquent (`@mjeanhudson-dev`), the page opens on a Warm Alabaster vs. Obsidian split anchored by a natural Muonionalusta/Sikhote-Alin regmaglypt iron-nickel meteorite cutout (`./assets/meteorite-crust.webp`), pans a six-plate 25-turn amnesia autopsy, drops into basalt-and-obsidian mirror-void silence (`./assets/impact-void.webp`), awakens a single-pass Sobel-normal PBR WebGL image-relighting Peak (`./webgl/artifact-shader.js`) over three macro mineral plates, and closes in a lazy-hydrated borderless Operate studio and 472px colophon.

Hierarchy uses 1px hairlines, tonal obsidian steps, 2px control corners, self-hosted `BricolageGrotesque` and `RedHatMono`, and Molten Troilite Amber reserved for primary actions and active landmarks. Rectified v2.1 verification recorded Lighthouse `100 / 100 / 100 / 100` on both Desktop and Mobile (`52/52` audits passed), `LCP 146ms`, `CLS 0.00`, `domContentLoaded 71ms` (`0` cold-load Long Tasks), Act 4 `61 FPS` (`0.71ms/frame` GPU draw), zero overflow to `360x640`, and `>= 8.56:1` minimum contrast.

**Key Characteristics:**
- Split Warm Alabaster (`#F2EFE8`) vs. Obsidian (`#07090D`) polarity paired with scoped `[data-aw-surface="obsidian"|"paper"]` Operate surfaces.
- Zero `box-shadow`, zero `backdrop-filter`, zero `[data-sc-progress]` spoiler bars, and zero rounded card grids.
- Single-pass, loop-free Sobel PBR WebGL image-relighting Peak (`./webgl/artifact-shader.js`, `MAX_DPR = 1.25`, `<= 1440x900` backing cap, `antialias: false`, `resScale = 0.48` software scaling, 5-slow-frame governor) lazy-initialized via `1100px` `IntersectionObserver` + `requestIdleCallback` + `KHR_parallel_shader_compile` and paused offscreen (`IntersectionObserver`, `visibilitychange`, `contentvisibilityautostatechange`) with dynamic `Pause shader` / `Resume shader` (`WCAG 2.2.2`, no `aria-pressed`) and static WebP fallback.
- Self-hosted WOFF2 fonts (`./fonts/*.woff2`, `103,004` bytes total, `58.9%` smaller than archival TTFs) and 7 macro geological WebP plates (`./scripts/build-assets.mjs`: exterior BFS flood-fill and white-matte edge color decontamination) with `./assets/*.webp.json` provenance sidecars (`SCAN: 7 rasters, 0 missing`), zero external requests.

## Colors

Warm alabaster paper contrasts against stepped obsidian depths, punctuated by troilite amber and surface-calibrated Wave markers.

### Primary
- **Troilite Amber** (`#E27A2C`): Primary CTAs (`Start Day 1: Free`, `Export My Kit (.html)`), active controls, and mineral fissures, paired with `#111214` AA ink (`troilite-amber-ink`).
- **Troilite Hover** (`#EA8E47` host, `#ED8C42` studio): Hover fill on primary buttons with `#111214` ink.
- **Troilite Text** (`#EA8D44` obsidian, `#984306` paper): Inline amber links, Wave 0 tags, and live feedback (`>= 4.5:1` AA).

### Secondary
- **Wave 1** (`#67CEFA` obsidian, `#1A5276` paper) and **Wave 2** (`#4ADE80` obsidian, `#145A32` paper): Floorplan tiers, digest chips, and manifest badges.

### Neutral
- **Obsidian Spectrum**: Mirror Void (`#030508`) in Act 3; Peak Stage (`#05070B`) in Act 4; Obsidian (`#07090D`) canvas, nav, Act 1 right plane, Act 6; Obsidian Surface (`#080A0E`) in Act 2, Act 5, default studio; Deep (`#0B0E14`), Elevated (`#0D1017`), Hover (`#10141C`), Active (`#141922`).
- **Paper Spectrum**: Warm Alabaster (`#F2EFE8`) in Act 1 left plane and Paper studio mode, stepping to Deep (`#ECE7DE`), Elevated (`#EAE5DB`), Active (`#E2DDD1`).
- **Inks & Hairlines**: Alabaster Ink (`#111214`) and Soft (`#4A4D55`) on paper (`16.32:1` headline); Platinum (`#ECEAE4`) and Steel (`#A8B0BC`) on obsidian (`16.54:1` headline); `rgba(236, 234, 228, 0.14)` / `0.28` obsidian and `rgba(17, 18, 20, 0.16)` / `0.34` paper hairlines.

### Named Rules
**The Cleaved Polarity Rule.** Pair Warm Alabaster (`#F2EFE8`, `#111214`) directly against Obsidian (`#07090D`, `#ECEAE4`, `#A8B0BC`) along 1px seams rather than blending mid-grays.

**The Molten Troilite Reserve Rule.** Restrict `#E27A2C` strictly to primary actions, active landmarks, and mineral glints; pair solid fills with `#111214` ink and shift inline amber text to `#EA8D44` (obsidian) or `#984306` (paper).

**The Scoped Dual-Surface Rule.** Confine `[data-aw-surface="obsidian"|"paper"]` toggling to `#aether-webos-mount` so narrative acts hold fixed lighting.

## Typography

**Display & Body:** `BricolageGrotesque` (`./fonts/BricolageGrotesque-Bold.woff2`, `37,656` bytes, `700`; `./fonts/BricolageGrotesque-Regular.woff2`, `38,064` bytes, `400`; fallback `system-ui, sans-serif`)
**Label/Mono:** `RedHatMono` (`./fonts/RedHatMono-Regular.woff2`, `13,568` bytes, `400`; `./fonts/RedHatMono-Bold.woff2`, `13,716` bytes, `700`; fallback `ui-monospace, Menlo, Consolas, monospace`)

**Character:** Ink-trap neo-grotesque display paired with technical monospace telemetry. Only the two critical `BricolageGrotesque` WOFF2 files (`Bold` and `Regular`) plus `./assets/meteorite-crust.webp` preload in `./index.html` (`font-display: swap`) under `font-synthesis-weight: none` (`./scrollcraft.css`), while `RedHatMono` loads smoothly on demand; `500`/`600` rules in `./webos/refractory.css` render at `400` without faux-bolding.

### Hierarchy
- **Display** (`700`, `clamp(2.4rem, 5.2vw, 4.6rem)`, `0.96` line-height, `-0.035em` tracking): Act 1 `<h1>` and Act 3 primary mirror line (`clamp(2.1rem, 4.4vw, 3.85rem)`).
- **Headline** (`700`, `clamp(1.8rem, 3.2vw, 2.9rem)`, `1.04` line-height, `-0.028em` tracking): Corridor plates, Peak stage, Studio, and Ledger.
- **Title** (`700`, `clamp(1.45rem, 2.5vw, 2.15rem)`, `1.08` line-height, `-0.025em` tracking): Colophon title, Dual-View Reader heading, and week titles (`1.15rem`).
- **Body** (`400`, `clamp(1rem, 0.96rem + 0.22vw, 1.125rem)`, `1.56` line-height, `-0.005em` tracking): Prose (`40ch`-`58ch`) and `472px` colophon (`0.96rem`, `1.6`).
- **Label** (`700`, `0.73rem`-`0.78rem`, `1.35` line-height, `0.06em`, `tabular-nums`): Wordmark (`0.9rem`), day counters, readouts, pipeline nodes, chips, week tags.
- **Mono** (`400`, `0.77rem`-`0.85rem`, `1.62` line-height): Refractory textarea, 25-Turn Capsule, `floorplan-codex` output.

### Named Rules
**The Two-Voice Self-Hosted Rule.** Serve only self-hosted `BricolageGrotesque` (preloaded) and `RedHatMono` WOFF2 fonts from `./fonts/` with `font-synthesis-weight: none`; never add third-party font stylesheets or unnecessary above-fold preload stalls.

**The Monospace Measurement Rule.** Reserve `RedHatMono` (`tabular-nums`) for digests, day indices, coordinates, and Markdown/capsule text editors rather than decorative prose.

## Layout

Unmodified `./scrollcraft.js` and `./scrollcraft.css` score six acts across `11.6vh` pinned/panned travel (`pin[2.1] > pan[4.2] > pin[1.7] > pin[3.6, dwell=0.40] > flow > flow`; `13,474px` height at `900px` vh) inside `82rem` max-width, `clamp(1.25rem, 5vw, 5.5rem)` gutters, and a `60px` fixed header.

- **Act 1 (`pin[2.1]`):** `100svh` `52fr 48fr` split (`54fr 46fr` `<= 960px`, vertical `<= 760px`) placing CTA above `y = 836px` opposite eager `fetchpriority="high"` `meteorite-crust.webp`.
- **Act 2 (`pan[4.2]`):** Rail (`data-sc-pan="0.04"`) spanning six `46rem` plates (`min(88vw, 336px)` `<= 760px`) with `loading="lazy"` mineral shards; `overflow-x: auto` under reduced motion.
- **Act 3 (`pin[1.7]`):** Centered `44rem` `#030508` Mirror Void pause backed by `loading="lazy"` `./assets/impact-void.webp` (fractured basalt/obsidian crater dissolving into `#030508` via `.mirror-impact` `var(--aether-void)` radial mask) and GPU-composited `.mirror-sheen` `translate3d` drift (`zero` CSS custom-property repaints).
- **Act 4 (`pin[3.6, dwell=0.40]`):** Single loop-free, phase-gated Sobel PBR WebGL image-relighting Peak (`./webgl/artifact-shader.js`, `MAX_DPR = 1.25`, `<= 1440x900` backing cap, `3-5` texture taps/px across `artifact-mercury.webp` -> `artifact-poster.webp` -> `artifact-crystal.webp`; lazy `1100px` `IntersectionObserver` + `requestIdleCallback` + `KHR_parallel_shader_compile`) with scrims, 5-node pipeline, and 3-column artifact strip (`1fr` `<= 760px`).
- **Act 5 & Act 6 (`flow`):** `content-visibility: auto` shells (`contain-intrinsic-size: auto none auto 1220px` / `auto none auto 1320px`; `auto none auto 2540px` / `auto none auto 1560px` `<= 760px`) holding lazy-hydrated (`data-aw-lazy="true"`, `yieldToMain()`) `0.9fr 1.35fr` studio (`1fr` `<= 1020px`), `21rem 1fr` ledger (`1fr` `<= 960px`), and `472px` colophon.

### Named Rules
**The Surprise-Over-Spoiler Rule.** Omit `[data-sc-progress]` top bars so horizontal travel, Mirror Void silence, and Peak cleavage land without progress spoilers.

**The Budgeted Single-Peak Rule.** Permit one active WebGL context (`./webgl/artifact-shader.js`, `antialias: false`, `MAX_DPR <= 1.25`, `<= 1440x900` cap, `resScale = 0.48` on software renderers, 5-slow-frame adaptive governor), defer initialization off cold load (`1100px` `IntersectionObserver` + `requestIdleCallback` + `KHR_parallel_shader_compile`), pause `requestAnimationFrame` offscreen/hidden/skipped via direct `contentvisibilityautostatechange` listeners, update via zero-DOM-touch `setPointer`/`setProgress` hooks, and pair with `Pause shader` / `Resume shader` (`WCAG 2.2.2`, no `aria-pressed`).

## Elevation & Depth

Zero `box-shadow` and zero `backdrop-filter` rules exist in host or studio styles. Depth comes from stepped opaque planes (`#030508` -> `#05070B` -> `#07090D` -> `#080A0E` -> `#0B0E14` -> `#0D1017` -> `#141922`), directional `rgba(5, 7, 11, 0.96)` Peak scrims, `.mirror-impact` basalt dissolve (`var(--aether-void)` radial mask) + GPU-composited `.mirror-sheen` `translate3d` glow, and `1px` hairlines.

### Named Rules
**The Zero-Shadow Tonal Depth Rule.** Never add drop shadows or blurred glass; convey elevation exclusively via stepped tonal fills and 1px hairline partitions.

## Shapes

Containers, studio shells, SVG boxes (`rx="0"`), and ledger rows stay `0px` with `1px` dividers; buttons, chips, and `:focus-visible` outlines share `2px` (`--aw-r-ctrl`). Organic mineral forms appear across 7 macro geological WebP plates (`./scripts/build-assets.mjs` via exterior BFS flood-fill and white-matte edge color decontamination) backed by `./assets/*.webp.json` provenance (`SCAN: 7 rasters, 0 missing`): `./assets/meteorite-crust.webp` (`1200x1200`, `140,356` bytes, RGBA cutout, eager `fetchpriority="high"`), `./assets/shard-01.webp` (`640x640`, `64,560` bytes, RGBA cutout, `loading="lazy"`), `./assets/shard-02.webp` (`640x640`, `58,124` bytes, RGBA cutout, `loading="lazy"`), `./assets/impact-void.webp` (`1440x900`, `35,174` bytes, `#030508` volcanic basalt/obsidian crater dissolve, `loading="lazy"`), `./assets/artifact-poster.webp` (`1440x900`, `58,246` bytes, `#05070B` liquid-mercury cleavage core and static fallback, `loading="lazy"`), `./assets/artifact-mercury.webp` (`1280x720`, `25,796` bytes, `#05070B` Phase 1 suspended mercury), and `./assets/artifact-crystal.webp` (`1280x720`, `54,020` bytes, `#05070B` Phase 3 cleaved Widmanstatten monolith).

### Named Rules
**The Sharp Control and Mineral Edge Rule.** Keep containers at `0px` and controls at `2px`; render mineral silhouettes as real decontaminated RGBA alpha mattes and `#030508`/`#05070B` macro plates with provenance sidecars rather than CSS `clip-path` masks.

## Components

### Buttons
`2px` corners, explicit transitions (`140ms` host, `120ms` studio, `scale(0.98)` active), and `2px` `#E27A2C` focus rings (`#111214` in Act 1 alabaster). Primary (`#E27A2C`, `#111214`, `44px` min-height, `36px` bar) shifts to `#EA8E47`/`#ED8C42`. Ghost (`#07090D`, `rgba(236, 234, 228, 0.28)` border, `#ECEAE4`) shifts to `#10141C` / `#E27A2C` border; `[data-aether-shader-toggle]` swaps `Pause shader` / `Resume shader` cleanly without `aria-pressed` while studio surface and day/tab toggles use `aria-pressed`.

### Chips
`RedHatMono` tags (`0.74rem`, `0.22rem 0.55rem`, `2px`, `1px` border): neutral (`#0D1017` / `#A8B0BC`), Amber (`#EA8D44`, `#984306`), Live (`#67CEFA`, `#1A5276`), Connected (`#4ADE80`, `#145A32`) at `12%-14%` tints.

### Containers & Starter Kit Grid
Borderless `0px` studio shell (`1px` top/bottom hairlines), 4-column `1px`-gap kit grid (`2`-col `<= 1020px`, `1`-col `<= 640px`) with `2px` `#E27A2C` top stroke on active, `40px` `0px` tabs with `2px` bottom amber active rule, and `218x44` SVG nodes (`rx="0"`).

### Inputs / Fields
Recessed `0px` textarea (`#0B0E14` obsidian, `#ECE7DE` paper, `RedHatMono` `0.85rem`, `1.62` line-height, `#E27A2C` caret, `2px` focus ring).

### Navigation
Fixed `60px` opaque `#07090D` bar (`1px` bottom hairline): `20x20` SVG diamond mark + `AETHER` (`RedHatMono` `700`), four one-word links (hidden `<= 760px`), synchronized `Day N · Wk M` (`#E27A2C`), and `36px` `Start Day 1: Free` CTA.

### Named Rules
**The Borderless Operate Hairline Rule.** Partition `#act-studio` and `#act-curriculum` with `1px` hairlines, surface steps, and `2px` active strokes rather than rounded, shadowed SaaS cards.

## Do's and Don'ts

### Do:
- **Do** pair `#E27A2C` fills strictly with `#111214` ink, and shift inline amber text to `#EA8D44` (obsidian) or `#984306` (paper) for `>= 4.5:1` AA contrast.
- **Do** keep Paper/Obsidian toggling scoped to `#aether-webos-mount` via `[data-aw-surface="obsidian"|"paper"]`.
- **Do** retain `content-visibility: auto` with `contain-intrinsic-size: auto none auto <h>`, eager `fetchpriority="high"` only above the fold, `loading="lazy"` on below-fold images, and explicit `width`/`height` on WebP assets to hold `CLS 0.00`.
- **Do** wire dynamic `Pause shader` / `Resume shader` (`WCAG 2.2.2`, no `aria-pressed`), `prefers-reduced-motion` static fallbacks, lazy `1100px` IO + `requestIdleCallback` shader init, and offscreen/hidden/skipped `rAF` pausing on WebGL stages.
- **Do** avoid em dashes (U+2014 or HTML mdash entity) across copy and docs, and cite only `./` or `~/` paths under `Eloquent` (`@mjeanhudson-dev`).

### Don't:
- **Don't** add `[data-sc-progress]` bars, `01 / 06` section counters, `backdrop-filter` blur, `box-shadow` glows, or `border-radius` above `2px`.
- **Don't** add kickers or eyebrows above headings, synthetic weights outside `400`/`700`, or remote font CDN links.
- **Don't** run multiple WebGL contexts or leave `requestAnimationFrame` active offscreen or under `prefers-reduced-motion: reduce`.
- **Don't** mask mineral cutouts with CSS `clip-path` geometry instead of true RGBA alpha mattes.
- **Don't** edit `./scrollcraft.js` or `./scrollcraft.css`, leak local OS usernames, or fabricate user quotes or metrics.
