# Monetization and Payments Research Brief

Author: Eloquent (@mjeanhudson-dev). Status: working brief for Aether WebOS Kit v2.2.

> Fee and policy figures below are approximate public numbers recorded at the time of writing. Confirm each on the vendor's own pricing and terms page before you sign up, because rates, payout rules, and country coverage change.

## What we are actually selling

1. **Free, MIT-licensed tooling** (Aether WebOS Kit, floorplan-codex, public skills). Goodwill and proof of work. Cheap to support, never paywalled.
2. **Turn-key B2B work**: bespoke offline WebOS kits, private agentic suites, and scroll-driven storefronts delivered with full source ownership. This is where real revenue comes from.
3. **Optional backing** from people who use the free tools and want them maintained.

Donations alone rarely pay a living. Treat them as a signal and a thank-you channel, and treat B2B scoping as the revenue engine.

## Rail comparison (as of 2026-11-25)

| Rail | Typical cost (verify at link) | Merchant of record | Best for | Watch out for |
|---|---|---|---|---|
| [GitHub Sponsors](https://github.com/sponsors) | No platform fee on individual sponsorships at time of writing | No, you handle your own taxes | Recurring backing from developers, native Sponsor button | Needs an approved listing (not approved for this account as of today), organization or invoiced sponsorships can carry a fee, limited B2B invoicing |
| [Polar.sh](https://polar.sh/pricing) | Roughly 4% plus a fixed fee per order, extra for subscriptions and international cards | Yes, handles global VAT and sales tax | Open source funding, digital products, issue bounties, GitHub-linked perks | Younger platform, confirm payout countries and terms |
| [Stripe Payment Links + Customer Portal](https://stripe.com/pricing) | About 2.9% plus a fixed fee for US domestic cards, plus roughly 1.5% or more for international cards and currency conversion | No, you own tax compliance unless you enable Stripe Tax | Fast one-time tips and B2B deposits, self-serve receipts and subscription management | You carry VAT and sales tax duties, the Customer Portal must be configured first |
| [Lemon Squeezy](https://www.lemonsqueezy.com/pricing) | Roughly 5% plus a fixed fee | Yes | Selling software or downloads globally with tax handled | Higher take rate, owned by Stripe so confirm its roadmap |
| [Paddle](https://www.paddle.com/pricing) | Roughly 5% plus a fixed fee | Yes | SaaS and larger B2B software sales, invoicing and purchase orders | Approval process, heavier than a tip jar |

This is not legal or tax advice. Without a merchant of record, B2B sales across borders can create VAT or sales tax duties for you.

## Recommendation

- **Phase 1 (this week, free to start):** GitHub Sponsors (once the listing is approved) plus a Polar.sh account for tax-handled one-offs and recurring tiers. Keep `.github/FUNDING.yml` to two or three real channels. A broken slug shows as a dead button.
- **Phase 2 (B2B deposits):** Stripe Payment Links for turn-key project deposits and retainers, with the Stripe Customer Portal as the self-serve billing and receipts page. Add Stripe Tax if you sell across borders.
- **Phase 3 (transparency dashboard):** deploy `workers/funding-webhook.js` (config in `workers/wrangler.toml`). It verifies HMAC signatures, writes one KV key per provider event so retries cannot double count, and serves `/api/funding-stats`. Cents are hidden until 5 backers so one supporter's amount cannot be read off the public endpoint. No names, emails, or card data are stored. Totals are approximate past 1,000 events; move to D1 or a Durable Object if volume grows.

## Static dashboard design

- **Tier 1, static:** `context/funding.json` is the source of truth for channels and milestones. The page renders without any live data and works offline.
- **Tier 2, live aggregate:** point `live_stats_endpoint` in `funding.json` at the deployed Worker once it has secrets and a KV namespace. Never put API keys in client code.

## Who to target for B2B

Small teams that need private, offline-capable tooling: local service operators, training and education groups, regulated or privacy-minded studios, and agencies that want a distinctive scroll-driven site without a SaaS subscription. Lead with a fixed-scope discovery call and a written one-page scope, matching the Day 10 scope exercise in the kit.

## Not done yet (honest list)

- No payment account is connected yet. Every payment URL in `funding.json` stays `null` until a real one exists, and GitHub Sponsors reported no listing for this account on 2026-11-25.
- The Worker is written and reviewed but not deployed, and it has not been tested against real Stripe or Polar deliveries. The Polar signing-secret format and event field names are assumptions to confirm with one real test delivery. Do not show public totals until that is done.
- `context/funding.json` is wired into `#act-support` via `scripts/stage-choreography.js` (`window.AetherFunding`): while all channel URLs stay `null`, the support button remains honestly disabled, and once a valid `https://` Stripe, GitHub Sponsors, or Polar URL is added, it activates automatically.
- Fee numbers are approximate and need confirming at signup.
