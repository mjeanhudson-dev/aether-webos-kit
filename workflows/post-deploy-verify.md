# Workflow: Post-Deploy Verify

**Loop:** every change to the site, from edit to proven live.

## Trigger
- **Event:** push to `main`, or a manual Cloudflare Pages deploy.

## Steps (fully autonomous, no checkpoint unless a step fails)
1. `node --test scripts/test-v23-hardening.mjs` must report 0 failures.
2. `node "$HOME/tools/verify-public-push.mjs" "."` must exit `0`.
3. Fetch and compare, expecting HTTP 200 and `X-Content-Type-Options: nosniff` (GitHub Pages cannot set headers, so `nosniff` is not required there):
   - `https://aether-webos-kit.pages.dev/`
   - `https://eloquentwin.com/` (expected to match the Pages byte length once the DNS cutover is complete)
   - `https://mjeanhudson-dev.github.io/aether-webos-kit/`
4. Check `Permissions-Policy` on the Pages origin equals `camera=(), microphone=(self), geolocation=()`.

## Brief (only on failure)
`FAILED <step>: <observed vs expected>. Last good deploy: <commit>.`

## Invariants
- Never push if step 1 or 2 fails.
- Never touch `CNAME`, DNS records, or secrets.
