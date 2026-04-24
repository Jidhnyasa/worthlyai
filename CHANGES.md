# CHANGES — Worthly Repositioning

## What was added

### New files
- `docs/POSITIONING.md` — Source-of-truth copy brief: headline, 6 outcomes, pricing, verdict system, tech stack reality
- `server/prompts/verdict.ts` — URL-based Gemini verdict prompt. Strongly biased toward the user (not the seller). Returns `UrlVerdictResult` with fit_score, value_score, regret_score, 3 structured reasons, trust/value/timing sentences
- `server/prompts/_archive/verdict.v1.ts` — Archived original query-based system prompt (used by `/api/query`)
- `server/analyze-url.ts` — `scrapeProductMeta(url)` (OG/meta tag extraction, no cheerio) + `getUrlVerdict(input)` (Gemini call with new prompt)

### New API routes (in `server/routes.ts`)
- `POST /api/analyze-url` — Scrapes OG metadata from a product URL, calls Gemini, returns `UrlVerdictResult`. No auth required. Works on any HTTPS URL.
- `POST /api/waitlist` — Inserts email into `waitlist` table. Handles duplicate gracefully (returns `{ success: true, already: true }`).

### New DB table (in `shared/schema.ts`)
- `waitlist` — `(id uuid, email text UNIQUE, source text, created_at timestamp)`
- ⚠️ Run `npm run db:push` to create this table. (Timed out during this session — likely DB was paused. Run it when Supabase is active.)

### New storage method (in `server/storage.ts`)
- `addToWaitlist({ email, source })` — Inserts into `waitlist` table

### New UI component (in `client/src/pages/landing.tsx`)
- `WaitlistForm` — Email form that calls `POST /api/waitlist`. Shows success/error states. Used in extension callout section.

## What was changed

### `client/src/pages/dashboard.tsx`
- `VerdictResult` interface updated: `reasons` is now `{ label: string; detail: string }[]` (was `string[]`). Added `fit_score`, `value_score`, `regret_score` fields.
- `handleAnalyze` rewritten: now calls real `POST /api/analyze-url` instead of a 1.6s `setTimeout` fake. Handles non-URL input gracefully.
- `VerdictCard` updated: reasons render as `**Label:** detail`. Added score bars (Fit / Value / Regret risk) with color coding.
- Demo product data updated to use `{ label, detail }` reason shape.
- `handleSave` updated to serialize reasons as `"label: detail"` strings for `verdictReasonJson`.

### `client/src/components/Navbar.tsx`
- Added `LANDING_NAV` (Use cases / How it works / Pricing / Demo) shown on non-app pages
- `APP_NAV` (existing) shown only on `/app/*` and `/saved` and `/settings`
- Primary CTA is now always-visible "Try Worthly" button (was mobile-only)
- Mobile bottom nav only renders on app pages (was always visible)
- Landing nav uses `<a>` tags for hash links (vs `<Link>` for client routes)

### `client/src/pages/landing.tsx`
- Added `cn` import from `@/lib/utils`
- Added `useCallback` to React imports
- Added `WaitlistForm` component
- Extension callout CTA replaced: "Install extension" → email waitlist form + "Or try the web app" text link
- Added **Pricing section** (`id="pricing"`) between testimonials and final CTA: 4 tiers (Free / Pro / Family / Concierge), hardcoded, Pro highlighted with amber accent + "14 days free" badge

### `shared/schema.ts`
- Added `waitlist` table and `WaitlistEntry` type

### `server/storage.ts`
- Added `waitlist` to imports
- Added `addToWaitlist` to `IStorage` interface and implementation

## What was deleted

Nothing was deleted. Old files were archived, not removed.

## TODOs

1. **`npm run db:push`** — Create the `waitlist` table in Supabase. Run when DB is reachable.
2. **Stripe wiring** — Pricing section CTAs all go to `/app`. Wire to Stripe Checkout when billing is ready.
3. **Scraper edge cases** — Amazon blocks most scrapers. Some products will return minimal metadata → Gemini gets less context → verdict may fall back to "wait". The extension will fix this (it reads the live DOM). A serverless proxy or Browserless integration would help interim.
4. **Rate limiting** — `/api/analyze-url` has no rate limiting. Add IP-based in-memory LRU (e.g. `lru-cache`) before launch to prevent API abuse.
5. **Auth** — No login/signup UI exists. The session ID is a localStorage UUID. Full auth flow (Supabase Auth or passport-local UI) is a separate task.
6. **`/api/detected-products` GET** — Returns empty for unauthenticated users (no `x-user-id` header). The saved items panel always shows mock data. Wire real auth to fix.
7. **Resale / owned_items / subscription_plans tables** — All post-purchase features (returns, subscriptions, actions) are mock data. Creating real tables is the next major backend task.

## Screenshot checklist

- [ ] Homepage hero (dark, rotating ticker, two CTAs)
- [ ] Outcome cards grid (6 cards, 3×2)
- [ ] Extension section with waitlist form
- [ ] Pricing section (4 tiers, Pro highlighted)
- [ ] `/app` — paste a real Amazon URL, see real Gemini verdict
- [ ] `/app` — click demo product, see score bars
- [ ] Mobile: homepage nav (landing links)
- [ ] Mobile: app nav (bottom tab bar)
