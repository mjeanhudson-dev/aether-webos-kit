#!/usr/bin/env node
/**
 * Aether WebOS Kit Squarespace /s/ Packager
 * Author: Eloquent (@mjeanhudson-dev)
 *
 * Wraps the canonical scroll-craft squarespace-pack.mjs packager and applies
 * deterministic post-pack guarantees:
 *   1. Discovers and packages webos/capsules.js with true SHA-256 hash into
 *      squarespace/upload-to-s/.
 *   2. Registers and rewrites all relative url(...) assets inside styles/site.css
 *      (including non-preloaded RedHatMono WOFF2 fonts) and webos/refractory.css
 *      with exact SHA-256 parity.
 *   3. Generates a scoped styles-site-embed-<hash>.css for Fluid Engine embed
 *      blocks so host html/body backgrounds and fixed site headers are never
 *      overwritten.
 *   4. Enforces exact stylesheet order (scrollcraft*.css -> webos-refractory-*.css ->
 *      styles-site*.css) and <script defer> order (capsules -> exporter ->
 *      refractory -> artifact-shader -> stage-choreography) in both
 *      blank-page-head.html and code-block-embed.html.
 *   5. Recomputes manifest.json hashes, byte counts, and totalUploadBytes and
 *      verifies 0 orphans, 0 .ttf URLs, 0 OS usernames/paths, and 100% SHA-256 parity.
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
    .replace(/\r\n/g, '\n')
    .replace(/(^|\n):root,\s*\n?\[data-sc-embed\]\s*\{/g, '$1[data-sc-embed] {')
    .replace(/(^|\n)html,\s*\n?body\s*\{/g, '$1[data-sc-embed] {')
    .replace(/(^|\n)::selection\s*\{/g, '$1[data-sc-embed] ::selection {')
    .replace(/(^|\n)a:hover\s*\{/g, '$1[data-sc-embed] a:hover {')
    .replace(/(^|\n):focus-visible\s*\{/g, '$1[data-sc-embed] :focus-visible {')
    .replace(
      /(^|\n)\.site-bar\s*\{\s*\n\s*position:\s*fixed;/g,
      '$1.site-bar {\n  position: sticky;'
    );
}

function reorderLinesByRank(htmlText, lineMatcher, rankFn) {
  const lines = htmlText.replace(/\r\n/g, '\n').split('\n');
  const matched = [];
  const otherLines = [];
  let insertAt = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lineMatcher(lines[i])) {
      if (insertAt === -1) insertAt = otherLines.length;
      matched.push(lines[i]);
    } else {
      otherLines.push(lines[i]);
    }
  }
  if (matched.length < 2 || insertAt === -1) return htmlText;

  const sorted = matched
    .map((line, idx) => ({ line, idx, r: rankFn(line) }))
    .sort((a, b) => (a.r !== b.r ? a.r - b.r : a.idx - b.idx))
    .map((x) => x.line);

  otherLines.splice(insertAt, 0, ...sorted);
  return otherLines.join('\n');
}

function reorderStylesheets(htmlText) {
  return reorderLinesByRank(
    htmlText,
    (line) => /<link\b[^>]*rel=["']stylesheet["'][^>]*>/i.test(line),
    (line) => {
      if (/scrollcraft(?:-embed)?-/i.test(line)) return 0;
      if (/webos-refractory-/i.test(line)) return 1;
      if (/styles-site(?:-embed)?-/i.test(line)) return 2;
      return 3;
    }
  );
}

function reorderDeferredScripts(htmlText) {
  return reorderLinesByRank(
    htmlText,
    (line) => /<script\b[^>]*\bdefer\b[^>]*\bsrc=["'][^"']+["'][^>]*>\s*<\/script>/i.test(line),
    (line) => {
      if (/webos-capsules-/i.test(line) || /\/capsules\.js/i.test(line)) return 0;
      if (/webos-exporter-/i.test(line) || /\/exporter\.js/i.test(line)) return 1;
      if (/webos-refractory-/i.test(line) || /\/refractory\.js/i.test(line)) return 2;
      if (/webgl-artifact-shader-/i.test(line) || /\/artifact-shader\.js/i.test(line)) return 3;
      if (/scripts-stage-choreography-/i.test(line) || /\/stage-choreography\.js/i.test(line)) return 4;
      return 5;
    }
  );
}

function rewriteCssAssetUrls(cssText, cssRelPath, manifest, uploadsBySource) {
  const cssBaseDir = path.dirname(path.join(ROOT, cssRelPath));
  return cssText.replace(/url\((['"]?)([^)'"]+)\1\)/gi, (full, q, rawUrl) => {
    const clean = rawUrl.trim();
    if (/^(?:https?:|data:|blob:|\/s\/|#)/i.test(clean)) return full;
    const abs = path.resolve(cssBaseDir, clean.split('?')[0].split('#')[0]);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
      throw new Error(`Missing CSS-referenced asset in ${cssRelPath}: ${rawUrl}`);
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
}

function registerSourceFile(relSource, manifest, uploadsBySource) {
  const abs = path.join(ROOT, relSource);
  if (!fs.existsSync(abs) || !fs.statSync(abs).isFile()) {
    throw new Error(`Required module missing on disk: ${relSource}`);
  }
  const existing = uploadsBySource.get(relSource);
  if (existing) return existing;

  const buf = fs.readFileSync(abs);
  const sha256 = sha256Buffer(buf);
  const uploadFile = withContentHash(flattenAssetName(relSource), sha256);
  fs.writeFileSync(path.join(UPLOAD_DIR, uploadFile), buf);
  const rec = {
    source: relSource,
    uploadFile,
    publicPath: `${ASSET_BASE}${uploadFile}`,
    bytes: buf.length,
    sha256,
    over20MB: buf.length > SQUARESPACE_LIMIT_BYTES,
  };
  manifest.uploads.push(rec);
  uploadsBySource.set(relSource, rec);
  return rec;
}

function injectScriptBeforeExporter(htmlText, publicPath) {
  if (htmlText.includes(publicPath)) return htmlText;
  const tag = `<script defer src="${publicPath}"></script>`;
  const exporterRe = /^.*<script\b[^>]*\bsrc=["'][^"']*webos-exporter-[^"']+["'][^>]*>\s*<\/script>.*$/im;
  if (exporterRe.test(htmlText)) {
    return htmlText.replace(exporterRe, (line) => `${tag}\n${line}`);
  }
  throw new Error(`Cannot locate webos-exporter script anchor to inject ${publicPath}`);
}

function assertOrderedMatches(text, label, namedMatchers) {
  let prevIndex = -1;
  for (const [name, re] of namedMatchers) {
    const m = re.exec(text);
    if (!m) {
      throw new Error(`${label}: missing expected tag for ${name}`);
    }
    if (m.index <= prevIndex) {
      throw new Error(`${label}: ${name} appears out of order`);
    }
    prevIndex = m.index;
  }
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function verifyPackagedBundle(manifest, newSiteUploadFile, embedSiteUploadFile, blankHead, embedHtml) {
  if (manifest.warnings && manifest.warnings.length > 0) {
    throw new Error(`Packager warnings present: ${manifest.warnings.join('; ')}`);
  }

  const expectedFiles = new Set();
  for (const u of manifest.uploads) {
    if (/\.ttf\b/i.test(u.uploadFile) || /\.ttf\b/i.test(u.source) || /\.ttf\b/i.test(u.publicPath)) {
      throw new Error(`Forbidden .ttf asset in manifest: ${u.uploadFile}`);
    }
    const uploadPath = path.join(UPLOAD_DIR, u.uploadFile);
    if (!fs.existsSync(uploadPath)) {
      throw new Error(`Manifest upload missing on disk: ${u.uploadFile}`);
    }
    const buf = fs.readFileSync(uploadPath);
    const actualSha = sha256Buffer(buf);
    if (buf.length !== u.bytes || actualSha !== u.sha256 || u.over20MB) {
      throw new Error(`SHA-256 or byte mismatch for ${u.uploadFile}`);
    }
    expectedFiles.add(u.uploadFile);
  }

  const actualFiles = fs.readdirSync(UPLOAD_DIR);
  const orphans = actualFiles.filter((f) => !expectedFiles.has(f));
  if (orphans.length) {
    throw new Error(`Unexpected orphan files in upload-to-s/: ${orphans.join(', ')}`);
  }

  const expectedDeferScripts = [
    ['capsules', /<script\b[^>]*\bdefer\b[^>]*src="\/s\/aether-webos-rollout-webos-capsules-[0-9a-f]{8}\.js"/i],
    ['exporter', /<script\b[^>]*\bdefer\b[^>]*src="\/s\/aether-webos-rollout-webos-exporter-[0-9a-f]{8}\.js"/i],
    ['refractory', /<script\b[^>]*\bdefer\b[^>]*src="\/s\/aether-webos-rollout-webos-refractory-[0-9a-f]{8}\.js"/i],
    ['artifact-shader', /<script\b[^>]*\bdefer\b[^>]*src="\/s\/aether-webos-rollout-webgl-artifact-shader-[0-9a-f]{8}\.js"/i],
    ['stage-choreography', /<script\b[^>]*\bdefer\b[^>]*src="\/s\/aether-webos-rollout-scripts-stage-choreography-[0-9a-f]{8}\.js"/i],
  ];

  assertOrderedMatches(blankHead, 'blank-page-head.html stylesheets', [
    ['scrollcraft.css', /<link\b[^>]*rel=["']stylesheet["'][^>]*href="\/s\/aether-webos-rollout-scrollcraft-[0-9a-f]{8}\.css"/i],
    ['webos-refractory.css', /<link\b[^>]*rel=["']stylesheet["'][^>]*href="\/s\/aether-webos-rollout-webos-refractory-[0-9a-f]{8}\.css"/i],
    ['styles-site.css', /<link\b[^>]*rel=["']stylesheet["'][^>]*href="\/s\/aether-webos-rollout-styles-site-[0-9a-f]{8}\.css"/i],
  ]);
  assertOrderedMatches(blankHead, 'blank-page-head.html scripts', expectedDeferScripts);

  assertOrderedMatches(embedHtml, 'code-block-embed.html stylesheets', [
    ['scrollcraft-embed.css', /<link\b[^>]*rel=["']stylesheet["'][^>]*href="\/s\/aether-webos-rollout-scrollcraft-embed-[0-9a-f]{8}\.css"/i],
    ['webos-refractory.css', /<link\b[^>]*rel=["']stylesheet["'][^>]*href="\/s\/aether-webos-rollout-webos-refractory-[0-9a-f]{8}\.css"/i],
    ['styles-site-embed.css', /<link\b[^>]*rel=["']stylesheet["'][^>]*href="\/s\/aether-webos-rollout-styles-site-embed-[0-9a-f]{8}\.css"/i],
  ]);
  assertOrderedMatches(embedHtml, 'code-block-embed.html scripts', expectedDeferScripts);

  const siteCssText = fs.readFileSync(path.join(UPLOAD_DIR, newSiteUploadFile), 'utf8');
  const embedCssText = fs.readFileSync(path.join(UPLOAD_DIR, embedSiteUploadFile), 'utf8');
  for (const [label, css] of [[newSiteUploadFile, siteCssText], [embedSiteUploadFile, embedCssText]]) {
    if (/\.\.\/fonts\//i.test(css)) {
      throw new Error(`Unrewritten relative ../fonts/ url() in ${label}`);
    }
    if (!/\/s\/aether-webos-rollout-fonts-RedHatMono-Regular-[0-9a-f]{8}\.woff2/i.test(css)) {
      throw new Error(`Missing WOFF2 url() rewrite in ${label}`);
    }
  }
  if (/(^|\n)\s*(?:html,\s*\n?body|:root,)\s*\{/i.test(embedCssText)) {
    throw new Error(`Unscoped html/body/:root rule leaked into ${embedSiteUploadFile}`);
  }
  if (!/\[data-sc-embed\]\s*\{/.test(embedCssText) || !/\.site-bar\s*\{\s*\n\s*position:\s*sticky;/.test(embedCssText)) {
    throw new Error(`Missing [data-sc-embed] or sticky .site-bar isolation in ${embedSiteUploadFile}`);
  }

  const osUser = (os.userInfo().username || '').trim();
  const userRe = osUser.length >= 3 ? new RegExp(escapeRegExp(osUser), 'i') : null;
  const winHomeRe = new RegExp(['(?:file:///)?[A-Za-z]:[/\\\\]', 'Users', '[/\\\\](?!<)[A-Za-z0-9._ -]+'].join(''), 'i');
  const posixHomeRe = new RegExp(['(?:^|[\\s(\"`\'])/(?:', 'Users', '|home)/(?!<)[A-Za-z0-9._-]+'].join(''), 'm');

  const htmlFiles = ['blank-page-head.html', 'blank-page-body.html', 'code-block-embed.html', 'iframe-embed.html'];
  const textArtifacts = [
    ...htmlFiles.map((f) => path.join(OUT_DIR, f)),
    path.join(OUT_DIR, 'manifest.json'),
    ...actualFiles.filter((f) => /\.(css|js)$/i.test(f)).map((f) => path.join(UPLOAD_DIR, f)),
  ];

  for (const artifactPath of textArtifacts) {
    const content = fs.readFileSync(artifactPath, 'utf8');
    const rel = path.relative(OUT_DIR, artifactPath).replace(/\\/g, '/');
    if (userRe && userRe.test(content)) {
      throw new Error(`OS username leaked in ${rel}`);
    }
    if (winHomeRe.test(content) || posixHomeRe.test(content)) {
      throw new Error(`Local home path leaked in ${rel}`);
    }
    if ((rel.endsWith('.html') || rel.endsWith('.css') || rel === 'manifest.json') && /\.ttf(?:[?#"'\\s)]|$)/i.test(content)) {
      throw new Error(`Forbidden .ttf URL or reference in ${rel}`);
    }
  }
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

  // 1. Ensure webos/capsules.js is discovered and packaged with true SHA-256 parity
  const capsulesRec = registerSourceFile('webos/capsules.js', manifest, uploadsBySource);

  // 2. Rewrite relative url(...) inside styles/site.css (and webos/refractory.css if present)
  const siteRec = uploadsBySource.get('styles/site.css');
  if (!siteRec) throw new Error('styles/site.css entry missing from manifest');

  const oldSiteUploadFile = siteRec.uploadFile;
  const oldSitePublicPath = siteRec.publicPath;
  const rawSiteCss = fs.readFileSync(path.join(ROOT, 'styles/site.css'), 'utf8');
  const rewrittenSiteCss = rewriteCssAssetUrls(rawSiteCss, 'styles/site.css', manifest, uploadsBySource);

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

  const extraReplacements = [];
  const refractoryCssRec = uploadsBySource.get('webos/refractory.css');
  if (refractoryCssRec) {
    const rawRefractoryCss = fs.readFileSync(path.join(ROOT, 'webos/refractory.css'), 'utf8');
    const rewrittenRefractoryCss = rewriteCssAssetUrls(
      rawRefractoryCss,
      'webos/refractory.css',
      manifest,
      uploadsBySource
    );
    if (rewrittenRefractoryCss !== rawRefractoryCss) {
      const oldRefFile = refractoryCssRec.uploadFile;
      const oldRefPub = refractoryCssRec.publicPath;
      const newRefBuf = Buffer.from(rewrittenRefractoryCss, 'utf8');
      const newRefSha = sha256Buffer(newRefBuf);
      const newRefFile = withContentHash(`${PREFIX}webos-refractory.css`, newRefSha);
      const newRefPub = `${ASSET_BASE}${newRefFile}`;
      fs.rmSync(path.join(UPLOAD_DIR, oldRefFile), { force: true });
      fs.writeFileSync(path.join(UPLOAD_DIR, newRefFile), newRefBuf);
      refractoryCssRec.uploadFile = newRefFile;
      refractoryCssRec.publicPath = newRefPub;
      refractoryCssRec.bytes = newRefBuf.length;
      refractoryCssRec.sha256 = newRefSha;
      refractoryCssRec.over20MB = newRefBuf.length > SQUARESPACE_LIMIT_BYTES;
      extraReplacements.push([oldRefPub, newRefPub]);
    }
  }

  // 3. Generate scoped styles-site-embed-<hash>.css for Fluid Engine Code Block embeds
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

  // 4. Patch blank-page-head.html and code-block-embed.html (hashes, capsules, stylesheet & script order)
  const blankHeadPath = path.join(OUT_DIR, 'blank-page-head.html');
  let blankHead = fs.readFileSync(blankHeadPath, 'utf8');
  blankHead = blankHead.split(oldSitePublicPath).join(newSitePublicPath);
  for (const [oldPub, newPub] of extraReplacements) blankHead = blankHead.split(oldPub).join(newPub);
  blankHead = injectScriptBeforeExporter(blankHead, capsulesRec.publicPath);
  blankHead = reorderStylesheets(blankHead);
  blankHead = reorderDeferredScripts(blankHead);
  fs.writeFileSync(blankHeadPath, blankHead, 'utf8');

  const embedPath = path.join(OUT_DIR, 'code-block-embed.html');
  let embedHtml = fs.readFileSync(embedPath, 'utf8');
  embedHtml = embedHtml.split(oldSitePublicPath).join(embedSitePublicPath);
  for (const [oldPub, newPub] of extraReplacements) embedHtml = embedHtml.split(oldPub).join(newPub);
  embedHtml = injectScriptBeforeExporter(embedHtml, capsulesRec.publicPath);
  embedHtml = reorderStylesheets(embedHtml);
  embedHtml = reorderDeferredScripts(embedHtml);
  fs.writeFileSync(embedPath, embedHtml, 'utf8');

  // 5. Recompute totalUploadBytes and run full parity & hygiene verification
  manifest.generatedAt = new Date().toISOString();
  manifest.totalUploadBytes = manifest.uploads.reduce((sum, u) => sum + u.bytes, 0);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  verifyPackagedBundle(manifest, newSiteUploadFile, embedSiteUploadFile, blankHead, embedHtml);

  console.log(
    `PACK_OK: uploads=${manifest.uploads.length} totalBytes=${manifest.totalUploadBytes} capsules=${capsulesRec.uploadFile} siteCss=${newSiteUploadFile} embedSiteCss=${embedSiteUploadFile}`
  );
}

main().catch((err) => {
  console.error('PACK_FAIL:', err);
  process.exit(1);
});
