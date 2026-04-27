import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildUrlVerdictPrompt, type UrlVerdictInput, type UrlVerdictResult } from "./prompts/verdict.js";
import { scrapeProductFromUrl } from "./scrape/product.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function scrapeProductMeta(url: string): Promise<UrlVerdictInput> {
  try {
    const scraped = await scrapeProductFromUrl(url);
    return {
      url,
      title:       scraped.title !== "<could not identify>" ? scraped.title : undefined,
      description: scraped.description,
      imageUrl:    scraped.imageUrl,
      siteName:    scraped.merchant ?? new URL(url).hostname.replace("www.", ""),
      price:       scraped.price != null ? String(scraped.price) : undefined,
    };
  } catch {
    return { url, siteName: new URL(url).hostname.replace("www.", "") };
  }
}

// ─── Gemini call ──────────────────────────────────────────────────────────────

export async function getUrlVerdict(input: UrlVerdictInput): Promise<UrlVerdictResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = buildUrlVerdictPrompt(input);

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.3,
        maxOutputTokens: 1024,
      },
    });

    const text = result.response.text();
    const parsed = JSON.parse(text) as Partial<UrlVerdictResult>;
    return normalizeUrlVerdict(parsed, input);
  } catch (err) {
    console.error("Gemini URL verdict error:", err);
    return getFallbackUrlVerdict(input);
  }
}

function normalizeUrlVerdict(raw: Partial<UrlVerdictResult>, input: UrlVerdictInput): UrlVerdictResult {
  const verdict = (["buy", "wait", "skip"].includes(raw.verdict ?? "") ? raw.verdict : "wait") as "buy" | "wait" | "skip";
  const reasons = Array.isArray(raw.reasons) && raw.reasons.length >= 1
    ? raw.reasons.slice(0, 3).map(r => ({
        label: r.label ?? "Signal",
        detail: r.detail ?? "",
      }))
    : [{ label: "Limited data", detail: "Not enough product info to give a full verdict. Try installing the Worthly extension for richer analysis." }];

  return {
    verdict,
    product_name: raw.product_name ?? input.title ?? "Unknown product",
    product_image: input.imageUrl,
    price: typeof raw.price === "number" ? raw.price : (input.price ? parseFloat(input.price) : undefined),
    reasons,
    estimated_savings: raw.estimated_savings ?? undefined,
    fit_score: clamp(raw.fit_score ?? 65),
    value_score: clamp(raw.value_score ?? 65),
    regret_score: clamp(raw.regret_score ?? 30),
    trust: raw.trust ?? "Trust signals unclear — check reviews before buying.",
    value: raw.value ?? "Price assessment unavailable.",
    timing: raw.timing ?? "No clear timing signal.",
  };
}

function getFallbackUrlVerdict(input: UrlVerdictInput): UrlVerdictResult {
  const site = input.siteName ?? "this retailer";
  return {
    verdict: "wait",
    product_name: input.title ?? "Product",
    product_image: input.imageUrl,
    price: input.price ? parseFloat(input.price) : undefined,
    reasons: [
      { label: "Analysis incomplete", detail: "We couldn't fully analyze this product. The page may have blocked our scraper." },
      { label: "Try the extension", detail: "The Worthly browser extension gets richer product data for more accurate verdicts." },
      { label: "Check reviews", detail: `Before buying from ${site}, check recent reviews and compare prices across retailers.` },
    ],
    fit_score: 50,
    value_score: 50,
    regret_score: 40,
    trust: "Unable to assess trust signals for this product.",
    value: "Price fairness could not be determined.",
    timing: "No timing signal available.",
  };
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}
