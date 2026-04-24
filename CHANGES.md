# CHANGES — Worthly AI App Realignment

## Session 2 — App realign to match landing page promise

### New files

| File | Purpose |
|---|---|
| `server/gemini-verdict.ts` | `VerdictInput` / `VerdictOutput` types + `getVerdictForUrl()`. Anti-seller prompt, userContext injection, 10s timeout with WAIT fallback. |
| `server/scrape/product.ts` | `scrapeProductFromUrl()` — cheerio-based platform scraper. Amazon, Target, Walmart, Shopify selectors ported from extension. TikTok/Instagram stubbed. 6s timeout. |
| `client/src/pages/mine.tsx` | Unified post-purchase page: Watching / Returns / Renewals / Resale tabs. Actionable empty states. Reads `GET /api/detected-products`. |

### Changed files

| File | What changed |
|---|---|
| `server/routes.ts` | Added `POST /api/verdict/url` (scrape + verdict + rate limit + DB persist), `POST /api/chat` (streaming Gemini Flash). IP rate limiter (3/day for anonymous). |
| `shared/schema.ts` | Added `chatThreads`, `chatMessages` tables. Added `sensitiveTo` column to `userPreferences`. |
| `client/src/pages/dashboard.tsx` | Full rewrite: 3 tabs (URL / Describe / Saved), session-local history strip, demo URLs, calls `/api/verdict/url`, full VerdictOutput shape (headline, waitUntil, duplicateFlag, estimatedSavings, resaleOutlook, 4 score bars). `VerdictChat` component below verdict. |
| `client/src/components/Navbar.tsx` | APP_NAV simplified to 3 items: Analyze / Mine / Settings. |
| `client/src/pages/settings.tsx` | Removed Session ID block, removed quick-links. Added Goals multi-select + Sensitivities multi-select. Persists to `lifestyleTags` + `sensitiveTo`. |
| `client/src/App.tsx` | Added `/app/mine` route. |

### Redirected / replaced

| Old route | New destination |
|---|---|
| `/app/returns` | `/app/mine?tab=returns` |
| `/app/subscriptions` | `/app/mine?tab=renewals` |
| `/app/actions` | `/app/mine` |
| `/saved` | `/app/mine?tab=watching` |

MOCK_PURCHASES / MOCK_SUBSCRIPTIONS / MOCK_ACTIONS removed from rendered pages (kept in `lib/purchases-data.ts` for homepage preview). Mine page falls back to MOCK_DETECTED_PRODUCTS for demo mode only.

---

## TODOs

### Must-do before launch
1. **`npm run db:push`** — Push schema changes: `waitlist`, `chatThreads`, `chatMessages`, `sensitiveTo` column on `user_preferences`. Run when Supabase is active.
2. **Rate limiting persistence** — Current IP rate limiter is in-memory (resets on server restart). Replace with Redis or a `rate_limits` DB table for production.
3. **Auth** — No login/signup UI. Session ID is a localStorage UUID. `GET /api/detected-products` returns empty without `x-user-id` header. Mine page shows demo data for all unauthenticated users.

### Near-term features
4. **Gmail connector** — Renewals tab is empty; stub points to "Connect Gmail coming soon". Wire Nylas or Gmail OAuth to auto-detect subscriptions and receipts.
5. **Receipt forwarding** — Returns tab CTA points to `receipts@worthlyai.com`. Email parsing pipeline (Inbound Parse → parse order confirmation → insert TrackedPurchase) is not built.
6. **Resale pricing** — Resale tab is empty. Needs a "mark as sell" action on Watching cards + market price lookup (eBay Completed Listings API or similar).
7. **Stripe wiring** — Pricing section CTAs on landing page go to `/app`. Wire to Stripe Checkout when billing is ready.

### Scraper limitations
8. **Amazon blocks** — Amazon returns 503 or CAPTCHA for most server-side scrapes. The cheerio scraper will get minimal data for Amazon URLs. The extension reads the live DOM and is the correct long-term fix. Interim option: Browserless / ScrapingBee proxy.
9. **TikTok / Instagram** — Behind login wall. Scraper returns og:image only. Gemini verdict is low-confidence. Marked as TODO in `server/scrape/product.ts`.

### Chat
10. **Chat persistence** — `chatThreads` / `chatMessages` tables exist in schema but `POST /api/chat` does not yet persist messages to DB (streams directly). Add DB persistence when auth is wired (need user/session to anchor threads).

---

## Session 1 — Repositioning (prior session summary)

### Files added (session 1)
- `docs/POSITIONING.md` — Source-of-truth copy brief
- `server/prompts/verdict.ts` — URL-based Gemini verdict prompt (v1, superseded by `gemini-verdict.ts`)
- `server/prompts/_archive/verdict.v1.ts` — Archived original query-based prompt
- `server/analyze-url.ts` — OG/meta regex scraper + `getUrlVerdict()` (still used by legacy `/api/analyze-url`)

### Files changed (session 1)
- `client/src/pages/dashboard.tsx` — URL input wired to `/api/analyze-url`, VerdictCard with score bars
- `client/src/components/Navbar.tsx` — Dual nav (landing vs. app), "Try Worthly AI" CTA
- `client/src/pages/landing.tsx` — WaitlistForm + pricing section (4 tiers)
- `shared/schema.ts` — `waitlist` table
- `server/storage.ts` — `addToWaitlist`
- `server/routes.ts` — `POST /api/analyze-url`, `POST /api/waitlist`

### Session 1 TODOs still open
- `npm run db:push` for `waitlist` table (timed out, Supabase was paused)
- Auth UI (Supabase Auth or passport-local)
- `/api/detected-products GET` returns empty without auth
