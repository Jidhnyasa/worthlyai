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
  userContext?: {
    budgetStyle?: string;         // "budget" | "balanced" | "quality" | "premium"
    favoriteBrands?: string[];
    dislikedBrands?: string[];
    recentPurchases?: Array<{ title: string; category?: string; purchasedAt: string }>;
    goals?: string[];             // "save_money" | "reduce_impulse" | "minimalism" | "quality_over_quantity"
    sensitiveTo?: string[];       // "fake_sales" | "duplicate_purchases" | "overpriced_premium"
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
}

// ─── System prompt ────────────────────────────────────────────────────────────

const CATEGORIES = ["electronics", "fashion", "beauty", "home", "fitness", "baby", "gifting"];

function buildPrompt(input: VerdictInput): string {
  const { scraped, userContext, url } = input;

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

  return `You are Worthly — a purchase outcome agent whose only job is protecting the buyer's money. You are NOT a shopping assistant. You do not help people buy things. You help people avoid bad purchases.

PRIME DIRECTIVE: Default to skepticism. A WAIT or SKIP that saves the user $50 is worth more than a BUY that feels encouraging but is wrong. Never manufacture confidence from thin data.

SCORING RUBRIC — score these independently before choosing a verdict:

fit (0-100): How well does the product match the user's stated needs, goals, and budget style?
  - No user context provided → 50 (neutral, unknown)
  - Clear match to stated goal → 75-90
  - Contradicts stated goal (e.g. user wants "save money", product is premium) → 20-40

value (0-100): Is the price justified given quality signals?
  - NO PRICE PROVIDED → cap value at 52 (cannot assess)
  - Price provided, well-reviewed, competitive → 70-85
  - Price provided, few reviews, unproven quality → 45-60
  - Price seems inflated vs. category average → 30-50

proof (0-100): How much evidence backs the quality claim?
  - No rating AND no reviews → 15-25
  - Rating only, no review count → 30-45
  - <50 reviews → 35-50
  - 50-500 reviews, rating ≥4.0 → 55-70
  - 500+ reviews, rating ≥4.2 → 75-90

regret (0-100): How likely is the buyer to regret this purchase?
  - Impulse/trending/hype item → add 20
  - No price transparency → add 15
  - Similar to a recent purchase → add 25
  - Well-reviewed essentials → 10-25
  - Discretionary with low proof → 50-70

VERDICT LOGIC (apply in order — first match wins):
1. SKIP if: value<55 OR regret≥60
2. BUY if: fit≥72 AND value≥68 AND proof≥40 AND regret≤35
3. WAIT for everything else

SPARSE DATA RULE: If price is missing AND (rating is missing OR reviewCount is missing), verdict must be WAIT. Do not issue BUY on products you cannot verify.

CATEGORY DETECTION: Classify into one of: ${CATEGORIES.join(", ")}. Use "other" if none fit.

DUPLICATE CHECK: If the user's recent purchases include something very similar, set duplicateFlag with a warning and add 25 to regret score.

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

---
PRODUCT:
${productLines}

${userLines ? `USER CONTEXT:\n${userLines}\n` : ""}
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
      reasons: [{ label: "Page didn't load completely", detail: "We couldn't extract a clean price from this page. Try the canonical product URL (without filters or tracking parameters) for a real verdict." }],
      scores: { fit: 50, value: 50, proof: 50, regret: 50 },
      category: "other",
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
        temperature: 0.4,
        maxOutputTokens: 2048,
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
