import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QueryPayload, RecommendationResult, ScoredProduct } from "@shared/schema";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `You are Worthly, a personalized AI buying decision engine. You help users decide what to buy, whether it is worth it, and what tradeoffs exist.

Your job is to produce STRUCTURED buying recommendations. Never give vague advice. Always give concrete product suggestions with clear verdicts.

For every query, you must:
1. Identify 2-4 concrete product options (real products with real brand names and prices)
2. Score each on fit, value, proof, and regret risk (each 0-100)
3. Compute final score: (fit*0.35 + value*0.30 + proof*0.20 + regretScore_inverted*0.15)
4. Give a clear Buy / Wait / Skip verdict
5. Explain tradeoffs concisely

Always respond with valid JSON only. No markdown, no extra text.`;

export async function getRecommendation(payload: QueryPayload): Promise<RecommendationResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = buildPrompt(payload);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.4,
        maxOutputTokens: 4096,
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text);
    return validateAndNormalize(parsed, payload);
  } catch (err) {
    console.error("Gemini error:", err);
    return getFallbackRecommendation(payload);
  }
}

function buildPrompt(p: QueryPayload): string {
  const budgetStr = p.budgetMin && p.budgetMax
    ? `Budget: $${p.budgetMin}–$${p.budgetMax}`
    : p.budgetMax ? `Budget: up to $${p.budgetMax}` : "Budget: flexible";

  const moodStr = p.mood?.length ? `Mood/style: ${p.mood.join(", ")}` : "";
  const occasionStr = p.occasion ? `Occasion: ${p.occasion}` : "";
  const forWhomStr = `For: ${p.forWhom || "self"}`;
  const mustHaveStr = p.mustHaves?.length ? `Must-haves: ${p.mustHaves.join(", ")}` : "";
  const dealStr = p.dealbreakers?.length ? `Dealbreakers: ${p.dealbreakers.join(", ")}` : "";
  const favBrands = p.favoriteBrands?.length ? `Preferred brands: ${p.favoriteBrands.join(", ")}` : "";
  const badBrands = p.dislikedBrands?.length ? `Avoid brands: ${p.dislikedBrands.join(", ")}` : "";
  const urgency = p.urgency !== "flexible" ? `Urgency: ${p.urgency}` : "";

  const context = [budgetStr, moodStr, occasionStr, forWhomStr, mustHaveStr, dealStr, favBrands, badBrands, urgency]
    .filter(Boolean).join("\n");

  return `${SYSTEM_PROMPT}

User query: "${p.message}"
Category: ${p.category || "general"}
${context}

Respond with this exact JSON structure:
{
  "verdict": "buy" | "wait" | "skip",
  "confidence": "low" | "medium" | "high",
  "confidenceScore": 0-100,
  "explanation": "2-3 sentence explanation of why this is the best choice",
  "tradeoffs": ["tradeoff 1", "tradeoff 2", "tradeoff 3"],
  "regretRisk": "Who might regret this purchase",
  "resaleNote": "Brief resale value note if relevant",
  "topChoice": {
    "title": "Full product name",
    "brand": "Brand name",
    "category": "category",
    "price": 129.99,
    "priceRange": "$120-$140",
    "reason": "Why this fits this user specifically",
    "pros": ["pro 1", "pro 2", "pro 3"],
    "cons": ["con 1", "con 2"],
    "scores": {
      "finalScore": 88,
      "fitScore": 90,
      "valueScore": 85,
      "proofScore": 88,
      "regretScore": 15
    },
    "offers": [
      {
        "merchantName": "Amazon",
        "merchantUrl": "https://amazon.com/s?k=product+name",
        "affiliateUrl": null,
        "price": 129.99,
        "isAffiliate": false,
        "shippingNote": "Free Prime shipping"
      }
    ],
    "resaleNote": null
  },
  "budgetPick": { same structure, lower price option, or null },
  "premiumPick": { same structure, premium option, or null },
  "alternatives": [
    { same structure as topChoice }
  ]
}

Be specific. Use real product names, real brands, realistic prices. The user needs actionable buying decisions, not generic advice.`;
}

function validateAndNormalize(raw: any, payload: QueryPayload): RecommendationResult {
  const defaults = (product: any): ScoredProduct => ({
    title: product?.title || "Unknown Product",
    brand: product?.brand,
    category: product?.category || payload.category,
    price: product?.price,
    priceRange: product?.priceRange,
    reason: product?.reason || "Good match for your needs",
    pros: Array.isArray(product?.pros) ? product.pros : [],
    cons: Array.isArray(product?.cons) ? product.cons : [],
    scores: {
      finalScore: product?.scores?.finalScore || 75,
      fitScore: product?.scores?.fitScore || 75,
      valueScore: product?.scores?.valueScore || 75,
      proofScore: product?.scores?.proofScore || 75,
      regretScore: product?.scores?.regretScore || 20,
    },
    offers: Array.isArray(product?.offers) ? product.offers : [],
    resaleNote: product?.resaleNote,
  });

  return {
    verdict: ["buy", "wait", "skip"].includes(raw?.verdict) ? raw.verdict : "wait",
    confidence: ["low", "medium", "high"].includes(raw?.confidence) ? raw.confidence : "medium",
    confidenceScore: raw?.confidenceScore || 70,
    explanation: raw?.explanation || "Based on your requirements, this is our recommendation.",
    tradeoffs: Array.isArray(raw?.tradeoffs) ? raw.tradeoffs : [],
    regretRisk: raw?.regretRisk,
    resaleNote: raw?.resaleNote,
    topChoice: defaults(raw?.topChoice),
    budgetPick: raw?.budgetPick ? defaults(raw.budgetPick) : undefined,
    premiumPick: raw?.premiumPick ? defaults(raw.premiumPick) : undefined,
    alternatives: Array.isArray(raw?.alternatives) ? raw.alternatives.map(defaults) : [],
  };
}

function getFallbackRecommendation(payload: QueryPayload): RecommendationResult {
  const categoryMap: Record<string, any> = {
    electronics: {
      title: "Apple AirPods Pro (2nd Gen)",
      brand: "Apple",
      price: 249,
      priceRange: "$229-$249",
      reason: "Industry-leading active noise cancellation with great sound quality and ecosystem integration.",
      pros: ["Best-in-class ANC", "Seamless Apple ecosystem", "Excellent call quality"],
      cons: ["Premium price", "Android experience is limited"],
      scores: { finalScore: 87, fitScore: 88, valueScore: 80, proofScore: 92, regretScore: 12 },
      offers: [
        { merchantName: "Apple", merchantUrl: "https://apple.com/airpods-pro", isAffiliate: false, price: 249, shippingNote: "Free shipping" },
        { merchantName: "Amazon", merchantUrl: `https://amazon.com/s?k=${encodeURIComponent(payload.message || "airpods pro")}`, isAffiliate: false, price: 229 },
      ],
    },
    fashion: {
      title: "Levi's 501 Original Jeans",
      brand: "Levi's",
      price: 98,
      priceRange: "$60-$100",
      reason: "Timeless American denim that works for most body types and occasions.",
      pros: ["Classic fit", "Durable", "Wide size range"],
      cons: ["May need tailoring", "Runs slightly large"],
      scores: { finalScore: 82, fitScore: 80, valueScore: 85, proofScore: 88, regretScore: 15 },
      offers: [
        { merchantName: "Levi's", merchantUrl: "https://levi.com/501-jeans", isAffiliate: false, price: 98 },
        { merchantName: "Nordstrom", merchantUrl: "https://nordstrom.com/s/levis", isAffiliate: false, price: 89 },
      ],
    },
  };

  const category = payload.category || "electronics";
  const fallback = categoryMap[category] || categoryMap.electronics;

  return {
    verdict: "buy",
    confidence: "medium",
    confidenceScore: 72,
    explanation: `Based on your query "${payload.message}", this is our top pick. Connect your Gemini API key for fully personalized AI-powered recommendations.`,
    tradeoffs: ["Consider your specific use case", "Check current pricing before purchasing", "Read recent reviews"],
    regretRisk: "Users who need highly specialized features may prefer an alternative.",
    topChoice: {
      ...fallback,
      category,
      imageUrl: undefined,
      resaleNote: "Holds value well for this category.",
    },
    alternatives: [],
  };
}
