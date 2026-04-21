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

  return httpServer;
}
