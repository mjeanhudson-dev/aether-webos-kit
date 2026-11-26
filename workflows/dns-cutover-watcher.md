# Workflow: DNS Cutover Watcher (`eloquentwin.com` Squarespace -> Cloudflare)

**Loop:** one-time but retryable domain cutover; re-runnable any time DNS drifts.

## Trigger
- **Schedule:** every 15 minutes while the cutover is open (`powershell -File scripts/watch-dns-cutover.ps1 -Watch`), otherwise on demand.

## Phases
1. **Phase A (blocked on the human):** the owner disables DNSSEC at the registrar (Squarespace). The watcher polls the `DS` record (currently KeyTag `4615`) until it clears. Output: `WAIT: DS still active`.
2. **Phase B (Checkpoint, push right):** once `DS` is empty the watcher prints `SAFE TO SWITCH NS`. The brief to the owner is one line: set registrar nameservers to `brodie.ns.cloudflare.com` and `holly.ns.cloudflare.com`. Nothing else is asked.
3. **Phase C (autonomous):** after NS flips, the watcher verifies `NS`, `MX` (`smtp.google.com`), SPF `TXT`, and that `https://eloquentwin.com/` matches the Pages origin (HTTP 200, same byte length, `nosniff`). Output: `LIVE ON CLOUDFLARE`.

## Invariants
- Never swap NS while `DS` is present (SERVFAIL on web and email).
- Never edit `MX`, SPF, DKIM, or `CNAME` records from this workflow; it is read-only.

## Verification
- Exit `0` only for `LIVE ON CLOUDFLARE`; `WAIT`/`SAFE` states exit `1` so schedulers can branch.

## Brief format
`<STATE>: <one-line reason>. Next: <the single action the owner must take, or "none">.`
