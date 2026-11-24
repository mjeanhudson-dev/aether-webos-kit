#!/usr/bin/env node
/**
 * Aether WebOS Kit Squarespace /s/ Packager
 * Author: Eloquent (@mjeanhudson-dev)
 *
 * Wraps the canonical scroll-craft squarespace-pack.mjs packager and applies
 * deterministic post-pack guarantees:
 *   1. Registers and rewrites all relative url(...) assets inside styles/site.css
 *      (including non-preloaded RedHatMono WOFF2 fonts) with exact SHA-256 parity.
 *   2. Generates a scoped styles-site-embed-<hash>.css for Fluid Engine embed
 *      blocks so host html/body backgrounds and fixed site headers are never
 *      overwritten.
 *   3. Orders scrollcraft*.css BEFORE webos-refractory-*.css and styles-site*.css
 *      in both blank-page-head.html and code-block-embed.html so Aether tokens
 *      always win the cascade.
 *   4. Recomputes manifest.json hashes, byte counts, and totalUploadBytes cleanly.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT_DIR = path.join(ROOT, 'squarespace');
const UPLOAD_DIR = path.join(OUT_DIR, 'upload-to-s');
const SQUARESPACE_LIMIT_BYTES = 20 * 1024 * 1024;
const PREFIX = 'aether-webos-rollout-';
const ASSET_BASE = '/s/';

function sha256Buffer(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function withContentHash(flatName, shaHex) {
  const ext = path.extname(flatName);
  const stem = ext ? flatName.slice(0, -ext.length) : flatName;
  return `${stem}-${shaHex.slice(0, 8)}${ext}`;
}

function flattenAssetName(relPath) {
  const clean = relPath
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '')
    .replace(/^assets\//, '');
  return `${PREFIX}${clean.replace(/\//g, '-').replace(/[^a-zA-Z0-9._-]/g, '-')}`;
}

function scopeSiteCssForEmbed(cssText) {
  return cssText
    .replace(/(^|\n):root,\s*\n\[data-sc-embed\]\s*\{/g, '$1[data-sc-embed] {')
    .replace(/(^|\n)html,\s*\nbody\s*\{/g, '$1[data-sc-embed] {')
    .replace(/(^|\n)::selection\s*\{/g, '$1[data-sc-embed] ::selection {')
    .replace(/(^|\n)a:hover\s*\{/g, '$1[data-sc-embed] a:hover {')
    .replace(/(^|\n):focus-visible\s*\{/g, '$1[data-sc-embed] :focus-visible {')
    .replace(
      /(^|\n)\.site-bar\s*\{\s*\n\s*position:\s*fixed;/g,
      '$1.site-bar {\n  position: sticky;'
    );
}

function reorderStylesheets(htmlText) {
  const lines = htmlText.split('\n');
  const styleLines = [];
  const otherLines = [];
  let insertAt = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/<link\b[^>]*rel=["']stylesheet["'][^>]*>/i.test(lines[i])) {
      if (insertAt === -1) insertAt = otherLines.length;
      styleLines.push(lines[i]);
    } else {
      otherLines.push(lines[i]);
    }
  }
  if (styleLines.length < 2 || insertAt === -1) return htmlText;

  const rank = (line) => {
    if (/scrollcraft(?:-embed)?-/i.test(line)) return 0;
    if (/webos-refractory-/i.test(line)) return 1;
    if (/styles-site(?:-embed)?-/i.test(line)) return 2;
    return 3;
  };

  const sorted = styleLines
    .map((line, idx) => ({ line, idx, r: rank(line) }))
    .sort((a, b) => (a.r !== b.r ? a.r - b.r : a.idx - b.idx))
    .map((x) => x.line);

  otherLines.splice(insertAt, 0, ...sorted);
  return otherLines.join('\n');
}

async function main() {
  const packagerPath =
    process.env.SCROLLCRAFT_PACK ||
    path.join(
      os.homedir(),
      '.gemini',
      'config',
      'plugins',
      'scroll-craft',
      'skills',
      'scroll-craft',
      'scripts',
      'squarespace-pack.mjs'
    );

  if (!fs.existsSync(packagerPath)) {
    throw new Error(`scroll-craft squarespace-pack.mjs not found at ${packagerPath}`);
  }

  const { packSquarespace } = await import(pathToFileURL(packagerPath).href);
  packSquarespace({
    inDir: ROOT,
    outDir: OUT_DIR,
    assetBase: ASSET_BASE,
    prefix: PREFIX,
    load: 'direct',
  });

  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const uploadsBySource = new Map(manifest.uploads.map((u) => [u.source, u]));

  // 1. Rewrite relative url(...) inside styles/site.css and register any unreferenced local assets (e.g. RedHatMono WOFF2)
  const siteRec = uploadsBySource.get('styles/site.css');
  if (!siteRec) throw new Error('styles/site.css entry missing from manifest');

  const oldSiteUploadFile = siteRec.uploadFile;
  const oldSitePublicPath = siteRec.publicPath;
  const rawSiteCss = fs.readFileSync(path.join(ROOT, 'styles/site.css'), 'utf8');
  const cssBaseDir = path.join(ROOT, 'styles');

  const rewrittenSiteCss = rawSiteCss.replace(/url\((['"]?)([^)'"]+)\1\)/gi, (full, q, rawUrl) => {
    const clean = rawUrl.trim();
    if (/^(?:https?:|data:|blob:|\/s\/|#)/i.test(clean)) return full;
    const abs = path.resolve(cssBaseDir, clean.split('?')[0].split('#')[0]);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      throw new Error(`Missing CSS-referenced asset: ${rawUrl}`);
    }
    const relFromRoot = path.relative(ROOT, abs).replace(/\\/g, '/');
    let rec = uploadsBySource.get(relFromRoot);
    if (!rec) {
      const buf = fs.readFileSync(abs);
      const sha256 = sha256Buffer(buf);
      const uploadFile = withContentHash(flattenAssetName(relFromRoot), sha256);
      fs.writeFileSync(path.join(UPLOAD_DIR, uploadFile), buf);
      rec = {
        source: relFromRoot,
        uploadFile,
        publicPath: `${ASSET_BASE}${uploadFile}`,
        bytes: buf.length,
        sha256,
        over20MB: buf.length > SQUARESPACE_LIMIT_BYTES,
      };
      manifest.uploads.push(rec);
      uploadsBySource.set(relFromRoot, rec);
    }
    return `url(${q}${rec.publicPath}${q})`;
  });

  // Replace styles-site upload with rewritten content & true SHA-256 hash
  const newSiteBuf = Buffer.from(rewrittenSiteCss, 'utf8');
  const newSiteSha = sha256Buffer(newSiteBuf);
  const newSiteUploadFile = withContentHash(`${PREFIX}styles-site.css`, newSiteSha);
  const newSitePublicPath = `${ASSET_BASE}${newSiteUploadFile}`;

  fs.rmSync(path.join(UPLOAD_DIR, oldSiteUploadFile), { force: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, newSiteUploadFile), newSiteBuf);
  siteRec.uploadFile = newSiteUploadFile;
  siteRec.publicPath = newSitePublicPath;
  siteRec.bytes = newSiteBuf.length;
  siteRec.sha256 = newSiteSha;
  siteRec.over20MB = newSiteBuf.length > SQUARESPACE_LIMIT_BYTES;

  // 2. Generate scoped styles-site-embed-<hash>.css for Fluid Engine Code Block embeds
  const embedSiteCss = scopeSiteCssForEmbed(rewrittenSiteCss);
  const embedSiteBuf = Buffer.from(embedSiteCss, 'utf8');
  const embedSiteSha = sha256Buffer(embedSiteBuf);
  const embedSiteUploadFile = withContentHash(`${PREFIX}styles-site-embed.css`, embedSiteSha);
  const embedSitePublicPath = `${ASSET_BASE}${embedSiteUploadFile}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, embedSiteUploadFile), embedSiteBuf);
  manifest.uploads.push({
    source: `(generated) ${embedSiteUploadFile}`,
    uploadFile: embedSiteUploadFile,
    publicPath: embedSitePublicPath,
    bytes: embedSiteBuf.length,
    sha256: embedSiteSha,
    over20MB: embedSiteBuf.length > SQUARESPACE_LIMIT_BYTES,
  });

  // 3. Patch blank-page-head.html and code-block-embed.html (updated hashes + stylesheet cascade order)
  const blankHeadPath = path.join(OUT_DIR, 'blank-page-head.html');
  let blankHead = fs.readFileSync(blankHeadPath, 'utf8');
  blankHead = blankHead.split(oldSitePublicPath).join(newSitePublicPath);
  blankHead = reorderStylesheets(blankHead);
  fs.writeFileSync(blankHeadPath, blankHead, 'utf8');

  const embedPath = path.join(OUT_DIR, 'code-block-embed.html');
  let embedHtml = fs.readFileSync(embedPath, 'utf8');
  embedHtml = embedHtml.split(oldSitePublicPath).join(embedSitePublicPath);
  embedHtml = reorderStylesheets(embedHtml);
  fs.writeFileSync(embedPath, embedHtml, 'utf8');

  // 4. Recompute totalUploadBytes and verify zero orphan files
  manifest.generatedAt = new Date().toISOString();
  manifest.totalUploadBytes = manifest.uploads.reduce((sum, u) => sum + u.bytes, 0);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const expectedFiles = new Set(manifest.uploads.map((u) => u.uploadFile));
  const actualFiles = fs.readdirSync(UPLOAD_DIR);
  const orphans = actualFiles.filter((f) => !expectedFiles.has(f));
  if (orphans.length) {
    throw new Error(`Unexpected orphan files in upload-to-s/: ${orphans.join(', ')}`);
  }

  console.log(
    `PACK_OK: uploads=${manifest.uploads.length} totalBytes=${manifest.totalUploadBytes} siteCss=${newSiteUploadFile} embedSiteCss=${embedSiteUploadFile}`
  );
}

main().catch((err) => {
  console.error('PACK_FAIL:', err);
  process.exit(1);
});
