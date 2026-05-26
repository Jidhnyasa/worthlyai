import { GoogleGenerativeAI, SchemaType, type Schema } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ─── Contract ─────────────────────────────────────────────────────────────────

export interface VerdictInput {
  url: string;
  scraped: {
    title: string;
    price?: number;
    currency?: string;
    merchant?: string;
    imageUrl?: string;
    rating?: number;
    reviewCount?: number;
    description?: string;
  };
  userIntent?: {
    budget: string;
    reason: string;
    owns_similar: string;
    need_level: string;
    priority: string;
  } | null;
  userContext?: {
    budgetStyle?: string;         // "budget" | "balanced" | "quality" | "premium"
    favoriteBrands?: string[];
    dislikedBrands?: string[];
    recentPurchases?: Array<{ title: string; category?: string; purchasedAt: string }>;
    goals?: string[];             // "save_money" | "reduce_impulse" | "minimalism" | "quality_over_quantity"
    sensitiveTo?: string[];       // "fake_sales" | "duplicate_purchases" | "overpriced_premium"
  };
  userProfile?: {
    buying_style: string;
    regret_frequency: string;
    overspend_trigger: string;
    budget_discipline: string;
    duplicate_tendency: string;
    influence_source: string;
    household: string;
    return_attitude: string;
    quality_orientation: string;
    shopping_timing: string;
  };
}

export interface VerdictOutput {
  verdict: "buy" | "wait" | "skip";
  verdictScore: number;           // 0-100
  headline: string;               // one line, e.g. "Solid buy — well-priced and well-reviewed"
  reasons: Array<{ label: string; detail: string }>; // 3-5 items
  scores: {
    fit: number;
    value: number;
    proof: number;
    regret: number;
  };
  estimatedSavings?: number;
  waitUntil?: string;             // "until Black Friday", "until next price drop", etc.
  duplicateFlag?: string;
  resaleOutlook?: string;
  category?: string;
  retryable?: boolean;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const CATEGORIES = ["electronics", "fashion", "beauty", "home", "fitness", "baby", "gifting"];

function buildPrompt(input: VerdictInput): string {
  const { scraped, userContext, userIntent, userProfile, url } = input;

  const productLines = [
    `URL: ${url}`,
    scraped.merchant ? `Retailer: ${scraped.merchant}` : null,
    `Title: ${scraped.title}`,
    scraped.price != null ? `Price: ${scraped.currency ?? "$"}${scraped.price}` : null,
    scraped.rating != null ? `Rating: ${scraped.rating}/5` : null,
    scraped.reviewCount != null ? `Reviews: ${scraped.reviewCount.toLocaleString()}` : null,
    scraped.description ? `Description: ${scraped.description.slice(0, 500)}` : null,
  ].filter(Boolean).join("\n");

  const userLines = userContext ? [
    userContext.budgetStyle ? `User budget style: ${userContext.budgetStyle}` : null,
    userContext.goals?.length ? `User goals: ${userContext.goals.join(", ")}` : null,
    userContext.favoriteBrands?.length ? `Preferred brands: ${userContext.favoriteBrands.join(", ")}` : null,
    userContext.dislikedBrands?.length ? `Avoid brands: ${userContext.dislikedBrands.join(", ")}` : null,
    userContext.sensitiveTo?.length ? `User sensitive to: ${userContext.sensitiveTo.join(", ")}` : null,
    userContext.recentPurchases?.length
      ? `Recent purchases: ${userContext.recentPurchases.slice(0, 3).map(p => p.title).join(", ")}`
      : null,
  ].filter(Boolean).join("\n") : null;

  const BUDGET_LABELS: Record<string, string> = {
    under_25:     "Budget under $25",
    from_25_75:   "Budget $25–$75",
    from_75_150:  "Budget $75–$150",
    from_150_300: "Budget $150–$300",
    over_300:     "Budget over $300",
  };
  const REASON_LABELS: Record<string, string> = {
    replacing:  "Replacing something broken or worn out",
    upgrading:  "Upgrading something they already have",
    impulse:    "Impulse purchase — just caught their eye",
    gift:       "Buying a gift for someone else",
    considered: "Considered purchase — wanted this for a while",
  };
  const OWNS_LABELS: Record<string, string> = {
    no_new:     "Does not own anything similar — new category",
    yes_broken: "Owns something similar but it is old or broken",
    yes_works:  "Already owns something similar that works fine",
  };
  const NEED_LABELS: Record<string, string> = {
    need_now:      "Genuine need — clear gap to fill",
    nice_to_have:  "Nice to have, not essential",
    want_not_need: "Wants it but could live without it",
    not_sure:      "Unsure if they actually need it",
  };
  const PRIORITY_LABELS: Record<string, string> = {
    value:     "Priority: best value for money",
    quality:   "Priority: highest quality regardless of price",
    no_regret: "Priority: avoiding regret above all",
    quick:     "Priority: making a quick decision and moving on",
  };
  const BUYING_STYLE_LABELS: Record<string, string> = {
    researcher: "Researches extensively before buying",
    considered: "Spends hours comparing before deciding",
    quick:      "Reads a few reviews then decides quickly",
    impulse:    "Impulse buyer — sees it, wants it, buys it",
  };
  const REGRET_FREQ_LABELS: Record<string, string> = {
    rarely:     "Rarely regrets purchases — very selective",
    sometimes:  "Regrets purchases occasionally",
    often:      "Frequently regrets purchases — has unused items",
    very_often: "Very frequent regret — returns things often",
  };
  const OVERSPEND_LABELS: Record<string, string> = {
    sale:         "Triggered by sales and discounts",
    emotional:    "Triggered by boredom or stress",
    rationalized: "Rationalizes needs after the fact",
    fomo:         "Influenced by social media and FOMO",
    rarely:       "Rarely overspends",
  };
  const BUDGET_DISC_LABELS: Record<string, string> = {
    strict:     "Strict budget adherent",
    flexible:   "Flexible budget, occasionally overspends",
    want_based: "Budget based on desire, not limits",
    untracked:  "Does not track spending",
  };
  const DUPLICATE_LABELS: Record<string, string> = {
    no_new:      "Only buys when genuinely needs something new",
    replacement: "Buys as genuine replacement",
    upgrader:    "Regular upgrader of existing items",
    duplicator:  "Tends to accumulate duplicates",
  };
  const INFLUENCE_LABELS: Record<string, string> = {
    self:          "Self-directed, independent researcher",
    reviews:       "Relies on product page reviews",
    trusted_sites: "Uses Reddit, YouTube, trusted reviewers",
    social:        "Influenced by social circle and influencers",
    deals:         "Deal-driven, responds to sales and urgency",
  };
  const HOUSEHOLD_LABELS: Record<string, string> = {
    solo:       "Single person household",
    couple:     "Couple, no kids",
    young_kids: "Family with children under 5",
    kids_5_12:  "Family with school-age children 5-12",
    teenagers:  "Family with teenagers",
    multi_gen:  "Multi-generational household",
  };
  const RETURN_LABELS: Record<string, string> = {
    easy:     "Returns easily, low friction threshold",
    annoying: "Returns occasionally but finds it annoying",
    avoidant: "Avoids returns — finds it too much hassle",
    never:    "Almost never returns anything",
  };
  const QUALITY_LABELS: Record<string, string> = {
    quality_first:  "Quality-first, price is secondary",
    quality_budget: "Best quality within budget",
    value:          "Value-oriented — most for least money",
    cheapest:       "Buys cheapest option that works",
  };
  const TIMING_LABELS: Record<string, string> = {
    planned:    "Planned, deliberate shopper",
    browsing:   "Discovery-based browser",
    late_night: "Late night shopper",
    emotional:  "Emotional/stress shopper",
    all:        "Mixed shopping patterns",
  };
  const profileLines = userProfile ? [
    `Buying style: ${BUYING_STYLE_LABELS[userProfile.buying_style] ?? userProfile.buying_style}`,
    `Regret frequency: ${REGRET_FREQ_LABELS[userProfile.regret_frequency] ?? userProfile.regret_frequency}`,
    `Overspend trigger: ${OVERSPEND_LABELS[userProfile.overspend_trigger] ?? userProfile.overspend_trigger}`,
    `Budget discipline: ${BUDGET_DISC_LABELS[userProfile.budget_discipline] ?? userProfile.budget_discipline}`,
    `Duplicate tendency: ${DUPLICATE_LABELS[userProfile.duplicate_tendency] ?? userProfile.duplicate_tendency}`,
    `Main influence: ${INFLUENCE_LABELS[userProfile.influence_source] ?? userProfile.influence_source}`,
    `Household: ${HOUSEHOLD_LABELS[userProfile.household] ?? userProfile.household}`,
    `Return attitude: ${RETURN_LABELS[userProfile.return_attitude] ?? userProfile.return_attitude}`,
    `Quality orientation: ${QUALITY_LABELS[userProfile.quality_orientation] ?? userProfile.quality_orientation}`,
    `Shopping timing: ${TIMING_LABELS[userProfile.shopping_timing] ?? userProfile.shopping_timing}`,
  ].join("\n") : null;

  const intentLines = userIntent ? [
    `Budget: ${BUDGET_LABELS[userIntent.budget] ?? userIntent.budget}`,
    `Shopping reason: ${REASON_LABELS[userIntent.reason] ?? userIntent.reason}`,
    `Owns something similar: ${OWNS_LABELS[userIntent.owns_similar] ?? userIntent.owns_similar}`,
    `Need level: ${NEED_LABELS[userIntent.need_level] ?? userIntent.need_level}`,
    `What matters most: ${PRIORITY_LABELS[userIntent.priority] ?? userIntent.priority}`,
  ].join("\n") : null;

  return `You are Worthly — a purchase outcome agent whose only job is protecting the buyer's money. You are NOT a shopping assistant. You do not help people buy things. You help people avoid bad purchases.

PRIME DIRECTIVE: Default to skepticism. A WAIT or SKIP that saves the user $50 is worth more than a BUY that feels encouraging but is wrong. Never manufacture confidence from thin data.

ANCHORING DEFAULTS — these are not suggestions, they are the starting state:
- An anonymous user (no USER CONTEXT block) means fit MUST be 50. Not 60. Not 65. Exactly 50, regardless of how appealing the product seems. You cannot know fit without knowing the user.
- Without USER CONTEXT, the verdict floor is WAIT, not BUY. To override to BUY for an anonymous user, you must explicitly justify in a reason WHY this product is universally well-suited (rare — only true for true commodity goods at obviously fair prices).
- If you find yourself wanting to recommend BUY, ask: "What could go wrong for this buyer?" Write that down as a reason BEFORE the BUY reasons. If you can't find anything that could go wrong, your analysis is incomplete.

SCORING RUBRIC — score these independently before choosing a verdict:

fit (0-100): How well does the product match THIS specific user's stated needs?
  - No user context provided → fit = 50, hard rule, no exceptions.
  - Do not infer "high fit" from a product being generally good. Fit is about the buyer, not the product.
  - Clear match to stated goal → 75-90
  - Contradicts stated goal (e.g. user wants "save money", product is premium) → 20-40

value (0-100): Is the price justified given quality signals AND the buyer's likely alternatives?
  - NO PRICE PROVIDED → cap value at 52 (cannot assess)
  - Price seems competitive, well-reviewed, no obvious cheaper substitute → 65-80
  - Price seems competitive but a well-known cheaper alternative exists (name it) → 50-65
  - Price provided, few reviews, unproven quality → 45-60
  - Price seems inflated vs. category average → 30-50
  - Brand premium without clear product premium → 35-50

proof (0-100): How much evidence backs the quality claim?
  - No rating AND no reviews → 15-25
  - Rating only, no review count → 30-45
  - <50 reviews → 35-50
  - 50-500 reviews, rating ≥4.0 → 55-70
  - 500+ reviews, rating ≥4.2 → 75-90

regret (0-100): How likely is the buyer to regret this purchase?
  Start at 35 (slight default skepticism). Then adjust:
  - Impulse/trending/TikTok-viral item → add 25
  - No price transparency → add 15
  - Anonymous user (no context) buying discretionary item → add 15
  - Similar to recent purchase → add 30
  - Approaching obvious refresh cycle (Apple Sept, Samsung Feb, fashion end-of-season) → add 25
  - Brand premium suspected (designer logo on basic item) → add 20
  - Genuine essential, well-reviewed, fair price → subtract 15
  - Cap at 95.

INTENT MODIFIERS — apply after base scoring:
  - reason = "impulse"       → add 20 to regret (impulse buys regret easily)
  - reason = "replacing"     → subtract 10 from regret (genuine need, clear purpose)
  - reason = "considered"    → subtract 5 from regret (deliberate, not rushed)
  - owns_similar = "yes_works" → add 30 to regret (already has one that works)
  - owns_similar = "yes_works" → cap fit at 50 (hard to justify buying again)
  - owns_similar = "yes_broken" → subtract 10 from regret (legitimate replacement)
  - need_level = "want_not_need" → add 15 to regret
  - need_level = "not_sure"      → add 10 to regret, verdict floors at WAIT
  - need_level = "need_now"      → subtract 15 from regret
  - priority = "no_regret"       → add 10 to regret (they regret easily — be careful)
  - priority = "value"           → if product price seems above category average,
                                    cap value score at 60
  - priority = "quality"         → relax value scoring — user accepts paying more
  - budget = "under_25"    → if price > $30,  cap value at 40 (over budget)
  - budget = "from_25_75"  → if price > $80,  cap value at 45 (over budget)
  - budget = "from_75_150" → if price > $160, cap value at 45 (over budget)
  - budget = "from_150_300"→ if price > $320, cap value at 45 (over budget)
  - budget = "over_300"    → no budget cap — user comfortable spending

PROFILE MODIFIERS — apply if USER PROFILE is present:
  - buying_style = "impulse" → add 25 to regret, require extra scrutiny before BUY
  - buying_style = "researcher" → subtract 10 from regret, user makes deliberate choices
  - regret_frequency = "often" or "very_often" → add 15 to regret baseline, floor verdict at WAIT unless proof ≥ 70 AND value ≥ 65
  - overspend_trigger = "fomo" → add 20 to regret on trending or viral products
  - overspend_trigger = "sale" → explicitly call out if discount seems manufactured or price history is unknown
  - overspend_trigger = "emotional" → add 15 to regret, add reason flagging emotional purchase risk
  - budget_discipline = "untracked" → treat all purchases as potentially over-budget, value cap 60
  - duplicate_tendency = "duplicator" → add 35 to regret, cap fit at 40, require very strong justification for BUY
  - influence_source = "social" → add 20 to regret on trending items, flag if product appears driven by social media popularity
  - influence_source = "deals" → explicitly evaluate whether the price is genuinely good or manufactured urgency
  - return_attitude = "avoidant" or "never" → increase conservatism significantly — this user cannot easily undo a bad purchase. Add 15 to regret and require proof ≥ 65 for BUY
  - quality_orientation = "cheapest" → flag if product shows quality warning signals in reviews
  - quality_orientation = "quality_first" → relax value scoring, focus on proof and durability signals
  - shopping_timing = "late_night" → add 15 to regret (research-backed: late night impulse purchases have higher regret rates)
  - shopping_timing = "emotional" → add 20 to regret, explicitly mention this in a reason if firing SKIP
  - household = "young_kids" → prioritize safety, durability, and practicality signals in baby/home categories
  - household = "solo" → no household budget splitting, full purchase cost falls on one person

VERDICT LOGIC (apply in order — first match wins):
1. SKIP if: value<55 OR regret≥55 OR (proof<40 AND verdictScore<55)
2. WAIT if: fit<72 OR proof<55 OR (regret≥40 AND value<70)
3. BUY only if: fit≥72 AND value≥68 AND proof≥55 AND regret≤35

The order matters: check SKIP first, then WAIT, then BUY. Most products should be WAIT. BUY should be the rare verdict, not the default.

SPARSE DATA RULE: If price is missing AND (rating is missing OR reviewCount is missing), verdict must be WAIT. Do not issue BUY on products you cannot verify.

CATEGORY DETECTION: Classify into one of: ${CATEGORIES.join(", ")}. Use "other" if none fit.

DUPLICATE CHECK: If the user's recent purchases include something very similar, set duplicateFlag with a warning and add 25 to regret score.

REASON QUALITY — every reason must do at least one of:
- Cite a specific number from the data (price, review count, rating)
- Name a specific competitor product or category alternative
- Identify a specific risk (refresh cycle, fragility, low resale, brand premium, gimmick category)
- Flag a specific data gap and what it means

Banned reason patterns: "trusted brand," "high quality," "great value," "strong proof" without numbers, "addresses key concerns," "good investment." These are filler. If a reason fits this pattern, rewrite it with specifics or remove it.

If you cannot generate 3 reasons that meet the quality bar, generate 2 honest reasons and say so — better fewer real reasons than padding.

OUTPUT — strict JSON, no markdown:
{
  "verdict": "buy" | "wait" | "skip",
  "verdictScore": 0-100,
  "headline": "one line under 10 words — be direct about the verdict and the main reason",
  "category": "one of the categories above",
  "reasons": [
    { "label": "≤4 words", "detail": "1-2 sentences. Cite the actual price, rating, review count, or missing data. No vague language." },
    { "label": "...", "detail": "..." },
    { "label": "...", "detail": "..." }
  ],
  "scores": { "fit": 0-100, "value": 0-100, "proof": 0-100, "regret": 0-100 },
  "estimatedSavings": number or null,
  "waitUntil": "timing hint or null",
  "duplicateFlag": "warning string or null",
  "resaleOutlook": "brief resale note or null"
}

Always return 3-5 reasons. If data is missing, explicitly flag it in a reason (e.g. "No price listed — value cannot be assessed"). Never say "I cannot determine" — state what's missing and what that means for the verdict.

FINAL CHECK before you respond:
- If userIntent was provided, your verdict must explicitly reference at least one of the user's stated preferences (budget, reason, need level, or priority). Generic verdicts that ignore the user context are not acceptable.
- If owns_similar = "yes_works", the burden of proof for BUY is very high — the verdict must name a specific reason why buying again makes sense despite already owning a working version.
- If need_level = "not_sure", do not issue a confident BUY. The user has not decided they need this — default to WAIT and help them think it through.
- Read your verdict. Is it the kind of verdict a friend who knows shopping would say? Or is it polite restating of the product page?
- If you said BUY: what specifically could go wrong for this buyer? Did you flag it?
- If your reasons are all positive, that's a yellow flag — most products have real tradeoffs. Find at least one.

---
PRODUCT:
${productLines}

${profileLines ? `USER PROFILE:\n${profileLines}\n\n` : ""}${intentLines ? `USER INTENT:\n${intentLines}\n\n` : ""}${userLines ? `USER CONTEXT:\n${userLines}\n` : ""}
Output JSON verdict now.`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getVerdictForUrl(input: VerdictInput): Promise<VerdictOutput> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  const { scraped } = input;
  if (!scraped.price || scraped.price < 1 || !scraped.title || scraped.title.includes("could not identify")) {
    console.warn(`[verdict] insufficient scrape data, returning early: title="${scraped.title}" price=${scraped.price}`);
    clearTimeout(timeout);
    return {
      verdict: "wait",
      verdictScore: 50,
      headline: "Couldn't fully read this page",
      reasons: [{ label: "Amazon blocked our page reader", detail: "This happens occasionally with certain products. Try: (1) clicking the Worthly badge again to retry, (2) making sure you are on the main product page with /dp/ in the URL, or (3) trying a different product." }],
      scores: { fit: 50, value: 50, proof: 50, regret: 50 },
      category: "other",
      retryable: true,
    };
  }

  const verdictSchema = {
    type: SchemaType.OBJECT,
    properties: {
      verdict: {
        type: SchemaType.STRING,
        enum: ["buy", "wait", "skip"],
      },
      verdictScore: { type: SchemaType.NUMBER },
      headline: { type: SchemaType.STRING },
      category: { type: SchemaType.STRING },
      reasons: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            label: { type: SchemaType.STRING },
            detail: { type: SchemaType.STRING },
          },
          required: ["label", "detail"],
        },
      },
      scores: {
        type: SchemaType.OBJECT,
        properties: {
          fit: { type: SchemaType.NUMBER },
          value: { type: SchemaType.NUMBER },
          proof: { type: SchemaType.NUMBER },
          regret: { type: SchemaType.NUMBER },
        },
        required: ["fit", "value", "proof", "regret"],
      },
    },
    required: ["verdict", "verdictScore", "headline", "category", "reasons", "scores"],
  };

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: verdictSchema as Schema,
      },
    });
    const prompt = buildPrompt(input);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: verdictSchema as Schema,
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    });

    clearTimeout(timeout);
    const verdict = JSON.parse(result.response.text()) as Partial<VerdictOutput>;
    return normalize(verdict, input);
  } catch (err) {
    clearTimeout(timeout);
    console.error("Gemini verdict error:", err);
    return waitFallback(input);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normalize(raw: Partial<VerdictOutput>, input: VerdictInput): VerdictOutput {
  const verdict = (["buy", "wait", "skip"].includes(raw.verdict ?? "") ? raw.verdict : "wait") as "buy" | "wait" | "skip";
  const reasons = Array.isArray(raw.reasons) && raw.reasons.length > 0
    ? raw.reasons.slice(0, 5).map(r => ({ label: r.label ?? "Signal", detail: r.detail ?? "" }))
    : [{ label: "Limited data", detail: "Not enough product info to give a full verdict." }];

  return {
    verdict,
    verdictScore: clamp(raw.verdictScore ?? 55),
    headline: raw.headline ?? (verdict === "buy" ? "Looks like a solid buy" : verdict === "skip" ? "Not worth it right now" : "Hold off for now"),
    reasons,
    scores: {
      fit:    clamp(raw.scores?.fit ?? 60),
      value:  clamp(raw.scores?.value ?? 60),
      proof:  clamp(raw.scores?.proof ?? 50),
      regret: clamp(raw.scores?.regret ?? 40),
    },
    estimatedSavings: raw.estimatedSavings ?? undefined,
    waitUntil: raw.waitUntil ?? undefined,
    duplicateFlag: raw.duplicateFlag ?? undefined,
    resaleOutlook: raw.resaleOutlook ?? undefined,
    category: CATEGORIES.includes(raw.category ?? "") ? raw.category : "other",
  };
}

function waitFallback(input: VerdictInput): VerdictOutput {
  return {
    verdict: "wait",
    verdictScore: 50,
    headline: "Need more info — verdict pending",
    reasons: [
      { label: "Analysis failed", detail: "We couldn't fully analyze this product. The page may have blocked our scraper." },
      { label: "Check reviews", detail: "Read recent reviews and compare prices across retailers before buying." },
    ],
    scores: { fit: 55, value: 55, proof: 40, regret: 40 },
    category: "other",
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
