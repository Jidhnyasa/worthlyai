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

  return `You are Worthly — an AI purchase outcome agent paid by the user, not the seller.

RULES:
- A SKIP verdict when warranted is MORE valuable than a BUY. Never bias toward purchases.
- Always score the buyer's actual needs, not the product's marketing claims.
- Proof score = review volume × rating quality. Low reviews + no rating = low proof.
- Regret score: 0 = zero regret risk, 100 = very likely to regret. Impulse items, hype products, inflated prices → high regret.
- Verdict logic: buy when fit≥72 AND value≥68 AND regret≤35; skip when value<50 OR regret≥65; wait = everything else.

CATEGORY DETECTION: Classify into one of: ${CATEGORIES.join(", ")}. Use "other" if none fit.

DUPLICATE CHECK: If the user's recent purchases include something very similar, set duplicateFlag with a warning.

OUTPUT — strict JSON only, no markdown:
{
  "verdict": "buy" | "wait" | "skip",
  "verdictScore": 0-100,
  "headline": "one line under 10 words describing the verdict and why",
  "category": "one of the categories above",
  "reasons": [
    { "label": "≤4 words", "detail": "1-2 sentences citing specific signals" },
    { "label": "...", "detail": "..." },
    { "label": "...", "detail": "..." }
  ],
  "scores": { "fit": 0-100, "value": 0-100, "proof": 0-100, "regret": 0-100 },
  "estimatedSavings": number or null,
  "waitUntil": "timing hint or null",
  "duplicateFlag": "warning string or null",
  "resaleOutlook": "brief resale note or null"
}

Always return 3-5 reasons. Keep labels ≤4 words. Make details specific — cite the price, rating, review count, or other signals. Never say "I cannot determine" — make a reasoned judgment.

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
      model: "gemini-2.0-flash",
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
