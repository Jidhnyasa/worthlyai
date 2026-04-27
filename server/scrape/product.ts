import * as cheerio from "cheerio";
import type { VerdictInput } from "../gemini-verdict.js";

type Scraped = VerdictInput["scraped"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(str: string | null | undefined): number | undefined {
  if (!str) return undefined;
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? undefined : n;
}
function parseRating(str: string | null | undefined): number | undefined {
  if (!str) return undefined;
  const n = parseFloat(str);
  return isNaN(n) || n > 5 ? undefined : n;
}
function parseReviews(str: string | null | undefined): number | undefined {
  if (!str) return undefined;
  const n = parseInt(str.replace(/[^0-9]/g, ""));
  return isNaN(n) ? undefined : n;
}

function detectPlatform(hostname: string): string {
  if (/amazon\.(com|co\.uk|ca|de|fr|es|it|jp|in|com\.au)/.test(hostname)) return "amazon";
  if (/target\.com/.test(hostname)) return "target";
  if (/walmart\.com/.test(hostname)) return "walmart";
  if (/myshopify\.com/.test(hostname) || /\/products\//.test(hostname)) return "shopify";
  if (/tiktok\.com/.test(hostname)) return "tiktok";
  if (/instagram\.com/.test(hostname)) return "instagram";
  return "generic";
}

// ─── Platform extractors ──────────────────────────────────────────────────────
// Selectors mirrored from extension/content/content.js — kept in sync.

function extractAmazon($: cheerio.CheerioAPI, url: string): Scraped {
  const title =
    $("#productTitle").text().trim() ||
    $("h1.a-size-large span").text().trim() ||
    $("h1").first().text().trim() ||
    "";

  const whole = $(".a-price-whole").first().text().replace(/[^0-9]/g, "");
  const frac  = $(".a-price-fraction").first().text().replace(/[^0-9]/g, "") || "00";
  const priceStr =
    whole ? `${whole}.${frac}` :
    $("#priceblock_ourprice, #priceblock_dealprice, #price_inside_buybox").first().text() ||
    $(".a-price .a-offscreen").first().text();
  const price = parsePrice(priceStr);

  const ratingText = $("#acrPopover").attr("title") || $(".a-icon-star-small .a-icon-alt").first().text();
  const rating = parseRating(ratingText);

  const reviewText = $("#acrCustomerReviewText").first().text();
  const reviewCount = parseReviews(reviewText);

  const imageUrl =
    $("#landingImage").attr("data-old-hires") ||
    $("#landingImage").attr("src") ||
    $("#imgBlkFront").attr("src") ||
    undefined;

  const description = $("#productDescription p").first().text().trim() ||
    $("[data-feature-name='productDescription'] p").first().text().trim() ||
    undefined;

  return { title: title || "<could not identify>", price, rating, reviewCount, imageUrl, description, merchant: "Amazon" };
}

function extractTarget($: cheerio.CheerioAPI, url: string): Scraped {
  const title =
    $("h1[data-test='product-title']").text().trim() ||
    $("h1").first().text().trim() ||
    "";
  const priceText =
    $("[data-test='product-price']").first().text() ||
    $("[class*='CurrentPriceFinal']").first().text();
  const price = parsePrice(priceText);

  const ratingText = $("[data-test='ratings']").attr("aria-label") || $("[data-test='ratings'] span").first().text();
  const rating = parseRating(ratingText?.split(" ")[0]);
  const reviewCount = parseReviews($("[data-test='ratings-count'], [data-test='review-count']").first().text());

  const imageUrl = $("[data-test='product-image'] picture img").attr("src") || undefined;
  const description = $("[data-test='item-details-description']").first().text().trim() || undefined;

  return { title: title || "<could not identify>", price, rating, reviewCount, imageUrl, description, merchant: "Target" };
}

function extractWalmart($: cheerio.CheerioAPI, url: string): Scraped {
  const title =
    $("[itemprop='name']").first().text().trim() ||
    $("[data-testid='product-title']").text().trim() ||
    $("h1").first().text().trim() ||
    "";
  const priceStr =
    $("[itemprop='price']").attr("content") ||
    $("[data-testid='price-wrap'] .inline-flex span").first().text();
  const price = parsePrice(priceStr);

  const ratingEl = $("[itemprop='ratingValue']");
  const rating = parseRating(ratingEl.attr("content") || ratingEl.text());
  const reviewCount = parseReviews($("[itemprop='reviewCount']").first().text());

  const imageUrl = $("[data-testid='hero-image-container'] img").attr("src") || undefined;
  const description = $("[itemprop='description']").first().text().trim() || undefined;

  return { title: title || "<could not identify>", price, rating, reviewCount, imageUrl, description, merchant: "Walmart" };
}

function extractShopify($: cheerio.CheerioAPI, url: string): Scraped {
  const title =
    $("h1.product-single__title, h1.product__title, .product-title h1").first().text().trim() ||
    $("h1").first().text().trim() ||
    "";
  const priceText =
    $("[data-product-price]").first().text() ||
    $(".price .money, .product__price .money").first().text() ||
    $(".price-item--regular").first().text();
  const price = parsePrice(priceText);

  const rawImage =
    $(".product-single__media img, .product__media img, .product-featured-media img").first().attr("src");
  const imageUrl = rawImage?.startsWith("//") ? `https:${rawImage}` : rawImage || undefined;

  const description =
    $(".product-single__description, .product__description").first().text().trim() ||
    $("[class*='product-description']").first().text().trim() ||
    undefined;

  const hostname = new URL(url).hostname.replace("www.", "");

  return { title: title || "<could not identify>", price, imageUrl, description, merchant: hostname };
}

function extractGeneric($: cheerio.CheerioAPI, url: string): Scraped {
  const title =
    $("meta[property='og:title']").attr("content") ||
    $("meta[name='twitter:title']").attr("content") ||
    $("title").text().trim() ||
    $("h1").first().text().trim() ||
    "";
  const priceStr =
    $("meta[property='product:price:amount']").attr("content") ||
    $("[itemprop='price']").attr("content") ||
    $("[itemprop='price']").first().text();
  const price = parsePrice(priceStr);

  const imageUrl =
    $("meta[property='og:image']").attr("content") ||
    $("meta[name='twitter:image']").attr("content") ||
    undefined;
  const description =
    $("meta[property='og:description']").attr("content") ||
    $("meta[name='description']").attr("content") ||
    undefined;
  const merchant = new URL(url).hostname.replace("www.", "");

  return { title: title || "<could not identify>", price, imageUrl, description, merchant };
}

// ─── Social stubs (no DOM product data available server-side) ─────────────────

function extractSocial($: cheerio.CheerioAPI, url: string, platform: string): Scraped {
  // TODO: TikTok/Instagram product pages require login — stub with OG data only
  const title = $("meta[property='og:title']").attr("content") || $("title").text().trim() || "";
  const imageUrl = $("meta[property='og:image']").attr("content") || undefined;
  const description = $("meta[property='og:description']").attr("content") || undefined;
  const merchant = platform === "tiktok" ? "TikTok Shop" : "Instagram Shopping";
  console.warn(`[scraper] ${platform} scrape is partial — login wall likely blocks product data`);
  return { title: title || "<could not identify>", imageUrl, description, merchant };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function scrapeProductFromUrl(url: string): Promise<Scraped> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { title: "<invalid url>" };
  }

  // Block login-walled pages early
  if (/instagram\.com\/(p|reel|stories)/.test(url) || /tiktok\.com\/@/.test(url)) {
    console.warn(`[scraper] ${parsed.hostname} login wall — returning partial`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  const sbKey = process.env.SCRAPINGBEE_KEY;
  const fetchUrl = sbKey
    ? `https://app.scrapingbee.com/api/v1/?api_key=${sbKey}&url=${encodeURIComponent(url)}&render_js=true`
    : url;

  try {
    const res = await fetch(fetchUrl, {
      signal: controller.signal,
      ...(sbKey ? {} : {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          "Cache-Control": "no-cache",
        },
      }),
    });
    clearTimeout(timer);

    if (!res.ok) {
      console.warn(`[scraper] ${parsed.hostname} returned ${res.status}${sbKey ? " (via ScrapingBee)" : ""}`);
      return { title: "<could not identify>", merchant: parsed.hostname.replace("www.", "") };
    }

    const html = await res.text();
    const $ = cheerio.load(html);
    const platform = detectPlatform(parsed.hostname + parsed.pathname);

    switch (platform) {
      case "amazon":  return extractAmazon($, url);
      case "target":  return extractTarget($, url);
      case "walmart": return extractWalmart($, url);
      case "shopify": return extractShopify($, url);
      case "tiktok":
      case "instagram": return extractSocial($, url, platform);
      default: return extractGeneric($, url);
    }
  } catch (err: any) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      console.warn(`[scraper] ${parsed.hostname} timed out after 15s`);
    } else {
      console.warn(`[scraper] ${parsed.hostname} fetch error:`, err?.message);
    }
    return { title: "<could not identify>", merchant: parsed.hostname.replace("www.", "") };
  }
}
