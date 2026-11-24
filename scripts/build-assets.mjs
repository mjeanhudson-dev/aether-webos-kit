#!/usr/bin/env node
/**
 * Photorealistic Mineral & Obsidian Asset Pipeline for Aether WebOS Kit
 * Author: Eloquent (@mjeanhudson-dev)
 *
 * Processes high-resolution geological macro photography plates via headless
 * Chromium 2D canvas (exterior BFS flood-fill + edge color decontamination
 * against #FFFFFF for RGBA cutouts; exact obsidian hex edge-feathering for
 * #030508 / #05070B full-bleed plates) -> FFmpeg libwebp -> Impeccable
 * provenance embedding & automated alpha/dimension/size verification gate:
 *   1. assets/meteorite-crust.webp  (1200x1200, iron-nickel Widmanstatten RGBA cutout)
 *   2. assets/shard-01.webp         (640x640, torn Sikhote-Alin iron shrapnel RGBA cutout)
 *   3. assets/shard-02.webp         (640x640, liquid mercury on meteoric iron RGBA cutout)
 *   4. assets/impact-void.webp      (1440x900, opaque #030508 fractured obsidian impact)
 *   5. assets/artifact-poster.webp  (1440x900, opaque #05070B mercury-iron cleavage poster)
 *   6. assets/artifact-mercury.webp (1280x720, opaque #05070B molten mercury phase texture)
 *   7. assets/artifact-crystal.webp (1280x720, opaque #05070B cleaved crystal phase texture)
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { spawnSync, execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const playwrightPath = require.resolve("playwright-core", {
  paths: [
    process.cwd(),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "scroll-craft"),
  ],
});
const { chromium } = require(playwrightPath);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const ASSETS_DIR = path.join(ROOT_DIR, "assets");
const TMP_DIR = path.join(ROOT_DIR, "tmp", "build-assets-tmp");

const MAX_FILE_BYTES = 160 * 1024;
const TARGET_CEILING_BYTES = 148 * 1024;

const ASSET_SPECS = [
  {
    name: "meteorite-crust",
    file: "meteorite-crust.webp",
    rawPrefix: "meteorite_crust_raw",
    w: 1200,
    h: 1200,
    mode: "cutout",
    alpha: true,
    padRatio: 0.06,
    whiteThreshold: 236,
    featherBand: 34,
    startQuality: 84,
    minQuality: 68,
    marginCheckPx: 28,
    minTransRatio: 0.28,
    prompt:
      "Macro museum mineral specimen photography of an authentic, ancient, asymmetrically jagged iron-nickel octahedrite meteorite (Muonionalusta and Sikhote-Alin) with blackened charcoal regmaglypt fusion crust, oxidized iron-umber patina, naturally cleaved acid-etched Widmanstatten silver-graphite kamacite bands, tiny natural bronze troilite inclusions, and halo-free RGBA alpha exterior",
  },
  {
    name: "shard-01",
    file: "shard-01.webp",
    rawPrefix: "shard_01_raw",
    w: 640,
    h: 640,
    mode: "cutout",
    alpha: true,
    padRatio: 0.08,
    whiteThreshold: 236,
    featherBand: 34,
    startQuality: 84,
    minQuality: 68,
    marginCheckPx: 20,
    minTransRatio: 0.34,
    prompt:
      "Macro museum specimen photograph of a torn Sikhote-Alin iron-nickel meteorite shrapnel fragment with blackened regmaglypt fusion crust on one side, ragged crystalline silver-steel sheared metal fracture on the other, subtle dark iron-bronze patina, and clean RGBA alpha padding",
  },
  {
    name: "shard-02",
    file: "shard-02.webp",
    rawPrefix: "shard_02_raw",
    w: 640,
    h: 640,
    mode: "cutout",
    alpha: true,
    padRatio: 0.08,
    whiteThreshold: 238,
    featherBand: 30,
    startQuality: 84,
    minQuality: 68,
    marginCheckPx: 20,
    minTransRatio: 0.30,
    prompt:
      "Macro studio physics photograph of organic high-surface-tension liquid mercury and molten gallium-chrome droplets clinging to and cooling over a rough jagged fragment of blackened iron meteorite with faint warm bronze contact reflection and clean RGBA alpha padding",
  },
  {
    name: "impact-void",
    file: "impact-void.webp",
    rawPrefix: "impact_void_v2",
    w: 1440,
    h: 900,
    mode: "plate",
    alpha: false,
    bgHex: [3, 5, 8],
    vignetteInner: 0.42,
    vignetteOuter: 0.94,
    darkScale: 0.88,
    startQuality: 80,
    minQuality: 64,
    prompt:
      "Ultra-dark overhead geological photograph of a natural meteorite impact scar embedded in dark volcanic basalt and fractured black obsidian glass with radial shock fractures, shattered obsidian shards, subtle deep-amber fissure warmth, and seamless #030508 mirror-void perimeter feathering",
  },
  {
    name: "artifact-poster",
    file: "artifact-poster.webp",
    rawPrefix: "artifact_poster_v2",
    w: 1440,
    h: 900,
    mode: "plate",
    alpha: false,
    bgHex: [5, 7, 11],
    vignetteInner: 0.48,
    vignetteOuter: 0.96,
    darkScale: 1.0,
    startQuality: 82,
    minQuality: 66,
    prompt:
      "Dark museum macro photograph on seamless #05070B obsidian void showing heavy molten liquid mercury flowing over and solidifying into a jagged cleaved iron-nickel Widmanstatten meteorite core with recessed metallic bronze-amber troilite veins and raking studio rim light",
  },
  {
    name: "artifact-mercury",
    file: "artifact-mercury.webp",
    rawPrefix: "artifact_mercury_raw",
    w: 1280,
    h: 720,
    mode: "plate",
    alpha: false,
    bgHex: [5, 7, 11],
    vignetteInner: 0.46,
    vignetteOuter: 0.95,
    darkScale: 1.0,
    startQuality: 80,
    minQuality: 64,
    prompt:
      "Dark museum macro physics photograph on seamless #05070B obsidian void showing an asymmetric suspended mass of dark molten liquid mercury and gallium-chrome mid-flow with organic high-tension ridges and warm bronze horizon rim glint",
  },
  {
    name: "artifact-crystal",
    file: "artifact-crystal.webp",
    rawPrefix: "artifact_poster_raw",
    w: 1280,
    h: 720,
    mode: "plate",
    alpha: false,
    bgHex: [5, 7, 11],
    vignetteInner: 0.46,
    vignetteOuter: 0.95,
    darkScale: 1.0,
    startQuality: 80,
    minQuality: 64,
    prompt:
      "Dark museum macro photograph on seamless #05070B obsidian void showing a fully cleaved jagged iron-nickel octahedrite meteorite crystal monolith with authentic acid-etched Widmanstatten kamacite banding and deep recessed bronze-amber troilite seams",
  },
];

function runOutput(cmd, args) {
  try {
    return execFileSync(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

function globWinGetFfmpeg() {
  const home = process.env.USERPROFILE || process.env.HOME || os.homedir();
  if (!home) return [];
  const base = path.join(home, "AppData", "Local", "Microsoft", "WinGet", "Packages");
  if (!fs.existsSync(base)) return [];
  const out = [];
  for (const dir of fs.readdirSync(base)) {
    if (!/^Gyan\.FFmpeg/i.test(dir)) continue;
    const inner = path.join(base, dir);
    try {
      for (const entry of fs.readdirSync(inner)) {
        const candidate = path.join(inner, entry, "bin", "ffmpeg.exe");
        if (fs.existsSync(candidate)) out.push(candidate);
      }
    } catch {
      // ignore inaccessible directories
    }
  }
  return out;
}

function resolveFfmpeg() {
  const candidates = [
    process.env.SCROLLCRAFT_FFMPEG,
    "ffmpeg",
    ...globWinGetFfmpeg(),
    "/usr/local/bin/ffmpeg",
    "/opt/homebrew/bin/ffmpeg",
    "/usr/bin/ffmpeg",
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (candidate !== "ffmpeg" && !fs.existsSync(candidate)) continue;
    const encoders = runOutput(candidate, ["-hide_banner", "-encoders"]) || "";
    if (/libwebp/.test(encoders)) return candidate;
  }
  throw new Error("FFmpeg build with libwebp encoder not found. Set SCROLLCRAFT_FFMPEG.");
}

function resolveChrome() {
  const localAppData = process.env.LOCALAPPDATA || "";
  const progFiles = process.env.ProgramFiles || "C:/Program Files";
  const progFilesX86 = process.env["ProgramFiles(x86)"] || "C:/Program Files (x86)";
  const candidates = [
    process.env.SCROLLCRAFT_CHROME,
    path.join(progFiles, "Google/Chrome/Application/chrome.exe"),
    path.join(progFilesX86, "Google/Chrome/Application/chrome.exe"),
    path.join(progFilesX86, "Microsoft/Edge/Application/msedge.exe"),
    path.join(progFiles, "Microsoft/Edge/Application/msedge.exe"),
    localAppData && path.join(localAppData, "Google/Chrome/Application/chrome.exe"),
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ].filter(Boolean);

  const found = candidates.find((p) => fs.existsSync(p));
  if (!found) throw new Error("No Chrome/Chromium binary found. Set SCROLLCRAFT_CHROME.");
  return found;
}

function resolveImpeccableBin() {
  if (process.env.IMPECCABLE_BIN && fs.existsSync(process.env.IMPECCABLE_BIN)) {
    return process.env.IMPECCABLE_BIN;
  }
  const home = os.homedir();
  const binRoot = path.join(home, ".impeccable", "bin");
  const exeName = process.platform === "win32" ? "impeccable.exe" : "impeccable";
  if (fs.existsSync(binRoot)) {
    const versions = fs
      .readdirSync(binRoot)
      .filter((d) => fs.existsSync(path.join(binRoot, d, exeName)))
      .sort()
      .reverse();
    if (versions.length > 0) return path.join(binRoot, versions[0], exeName);
  }
  if (runOutput("impeccable", ["--version"]) !== null) return "impeccable";
  return null;
}

function execChecked(cmd, args, label) {
  const res = spawnSync(cmd, args, { encoding: "utf8" });
  if (res.status !== 0) {
    throw new Error(`${label} failed (exit ${res.status}): ${(res.stderr || res.stdout || "").trim()}`);
  }
  return res;
}

function resolveRawFile(rawDir, prefix) {
  if (!fs.existsSync(rawDir)) {
    throw new Error(`Raw assets directory does not exist: ${rawDir}`);
  }
  const matches = fs
    .readdirSync(rawDir)
    .filter((f) => f.startsWith(prefix) && /\.(png|jpe?g|webp)$/i.test(f))
    .sort()
    .reverse();
  if (!matches.length) {
    throw new Error(`No raw image matching prefix "${prefix}" in ${rawDir}`);
  }
  return path.join(rawDir, matches[0]);
}

function getProcessorHtml() {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>Aether Photorealistic Asset Processor</title></head>
<body style="margin:0;background:transparent">
<script>
(() => {
  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error("Failed loading " + url));
      im.src = url + "?t=" + Date.now();
    });
  }

  async function uploadCanvas(canvas, name) {
    const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    const resp = await fetch("/upload/still?name=" + encodeURIComponent(name), {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: blob,
    });
    if (!resp.ok) throw new Error("Upload failed for " + name);
  }

  function processCutout(im, spec) {
    // Work at full native resolution first so flood-fill & decontamination stay razor sharp
    const sw = im.naturalWidth;
    const sh = im.naturalHeight;
    const work = document.createElement("canvas");
    work.width = sw;
    work.height = sh;
    const wctx = work.getContext("2d", { willReadFrequently: true });
    wctx.drawImage(im, 0, 0, sw, sh);
    const imgData = wctx.getImageData(0, 0, sw, sh);
    const d = imgData.data;

    // 1. Exterior BFS flood-fill of near-white background pixels (protects interior bright chrome!)
    const total = sw * sh;
    const isBg = new Uint8Array(total);
    const queue = new Int32Array(total);
    let head = 0;
    let tail = 0;

    const thr = spec.whiteThreshold || 236;
    function isNearWhite(idx) {
      const o = idx * 4;
      const r = d[o], g = d[o + 1], b = d[o + 2];
      const minC = r < g ? (r < b ? r : b) : (g < b ? g : b);
      const maxC = r > g ? (r > b ? r : b) : (g > b ? g : b);
      return minC >= thr && (maxC - minC) <= 22;
    }

    function tryPush(idx) {
      if (!isBg[idx] && isNearWhite(idx)) {
        isBg[idx] = 1;
        queue[tail++] = idx;
      }
    }

    for (let x = 0; x < sw; x++) {
      tryPush(x);
      tryPush((sh - 1) * sw + x);
    }
    for (let y = 1; y < sh - 1; y++) {
      tryPush(y * sw);
      tryPush(y * sw + (sw - 1));
    }

    while (head < tail) {
      const idx = queue[head++];
      const x = idx % sw;
      const y = (idx - x) / sw;
      if (x > 0) tryPush(idx - 1);
      if (x + 1 < sw) tryPush(idx + 1);
      if (y > 0) tryPush(idx - sw);
      if (y + 1 < sh) tryPush(idx + sw);
    }

    // 2. Build distance-to-background map (1..3px fringe ring)
    const dist = new Uint8Array(total);
    dist.fill(9);
    for (let i = 0; i < total; i++) {
      if (isBg[i]) dist[i] = 0;
    }
    for (let step = 1; step <= 3; step++) {
      const prev = step - 1;
      for (let y = 1; y < sh - 1; y++) {
        const row = y * sw;
        for (let x = 1; x < sw - 1; x++) {
          const i = row + x;
          if (dist[i] !== 9) continue;
          if (
            dist[i - 1] === prev || dist[i + 1] === prev ||
            dist[i - sw] === prev || dist[i + sw] === prev
          ) {
            dist[i] = step;
          }
        }
      }
    }

    // 3. Apply soft alpha + exact white-matte color decontamination along boundary
    const band = spec.featherBand || 34;
    let minX = sw, minY = sh, maxX = 0, maxY = 0;

    for (let y = 0; y < sh; y++) {
      const row = y * sw;
      for (let x = 0; x < sw; x++) {
        const i = row + x;
        const o = i * 4;
        if (dist[i] === 0) {
          d[o] = 0; d[o + 1] = 0; d[o + 2] = 0; d[o + 3] = 0;
          continue;
        }
        let alpha = 1.0;
        if (dist[i] <= 3) {
          const r = d[o], g = d[o + 1], b = d[o + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const chroma = Math.max(r, g, b) - Math.min(r, g, b);
          const whiteness = lum - chroma * 0.7;
          if (dist[i] === 1) {
            // Outer 1px rim: aggressively cut faint white halo and decontaminate
            const t = Math.max(0, Math.min(1, (248 - whiteness) / (band + 18)));
            alpha = t < 0.16 ? 0 : t * t * (3 - 2 * t);
          } else if (dist[i] === 2) {
            const t = Math.max(0, Math.min(1, (252 - whiteness) / (band * 0.85)));
            alpha = Math.max(0.25, t);
          }
          if (alpha > 0 && alpha < 0.995) {
            // Exact un-premultiplication against #FFFFFF studio matte to kill white fringe on #07090D
            const inv = 1 / Math.max(alpha, 0.18);
            const bgW = (1 - alpha) * 255;
            d[o]     = Math.max(0, Math.min(255, Math.round((r - bgW) * inv)));
            d[o + 1] = Math.max(0, Math.min(255, Math.round((g - bgW) * inv)));
            d[o + 2] = Math.max(0, Math.min(255, Math.round((b - bgW) * inv)));
          }
        }
        const aByte = Math.round(alpha * 255);
        d[o + 3] = aByte;
        if (aByte > 12) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    wctx.putImageData(imgData, 0, 0);

    // 4. Center cropped specimen neatly into target W x H with guaranteed transparent padding
    const out = document.createElement("canvas");
    out.width = spec.w;
    out.height = spec.h;
    const octx = out.getContext("2d");
    octx.imageSmoothingEnabled = true;
    octx.imageSmoothingQuality = "high";

    const bw = Math.max(1, maxX - minX + 1);
    const bh = Math.max(1, maxY - minY + 1);
    const pad = Math.round(Math.min(spec.w, spec.h) * (spec.padRatio || 0.07));
    const maxW = spec.w - pad * 2;
    const maxH = spec.h - pad * 2;
    const scale = Math.min(maxW / bw, maxH / bh);
    const dw = Math.round(bw * scale);
    const dh = Math.round(bh * scale);
    const dx = Math.round((spec.w - dw) / 2);
    const dy = Math.round((spec.h - dh) / 2);
    octx.drawImage(work, minX, minY, bw, bh, dx, dy, dw, dh);
    return out;
  }

  function processPlate(im, spec) {
    const out = document.createElement("canvas");
    out.width = spec.w;
    out.height = spec.h;
    const ctx = out.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Cover-crop cleanly to target aspect ratio
    const scale = Math.max(spec.w / im.naturalWidth, spec.h / im.naturalHeight);
    const dw = im.naturalWidth * scale;
    const dh = im.naturalHeight * scale;
    const dx = (spec.w - dw) / 2;
    const dy = (spec.h - dh) / 2;
    ctx.drawImage(im, dx, dy, dw, dh);

    // Calibrate shadows and seamlessly feather outer margins into exact ground hex (#030508 or #05070B)
    const imgData = ctx.getImageData(0, 0, spec.w, spec.h);
    const d = imgData.data;
    const [br, bg, bb] = spec.bgHex || [5, 7, 11];
    const inner = spec.vignetteInner ?? 0.46;
    const outer = spec.vignetteOuter ?? 0.96;
    const darkScale = spec.darkScale ?? 1.0;

    for (let y = 0; y < spec.h; y++) {
      const ny = (y / (spec.h - 1)) * 2 - 1;
      for (let x = 0; x < spec.w; x++) {
        const nx = (x / (spec.w - 1)) * 2 - 1;
        const r = Math.hypot(nx * 0.94, ny * 1.08);
        let t = (r - inner) / Math.max(0.001, outer - inner);
        t = Math.max(0, Math.min(1, t));
        const fade = t * t * (3 - 2 * t);

        // Also enforce strict top/bottom edge melt (outer 8% of height)
        const edgeY = Math.min(y, spec.h - 1 - y) / (spec.h * 0.10);
        const edgeX = Math.min(x, spec.w - 1 - x) / (spec.w * 0.08);
        const edgeKeep = Math.max(0, Math.min(1, Math.min(edgeY, edgeX)));
        const keep = (1 - fade) * (edgeKeep * edgeKeep * (3 - 2 * edgeKeep));

        const o = (y * spec.w + x) * 4;
        const sr = d[o] * darkScale;
        const sg = d[o + 1] * darkScale;
        const sb = d[o + 2] * darkScale;

        // Lift pure #000000 noise floor cleanly to exact obsidian ground color
        const rr = Math.max(br, sr);
        const gg = Math.max(bg, sg);
        const bb2 = Math.max(bb, sb);

        d[o]     = Math.round(br + (rr - br) * keep);
        d[o + 1] = Math.round(bg + (gg - bg) * keep);
        d[o + 2] = Math.round(bb + (bb2 - bb) * keep);
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return out;
  }

  window.__AetherProcessor = {
    async processSpec(spec) {
      const im = await loadImage("/raw/" + encodeURIComponent(spec.name));
      const canvas = spec.mode === "cutout" ? processCutout(im, spec) : processPlate(im, spec);
      await uploadCanvas(canvas, spec.name);
      return { w: canvas.width, h: canvas.height };
    },

    async inspectWebp(url, opts) {
      const im = await loadImage(url);
      const W = im.naturalWidth;
      const H = im.naturalHeight;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(im, 0, 0);
      const data = ctx.getImageData(0, 0, W, H).data;

      let minA = 255, maxA = 0, transCount = 0, outerMarginMaxA = 0;
      const m = opts.marginCheckPx || 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const a = data[(y * W + x) * 4 + 3];
          if (a < minA) minA = a;
          if (a > maxA) maxA = a;
          if (a < 250) transCount++;
          if (m > 0 && (x < m || x >= W - m || y < m || y >= H - m)) {
            if (a > outerMarginMaxA) outerMarginMaxA = a;
          }
        }
      }
      const cx = Math.floor(W / 2);
      const cy = Math.floor(H / 2);
      const centerAlpha = data[(cy * W + cx) * 4 + 3];
      return {
        width: W,
        height: H,
        minAlpha: minA,
        maxAlpha: maxA,
        centerAlpha,
        outerMarginMaxAlpha: outerMarginMaxA,
        transparentRatio: Number((transCount / (W * H)).toFixed(4)),
        cornerRgb: [data[0], data[1], data[2], data[3]],
      };
    },

    async buildPreviewSheet(urls) {
      const W = 1680, H = 960;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d");

      ctx.fillStyle = "#07090D";
      ctx.fillRect(0, 0, W, H);
      // Warm Alabaster left half in top-left quadrant to inspect meteorite cutout on BOTH grounds
      ctx.fillStyle = "#F2EFE8";
      ctx.fillRect(0, 0, 340, 480);

      const imgs = {};
      for (const [k, u] of Object.entries(urls)) {
        imgs[k] = await loadImage(u);
      }

      // Meteorite straddling Alabaster #F2EFE8 and Obsidian #07090D
      ctx.drawImage(imgs["meteorite-crust"], 130, 30, 420, 420);
      // Shards on obsidian
      ctx.drawImage(imgs["shard-01"], 610, 60, 260, 260);
      ctx.drawImage(imgs["shard-02"], 910, 60, 260, 260);
      // Impact void upper right
      ctx.drawImage(imgs["impact-void"], 1200, 30, 450, 281);
      // Three Act 4 phases across bottom row
      ctx.drawImage(imgs["artifact-mercury"], 30, 500, 520, 325);
      ctx.drawImage(imgs["artifact-poster"], 580, 500, 520, 325);
      ctx.drawImage(imgs["artifact-crystal"], 1130, 500, 520, 325);

      await uploadCanvas(c, "contact-sheet");
    },
  };
})();
</script>
</body>
</html>`;
}

function encodeWebpUnderBudget(ffmpeg, srcPng, outWebp, spec) {
  let q = spec.startQuality;
  const minQ = spec.minQuality;
  while (true) {
    const ffArgs = ["-y", "-hide_banner", "-loglevel", "error", "-i", srcPng, "-c:v", "libwebp"];
    if (spec.alpha) {
      ffArgs.push("-pix_fmt", "yuva420p", "-quality", String(q), "-compression_level", "6", "-preset", "photo");
    } else {
      ffArgs.push("-pix_fmt", "yuv420p", "-quality", String(q), "-compression_level", "6", "-preset", "photo");
    }
    ffArgs.push(outWebp);
    execChecked(ffmpeg, ffArgs, `ffmpeg webp ${spec.name} q=${q}`);

    const size = fs.statSync(outWebp).size;
    if (size <= TARGET_CEILING_BYTES || q <= minQ) {
      return { size, quality: q };
    }
    q = Math.max(minQ, q - 4);
  }
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const rawDirIdx = rawArgs.indexOf("--raw-dir");
  const rawDir =
    rawDirIdx >= 0
      ? path.resolve(rawArgs[rawDirIdx + 1])
      : path.resolve(process.env.AETHER_RAW_ASSETS_DIR || path.join(ROOT_DIR, "raw-assets"));
  const sheetIdx = rawArgs.indexOf("--contact-sheet");
  const contactSheetOut = sheetIdx >= 0 ? path.resolve(rawArgs[sheetIdx + 1]) : null;

  const ffmpeg = resolveFfmpeg();
  const chromePath = resolveChrome();
  const impeccableBin = resolveImpeccableBin();

  const rawMap = {};
  for (const spec of ASSET_SPECS) {
    rawMap[spec.name] = resolveRawFile(rawDir, spec.rawPrefix);
  }

  fs.mkdirSync(ASSETS_DIR, { recursive: true });
  fs.rmSync(TMP_DIR, { recursive: true, force: true });
  fs.mkdirSync(TMP_DIR, { recursive: true });

  const html = getProcessorHtml();
  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url, "http://127.0.0.1");
    if (req.method === "GET" && reqUrl.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(html);
      return;
    }
    if (req.method === "GET" && reqUrl.pathname.startsWith("/raw/")) {
      const name = decodeURIComponent(path.basename(reqUrl.pathname));
      const p = rawMap[name];
      if (!p || !fs.existsSync(p)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const ext = path.extname(p).toLowerCase();
      const mime = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
      res.writeHead(200, { "Content-Type": mime, "Content-Length": fs.statSync(p).size });
      fs.createReadStream(p).pipe(res);
      return;
    }
    if (req.method === "GET" && reqUrl.pathname.startsWith("/assets/")) {
      const fileName = path.basename(reqUrl.pathname);
      const target = path.join(ASSETS_DIR, fileName);
      if (!fs.existsSync(target)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": "image/webp", "Content-Length": fs.statSync(target).size });
      fs.createReadStream(target).pipe(res);
      return;
    }
    if (req.method === "POST" && reqUrl.pathname === "/upload/still") {
      const chunks = [];
      req.on("data", (c) => chunks.push(c));
      req.on("end", () => {
        const name = path.basename(reqUrl.searchParams.get("name") || "");
        fs.writeFileSync(path.join(TMP_DIR, `${name}.png`), Buffer.concat(chunks));
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK");
      });
      return;
    }
    res.writeHead(404);
    res.end("Not found");
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  const browser = await chromium.launch({ executablePath: chromePath, headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1680, height: 1000 } });
    page.on("pageerror", (err) => console.error("[asset pageerror]", err));
    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });

    console.log("[1/4] Processing photorealistic geological cutouts & obsidian plates...");
    for (const spec of ASSET_SPECS) {
      await page.evaluate((s) => window.__AetherProcessor.processSpec(s), spec);
    }

    console.log("[2/4] Encoding WebP plates (ceiling <= 160 KB per asset)...");
    for (const spec of ASSET_SPECS) {
      const srcPng = path.join(TMP_DIR, `${spec.name}.png`);
      const outWebp = path.join(ASSETS_DIR, spec.file);
      const { size, quality } = encodeWebpUnderBudget(ffmpeg, srcPng, outWebp, spec);
      if (size > MAX_FILE_BYTES) {
        throw new Error(`${spec.file} exceeded 160 KB cap (${size} bytes)`);
      }
      if (impeccableBin) {
        execChecked(impeccableBin, ["embed-prompt", outWebp, "--prompt", spec.prompt], `embed-prompt ${spec.file}`);
      }
      console.log(`  ENC ${spec.file.padEnd(24)} q=${quality}  ${(size / 1024).toFixed(1)} KB`);
    }

    console.log("[3/4] Verifying decoded alpha channels, padding, solidity, and dimensions...");
    for (const spec of ASSET_SPECS) {
      const outWebp = path.join(ASSETS_DIR, spec.file);
      const stats = await page.evaluate(
        ({ url, opts }) => window.__AetherProcessor.inspectWebp(url, opts),
        { url: `${baseUrl}/assets/${spec.file}`, opts: spec }
      );
      if (stats.width !== spec.w || stats.height !== spec.h) {
        throw new Error(`${spec.file} dimension mismatch: got ${stats.width}x${stats.height}, expected ${spec.w}x${spec.h}`);
      }
      if (spec.alpha) {
        if (stats.centerAlpha !== 255) {
          throw new Error(`${spec.file} center pixel is not solid (centerAlpha=${stats.centerAlpha})`);
        }
        if (stats.outerMarginMaxAlpha !== 0) {
          throw new Error(`${spec.file} outer margin padding not transparent (outerMarginMaxAlpha=${stats.outerMarginMaxAlpha})`);
        }
        if (stats.minAlpha !== 0 || stats.maxAlpha !== 255 || stats.transparentRatio < spec.minTransRatio) {
          throw new Error(`${spec.file} lacks genuine RGBA cutout alpha: ${JSON.stringify(stats)}`);
        }
      } else {
        if (stats.minAlpha !== 255) {
          throw new Error(`${spec.file} expected opaque (minAlpha=${stats.minAlpha})`);
        }
      }
      const sizeBytes = fs.statSync(outWebp).size;
      console.log(
        `  OK  ${spec.file.padEnd(24)} ${stats.width}x${stats.height}  ${(sizeBytes / 1024)
          .toFixed(1)
          .padStart(6)} KB  alpha=[${stats.minAlpha}..${stats.maxAlpha}]  centerA=${stats.centerAlpha}  outerMaxA=${stats.outerMarginMaxAlpha}  trans=${(
          stats.transparentRatio * 100
        ).toFixed(1)}%  corner=${JSON.stringify(stats.cornerRgb)}`
      );
    }

    if (impeccableBin) {
      console.log("[4/4] Running impeccable embed-prompt --scan gate...");
      execChecked(impeccableBin, ["embed-prompt", "--scan", ASSETS_DIR], "embed-prompt --scan");
      console.log("  OK  Provenance scan passed (0 missing rasters)");
    }

    if (contactSheetOut) {
      const urlMap = {};
      for (const spec of ASSET_SPECS) urlMap[spec.name] = `${baseUrl}/assets/${spec.file}`;
      await page.evaluate((u) => window.__AetherProcessor.buildPreviewSheet(u), urlMap);
      fs.mkdirSync(path.dirname(contactSheetOut), { recursive: true });
      fs.copyFileSync(path.join(TMP_DIR, "contact-sheet.png"), contactSheetOut);
      console.log(`Contact sheet saved to ${contactSheetOut}`);
    }
  } finally {
    await browser.close();
    server.close();
    fs.rmSync(TMP_DIR, { recursive: true, force: true });
    const parentTmp = path.join(ROOT_DIR, "tmp");
    if (fs.existsSync(parentTmp) && fs.readdirSync(parentTmp).length === 0) {
      fs.rmdirSync(parentTmp);
    }
  }
}

main().catch((err) => {
  console.error("BUILD FAILED:", err);
  process.exit(1);
});
