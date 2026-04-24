# Worthly Positioning

## Product thesis

Worthly is the first AI built for the user, not the seller.
It spans the full purchase lifecycle:

- **Before purchase:** what to buy, what to skip
- **After purchase:** what to return, what to cancel, what dropped in price, what to resell

## Why this wins

- Every other shopping AI (Rufus, Perplexity, OpenAI Checkout) is paid by sellers and cannot say "skip"
- Worthly is paid by users ($9.99/mo Pro) and gets smarter with every outcome tracked
- The regret graph (feedback × recommendations) is a moat no retailer can build

## Core copy

**Hero headline:** Your AI purchase outcome agent

**Hero sub:** Worthly tells you what to buy, what to skip, what to return, what to cancel, what dropped in price, and what you can resell — all in one place.

**Primary CTA:** Try Worthly

**Secondary CTA:** See how it works

**Support line:** Before you buy. After you buy. Worthly stays with you.

**Final CTA:** Buy smarter. Recover more. Regret less.

## The 6 outcomes

1. **What to buy** — Quick verdicts on whether a product is actually worth it.
2. **What to skip** — Avoid overpriced, low-trust, or unnecessary purchases.
3. **What to return** — Stay ahead of return windows before it's too late.
4. **What to cancel** — Spot recurring charges draining your money.
5. **What dropped in price** — Catch post-purchase price drops and refunds.
6. **What you can resell** — Surface items you no longer need with resale value.

## Verdict system

- **BUY** — Confident purchase. Good value, strong trust signals, right timing.
- **WAIT** — Some hesitation. Check timing, price trajectory, or alternatives first.
- **SKIP** — Not recommended. Overpriced, low-trust, or unnecessary for this user.

A SKIP verdict when warranted is more valuable than a BUY. Worthly is paid by the user, not the seller.

## Pricing tiers

| Tier | Price | Core value |
|---|---|---|
| Free | $0 | 5 verdicts/month, basic return tracking |
| Pro | $9.99/mo | Unlimited verdicts, full post-purchase suite, price drop alerts |
| Family | $19.99/mo | Up to 5 members, shared purchase tracking |
| Concierge | $49.99/mo | Dedicated advisor, resale assistance, negotiation drafts |

Pro is the recommended tier. Highlight with "14 days free" badge.

## Tech stack (actual)

- **Frontend:** Vite + React 18 + TypeScript + wouter + Tailwind 3.4 + Framer Motion
- **Backend:** Express 5 + Drizzle ORM + Postgres (Supabase hosted)
- **AI:** Google Gemini 1.5 Flash (`@google/generative-ai`)
- **Auth:** passport-local + express-session (no Supabase Auth)
- **No Supabase JS client** — direct postgres connection via Drizzle

## What's real vs. mock

| Feature | Status |
|---|---|
| URL verdict (hero) | Real Gemini call via `/api/analyze-url` |
| Natural language query | Real Gemini call via `/api/query` |
| Return windows | Mock data (`purchases-data.ts`) |
| Subscriptions | Mock data |
| Actions | Mock data |
| Saved items | Real DB (`detected_products` table) |
| Pricing | Hardcoded (no DB table yet) |
| Waitlist | Real DB (`waitlist` table) |
