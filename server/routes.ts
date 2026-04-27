import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { getRecommendation } from "./gemini";
import { scrapeProductMeta, getUrlVerdict } from "./analyze-url";
import { scrapeProductFromUrl } from "./scrape/product.js";
import { getVerdictForUrl } from "./gemini-verdict.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QueryPayload } from "@shared/schema";

const chatAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const CHAT_SYSTEM = `You are Worthly — an AI purchase advisor paid by the user, not the seller.
Keep answers to 2-4 sentences unless the user asks for more.
If verdict JSON is provided in the context, use it directly — do not re-derive it.
Be specific, honest, and concise. If something is a bad deal, say so plainly.`;

// ── IP rate limiter — 3 anonymous verdicts per IP per day ────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = rateLimitMap.get(ip);
  if (!rec || now > rec.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 86_400_000 });
    return true;
  }
  if (rec.count >= 3) return false;
  rec.count++;
  return true;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ── POST /api/query ──────────────────────────────────────────────────────
  app.post("/api/query", async (req, res) => {
    try {
      const payload: QueryPayload = req.body;
      const sessionId = payload.sessionId || req.headers["x-session-id"] as string || "anonymous";
      const userId = payload.userId || req.headers["x-user-id"] as string | undefined;

      // AI call first — works even if DB is unavailable
      const result = await getRecommendation(payload);

      // Best-effort DB persistence — don't fail the request if DB is down
      let queryId: string | undefined;
      let recommendationId: string | undefined;
      try {
        const query = await storage.createQuery({
          sessionId,
          userId,
          rawQuery:  payload.message,
          category:  payload.category,
          budgetMin: payload.budgetMin,
          budgetMax: payload.budgetMax,
          mood:      payload.mood?.join(", "),
          occasion:  payload.occasion,
        });
        queryId = query.id;

        const rec = await storage.createRecommendation({ queryId: query.id, userId, result });
        recommendationId = rec.id;
      } catch (dbErr) {
        console.error("DB persistence failed (non-fatal):", dbErr);
      }

      res.json({ queryId, recommendationId, result });
    } catch (err) {
      console.error("Query error:", err);
      res.status(500).json({ error: "Failed to process query" });
    }
  });

  // ── GET /api/history ─────────────────────────────────────────────────────
  app.get("/api/history", async (req, res) => {
    const sessionId = req.headers["x-session-id"] as string || "anonymous";
    try {
      const history = await storage.getHistory(sessionId);
      res.json(history.map(h => ({
        ...h,
        recommendation: h.recommendation
          ? { ...h.recommendation, resultJson: h.recommendation.resultJson }
          : null,
      })));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // ── POST /api/save ───────────────────────────────────────────────────────
  app.post("/api/save", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Authentication required to save items" });
    try {
      const item = await storage.saveItem({
        userId,
        recommendationId: req.body.recommendationId,
        notes:            req.body.notes,
      });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to save item" });
    }
  });

  // ── GET /api/saved ───────────────────────────────────────────────────────
  app.get("/api/saved", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.json([]);
    try {
      const items = await storage.getSavedItems(userId);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch saved items" });
    }
  });

  // ── DELETE /api/saved/:id ────────────────────────────────────────────────
  app.delete("/api/saved/:id", async (req, res) => {
    try {
      await storage.deleteSavedItem(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // ── POST /api/feedback ───────────────────────────────────────────────────
  app.post("/api/feedback", async (req, res) => {
    const userId = req.headers["x-user-id"] as string | undefined;
    try {
      await storage.submitFeedback({
        userId,
        queryId:          req.body.queryId,
        recommendationId: req.body.recommendationId,
        helpful:          req.body.helpful,
        outcome:          req.body.outcome,
        notes:            req.body.notes,
      });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // ── GET /api/preferences ─────────────────────────────────────────────────
  app.get("/api/preferences", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.json(null);
    try {
      const prefs = await storage.getPreferences(userId);
      res.json(prefs ?? null);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // ── POST /api/preferences ────────────────────────────────────────────────
  app.post("/api/preferences", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "Authentication required" });
    try {
      const prefs = await storage.upsertPreferences(userId, req.body);
      res.json(prefs);
    } catch (err) {
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  // ── POST /api/detected-products ─────────────────────────────────────────────
  // Called by the browser extension to save a product from a shopping page.
  app.post("/api/detected-products", async (req, res) => {
    const userId = req.headers["x-user-id"] as string | undefined;
    try {
      const product = await storage.saveDetectedProduct({
        userId: userId ?? null,
        title:               req.body.title,
        merchant:            req.body.merchant,
        productUrl:          req.body.productUrl,
        imageUrl:            req.body.imageUrl ?? null,
        price:               req.body.price?.toString() ?? null,
        detectedRating:      req.body.detectedRating?.toString() ?? null,
        detectedReviewCount: req.body.detectedReviewCount ?? null,
        verdict:             req.body.verdict ?? "wait",
        verdictScore:        req.body.verdictScore ?? null,
        verdictReasonJson:   req.body.verdictReasonJson ?? [],
        status:              "saved",
      });
      res.json(product);
    } catch (err) {
      console.error("Save detected product error:", err);
      res.status(500).json({ error: "Failed to save product" });
    }
  });

  // ── GET /api/detected-products ───────────────────────────────────────────────
  app.get("/api/detected-products", async (req, res) => {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.json([]);
    try {
      const products = await storage.getDetectedProducts(userId);
      res.json(products);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // ── PATCH /api/detected-products/:id ────────────────────────────────────────
  app.patch("/api/detected-products/:id", async (req, res) => {
    try {
      await storage.updateDetectedProductStatus(req.params.id, req.body.status);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // ── DELETE /api/detected-products/:id ───────────────────────────────────────
  app.delete("/api/detected-products/:id", async (req, res) => {
    try {
      await storage.deleteDetectedProduct(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // ── POST /api/analyze-url ────────────────────────────────────────────────────
  // Real verdict for a product URL. Scrapes OG metadata, calls Gemini.
  // No auth required — rate limiting handled client-side for now.
  app.post("/api/analyze-url", async (req, res) => {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url is required" });
    }

    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    const allowedHosts = ["amazon.com", "target.com", "walmart.com", "bestbuy.com", "ebay.com", "etsy.com", "shopify.com"];
    const isAllowed = allowedHosts.some(h => parsed.hostname.endsWith(h));
    if (!isAllowed) {
      // Still try — just don't restrict. Return best-effort result.
    }

    try {
      const meta = await scrapeProductMeta(url);
      const verdict = await getUrlVerdict(meta);
      res.json(verdict);
    } catch (err) {
      console.error("analyze-url error:", err);
      res.status(500).json({ error: "Failed to analyze URL" });
    }
  });

  // ── POST /api/verdict/url ────────────────────────────────────────────────────
  // Full URL verdict: scrapes DOM, injects user context, rate-limits anonymous users.
  app.post("/api/verdict/url", async (req, res) => {
    const { url } = req.body as { url?: string };
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "url is required" });
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return res.status(400).json({ error: "Only http/https URLs are supported" });
    }

    const userId  = req.headers["x-user-id"] as string | undefined;
    const sessionId = req.headers["x-session-id"] as string || "anonymous";

    // Rate-limit anonymous users
    if (!userId) {
      const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "unknown").split(",")[0].trim();
      if (!checkRateLimit(ip)) {
        return res.status(402).json({ needsSignup: true, error: "Free limit reached — 3 verdicts/day. Sign in to continue." });
      }
    }

    try {
      // 1. Scrape
      const scraped = await scrapeProductFromUrl(url);

      // 2. Load user context if authenticated
      let userContext: Parameters<typeof getVerdictForUrl>[0]["userContext"];
      if (userId) {
        try {
          const prefs = await storage.getPreferences(userId);
          if (prefs) {
            userContext = {
              budgetStyle: prefs.lifestyleTags?.find(t => ["budget","balanced","quality","premium"].includes(t)),
              favoriteBrands: prefs.favoriteBrands ?? [],
              dislikedBrands: prefs.dislikedBrands ?? [],
              goals: prefs.lifestyleTags?.filter(t => ["save_money","reduce_impulse","minimalism","quality_over_quantity"].includes(t)),
            };
          }
        } catch { /* non-fatal */ }
      }

      // 3. Verdict
      const verdict = await getVerdictForUrl({ url, scraped, userContext });

      // 4. Persist (best-effort)
      let queryId: string | undefined;
      let recommendationId: string | undefined;
      try {
        const q = await storage.createQuery({ sessionId, userId, rawQuery: url, queryType: "verdict", category: verdict.category });
        queryId = q.id;
        const overallScore = Math.round(verdict.scores.fit * 0.35 + verdict.scores.value * 0.35 + (100 - verdict.scores.regret) * 0.30);
        const rec = await storage.createRecommendation({
          queryId: q.id,
          userId,
          result: {
            verdict: verdict.verdict,
            confidence: "high",
            confidenceScore: verdict.verdictScore,
            explanation: verdict.headline,
            tradeoffs: verdict.reasons.map(r => `${r.label}: ${r.detail}`),
            topChoice: {
              title: scraped.title,
              price: scraped.price,
              imageUrl: scraped.imageUrl,
              reason: verdict.headline,
              pros: [], cons: [],
              scores: { finalScore: verdict.verdictScore, fitScore: verdict.scores.fit, valueScore: verdict.scores.value, proofScore: verdict.scores.proof, regretScore: verdict.scores.regret },
              offers: [],
            },
            alternatives: [],
          },
        });
        recommendationId = rec.id;
      } catch (dbErr) {
        console.error("DB persistence failed (non-fatal):", dbErr);
      }

      res.json({ ...verdict, scraped, queryId, recommendationId });
    } catch (err) {
      console.error("/api/verdict/url error:", err);
      res.status(500).json({ error: "Failed to analyze URL" });
    }
  });

  // ── POST /api/chat ──────────────────────────────────────────────────────────
  // Streaming chat anchored to a verdict. Body: { message, verdictContext?, history? }
  app.post("/api/chat", async (req, res) => {
    const { message, verdictContext, history = [] } = req.body as {
      message: string;
      verdictContext?: string;   // JSON string of VerdictOutput + scraped
      history?: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>;
    };

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const systemContext = verdictContext
      ? `${CHAT_SYSTEM}\n\nVERDICT CONTEXT:\n${verdictContext}`
      : CHAT_SYSTEM;

    try {
      const model = chatAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const chat  = model.startChat({
        history: [
          { role: "user",  parts: [{ text: systemContext }] },
          { role: "model", parts: [{ text: "Understood. I'm ready to help with purchase decisions." }] },
          ...history,
        ],
        generationConfig: { temperature: 0.4, maxOutputTokens: 512 },
      });

      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");

      const stream = await chat.sendMessageStream(message);
      for await (const chunk of stream.stream) {
        const text = chunk.text();
        if (text) res.write(text);
      }
      res.end();
    } catch (err) {
      console.error("/api/chat error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Chat failed" });
      else res.end();
    }
  });

  // ── POST /api/waitlist ───────────────────────────────────────────────────────
  app.post("/api/waitlist", async (req, res) => {
    const { email, source } = req.body as { email?: string; source?: string };
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ error: "Valid email is required" });
    }
    try {
      await storage.addToWaitlist({ email: email.trim().toLowerCase(), source: source ?? "extension_cta" });
      res.json({ success: true });
    } catch (err: any) {
      // Unique constraint — already on waitlist
      if (err?.code === "23505") {
        return res.json({ success: true, already: true });
      }
      console.error("Waitlist error:", err);
      res.status(500).json({ error: "Failed to join waitlist" });
    }
  });

  return httpServer;
}
