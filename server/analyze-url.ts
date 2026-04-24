import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildUrlVerdictPrompt, type UrlVerdictInput, type UrlVerdictResult } from "./prompts/verdict.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// ─── OG / meta tag scraper ────────────────────────────────────────────────────
// No cheerio — just regex over raw HTML. Fast and dependency-free.

function extractMeta(html: string, property: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return undefined;
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m?.[1]?.trim();
}

function extractSchemaPrice(html: string): string | undefined {
  // JSON-LD price
  const ldMatch = html.match(/"price"\s*:\s*"?([0-9]+(?:\.[0-9]{1,2})?)"?/);
  if (ldMatch?.[1]) return ldMatch[1];
  // Meta price
  return extractMeta(html, "product:price:amount") ?? extractMeta(html, "og:price:amount");
}

export async function scrapeProductMeta(url: string): Promise<UrlVerdictInput> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WorthlyBot/1.0; +https://worthlyai.com)",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    clearTimeout(timeout);

    const html = await res.text();

    const title =
      extractMeta(html, "og:title") ??
      extractMeta(html, "twitter:title") ??
      extractTitle(html);

    const description =
      extractMeta(html, "og:description") ??
      extractMeta(html, "twitter:description") ??
      extractMeta(html, "description");

    const imageUrl =
      extractMeta(html, "og:image") ??
      extractMeta(html, "twitter:image");

    const siteName =
      extractMeta(html, "og:site_name") ??
      new URL(url).hostname.replace("www.", "");

    const brand =
      extractMeta(html, "og:brand") ??
      extractMeta(html, "product:brand");

    const price =
      extractSchemaPrice(html) ??
      extractMeta(html, "og:price:amount");

    return { url, title, description, imageUrl, siteName, brand, price };
  } catch {
    clearTimeout(timeout);
    // Return minimal input — Gemini will handle "not enough info" gracefully
    return {
      url,
      siteName: new URL(url).hostname.replace("www.", ""),
    };
  }
}

// ─── Gemini call ──────────────────────────────────────────────────────────────

export async function getUrlVerdict(input: UrlVerdictInput): Promise<UrlVerdictResult> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
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
