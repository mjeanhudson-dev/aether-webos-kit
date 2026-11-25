# Custom Domain Email Forwarding & Smart Quote Guide (`eloquentwin.com`)

Author: Eloquent (`@mjeanhudson-dev`)
Status: Operational `$0/mo` Email Routing, Outbound Gmail Alias & Quote Intake Guide for Aether WebOS Kit v2.4

This guide documents the exact `$0/mo` architecture for routing **`eloquent@eloquentwin.com`** (public B2B quotes and contact) and **`gazy@eloquentwin.com`** (private super-admin and infrastructure notices) into a single daily Gmail inbox (`<your-daily-gmail>@gmail.com`), replying seamlessly from `eloquent@eloquentwin.com`, and operating the zero-login **Smart Free Quote System** (`#act-contact` and `./context/contact.json`).

> [!IMPORTANT]
> **Repository Privacy Invariant:** Never commit or hardcode `<your-daily-gmail>@gmail.com` or `gazy@eloquentwin.com` inside public client HTML, CSS, JS, or `./context/contact.json`. Only `eloquent@eloquentwin.com` appears in public-facing web surfaces.

---

## 1. Live DNS Audit Snapshot (`eloquentwin.com`, Read-Only Check on `2026-11-25`)

A read-only DNS query (`Resolve-DnsName eloquentwin.com -Type MX,TXT,NS,A` and `_dmarc.eloquentwin.com -Type TXT`) returned the following live configuration:

| Record Type | Host | Observed Value | TTL | Operational Diagnosis |
|---|---|---|---|---|
| `NS` | `eloquentwin.com` | `nse1.squarespacedns.com` .. `nse4.squarespacedns.com` | `21600` | Authoritative DNS is currently managed at **Squarespace Domains** |
| `A` | `eloquentwin.com` | `198.185.159.144`, `198.185.159.145`, `198.49.23.144`, `198.49.23.145` | `14400` | Points apex web traffic to Squarespace web edge |
| `MX` | `eloquentwin.com` | Preference `1` -> `smtp.google.com` | `3600` | Points inbound mail to **Google Workspace** (`smtp.google.com`) |
| `TXT` (SPF) | `eloquentwin.com` | `v=spf1 include:_spf.google.com ~all` | `3600` | Authorizes Google outbound servers (`_spf.google.com`) |
| `TXT` (DMARC) | `_dmarc.eloquentwin.com` | *(none published yet)* | n/a | Safe to add relaxed DMARC (`p=none`) once forwarding is active |

### Critical Takeaway From Live DNS
Because `MX` currently points to `smtp.google.com`, inbound messages sent to `eloquent@eloquentwin.com` or `gazy@eloquentwin.com` will bounce with `550 5.1.1` **unless** either:
1. A paid Google Workspace subscription is active on `eloquentwin.com`, **OR**
2. You replace the `smtp.google.com` `MX` record with **Squarespace Domains Free Email Forwarding** (Path A below, `$0/mo`, zero nameserver migration) or **Cloudflare Email Routing** (Path B below, `$0/mo` if moving nameservers to Cloudflare).

---

## 2. Role Separation: Two Custom Addresses, One Daily Gmail Inbox

| Custom Address | Exposure Level | Operational Role | Gmail Inbox Label |
|---|---|---|---|
| `eloquent@eloquentwin.com` | **Public** (`./context/contact.json`, `#act-contact`, quote `mailto:`) | B2B custom build quotes, scoping capsules, reader replies, and partner inquiries | `Eloquent / Quotes` |
| `gazy@eloquentwin.com` | **Private** (never listed on public web pages) | Registrar notices, Cloudflare/GitHub security alerts, Stripe/Polar webhook administration, and domain ops | `Eloquent / Super-Admin` |

Both addresses forward into `<your-daily-gmail>@gmail.com` at `$0/mo` so you monitor one inbox on phone and desktop without paying per-seat mailbox fees.

---

## 3. Inbound Setup at `$0/mo` (Choose Path A or Path B)

### Path A (Recommended Default): Squarespace Domains Free Email Forwarding (`$0/mo`)

Use Path A while `eloquentwin.com` remains on `nse1..4.squarespacedns.com`. Squarespace includes up to 100 free forwarding rules per domain (powered behind the scenes by Mailgun).

1. **Remove Inactive Google Workspace MX Preset (If Not Paying for Workspace):**
   - Sign in at `https://account.squarespace.com/domains` and select **`eloquentwin.com`**.
   - Open **DNS** -> **DNS Settings**.
   - If a **Google Workspace** preset (`MX 1 smtp.google.com`) is listed and you do not have a paid Google Workspace account, delete that `MX` preset so Squarespace Email Forwarding can claim inbound `MX` cleanly.
2. **Create Both Forwarding Rules:**
   - In the left sidebar for `eloquentwin.com`, click **Email** -> **Email Forwarding** -> **Add rule**.
   - **Rule 1 (Public Quotes & Contact):** Forward `eloquent` (`@eloquentwin.com`) -> `<your-daily-gmail>@gmail.com`.
   - **Rule 2 (Private Super-Admin):** Forward `gazy` (`@eloquentwin.com`) -> `<your-daily-gmail>@gmail.com`.
3. **Confirm Destination Ownership:**
   - Open `<your-daily-gmail>@gmail.com` and click the verification link in the confirmation email sent by Squarespace.
4. **Unify the Single SPF `TXT` Record (Crucial for Outbound Gmail Replies):**
   - Squarespace Email Forwarding automatically adds its forwarding `MX` records (`mxa.mailgun.org` / `mxb.mailgun.org` or Squarespace's managed forwarding hosts) and an SPF `TXT` entry (`include:mailgun.org` or `include:squarespace-mail.com`).
   - RFC 7208 forbids publishing two separate `v=spf1` `TXT` records on the same apex domain. Inspect **DNS Settings** and ensure there is **one** merged `@` `TXT` record authorizing **both** Squarespace's forwarder and Google's outbound `smtp.gmail.com` relay:
     ```text
     Type: TXT
     Host: @
     Value: v=spf1 include:mailgun.org include:_spf.google.com ~all
     ```
     *(If Squarespace inserted `include:squarespace-mail.com` in its managed preset, keep that exact include token alongside `include:_spf.google.com` inside a single `v=spf1 ... ~all` string.)*
5. **Add a Relaxed DMARC Record (Recommended):**
   - Add one `TXT` record so receiving servers see valid DMARC telemetry without rejecting Gmail-relayed alias mail:
     ```text
     Type: TXT
     Host: _dmarc
     Value: v=DMARC1; p=none; adkim=r; aspf=r; rua=mailto:gazy@eloquentwin.com
     ```

---

### Path B (Optional `$0/mo` Alternative): Cloudflare Email Routing

Choose Path B only if you move `eloquentwin.com` authoritative nameservers from Squarespace to a free Cloudflare plan (for example, to bind Cloudflare Workers such as `workers/funding-webhook.js` or a future `/api/quote-intake` Worker directly on `eloquentwin.com` while keeping your existing `A` / `CNAME` web records pointed at Squarespace or GitHub Pages).

1. **Import Existing Web Records First:**
   - Add `eloquentwin.com` to Cloudflare (Free `$0/mo` plan) and verify all four Squarespace `A` records (`198.185.159.144`, `198.185.159.145`, `198.49.23.144`, `198.49.23.145`) and `www` `CNAME` copy over intact before switching nameservers at Squarespace.
2. **Enable Cloudflare Email Routing:**
   - In Cloudflare Dashboard -> **`eloquentwin.com`** -> **Email** -> **Email Routing** -> **Get started**.
   - Add `<your-daily-gmail>@gmail.com` under **Destination addresses** and click the verification link delivered to Gmail.
3. **Create Custom Addresses:**
   - `eloquent@eloquentwin.com` -> Action: **Send to an email** -> `<your-daily-gmail>@gmail.com`
   - `gazy@eloquentwin.com` -> Action: **Send to an email** -> `<your-daily-gmail>@gmail.com`
   - Keep **Catch-all address** set to **Drop** (disabled) so random dictionary spam never hits your daily inbox.
4. **Verify Cloudflare `MX` + Merged `SPF` Records:**
   - Cloudflare automatically publishes `route1.mx.cloudflare.net`, `route2.mx.cloudflare.net`, and `route3.mx.cloudflare.net`.
   - Edit the single `@` SPF `TXT` record so both Cloudflare forwarding and Gmail outbound SMTP pass SPF:
     ```text
     Type: TXT
     Name: @
     Content: v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all
     ```

---

## 4. Outbound Replies at `$0/mo`: Gmail "Send mail as" (`eloquent@eloquentwin.com`)

Inbound forwarding alone only receives mail. To reply from inside `<your-daily-gmail>@gmail.com` with **`From: Eloquent <eloquent@eloquentwin.com>`** at `$0/mo`, configure Gmail's SMTP alias using a Google App Password:

### Step 1: Generate a 16-Character Google App Password
1. Sign in to `<your-daily-gmail>@gmail.com` and open `https://myaccount.google.com/security`.
2. Ensure **2-Step Verification** is **On**.
3. Open `https://myaccount.google.com/apppasswords`.
4. Enter app name `Eloquent Domain Alias` and click **Create**.
5. Copy the 16-character password shown on screen (spaces do not matter) and store it in your password manager. Never use your main Google password in SMTP dialogs.

### Step 2: Register `eloquent@eloquentwin.com` Under Gmail "Send mail as"
1. In Gmail (`<your-daily-gmail>@gmail.com`), click **Settings (gear icon)** -> **See all settings** -> **Accounts and Import**.
2. In the **Send mail as** section, click **Add another email address**:
   - **Name:** `Eloquent`
   - **Email address:** `eloquent@eloquentwin.com`
   - **Treat as an alias:** Checked
   - Click **Next Step**.
3. Enter the SMTP relay credentials:
   - **SMTP Server:** `smtp.gmail.com`
   - **Port:** `587` with **Secured connection using TLS** *(or Port `465` with SSL)*
   - **Username:** `<your-daily-gmail>@gmail.com` *(must be the full `@gmail.com` login, not the custom domain)*
   - **Password:** Paste the 16-character App Password from Step 1
   - Click **Add Account**.
4. **Complete Verification:** Gmail immediately emails a confirmation code to `eloquent@eloquentwin.com`. Because inbound forwarding (Section 3) is active, that email arrives right inside `<your-daily-gmail>@gmail.com`. Click the link or paste the code to finish.
5. **Enable Automatic Domain Matching on Replies:** Back in **Settings -> Accounts and Import -> Send mail as**, select **"Reply from the same address the message was sent to"**. Whenever a client emails `eloquent@eloquentwin.com` and you press **Reply**, Gmail automatically sends from `Eloquent <eloquent@eloquentwin.com>`.
6. *(Optional)* Repeat Steps 2 to 4 for `gazy@eloquentwin.com` only if you ever need to send outbound verification emails from the super-admin address.

### Honest Deliverability Note (`via gmail.com` vs. Custom DKIM Relay)
When sending through `smtp.gmail.com` on a free `@gmail.com` account, Google signs outbound messages with Gmail's DKIM key (`d=gmail.com`), so Outlook and Gmail recipients may see a small `via gmail.com` note beside `eloquent@eloquentwin.com`. Keep `_dmarc.eloquentwin.com` at `p=none; adkim=r; aspf=r;` so strict DMARC alignment never blocks these replies. If higher B2B volume later calls for native `d=eloquentwin.com` DKIM signing with zero `via gmail.com` tag while staying at `$0/mo`, swap `smtp.gmail.com` in Step 2 for a free-tier transactional SMTP relay (such as Brevo, Resend, or SMTP2Go free tier) and add that provider's DKIM CNAME + SPF include to DNS.

---

## 5. Daily Gmail Triage Filters (`120-Second Setup`)

Create two filters in Gmail (**Settings -> Filters and Blocked Addresses -> Create a new filter**) so client quotes and admin alerts stay organized and never land in Spam:

1. **Public Quotes Filter:**
   - **To:** `eloquent@eloquentwin.com`
   - **Actions:** Apply label `Eloquent / Quotes`, check **Never send it to Spam**, check **Categorize as: Primary**.
2. **Super-Admin Filter:**
   - **To:** `gazy@eloquentwin.com`
   - **Actions:** Apply label `Eloquent / Super-Admin`, check **Star it**, check **Never send it to Spam**, check **Always mark it as important**.

---

## 6. How the v2.4 Smart Free Quote System Works (`#act-contact`)

Aether WebOS Kit v2.4 connects Act 1's **Smart AI Intent & Free Quote Router** (`[data-quote-router]`) directly to `#act-contact` (`#aether-quote-form` + `#aether-quote-preview`) and `./context/contact.json`:

```json
{
  "public_email": "eloquent@eloquentwin.com",
  "quote_webhook_url": null,
  "response_window": "1 to 2 business days"
}
```

1. **Intent Routing (Act 1 -> `#act-contact`):** After clicking `#cleave-detonate-btn` in Act 1, visitors can pick one of four tracks (`Offline Workspace`, `Private Local AI Vault`, `Custom Scroll / WebOS Site`, or `Free 30-Day Kit`), type an optional one-line goal, and click `Route My Free Quote ->`. Selecting a custom build track scrolls smoothly to `#act-contact` and pre-populates `#aether-quote-form`.
2. **Deterministic Client-Side Scope Synthesis (`#aether-quote-preview`):** As the visitor selects a Build Track, Timeline, or types plain-English notes (`spellcheck="true"`), the browser deterministically synthesizes a **Quote Reference ID** and a structured **Wave 0 / Wave 1 / Wave 2 Proposed Build Scope** with zero server round-trips and zero AI API cost.
3. **Three Zero-Lock-In Delivery Channels:**
   - **Email Quote Request (`mailto:eloquent@eloquentwin.com`):** Opens the visitor's mail client pre-addressed to `eloquent@eloquentwin.com` with the Quote Reference ID in the subject line and the complete Wave 0..2 scope + contact details formatted cleanly in the body.
   - **Copy Scoped Quote Brief:** Copies the formatted Markdown brief to the clipboard so visitors using browser webmail can paste and send to `eloquent@eloquentwin.com` in two clicks.
   - **Download Quote Capsule (`.json`):** Exports a portable JSON scoping receipt the client can keep on local disk or attach to an email.
   - **Optional Webhook Upgrade (`quote_webhook_url`):** Whenever `./context/contact.json` sets `quote_webhook_url` to a verified `https://` endpoint (`AetherFunding.isSafeHttpsUrl`), submitting `#aether-quote-form` also `POST`s the structured JSON payload directly to your Worker while keeping the email, copy, and download actions available as resilient fallbacks.

---

## 7. Post-Cutover DNS Verification Command

After enabling forwarding in Section 3, run this read-only PowerShell check to confirm the new `MX`, `SPF`, and `DMARC` records have propagated:

```powershell
# ==============================================================================
# LABEL:               Verify EloquentWin MX, SPF, and DMARC DNS Propagation
# USE:                 Confirm custom domain email forwarding and SPF/DMARC alignment after DNS updates.
# MECHANISM_OF_ACTION: Queries public DNS via Resolve-DnsName for MX and TXT records on eloquentwin.com and _dmarc.eloquentwin.com without modifying state.
# ==============================================================================
Resolve-DnsName eloquentwin.com -Type MX | Format-Table Name, NameExchange, Preference, TTL -AutoSize
Resolve-DnsName eloquentwin.com -Type TXT | Format-Table Name, Strings, TTL -AutoSize
Resolve-DnsName _dmarc.eloquentwin.com -Type TXT -ErrorAction SilentlyContinue | Format-Table Name, Strings, TTL -AutoSize
```
