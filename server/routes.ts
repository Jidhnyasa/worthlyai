import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { getRecommendation } from "./gemini";
import type { QueryPayload } from "@shared/schema";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ── POST /api/query ──────────────────────────────────────────────────────
  app.post("/api/query", async (req, res) => {
    try {
      const payload: QueryPayload = req.body;
      const sessionId = payload.sessionId || req.headers["x-session-id"] as string || "anonymous";

      const query = await storage.createQuery({
        sessionId,
        category: payload.category,
        message: payload.message,
        budgetMin: payload.budgetMin,
        budgetMax: payload.budgetMax,
        mood: JSON.stringify(payload.mood ?? []) as any,
        occasion: payload.occasion,
        forWhom: payload.forWhom || "self",
        favoriteBrands: JSON.stringify(payload.favoriteBrands ?? []) as any,
        dislikedBrands: JSON.stringify(payload.dislikedBrands ?? []) as any,
        mustHaves: JSON.stringify(payload.mustHaves ?? []) as any,
        dealbreakers: JSON.stringify(payload.dealbreakers ?? []) as any,
        urgency: payload.urgency || "flexible",
        notes: payload.notes,
      });

      await storage.updateQueryStatus(query.id, "processing");

      const result = await getRecommendation(payload);

      const rec = await storage.createRecommendation({
        queryId: query.id,
        verdict: result.verdict,
        confidence: result.confidence,
        confidenceScore: result.confidenceScore,
        explanation: result.explanation,
        tradeoffs: JSON.stringify(result.tradeoffs) as any,
        regretRisk: result.regretRisk,
        resaleNote: result.resaleNote,
        products: JSON.stringify([
          result.topChoice,
          ...(result.budgetPick ? [result.budgetPick] : []),
          ...(result.premiumPick ? [result.premiumPick] : []),
          ...(result.alternatives || []),
        ]) as any,
      });

      await storage.updateQueryStatus(query.id, "done");

      res.json({ queryId: query.id, recommendationId: rec.id, result });
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
        mood: safeJson(h.mood, []),
        recommendation: h.recommendation ? {
          ...h.recommendation,
          tradeoffs: safeJson(h.recommendation.tradeoffs, []),
          products: safeJson(h.recommendation.products, []),
        } : null,
      })));
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch history" });
    }
  });

  // ── POST /api/save ───────────────────────────────────────────────────────
  app.post("/api/save", async (req, res) => {
    const sessionId = req.headers["x-session-id"] as string || "anonymous";
    try {
      const item = await storage.saveItem({ ...req.body, sessionId });
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: "Failed to save item" });
    }
  });

  // ── GET /api/saved ───────────────────────────────────────────────────────
  app.get("/api/saved", async (req, res) => {
    const sessionId = req.headers["x-session-id"] as string || "anonymous";
    try {
      const items = await storage.getSavedItems(sessionId);
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch saved items" });
    }
  });

  // ── DELETE /api/saved/:id ────────────────────────────────────────────────
  app.delete("/api/saved/:id", async (req, res) => {
    try {
      await storage.deleteSavedItem(parseInt(req.params.id));
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // ── POST /api/feedback ───────────────────────────────────────────────────
  app.post("/api/feedback", async (req, res) => {
    const sessionId = req.headers["x-session-id"] as string || "anonymous";
    try {
      await storage.submitFeedback({ ...req.body, sessionId });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: "Failed to submit feedback" });
    }
  });

  // ── GET /api/preferences ─────────────────────────────────────────────────
  app.get("/api/preferences", async (req, res) => {
    const sessionId = req.headers["x-session-id"] as string || "anonymous";
    try {
      const prefs = await storage.getPreferences(sessionId);
      if (!prefs) return res.json(null);
      res.json({
        ...prefs,
        categories: safeJson(prefs.categories, []),
        favoriteBrands: safeJson(prefs.favoriteBrands, []),
        dislikedBrands: safeJson(prefs.dislikedBrands, []),
        moods: safeJson(prefs.moods, []),
        occasions: safeJson(prefs.occasions, []),
        lifestyleTags: safeJson(prefs.lifestyleTags, []),
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch preferences" });
    }
  });

  // ── POST /api/preferences ────────────────────────────────────────────────
  app.post("/api/preferences", async (req, res) => {
    const sessionId = req.headers["x-session-id"] as string || "anonymous";
    try {
      const prefs = await storage.upsertPreferences(sessionId, {
        ...req.body,
        categories: JSON.stringify(req.body.categories ?? []),
        favoriteBrands: JSON.stringify(req.body.favoriteBrands ?? []),
        dislikedBrands: JSON.stringify(req.body.dislikedBrands ?? []),
        moods: JSON.stringify(req.body.moods ?? []),
        occasions: JSON.stringify(req.body.occasions ?? []),
        lifestyleTags: JSON.stringify(req.body.lifestyleTags ?? []),
      });
      res.json(prefs);
    } catch (err) {
      res.status(500).json({ error: "Failed to save preferences" });
    }
  });

  return httpServer;
}

function safeJson(val: any, fallback: any) {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return fallback; }
  }
  return fallback;
}
