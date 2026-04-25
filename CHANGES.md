# CHANGES — Worthly AI App Realignment

## Session 3 — Close the gaps between landing page promise and authenticated app

### New files

| File | Purpose |
|---|---|
| `client/src/lib/supabase.ts` | Supabase client with VITE env vars. `SupabaseUser` type. |
| `client/src/pages/auth.tsx` | Magic-link sign-in page. Email → OTP → redirect to `/app`. Handles SIGNED_IN event and `return_to` param. |

### Changed files

| File | What changed |
|---|---|
| `client/src/pages/dashboard.tsx` | Collapsed to URL-only (removed Describe/Saved tabs). Added "Don't have a URL?" link to `/app/discover`. Context-aware action strip: BUY/WAIT/SKIP each have distinct outcome buttons that write to `/api/detected-products` or `/api/feedback`. |
| `client/src/pages/mine.tsx` | Removed mock data fallback — authenticated users see real API data only. |
| `client/src/components/Navbar.tsx` | Auth state: shows email + Sign out when signed in, Sign in button when not. |
| `client/src/pages/settings.tsx` | Added Account section with sign in/out. |
| `client/src/App.tsx` | Renamed `/app/verdicts` → `/app/discover`. Added `/auth` route. |
| `server/analyze-url.ts` | Replaced OG-tag regex with cheerio platform parsers from `server/scrape/product.ts`. |
| `shared/schema.ts` | Added `tracked_subscriptions`, `price_watches`, `price_history` tables. |

### Pending next session

- `npm run db:push` — push 3 new tables (network timeout blocked this session)
- Auth guards on `/app/*` routes
- Anonymous → authenticated session migration on magic link confirm
- Gmail receipt connector for Returns tab
- Price watch polling cron
- Stripe wiring

---

## Session 2 — App realign to match landing page promise

### New files

| File | Purpose |
|---|---|
| `server/gemini-verdict.ts` | `VerdictInput` / `VerdictOutput` types + `getVerdictForUrl()`. Anti-seller prompt, userContext injection, 10s timeout with WAIT fallback. |
| `server/scrape/product.ts` | `scrapeProductFromUrl()` — cheerio-based platform scraper. Amazon, Target, Walmart, Shopify selectors. 6s timeout. |
| `client/src/pages/mine.tsx` | Unified post-purchase page: Watching / Returns / Renewals / Resale tabs. |

### Changed files

| File | What changed |
|---|---|
| `server/routes.ts` | Added `POST /api/verdict/url`, `POST /api/chat` (streaming). IP rate limiter 3/day anonymous. |
| `shared/schema.ts` | Added `chatThreads`, `chatMessages`, `sensitiveTo` on `userPreferences`. |
| `client/src/pages/dashboard.tsx` | URL verdict engine, history strip, demo URLs, full VerdictOutput shape, VerdictChat. |
| `client/src/components/Navbar.tsx` | APP_NAV: Analyze / Mine / Settings. |
| `client/src/pages/settings.tsx` | Goals + Sensitivities multi-select. Removed session ID block. |
| `client/src/App.tsx` | Added `/app/mine` route. |

### Redirected

| Old route | New destination |
|---|---|
| `/app/returns` | `/app/mine?tab=returns` |
| `/app/subscriptions` | `/app/mine?tab=renewals` |
| `/app/actions` | `/app/mine` |
| `/saved` | `/app/mine?tab=watching` |
