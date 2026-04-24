import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { getRecommendation } from "./gemini";
import { scrapeProductMeta, getUrlVerdict } from "./analyze-url";
import type { QueryPayload } from "@shared/schema";

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
