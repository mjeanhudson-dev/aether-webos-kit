# Aether WebOS Kit v2.4 Design System Rules (Figma MCP Reference)

Author: Eloquent (`@mjeanhudson-dev`)
Status: Canonical v2.4 Design-to-Code Specification (`index.html`, `styles/site.css`, `webos/refractory.css`, `webos/refractory.js`, `webos/exporter.js`, `webgl/artifact-shader.js`)

This document defines the complete Figma Model Context Protocol (MCP) design system rules for **Aether WebOS Kit v2.4**. Whenever translating Figma frames, variables, or component specs into repository code (or exporting code structures back to Figma), adhere strictly to the seven sections below.

---

## 1. Token Definitions

All visual primitives are defined as native CSS custom properties across two strictly scoped token roots:
- **Global Narrative Stage & Chrome (`:root`, `[data-sc-embed]` in `./styles/site.css`):** Governs the floating capsule navigation dock, Act 1 Freeze-Frame Meteor Detonation stage, Act 2 horizontal narrative corridor, Act 3 Mirror Void, Act 4 Sobel PBR Artifact Peak, Act 5b Solutions, Act 5c Support, Act 6 `#act-contact` Smart Quote Intake, and Act 6 30-Day Mentorship Ledger + Colophon.
- **Scoped Operate Workspace (`#aether-webos-mount[data-aw-surface="obsidian"|"paper"]` in `./webos/refractory.css` and standalone exports in `./webos/exporter.js`):** Governs the interactive Mind-Map, Dual-View Reader, Agenda/Lexicon/Wiki/Soul Dossier, Multi-Aspect Rehydration Capsules, and Live Studio Co-Pilot without mutating narrative stage lighting.

### 1.1 Perceptual Mineral Palette (WCAG AA >= 4.5:1)

Stock generic cyan/green/red framework colors and purple/blue AI glows are banned. Every semantic tier derives from natural octahedrite meteorite mineralogy and maintains verified `>= 4.5:1` text contrast across both `obsidian` and `paper` surfaces.

#### Global Stage & Obsidian Atmospheric Planes (`./styles/site.css`)

| Token | Value | Role |
|---|---|---|
| `--sc-canvas` / `--aether-obsidian` | `#07090D` | Primary deep volcanic obsidian page ground and Act 1 negative space |
| `--aether-void` | `#030508` | Act 3 silent Mirror Void ground (`impact-void.webp` perimeter target) |
| `--aether-artifact-bg` | `#05070B` | Act 4 WebGL Sobel PBR Peak ground (`artifact-*.webp` perimeter target) |
| `--aether-nav-surface` | `#0D1119` | Floating sculpted capsule navigation dock fill |
| `--aether-card-surface` | `#0E131D` | Elevated sculpted mineral bento/corridor cards on stage |
| `--aether-alabaster` | `#F4F0E8` (legacy alias `#F2EFE8`) | Warm alabaster mineral daylight surface |
| `--aether-platinum` / `--sc-ink` | `#F4F1EA` (legacy alias `#ECEAE4`) | Primary high-contrast display and body ink on obsidian (`> 16:1`) |
| `--aether-steel` / `--sc-ink-soft` | `#B4BCC8` (legacy alias `#A8B0BC`) | Secondary metadata and supporting prose on obsidian (`>= 8.5:1`) |
| `--aether-alabaster-ink` | `#111214` | Primary display and body ink on warm alabaster (`> 16:1`) |
| `--aether-alabaster-soft` | `#484D56` | Secondary prose on warm alabaster (`>= 7.5:1`) |
| `--aether-amber` / `--sc-accent` | `#E27A2C` | Molten Troilite Amber primary solid CTA fill and active mineral glint |
| `--aether-amber-text` | `#F08A38` | Inline Molten Troilite Amber text and active anchors on obsidian (`>= 4.5:1`) |
| `--aether-amber-hover` | `#EA8E47` | Primary button hover fill (`@media (hover: hover) and (pointer: fine)`) |
| `--aether-amber-ink` / `--sc-accent-ink` | `#111214` | High-contrast dark ink on solid `#E27A2C` / `#EA8E47` fills |
| `--aether-well-recessed` | `#0A0D14` | Unbordered recessed tonal well inside sculpted stage cards (`border: 0; box-shadow: none`) |
| `--aether-hairline` | `rgba(244, 241, 234, 0.12)` | Subtle sculpted card contour border on obsidian |
| `--aether-hairline-strong` | `rgba(244, 241, 234, 0.26)` | Interactive control border and active card contour |
| `--aether-specular-top` | `inset 0 1px 0 rgba(244, 241, 234, 0.07)` | Tactile top-edge mineral highlight on sculpted shells and cards |

#### Dual-Surface Refractory Studio Palette (`./webos/refractory.css` & `./webos/exporter.js`)

| Semantic Token | Obsidian (`data-aw-surface="obsidian"`) | Paper (`data-aw-surface="paper"`) | Usage |
|---|---|---|---|
| `--aw-surface` (Shell) | `#090C12` | `#F4F0E8` | Outer `.aw-shell` studio frame |
| `--aw-surface-2` (Widget Card) | `#10151F` | `#FFFFFF` | Elevated `.aw-kit-card`, `.aw-editor-pane`, `.aw-output-pane`, `.aw-lws-card` |
| `--aw-surface-deep` (Input Well) | `#0C1018` | `#EAE4D8` | Recessed `.aw-textarea`, `.aw-capsule-box`, `.aw-rehydrate-box` |
| `--aw-surface-active` | `#171F2E` | `#E2DBD0` | Active Starter Kit card, selected tab/pill, hover state |
| `--aw-ink` | `#F4F1EA` | `#121417` | Primary studio headings, task labels, editor prose |
| `--aw-ink-soft` | `#B4BCC8` | `#484D56` | Secondary descriptions, telemetry labels, timestamps |
| `--aw-accent` / `--aw-accent-ink` | `#E27A2C` / `#111214` | `#E27A2C` / `#111214` | Primary action fill (`Start Day 1: Free`, `Export My Kit (.html)`) |
| `--aw-accent-text` (Wave 0) | `#F08A38` | `#964205` | Molten Troilite Amber text, Wave 0 baseline tags (`>= 4.5:1`) |
| `--aw-info` (Wave 1) | `#E2CCA8` | `#2B4C63` | Burnished Champagne-Titanium (Obsidian) / Deep Slate (Paper) Wave 1 flow |
| `--aw-info-tint` / `--aw-info-line` | `rgba(226, 204, 168, 0.13)` / `0.44` | `rgba(43, 76, 99, 0.10)` / `0.40` | Wave 1 chip background and border |
| `--aw-ok` (Wave 2) | `#7AD1AE` | `#165B40` | Mineral Celadon-Jade (Obsidian) / Deep Pine (Paper) Wave 2 completion & valid SHA-256 |
| `--aw-ok-tint` / `--aw-ok-line` | `rgba(122, 209, 174, 0.13)` / `0.44` | `rgba(22, 91, 64, 0.10)` / `0.40` | Wave 2 chip and rehydrate success banner |
| `--aw-err` (Validation) | `#F48C72` | `#A6261A` | Terracotta Cinnabar (Obsidian) / Crimson Oxide (Paper) form & capsule errors |
| `--aw-err-tint` / `--aw-err-line` | `rgba(244, 140, 114, 0.13)` / `0.46` | `rgba(166, 38, 26, 0.09)` / `0.42` | Error feedback surface and contour |

### 1.2 Concentric Sculpted Widget Radii (`v2.4` Canonical Scale)

All legacy `0px` right-angle cages, `2px` sharp buttons, and `1px` spreadsheet divider grids are eradicated in v2.4. Surfaces follow a tactile phone-widget concentric curvature system governed by `R_outer = R_inner + padding`:

| Tier | Canonical Token / Value | Permitted Range | Mapped Surfaces & Elements |
|---|---|---|---|
| **Shell** | `--aw-r-shell: 28px` | `26px` to `28px` | `.aw-shell` studio frame (`28px`), `.corridor-plate` (`26px`), `.colophon` card wrapper (`26px`) |
| **Card** | `--aether-r-card: 22px` | `20px` to `24px` | Act 4 HUD pods (`22px`), `#aether-live-copilot` (`22px`), `.studio-skeleton` (`22px`), `#act-solutions` / `#act-support` / `#act-curriculum` bento cards (`24px`), `.aw-kit-card` / `.aw-editor-pane` / `.aw-output-pane` / `.aw-map-viewport` (`20px`) |
| **Panel** | `--aw-r-panel: 18px` | `16px` to `18px` | `.codex-preview` (`18px`), `.aw-lws-card` Agenda/Lexicon/Wiki/Soul Dossier widgets (`18px`), `.aw-day-banner` (`18px`), `#aether-quote-preview` (`18px`), `.aw-capsule-box` & `.aw-rehydrate-box` (`16px`) |
| **Control** | `--aether-r-ctrl: 14px` | `12px` to `14px` | SVG Mind-Map `<rect rx="14" ry="14">` nodes (`14px`), form fields/textareas (`14px`), `.aw-btn` / `.aw-day-btn` / `.aw-aspect-btn` / `.aw-rehydrate-feedback` (`12px` via `--aw-r-ctrl`) |
| **Pill** | `--aw-r-pill: 999px` | `999px` | Floating `.site-bar` capsule dock, `.btn` primary/ghost CTAs, Act 1 intent router pills, `.aw-chip`, `.aw-pill-btn`, `.aw-format-toggle`, `.aw-tablist` / `.aw-tab`, `[data-aw-spellcheck-toggle]`, `.aw-swatch` dots |

### 1.3 Optical Fluid Typography (`360px` Mobile to `3840px` 4K)

Typography uses two self-hosted WOFF2 families (`./fonts/`, `103,004` bytes total, zero external font requests) rendered with `font-optical-sizing: auto` and `font-synthesis-weight: none`:
- **Display & Editorial Prose (`--sc-font-display`, `--sc-font-text`):** `"BricolageGrotesque", system-ui, -apple-system, sans-serif` (`400` Regular, `700` Bold).
- **Technical Telemetry & Code/Capsule Buffers (`--sc-font-mono`):** `"RedHatMono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` (`400` Regular, `700` Bold, `font-variant-numeric: tabular-nums`).

| Scale Role | Fluid `font-size` (`clamp()`) | Weight | Line-Height | Tracking | Measure / Notes |
|---|---|---|---|---|---|
| **Display Hero (`h1.cleave-title`)** | `clamp(2.45rem, 4.8vw + 0.6rem, 5.4rem)` | `700` | `0.96` | `-0.035em` | `text-wrap: balance`; scales cleanly to QHD/4K |
| **Stage Headline (`h2`)** | `clamp(1.85rem, 3.1vw + 0.4rem, 3.4rem)` | `700` | `1.04` | `-0.028em` | Corridor, Artifact Peak, Studio, Solutions, Quote, Ledger |
| **Section / Card Title (`h3`)** | `clamp(1.35rem, 2.1vw + 0.3rem, 2.2rem)` | `700` | `1.10` | `-0.024em` | Bento cards, Dual-View Reader, Colophon title |
| **Editorial Body** | `clamp(1rem, 0.94rem + 0.28vw, 1.22rem)` | `400` | `1.58` | `-0.005em` | `40ch` to `60ch` max line measure (`text-wrap: pretty`) |
| **Transactional Colophon / Dispatch** | `0.96rem` | `400` | `1.60` | `-0.005em` | Locked `472px` inner reading measure (`.colophon__measure`) |
| **Monospace Telemetry / Pill Label** | `0.75rem` to `0.82rem` | `700` | `1.35` | `0.05em` | `tabular-nums`; never drop below `0.72rem` on mobile |
| **Refractory Editor / Capsule Mono** | `0.85rem` | `400` | `1.62` | `0em` | Plain-English editor (`spellcheck="true"`) & JSON/SHA buffers (`spellcheck="false"`) |

### 1.4 Layout, Spacing & Composite Motion Tokens

- **Stage Containers:** `max-width: min(92vw, 96rem)` with fluid horizontal gutter `--sc-gutter: clamp(1.25rem, 5vw, 5.5rem)` and vertical section cadence `clamp(3.5rem, 6.5vw, 6rem)`.
- **Card Grid Gaps:** `0.75rem` to `1.5rem` breathable gaps between sculpted cards (replacing `gap: 1px; background: var(--aw-hairline)` cell cages).
- **Motion Curves & Budgets:**
  - Micro-interactions: `140ms` to `180ms` `cubic-bezier(0.22, 1, 0.36, 1)` on explicit properties (`background-color`, `border-color`, `color`, `transform`, `opacity`).
  - Act 1 Detonation Reveal: GPU-composited `transform` and `opacity` using `cubic-bezier(0.16, 1, 0.3, 1)`.
  - Tactile Press: `transform: scale(0.98)` on `:active`.
  - Hover Gating: All pointer hover states wrapped inside `@media (hover: hover) and (pointer: fine)`.
  - Reduced Motion: `@media (prefers-reduced-motion: reduce)` collapses transitions to instant state swaps, disables WebGL `requestAnimationFrame`, and enables native horizontal scroll in Act 2.

---

## 2. Component Library

### 2.1 Floating Sculpted Capsule Navigation Dock (`.site-bar`)
- Centered floating pill bar (`border-radius: 999px`, `top: 0.85rem`, `max-width: min(94vw, 86rem)`) over `#0D1119` with `1px` hairline contour and top specular inner highlight.
- Contains left `20x20` diamond cleavage SVG + `AETHER` wordmark, center section anchors (`Story`, `Artifact`, `Studio`, `Solutions`, `Support`, `Free Quote` -> `#act-contact`, `Days`), live `[data-aether-nav-day]` badge (`Day N · Wk M`), and right `999px` primary pill CTA `Start Day 1: Free` (`[data-aether-start]`).

### 2.2 Freeze-Frame Meteor Detonation Stage & Smart AI Quote Router (`#act-cleave`)
- Replaces the legacy 50/50 vertical `.cleave-seam` split with a two-state interactive full-bleed stage (`#cleave-stage`) while keeping normal vertical scrolling past Act 1 completely unlocked:
  - **State 0 (`data-impact-state="frozen"` at cold load):** Displays full-bleed `assets/meteor-preimpact.webp` (`2560x1440`) paired with suspended `assets/meteorite-crust.webp` (`2048x2048` RGBA cutout) frozen at `T - 0.04s · IMPACT SUSPENDED`. Left/lower-left calm `#07090D` negative space holds `h1.cleave-title` (`Your mind, cleaved into working software.`), concise subcopy, verbatim primary pill CTA `Start Day 1: Free` (`[data-aether-start]`), and keyboard-accessible detonation trigger `button#cleave-detonate-btn` + `[data-aether-detonate]` (`aria-expanded="false"`).
  - **State 1 (`data-impact-state="detonated"` on click/tap):** GPU-only (`transform` + `opacity`) shockwave pulse crossfades into `assets/meteor-detonation.webp` (`2560x1440`), revealing sculpted mineral cards and the **Smart AI Intent & Free Quote Router** (`[data-quote-router]`):
    - 4 selectable `999px` intent pills: `Offline Workspace`, `Private Local AI Vault`, `Custom Scroll / WebOS Site`, `Free 30-Day Kit`.
    - Optional 1-line goal input + `Route My Free Quote ->` primary pill that scrolls smoothly to `#act-contact` (or `#act-studio` when `Free 30-Day Kit` is chosen), pre-fills the Quote Intake track and project brief, and synthesizes a live Wave 0..2 scope preview.
    - Subtle `Replay freeze-frame` pill (`[data-impact-reset]`) restores `frozen` state cleanly.

### 2.3 Sculpted Corridor, Mirror Void & Sobel PBR Artifact Peak (`#act-corridor`, `#act-mirror`, `#act-artifact`)
- **Act 2 Corridor (`.corridor-plate`):** Six `26px` elevated `#0E131D` cards separated by `1.5rem` spacing, embedding `shard-01.webp` (`1600x1600` RGBA), `shard-02.webp` (`1600x1600` RGBA), and the interactive `18px` `.codex-preview` widget with `999px` sample selector pills (`Household`, `Workshop`, `Creator`).
- **Act 3 Mirror Void (`#act-mirror`):** Silent `#030508` reflection backed by `impact-void.webp` (`2560x1600`) and GPU `translate3d` `.mirror-sheen`.
- **Act 4 Artifact Peak (`#act-artifact`):** Single-pass, loop-free Sobel PBR WebGL relighting canvas (`#aether-artifact-canvas`, HiDPI `Math.min(window.devicePixelRatio || 1, 2.5)` backing resolution with 5-slow-frame adaptive governor and offscreen `IntersectionObserver` pause) blending `artifact-mercury.webp` -> `artifact-poster.webp` -> `artifact-crystal.webp`, framed by `22px` sculpted HUD pods, 5 pipeline pills (`RAW NOTE` .. `SHA-256`), 3 artifact unlock cards, and WCAG 2.2.2 `Pause shader` / `Resume shader` button (`[data-aether-shader-toggle]`, no `aria-pressed`).

### 2.4 Refractory Operate Studio (`#aether-webos-mount`)
- **Outer Frame (`.aw-shell`):** `28px` sculpted container supporting scoped `Obsidian` / `Paper` surface toggle (`[data-aw-surface]`).
- **Starter Kits Bar:** 4-column (`0.75rem` gap) `20px` `.aw-kit-card` bento grid (`Household & Cashflow Clarity`, `Local Service & Workshop Launch`, `30-Day Creator & Newsletter System`, `Community & Teaching Hub`).
- **Plain-English Editor Pane (`.aw-editor-pane`, `20px`):** Features `.aw-textarea` (`spellcheck="true"` by default) plus a live `999px` pill toggle `[data-aw-spellcheck-toggle]` (`Spellcheck: On` / `Spellcheck: Off`, `aria-pressed="true"|"false"`) in `.aw-pane-head`.
- **4-View Segmented Output Pane (`.aw-output-pane`, `20px`):** `999px` `.aw-tablist` switching between:
  1. **Mind-Map Floorplan:** Interactive pan/zoom SVG with sculpted `<rect rx="14" ry="14">` task nodes, `999px` wave tags, and smooth cubic-bezier (`M ... C ...`) dependency curves (zero DOM rebuilds during pointer drag).
  2. **Dual-View Reader:** Sculpted checklist and section cards with arm's-length optical typography.
  3. **Agenda / Lexicon / Wiki / Soul Dossier:** `18px` `.aw-lws-card` widgets separated by `0.85rem` grid gaps.
  4. **Rehydration Capsules (`Tab 4`):** `6` specialized aspects + `Master Bundle` (`12px` `.aw-aspect-btn`), `999px` `Markdown` / `JSON v2` toggle, live token/byte/SHA-256 chips (`spellcheck="false"` on raw JSON/digest boxes), Copy/Download actions, and 1-click Rehydrate/Restore validator.
- **Optional Live Studio Co-Pilot (`#aether-live-copilot`):** `22px` disclosure widget mounting `window.AetherLiveBridge` (ephemeral-token Gemini 3.8 Live WebSocket bridge; zero network traffic until explicit `Connect`).

### 2.5 Smart Free Quote Intake & Scope Synthesizer (`#act-contact`)
- Driven by `./context/contact.json` (`public_email: "eloquent@eloquentwin.com"`, `quote_webhook_url: null`, `response_window: "1 to 2 business days"`).
- Pairs `#aether-quote-form` (Name, Reply Email, optional Company/Team, Build Track select, Timeline select, and `spellcheck="true"` Project Brief) with `#aether-quote-preview` (`18px` live card generating a deterministic Quote Reference ID and structured Wave 0 / Wave 1 / Wave 2 Proposed Build Scope as the user types).
- Provides resilient zero-login delivery: optional validated `https://` webhook `POST` when configured, plus always-available 1-click `mailto:eloquent@eloquentwin.com` pre-fill, `Copy Scoped Quote Brief`, and `Download Quote Capsule (.json)`.

### 2.6 Figma MCP Translation Rules
- Map Figma Auto Layout frames directly to CSS Grid or Flexbox with `gap`; never emit absolute-positioned wrapper divs for flow content.
- Bind every fill, stroke, corner radius, and text style to the CSS custom properties in Section 1; never inline raw hex codes or `border-radius: 2px` / `0px` overrides in component markup.
- Keep the primary CTA string verbatim as `Start Day 1: Free` across all Figma variants and exported HTML.

---

## 3. Frameworks & Libraries

- **Runtime Stack:** Zero npm runtime dependencies, zero bundler requirement, zero React/Tailwind/CSS-in-JS runtime overhead. Ships as standards-compliant HTML5, vanilla CSS3 custom properties, and dependency-free UMD JavaScript (`browser` global + `CommonJS` `module.exports` for deterministic Node testing).
- **Scroll Choreography Engine:** `./scrollcraft.js` and `./scrollcraft.css` (`v0.3.1`, unmodified byte-for-byte SHA-256 parity; configured via declarative `data-sc-act`, `data-sc-span`, `data-sc-dwell`, `data-sc-pan`, and `data-sc-cue` attributes).
- **Cryptographic Integrity:** Native WebCrypto `crypto.subtle.digest("SHA-256")` paired with a synchronous pure-JS FIPS 180-4 SHA-256 implementation (`window.AetherCapsules.computeCapsuleDigestSync`) for `file://` airplane-mode parity.
- **Offline Build, Verification & Packaging Tooling:**
  - `node:test` (`./scripts/test-v23-hardening.mjs`) for deterministic contract and security regression testing.
  - `playwright-core` + local Chromium (`./scripts/build-assets.mjs`) for exterior BFS alpha-matte decontamination and headless multi-viewport verification.
  - `ffmpeg` (`libwebp`, `-q:v 84`) for HiDPI / 4K WebP encoding.
  - `impeccable` CLI (`embed-prompt --scan assets`, `detect --json`) for raster provenance and anti-slop static verification.
  - `./scripts/pack-squarespace.mjs` for content-addressed Squarespace `/s/` asset bundle generation.

---

## 4. Asset Management

### 4.1 HiDPI / QHD / 4K WebP Geological Plate Manifest (`./assets/`)

All nine shipping rasters are encoded via `ffmpeg -c:v libwebp -q:v 84` (`yuva420p` for halo-free RGBA cutouts; `yuv420p` for full-bleed obsidian plates) and paired with `./assets/<name>.webp.json` provenance sidecars (`SCAN: 9 rasters, 0 missing`):

| Asset Path | Pixel Dimensions | Channels | Surface / Ground | Loading Strategy & Stage Role |
|---|---|---|---|---|
| `./assets/meteor-preimpact.webp` | `2560x1440` | RGB | `#07090D` obsidian | Eager/high-priority Act 1 `frozen` sky-clean low-horizon obsidian plate with lower-right `#E27A2C` bow-shock glow & micro-sparks (zero sky boulder) |
| `./assets/meteor-detonation.webp` | `2560x1440` | RGB | `#07090D` / `#F4F0E8` | Act 1 `detonated` fractured obsidian-and-alabaster caldera with 60-degree Widmanstatten amber veins |
| `./assets/meteorite-crust.webp` | `2048x2048` | RGBA | True alpha matte | `<link rel="preload" fetchpriority="high">` Act 1 suspended iron-nickel bolide specimen cutout |
| `./assets/shard-01.webp` | `1600x1600` | RGBA | True alpha matte | `loading="lazy"` Act 2 Plate 2 torn Sikhote-Alin shrapnel fragment cutout |
| `./assets/shard-02.webp` | `1600x1600` | RGBA | True alpha matte | `loading="lazy"` Act 2 Plate 4 liquid-mercury on blackened meteoric iron cutout |
| `./assets/impact-void.webp` | `2560x1600` | RGB | `#030508` mirror void | `loading="lazy"` Act 3 radial basalt-and-obsidian crater plate feathered into `#030508` |
| `./assets/artifact-poster.webp` | `2560x1600` | RGB | `#05070B` peak void | `loading="lazy"` Act 4 Phase 2 cleavage core poster & reduced-motion / non-WebGL static plate |
| `./assets/artifact-mercury.webp` | `2560x1440` | RGB | `#05070B` peak void | Lazy WebGL texture unit `0` (`u_tex0`) & CSS fallback Phase 1 molten mercury suspension |
| `./assets/artifact-crystal.webp` | `2560x1440` | RGB | `#05070B` peak void | Lazy WebGL texture unit `2` (`u_tex2`) & CSS fallback Phase 3 etched Widmanstatten crystal lock |

### 4.2 Self-Hosted Typography (`./fonts/`) & Squarespace `/s/` Rewriting
- Only WOFF2 font binaries (`BricolageGrotesque-Bold.woff2`, `BricolageGrotesque-Regular.woff2`, `RedHatMono-Regular.woff2`, `RedHatMono-Bold.woff2`) are referenced at runtime (`0` `.ttf` runtime references, `0` remote font CDNs).
- `./scripts/pack-squarespace.mjs` hashes every WebP, WOFF2, CSS, and JS file into `./squarespace/upload-to-s/aether-webos-rollout-<stem>-<sha8>.<ext>` and rewrites `url(...)` and `<template id="aether-artifact-plates">` references with 100% SHA-256 manifest parity.

---

## 5. Icon System

- **Zero External Icon Libraries:** Do not import Lucide, Heroicons, FontAwesome, Material Icons, or icon webfont sheets.
- **Brand Mark:** `20x20` inline `<svg viewBox="0 0 24 24" aria-hidden="true">` diamond cleavage emblem in `.site-bar__brand` (mirrored in the `32x32` inline SVG favicon), using `1.6px` `#ECEAE4` outer facets, `1.4px` `#E27A2C` vertical cleavage axis, and `r="2.2"` `#E27A2C` core.
- **Floorplan Graph Primitives:** Generated deterministically in `./webos/refractory.js` and `./webos/exporter.js` using inline `<svg>` with `<rect rx="14" ry="14">` node frames, `999px` wave pill badges, and `<path d="M ... C ...">` cubic-bezier curves with `>= 32px` viewport clearance on all 4 sides.
- **UI Chevrons, Arrows & Status Indicators:** Render all button arrows, link indicators, disclosure chevrons, and custom `<select>` carets as crisp `1.4px`-stroke inline `<svg aria-hidden="true">` (or SVG data-URI) vectors; never substitute raw ASCII `->` or `+`/`-` characters inside UI chrome (reserve `->` strictly for plain-text Markdown/capsule data specimens). Use `999px` `.aw-swatch` CSS dots for surface-calibrated status indicators, and omit eyebrows/kickers above headings and decorative `01`/`02`/`03` badges on parallel lists. Never use em dashes (`\u2014`), en dashes (`\u2013`), or decorative emoji clutter.

---

## 6. Styling Approach

1. **Deterministic Three-Layer Cascade:**
   - `1. scrollcraft.css` (unmodified engine layout & sticky stage primitives)
   - `2. webos/refractory.css` (strictly scoped to `#aether-webos-mount`, zero global tag selectors)
   - `3. styles/site.css` (host tokens, floating nav dock, Acts 1 to 6, `#act-contact`, fluid 4K scaling, and `[data-sc-embed]` isolation)
2. **Concentric Tactile Elevation Without Blur Slop:**
   - Achieve widget depth via stepped perceptual mineral backgrounds (`#07090D` -> `#090C12` -> `#10151F` -> `#171F2E` in Obsidian; `#F4F0E8` -> `#FFFFFF` -> `#EAE4D8` in Paper), `1px` low-opacity hairline contours, and crisp top specular inner highlights (`inset 0 1px 0 rgba(244, 241, 234, 0.07)`).
   - Never use `backdrop-filter: blur(...)` over pinned/WebGL stages or neon outer `box-shadow` halos.
3. **Offscreen Rendering & Scroll Budget:**
   - Wrap heavy below-the-fold flow sections (`.studio-cv-shell`, `.curriculum-cv-shell`) in `content-visibility: auto` with matched `contain-intrinsic-size` reserves so cold-load `CLS` stays `0.00`.
   - Maintain `overflow-x: clip` on `html, body` and verify `document.documentElement.scrollWidth <= window.innerWidth` across `360px`, `390px`, `1440px`, and `2560px`+ viewports.

---

## 7. Project Structure

```text
aether-webos-rollout/
|-- index.html                      # 6-Act narrative + Freeze-Frame Detonation + #act-studio + #act-contact
|-- scrollcraft.css                 # Unmodified ScrollCraft v0.3.1 stylesheet (SHA-256 locked)
|-- scrollcraft.js                  # Unmodified ScrollCraft v0.3.1 scroll engine (SHA-256 locked)
|-- DESIGN.md                       # Impeccable design system summary & token frontmatter
|-- PRODUCT.md                      # Product positioning, capabilities, and release ledger
|-- styles/
|   `-- site.css                    # Host tokens, sculpted 999px/28px..14px geometry, 4K fluid type
|-- scripts/
|   |-- stage-choreography.js       # Act 1 detonation & quote router, Act 2..6 hooks, #act-contact scope synth
|   |-- build-assets.mjs            # Chromium BFS alpha-matte processor + FFmpeg WebP + provenance scanner
|   |-- pack-squarespace.mjs        # Content-addressed Squarespace /s/ packager & hygiene verifier
|   `-- test-v23-hardening.mjs      # Deterministic node:test suite for modules, assets, and contracts
|-- webgl/
|   `-- artifact-shader.js          # Single-pass HiDPI Sobel PBR relighting shader + 3-plate CSS fallback
|-- webos/
|   |-- capsules.js                 # UMD 6-aspect + Master Bundle capsule engine (aether.rehydration.capsule.v2)
|   |-- exporter.js                 # UMD standalone offline .html & 472px dispatch builder
|   |-- refractory.css              # Scoped #aether-webos-mount Obsidian/Paper sculpted widget styles
|   |-- refractory.js               # UMD studio runtime, rx="14" bezier Mind-Map, live spellcheck toggle
|   `-- live-bridge.js              # UMD optional Gemini 3.8 Live ephemeral-token WebSocket co-pilot
|-- context/
|   |-- terminal-synthesis.json     # v2.1.0 Starter Kits, 30-day curriculum, and 7 capsuleAspect specs
|   |-- funding.json                # Honest backing channel configuration (window.AetherFunding)
|   `-- contact.json                # Public quote endpoint config (eloquent@eloquentwin.com)
|-- assets/                         # 9 HiDPI/4K WebP geological plates + paired .webp.json provenance sidecars
|-- fonts/                          # Self-hosted BricolageGrotesque & RedHatMono WOFF2 binaries
|-- docs/
|   |-- DESIGN_SYSTEM_RULES.md      # Canonical 7-section Figma MCP design system rules (this file)
|   |-- EMAIL_AND_QUOTES.md         # $0/mo custom domain email forwarding, Gmail alias & quote guide
|   `-- MONETIZATION_AND_PAYMENTS.md# Payment rail research & transparency worker architecture
|-- workers/
|   `-- funding-webhook.js          # HMAC-verified Stripe/Polar aggregate stats Cloudflare Worker
`-- squarespace/                    # Generated /s/ upload bundle & embed snippets (pack-squarespace.mjs)
```

### Hygiene & Pre-Push Gate Invariants
- **Author Identity:** `Eloquent (@mjeanhudson-dev)` across all source headers, manifests, and exports.
- **Zero Workstation Leakage:** Zero local OS usernames or workstation paths in any tracked file (`verify-public-push.mjs` must exit `0` with `errors=0`).
- **Zero Forbidden Punctuation:** Zero em dashes (`\u2014`) and zero en dashes (`\u2013`) across HTML, CSS, JS, JSON, and Markdown documentation.
