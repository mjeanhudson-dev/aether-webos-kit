# AGENTS.md — Site Maintainer Boneworks (`eloquentwin.com` / `aether-webos-kit`)

Operational skeleton and invariants for AI agents and human maintainers working on **Aether WebOS Kit** (`eloquentwin.com`).

---

## 1. Canonical Ownership & Live Surfaces
- **Brand / Public Author:** `Eloquent` (`@mjeanhudson-dev`)
- **Primary Domain:** `https://eloquentwin.com/` (`www.eloquentwin.com`)
- **Site & Cloudflare Admin Email:** `eloquent@eloquentwin.com`
- **Primary Edge Host (Cloudflare Pages):** `https://aether-webos-kit.pages.dev/` (project: `aether-webos-kit`, production branch: `main`)
- **Static Mirror (GitHub Pages):** `https://mjeanhudson-dev.github.io/aether-webos-kit/`
- **Git Repository:** `https://github.com/mjeanhudson-dev/aether-webos-kit` (`main`)
- **Local Working Copy:** `~/.gemini/antigravity/scratch/aether-webos-rollout`

---

## 2. Runtime File Skeleton (static files + `_headers`)
Only runtime files ship to edge hosting; docs, scratch tests, `workflows/`, and `node_modules` stay out of the deploy bundle.

```text
/
├── index.html                    # Main landing + interactive WebOS stage
├── scrollcraft.css               # Scroll-craft layout & motion styles
├── scrollcraft.js                # Scroll-driven choreography runtime
├── _headers                      # Cloudflare Pages security & cache headers
├── CNAME                         # Custom domain pin (eloquentwin.com)
├── scripts/
│   └── stage-choreography.js     # Act transitions & scroll triggers
├── styles/site.css               # Design system tokens & typography
├── webgl/artifact-shader.js      # WebGL shader canvas
├── webos/
│   ├── refractory.js / .css      # Interactive WebOS workspace shell
│   ├── capsules.js               # Capsule state renderer
│   ├── exporter.js               # Export pipeline
│   └── live-bridge.js            # Gemini Live co-pilot bridge (opt-in, Connect-click only)
├── context/
│   ├── contact.json              # Public contact metadata
│   ├── funding.json              # Sponsorship / funding metadata
│   └── terminal-synthesis.json   # Terminal readout content
├── assets/*.webp (+ .webp.json)  # Optimized visual assets & metadata
├── fonts/*.woff2 / *.ttf         # BricolageGrotesque & RedHatMono
└── workers/                      # Cloudflare Workers (separate deploy, not in _site)
    ├── wrangler.toml             # aether-funding-webhook + FUNDING_KV
    ├── funding-webhook.js        # Stripe/Polar webhook handler
    ├── wrangler.live-token.toml  # aether-live-token
    └── live-token.js             # Gemini ephemeral-token minter (Origin + Turnstile gated)
```

---

## 3. Non-Negotiable DNS, Email & Security Invariants
1. **Never Break `eloquent@eloquentwin.com` Email:** Always preserve these 3 DNS records in Cloudflare (Zone `4ae8c5f4974d41913ea9b496c61c750d`):
   - `MX` `@` -> `smtp.google.com` (Priority `1`, TTL `3600`, DNS Only)
   - `TXT` `@` -> `v=spf1 include:_spf.google.com ~all` (TTL `3600`)
   - `TXT` `google._domainkey` -> Google Workspace RSA DKIM key (TTL `3600`)
2. **Cloudflare Routing & SSL:**
   - `CNAME` `@` -> `aether-webos-kit.pages.dev` (`proxied: true`)
   - `CNAME` `www` -> `aether-webos-kit.pages.dev` (`proxied: true`)
   - Cloudflare SSL/TLS mode **must remain `Full`** (never `Flexible`, which causes redirect loops).
   - Registrar nameservers (Squarespace -> Custom Nameservers): `brodie.ns.cloudflare.com`, `holly.ns.cloudflare.com`.
   - **DNSSEC Rule:** Never swap nameservers while old registrar DNSSEC is enabled (causes `SERVFAIL` on web + email). Disable registrar DNSSEC first, verify `DS` clears, then switch nameservers. Use `scripts/watch-dns-cutover.ps1`.
3. **Zero PII / OS Path Leakage:** Never commit local usernames, absolute OS home paths, or API tokens. Always use `Eloquent` and `~/` in docs/scripts.
4. **Edge Headers (`_headers`):** Keep `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(self), geolocation=()` (microphone is same-origin only, for Live co-pilot Hold-to-Talk), immutable caching on `/assets/*` and `/fonts/*`, and `max-age=300` on `/context/*`.

---

## 4. Standard Maintainer Workflow (Edit -> Test -> Gate -> Deploy -> Verify)

### A. Local Preview (Port 4500)
```powershell
# ==============================================================================
# LABEL:               Start Local Aether WebOS Preview Server
# USE:                 Preview visual and interactive edits locally before committing or deploying.
# MECHANISM_OF_ACTION: Runs scroll-craft serve.mjs against ~/.gemini/antigravity/scratch/aether-webos-rollout on http://127.0.0.1:4500/.
# ==============================================================================
node "$HOME/.gemini/config/plugins/scroll-craft/skills/scroll-craft/scripts/serve.mjs" --root "$HOME/.gemini/antigravity/scratch/aether-webos-rollout" --port 4500
```

### B. Hardening Tests & Public Hygiene Gate (Required Before Every Push)
```powershell
# ==============================================================================
# LABEL:               Run Hardening Suite & Public Push Hygiene Gate
# USE:                 Verify all site hardening assertions and guarantee zero PII/secret leakage before git push or edge deploy.
# MECHANISM_OF_ACTION: Executes Node's built-in test runner on scripts/test-v23-hardening.mjs and runs verify-public-push.mjs requiring exit code 0.
# ==============================================================================
cd "$HOME/.gemini/antigravity/scratch/aether-webos-rollout" && node --test scripts/test-v23-hardening.mjs && node "$HOME/tools/verify-public-push.mjs" "."
```

### C. Deploy Targets
- **GitHub Pages (Automatic):** Pushing to `main` triggers `.github/workflows/` Pages deployment to `https://mjeanhudson-dev.github.io/aether-webos-kit/`.
- **Cloudflare Pages (Automatic or Direct):**
  - CI workflow `.github/workflows/deploy-cloudflare.yml` deploys `_site` automatically once `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are added to GitHub Actions Secrets.
  - Or deploy directly via the Cloudflare MCP plugin (`cloudflare_cloudflare`) / Pages Direct Upload API using the runtime files + `_headers`.
- **Optional Workers (`workers/`):** Never commit secrets to any `wrangler*.toml`; set `STRIPE_WEBHOOK_SECRET`, `POLAR_WEBHOOK_SECRET`, `GEMINI_API_KEY`, and `TURNSTILE_SECRET_KEY` via `wrangler secret put`.

### D. Post-Deploy Live Verification (Required After Every Deploy)
```powershell
# ==============================================================================
# LABEL:               Verify Live Cloudflare Pages HTTPS & Security Headers
# USE:                 Confirm production edge serves HTTP 200 across HTML, WebP, JS, JSON, and security headers.
# MECHANISM_OF_ACTION: Fetches root index, artifact-crystal.webp, scrollcraft.js, and context/funding.json and prints status, byte count, Content-Type, and X-Content-Type-Options.
# ==============================================================================
@'
import urllib.request
for u in [
    'https://eloquentwin.com/',
    'https://aether-webos-kit.pages.dev/',
    'https://aether-webos-kit.pages.dev/assets/artifact-crystal.webp',
    'https://aether-webos-kit.pages.dev/scrollcraft.js',
    'https://aether-webos-kit.pages.dev/context/funding.json',
]:
    with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=10) as r:
        b = r.read()
        print(r.status, len(b), r.headers.get('Content-Type'), r.headers.get('X-Content-Type-Options'), u)
'@ | python -
```

### E. DNS Cutover Watcher
See `workflows/dns-cutover-watcher.md` and `scripts/watch-dns-cutover.ps1`. Post-deploy checklist: `workflows/post-deploy-verify.md`.

---

## 5. Agent Guardrails
- Keep changes minimal and reversible; never run unasked `npm install`.
- Do not modify `CNAME`, `_headers`, or DNS `MX`/`SPF`/`DKIM` records unless explicitly requested.
- Always prove changes against real test output and live HTTP responses before reporting done.
