import { Database } from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import BetterSqlite3 from "better-sqlite3";
import { eq, desc, and } from "drizzle-orm";
import {
  userProfiles, userPreferences, queries, recommendations,
  savedItems, feedback, behaviorEvents,
  type UserProfile, type InsertUserProfile,
  type UserPreferences, type InsertUserPreferences,
  type Query, type InsertQuery,
  type Recommendation, type InsertRecommendation,
  type SavedItem, type InsertSavedItem,
  type InsertFeedback,
} from "@shared/schema";

const sqlite: Database = new BetterSqlite3("worthly.db");
export const db = drizzle(sqlite);

// Create tables
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar TEXT,
    onboarding_done INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS user_preferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    categories TEXT DEFAULT '[]',
    budget_style TEXT DEFAULT 'balanced',
    favorite_brands TEXT DEFAULT '[]',
    disliked_brands TEXT DEFAULT '[]',
    moods TEXT DEFAULT '[]',
    occasions TEXT DEFAULT '[]',
    sizes TEXT DEFAULT '{}',
    skin_hair_profile TEXT DEFAULT '{}',
    lifestyle_tags TEXT DEFAULT '[]',
    gift_relationships TEXT DEFAULT '[]'
  );
  CREATE TABLE IF NOT EXISTS queries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id TEXT,
    category TEXT,
    message TEXT,
    budget_min REAL,
    budget_max REAL,
    mood TEXT DEFAULT '[]',
    occasion TEXT,
    for_whom TEXT DEFAULT 'self',
    favorite_brands TEXT DEFAULT '[]',
    disliked_brands TEXT DEFAULT '[]',
    must_haves TEXT DEFAULT '[]',
    dealbreakers TEXT DEFAULT '[]',
    urgency TEXT DEFAULT 'flexible',
    image_url TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_id INTEGER NOT NULL,
    user_id INTEGER,
    verdict TEXT DEFAULT 'wait',
    confidence TEXT DEFAULT 'medium',
    confidence_score INTEGER DEFAULT 70,
    explanation TEXT,
    tradeoffs TEXT DEFAULT '[]',
    regret_risk TEXT,
    resale_note TEXT,
    top_pick_id INTEGER,
    budget_pick_id INTEGER,
    products TEXT DEFAULT '[]',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS saved_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id TEXT,
    product_title TEXT NOT NULL,
    product_brand TEXT,
    product_price REAL,
    product_image_url TEXT,
    category TEXT,
    score INTEGER,
    verdict TEXT,
    notes TEXT,
    merchant_url TEXT,
    saved_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_id INTEGER,
    recommendation_id INTEGER,
    session_id TEXT,
    vote TEXT,
    outcome TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS behavior_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    session_id TEXT,
    event_type TEXT NOT NULL,
    product_title TEXT,
    category TEXT,
    metadata TEXT DEFAULT '{}',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

export interface IStorage {
  // Queries
  createQuery(data: InsertQuery): Query;
  getQuery(id: number): Query | undefined;
  updateQueryStatus(id: number, status: string): void;
  getQueryHistory(sessionId: string, limit?: number): Query[];

  // Recommendations
  createRecommendation(data: InsertRecommendation): Recommendation;
  getRecommendation(queryId: number): Recommendation | undefined;

  // Saved items
  saveItem(data: InsertSavedItem): SavedItem;
  getSavedItems(sessionId: string): SavedItem[];
  deleteSavedItem(id: number): void;

  // Feedback
  submitFeedback(data: InsertFeedback): void;

  // Preferences
  getPreferences(sessionId: string): UserPreferences | undefined;
  upsertPreferences(sessionId: string, prefs: Partial<UserPreferences>): UserPreferences;

  // History
  getHistory(sessionId: string, limit?: number): Array<Query & { recommendation?: Recommendation }>;
}

export const storage: IStorage = {
  createQuery(data) {
    return db.insert(queries).values({
      ...data,
      mood: JSON.stringify(data.mood ?? []),
      favoriteBrands: JSON.stringify(data.favoriteBrands ?? []),
      dislikedBrands: JSON.stringify(data.dislikedBrands ?? []),
      mustHaves: JSON.stringify(data.mustHaves ?? []),
      dealbreakers: JSON.stringify(data.dealbreakers ?? []),
    }).returning().get()!;
  },

  getQuery(id) {
    return db.select().from(queries).where(eq(queries.id, id)).get();
  },

  updateQueryStatus(id, status) {
    sqlite.prepare("UPDATE queries SET status = ? WHERE id = ?").run(status, id);
  },

  getQueryHistory(sessionId, limit = 20) {
    return db.select().from(queries)
      .where(eq(queries.sessionId, sessionId))
      .orderBy(desc(queries.id))
      .limit(limit)
      .all();
  },

  createRecommendation(data) {
    return db.insert(recommendations).values({
      ...data,
      tradeoffs: JSON.stringify(data.tradeoffs ?? []),
      products: JSON.stringify(data.products ?? []),
    }).returning().get()!;
  },

  getRecommendation(queryId) {
    return db.select().from(recommendations).where(eq(recommendations.queryId, queryId)).get();
  },

  saveItem(data) {
    return db.insert(savedItems).values(data).returning().get()!;
  },

  getSavedItems(sessionId) {
    return db.select().from(savedItems)
      .where(eq(savedItems.sessionId, sessionId))
      .orderBy(desc(savedItems.id))
      .all();
  },

  deleteSavedItem(id) {
    db.delete(savedItems).where(eq(savedItems.id, id)).run();
  },

  submitFeedback(data) {
    db.insert(feedback).values(data).run();
  },

  getPreferences(sessionId) {
    return db.select().from(userPreferences)
      .where(eq(userPreferences.userId, -1))
      .get();
  },

  upsertPreferences(sessionId, prefs) {
    // Use sessionId as userId=-1 for demo (no real auth)
    const existing = db.select().from(userPreferences)
      .where(eq(userPreferences.userId, -1)).get();
    if (existing) {
      sqlite.prepare(`UPDATE user_preferences SET
        categories = ?, budget_style = ?, favorite_brands = ?,
        disliked_brands = ?, moods = ?, occasions = ?,
        lifestyle_tags = ?
        WHERE id = ?`
      ).run(
        prefs.categories ?? existing.categories,
        prefs.budgetStyle ?? existing.budgetStyle,
        prefs.favoriteBrands ?? existing.favoriteBrands,
        prefs.dislikedBrands ?? existing.dislikedBrands,
        prefs.moods ?? existing.moods,
        prefs.occasions ?? existing.occasions,
        prefs.lifestyleTags ?? existing.lifestyleTags,
        existing.id,
      );
      return db.select().from(userPreferences).where(eq(userPreferences.id, existing.id)).get()!;
    } else {
      return db.insert(userPreferences).values({
        userId: -1,
        categories: JSON.stringify(prefs.categories ?? []),
        budgetStyle: prefs.budgetStyle ?? "balanced",
        favoriteBrands: JSON.stringify(prefs.favoriteBrands ?? []),
        dislikedBrands: JSON.stringify(prefs.dislikedBrands ?? []),
        moods: JSON.stringify(prefs.moods ?? []),
        occasions: JSON.stringify(prefs.occasions ?? []),
        lifestyleTags: JSON.stringify(prefs.lifestyleTags ?? []),
      }).returning().get()!;
    }
  },

  getHistory(sessionId, limit = 15) {
    const qs = db.select().from(queries)
      .where(eq(queries.sessionId, sessionId))
      .orderBy(desc(queries.id))
      .limit(limit)
      .all();
    return qs.map(q => {
      const rec = db.select().from(recommendations)
        .where(eq(recommendations.queryId, q.id)).get();
      return { ...q, recommendation: rec };
    });
  },
};
