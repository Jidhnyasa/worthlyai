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
  redditContext?: string;    // top community threads about this product, pre-fetched
  userIntent?: {
    budget: string;
    reason: string;
    owns_similar: string;
    need_level: string;
    priority: string;
  } | null;
  userContext?: {
    budgetStyle?: string;
    favoriteBrands?: string[];
    dislikedBrands?: string[];
    recentPurchases?: Array<{ title: string; category?: string; purchasedAt: string }>;
    goals?: string[];
    sensitiveTo?: string[];
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
  // ── Core verdict (existing) ──────────────────────────────────────────────────
  verdict: "buy" | "wait" | "skip";
  verdictScore: number;                  // 0-100
  headline: string;
  reasons: Array<{ label: string; detail: string }>;
  scores: { fit: number; value: number; proof: number; regret: number };
  estimatedSavings?: number;
  waitUntil?: string;
  duplicateFlag?: string;
  resaleOutlook?: string;
  category?: string;
  retryable?: boolean;

  // ── Research report (new) ────────────────────────────────────────────────────
  confidenceScore?: number;              // 0-100
  recommendation?: "Strong Buy" | "Buy" | "Consider" | "Wait" | "Not Recommended";
  buyReasons?: Array<{ claim: string; frequency?: string }>;
  hiddenConcerns?: Array<{ concern: string; severity: "low" | "medium" | "high" }>;
  reviewReliability?: { rating: "High" | "Medium" | "Low"; explanation: string };
  communityConsensus?: { summary: string; longTermSentiment: string; commonRegrets?: string; dataSource: string };
  expertConsensus?: { summary: string; disagreements?: string; dataSource: string };
  alternatives?: {
    betterValue?: { name: string; reason: string };
    premium?: { name: string; reason: string };
    budget?: { name: string; reason: string };
  };
  priceIntelligence?: {
    analysis: string;
    recommendation: "Buy Now" | "Wait" | "Buy During Event";
    reasoning: string;
  };
  whoShouldBuy?: string[];
  whoShouldAvoid?: string[];
}

// ─── System prompt ────────────────────────────────────────────────────────────

const CATEGORIES = ["electronics", "fashion", "beauty", "home", "fitness", "baby", "gifting"];

function buildPrompt(input: VerdictInput): string {
  const { scraped, userContext, userIntent, userProfile, url, redditContext } = input;

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

  const redditBlock = redditContext
    ? `\nCOMMUNITY DATA (Reddit threads, pre-fetched):\n${redditContext}\n`
    : "";

  return `You are Worthly — a consumer-first, evidence-first purchase research agent. Your only mission is protecting the buyer's money and minimizing post-purchase regret. You do NOT optimize for sales or conversion.

PRIME DIRECTIVE: Default to skepticism. A WAIT or SKIP that saves the user $50 is worth more than a BUY that feels encouraging but is wrong. Never manufacture confidence from thin data. Surface tradeoffs honestly — if a product has no visible downsides in your analysis, that is a signal your analysis is incomplete, not that the product is perfect.

HALLUCINATION RULES (strictly enforced):
- Never invent specific Reddit usernames, thread titles, or post dates.
- Never cite specific expert review scores (e.g. "Wirecutter gave it 9/10") unless they appear in the product data or community data provided below.
- For communityConsensus and expertConsensus: draw from your training knowledge about this specific product/brand/category. If your training knowledge is limited or the product is too recent, explicitly say "Limited training data for this specific product — assessment based on product category signals."
- For alternatives: name real, well-known products in the category. If unsure of specific model names, name the brand + category (e.g. "Anker USB-C chargers") rather than inventing a model number.
- For priceIntelligence: only cite actual price history if the COMMUNITY DATA block below contains it. Otherwise reason from category patterns (seasonal discounts, common deal cycles) and label it clearly as "category pattern, not product-specific history."
- All claims that are not derivable from the product data provided must be labelled with their source: "(training knowledge)", "(community data)", or "(category pattern)."

─── SCORING RUBRIC ─────────────────────────────────────────────────────────────

fit (0-100): Match to THIS specific user's stated needs.
  - No user context → fit = 50, hard rule, no exceptions.
  - Clear match to stated goal → 75-90
  - Contradicts stated goal → 20-40

value (0-100): Is the price justified?
  - NO PRICE → cap at 52.
  - Competitive, well-reviewed, no obvious substitute → 65-80
  - Competitive but cheaper alternative exists → 50-65
  - Few reviews, unproven quality → 45-60
  - Price seems inflated → 30-50

proof (0-100): Evidence base quality.
  - No rating AND no reviews → 15-25
  - Rating only, no count → 30-45
  - <50 reviews → 35-50
  - 50-500 reviews, rating ≥4.0 → 55-70
  - 500+ reviews, rating ≥4.2 → 75-90

regret (0-100): Likelihood of post-purchase regret. Start at 35.
  - Impulse/trending → +25
  - No price transparency → +15
  - Anonymous user, discretionary item → +15
  - Similar to recent purchase → +30
  - Approaching obvious refresh cycle → +25
  - Brand premium suspected → +20
  - Essential, well-reviewed, fair price → -15
  - Cap at 95.

INTENT MODIFIERS:
  - reason = "impulse"         → +20 regret
  - reason = "replacing"       → -10 regret
  - reason = "considered"      → -5 regret
  - owns_similar = "yes_works" → +30 regret, cap fit at 50
  - owns_similar = "yes_broken"→ -10 regret
  - need_level = "want_not_need"→ +15 regret
  - need_level = "not_sure"    → +10 regret, floor verdict at WAIT
  - need_level = "need_now"    → -15 regret
  - priority = "no_regret"     → +10 regret
  - priority = "value"         → if above avg price, cap value at 60
  - priority = "quality"       → relax value scoring
  - Budget overruns: cap value at 40-45 if price exceeds budget bracket.

PROFILE MODIFIERS (if USER PROFILE present):
  - buying_style = "impulse"   → +25 regret, extra scrutiny before BUY
  - buying_style = "researcher"→ -10 regret
  - regret_frequency = "often"/"very_often" → +15 regret base, floor at WAIT unless proof ≥ 70 AND value ≥ 65
  - overspend_trigger = "fomo" → +20 regret on trending items
  - overspend_trigger = "sale" → call out manufactured discounts explicitly
  - duplicate_tendency = "duplicator" → +35 regret, cap fit at 40
  - return_attitude = "avoidant"/"never" → +15 regret, require proof ≥ 65 for BUY
  - shopping_timing = "late_night" → +15 regret
  - shopping_timing = "emotional" → +20 regret

VERDICT LOGIC (check in order — first match wins):
1. SKIP if: value<55 OR regret≥55 OR (proof<40 AND verdictScore<55)
2. WAIT if: fit<72 OR proof<55 OR (regret≥40 AND value<70)
3. BUY only if: fit≥72 AND value≥68 AND proof≥55 AND regret≤35

Most products should be WAIT. BUY is the rare verdict.
SPARSE DATA RULE: Missing price AND (missing rating OR missing reviews) → verdict must be WAIT.

CATEGORY: Classify into one of: ${CATEGORIES.join(", ")}, or "other".

REASON QUALITY — every reason must cite at least one of:
- A specific number (price, rating, review count)
- A named competitor or category alternative
- A specific risk (refresh cycle, fragility, low resale, brand premium)
- A specific data gap and its implication
Banned patterns: "trusted brand," "high quality," "great value," "strong proof" without numbers.

DUPLICATE CHECK: Flag if recent purchases include something very similar. Add 25 to regret.

RECOMMENDATION MAPPING (based on verdictScore):
- Strong Buy: verdictScore ≥ 82
- Buy: verdictScore 68-81
- Consider: verdictScore 55-67
- Wait: verdictScore 40-54
- Not Recommended: verdictScore < 40

REVIEW RELIABILITY — assess the product's review ecosystem:
- High: consistent reviews, no sudden spikes, verified purchases dominate, rating distribution is natural
- Medium: some inconsistency, possible incentivized reviews, moderate confidence
- Low: suspicious review clusters, extreme rating bimodality, recent score inflation, very few reviews

COMMUNITY CONSENSUS — synthesize what real long-term users say:
- Use the COMMUNITY DATA block below if provided.
- Otherwise use training knowledge, labelled as "(training knowledge)."
- Focus on: long-term durability reports, what buyers regret, who the product is and isn't for.

EXPERT CONSENSUS — draw from your training knowledge about this product:
- Cite publication names if you have genuine confidence (e.g. "Wirecutter" or "RTINGS" for specific product categories).
- If you have no specific expert knowledge about this product, say so and reason from category patterns.
- Note disagreements between sources if they exist.

ALTERNATIVES — name real products:
- Better Value: a cheaper product that covers most of the same needs
- Premium: a better product worth the extra cost
- Budget: a lower-cost option for minimal requirements
If you cannot name a specific model with confidence, name the brand + category description.

PRICE INTELLIGENCE:
- If COMMUNITY DATA contains price history, use it and cite it.
- Otherwise, reason from category-level patterns (e.g. "Electronics typically see 15-20% drops in November") and label as "(category pattern)."
- Specific recommendations: Buy Now / Wait / Buy During Event.

WHO SHOULD BUY / AVOID: 3-5 specific buyer profiles each. Be concrete, not generic ("value-conscious buyers who need X" not just "people who want a good deal").

FINAL CHECKS before responding:
- If userIntent provided: verdict must reference at least one stated preference.
- If owns_similar = "yes_works": name a specific reason why buying again makes sense.
- If reasons are all positive: find at least one tradeoff — real products always have them.
- If you said BUY: explicitly state what could go wrong for this buyer.
- Consumer trust > conversion. When in doubt, WAIT.

─── DATA ────────────────────────────────────────────────────────────────────────

PRODUCT:
${productLines}
${redditBlock}
${profileLines ? `USER PROFILE:\n${profileLines}\n` : ""}${intentLines ? `USER INTENT:\n${intentLines}\n` : ""}${userLines ? `USER CONTEXT:\n${userLines}\n` : ""}
─── OUTPUT ──────────────────────────────────────────────────────────────────────

Return strict JSON only (no markdown). Required fields exactly as specified:

{
  "verdict": "buy" | "wait" | "skip",
  "verdictScore": 0-100,
  "recommendation": "Strong Buy" | "Buy" | "Consider" | "Wait" | "Not Recommended",
  "confidenceScore": 0-100,
  "headline": "one line, under 10 words, direct about verdict and main reason",
  "category": "one of the categories listed above",
  "reasons": [
    { "label": "≤4 words", "detail": "1-2 sentences with specifics — price, rating, review count, or named risk" }
  ],
  "scores": { "fit": 0-100, "value": 0-100, "proof": 0-100, "regret": 0-100 },
  "estimatedSavings": number | null,
  "waitUntil": "timing hint" | null,
  "duplicateFlag": "warning string" | null,
  "resaleOutlook": "brief resale note" | null,
  "buyReasons": [
    { "claim": "positive theme", "frequency": "e.g. mentioned in ~60% of reviews or 'common theme'" }
  ],
  "hiddenConcerns": [
    { "concern": "issue users discover post-purchase", "severity": "low" | "medium" | "high" }
  ],
  "reviewReliability": {
    "rating": "High" | "Medium" | "Low",
    "explanation": "reason for the rating"
  },
  "communityConsensus": {
    "summary": "overall community sentiment",
    "longTermSentiment": "what owners say after 6-12 months",
    "commonRegrets": "most cited post-purchase regret or null",
    "dataSource": "community data provided" | "training knowledge" | "limited data available"
  },
  "expertConsensus": {
    "summary": "expert verdict on this product",
    "disagreements": "notable expert disagreements or null",
    "dataSource": "publication names if confident, else 'category pattern'"
  },
  "alternatives": {
    "betterValue": { "name": "product name or brand+category", "reason": "why it beats this on value" },
    "premium": { "name": "product name or brand+category", "reason": "why it's worth the premium" },
    "budget": { "name": "product name or brand+category", "reason": "what you give up at lower price" }
  },
  "priceIntelligence": {
    "analysis": "current price assessment relative to history and category norms",
    "recommendation": "Buy Now" | "Wait" | "Buy During Event",
    "reasoning": "why — cite source: community data, category pattern, or product-specific"
  },
  "whoShouldBuy": ["specific buyer profile 1", "specific buyer profile 2", "..."],
  "whoShouldAvoid": ["specific avoidance profile 1", "specific avoidance profile 2", "..."]
}

Always return 3-5 reasons. Always populate all sections. Use "Limited data available" as value for text fields when genuinely uncertain rather than inventing specifics.`;
}

// ─── Reddit enrichment ────────────────────────────────────────────────────────

export async function fetchRedditContext(productTitle: string): Promise<string | null> {
  try {
    // Use only first ~5 words of title to avoid overly specific searches
    const query = productTitle.split(/\s+/).slice(0, 5).join(" ") + " review";
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&sort=top&t=year&limit=5&type=link`;
    const res = await fetch(url, {
      headers: { "User-Agent": "WorthlyAI/1.0 (purchase research tool)" },
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as any;
    const posts: Array<{ title: string; score: number; url: string; selftext?: string }> =
      (data?.data?.children ?? []).map((c: any) => c.data).filter(Boolean);
    if (!posts.length) return null;
    return posts
      .slice(0, 5)
      .map(p => `- "${p.title}" (${p.score} upvotes)${p.selftext ? ": " + p.selftext.slice(0, 200) : ""}`)
      .join("\n");
  } catch {
    return null;
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function getVerdictForUrl(input: VerdictInput): Promise<VerdictOutput> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  const { scraped } = input;
  if (!scraped.price || scraped.price < 1 || !scraped.title || scraped.title.includes("could not identify")) {
    console.warn(`[verdict] insufficient scrape data, returning early: title="${scraped.title}" price=${scraped.price}`);
    clearTimeout(timeout);
    const site = scraped.merchant || "This site";
    const retryTip = scraped.merchant === "Amazon"
      ? "making sure you are on the main product page with /dp/ in the URL"
      : "making sure you are on the main product page, not a search or category page";
    return {
      verdict: "wait",
      verdictScore: 50,
      recommendation: "Wait",
      confidenceScore: 0,
      headline: "Couldn't fully read this page",
      reasons: [{ label: `${site} blocked our page reader`, detail: `This happens occasionally with certain products. Try: (1) clicking the Worthly badge again to retry, (2) ${retryTip}, or (3) trying a different product.` }],
      scores: { fit: 50, value: 50, proof: 50, regret: 50 },
      category: "other",
      retryable: true,
    };
  }

  const verdictSchema = {
    type: SchemaType.OBJECT,
    properties: {
      verdict:          { type: SchemaType.STRING, enum: ["buy", "wait", "skip"] },
      verdictScore:     { type: SchemaType.NUMBER },
      recommendation:   { type: SchemaType.STRING, enum: ["Strong Buy", "Buy", "Consider", "Wait", "Not Recommended"] },
      confidenceScore:  { type: SchemaType.NUMBER },
      headline:         { type: SchemaType.STRING },
      category:         { type: SchemaType.STRING },
      reasons: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            label:  { type: SchemaType.STRING },
            detail: { type: SchemaType.STRING },
          },
          required: ["label", "detail"],
        },
      },
      scores: {
        type: SchemaType.OBJECT,
        properties: {
          fit:    { type: SchemaType.NUMBER },
          value:  { type: SchemaType.NUMBER },
          proof:  { type: SchemaType.NUMBER },
          regret: { type: SchemaType.NUMBER },
        },
        required: ["fit", "value", "proof", "regret"],
      },
      estimatedSavings: { type: SchemaType.NUMBER },
      waitUntil:        { type: SchemaType.STRING },
      duplicateFlag:    { type: SchemaType.STRING },
      resaleOutlook:    { type: SchemaType.STRING },
      buyReasons: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            claim:     { type: SchemaType.STRING },
            frequency: { type: SchemaType.STRING },
          },
          required: ["claim"],
        },
      },
      hiddenConcerns: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            concern:  { type: SchemaType.STRING },
            severity: { type: SchemaType.STRING, enum: ["low", "medium", "high"] },
          },
          required: ["concern", "severity"],
        },
      },
      reviewReliability: {
        type: SchemaType.OBJECT,
        properties: {
          rating:      { type: SchemaType.STRING, enum: ["High", "Medium", "Low"] },
          explanation: { type: SchemaType.STRING },
        },
        required: ["rating", "explanation"],
      },
      communityConsensus: {
        type: SchemaType.OBJECT,
        properties: {
          summary:            { type: SchemaType.STRING },
          longTermSentiment:  { type: SchemaType.STRING },
          commonRegrets:      { type: SchemaType.STRING },
          dataSource:         { type: SchemaType.STRING },
        },
        required: ["summary", "longTermSentiment", "dataSource"],
      },
      expertConsensus: {
        type: SchemaType.OBJECT,
        properties: {
          summary:       { type: SchemaType.STRING },
          disagreements: { type: SchemaType.STRING },
          dataSource:    { type: SchemaType.STRING },
        },
        required: ["summary", "dataSource"],
      },
      alternatives: {
        type: SchemaType.OBJECT,
        properties: {
          betterValue: {
            type: SchemaType.OBJECT,
            properties: {
              name:   { type: SchemaType.STRING },
              reason: { type: SchemaType.STRING },
            },
            required: ["name", "reason"],
          },
          premium: {
            type: SchemaType.OBJECT,
            properties: {
              name:   { type: SchemaType.STRING },
              reason: { type: SchemaType.STRING },
            },
            required: ["name", "reason"],
          },
          budget: {
            type: SchemaType.OBJECT,
            properties: {
              name:   { type: SchemaType.STRING },
              reason: { type: SchemaType.STRING },
            },
            required: ["name", "reason"],
          },
        },
      },
      priceIntelligence: {
        type: SchemaType.OBJECT,
        properties: {
          analysis:       { type: SchemaType.STRING },
          recommendation: { type: SchemaType.STRING, enum: ["Buy Now", "Wait", "Buy During Event"] },
          reasoning:      { type: SchemaType.STRING },
        },
        required: ["analysis", "recommendation", "reasoning"],
      },
      whoShouldBuy:   { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
      whoShouldAvoid: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
    },
    required: ["verdict", "verdictScore", "recommendation", "confidenceScore", "headline", "category", "reasons", "scores"],
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
        maxOutputTokens: 8192,
      },
    });

    clearTimeout(timeout);
    const raw = JSON.parse(result.response.text()) as Partial<VerdictOutput>;
    return normalize(raw, input);
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

  const verdictScore = clamp(raw.verdictScore ?? 55);
  const recommendation = (["Strong Buy", "Buy", "Consider", "Wait", "Not Recommended"].includes(raw.recommendation ?? "")
    ? raw.recommendation
    : verdictScore >= 82 ? "Strong Buy"
    : verdictScore >= 68 ? "Buy"
    : verdictScore >= 55 ? "Consider"
    : verdictScore >= 40 ? "Wait"
    : "Not Recommended") as VerdictOutput["recommendation"];

  return {
    verdict,
    verdictScore,
    recommendation,
    confidenceScore: clamp(raw.confidenceScore ?? 50),
    headline: raw.headline ?? (verdict === "buy" ? "Looks like a solid buy" : verdict === "skip" ? "Not worth it right now" : "Hold off for now"),
    reasons,
    scores: {
      fit:    clamp(raw.scores?.fit ?? 60),
      value:  clamp(raw.scores?.value ?? 60),
      proof:  clamp(raw.scores?.proof ?? 50),
      regret: clamp(raw.scores?.regret ?? 40),
    },
    estimatedSavings: raw.estimatedSavings ?? undefined,
    waitUntil:        raw.waitUntil ?? undefined,
    duplicateFlag:    raw.duplicateFlag ?? undefined,
    resaleOutlook:    raw.resaleOutlook ?? undefined,
    category: CATEGORIES.includes(raw.category ?? "") ? raw.category : "other",
    buyReasons:        raw.buyReasons ?? [],
    hiddenConcerns:    raw.hiddenConcerns ?? [],
    reviewReliability: raw.reviewReliability,
    communityConsensus: raw.communityConsensus,
    expertConsensus:   raw.expertConsensus,
    alternatives:      raw.alternatives,
    priceIntelligence: raw.priceIntelligence,
    whoShouldBuy:      raw.whoShouldBuy ?? [],
    whoShouldAvoid:    raw.whoShouldAvoid ?? [],
  };
}

function waitFallback(input: VerdictInput): VerdictOutput {
  return {
    verdict: "wait",
    verdictScore: 50,
    recommendation: "Wait",
    confidenceScore: 0,
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
