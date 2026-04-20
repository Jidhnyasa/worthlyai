import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc } from "drizzle-orm";
import {
  userPreferences, queries, recommendations, savedItems, feedback,
  type UserPreferences, type InsertUserPreferences,
  type Query, type InsertQuery,
  type Recommendation, type InsertRecommendation,
  type SavedItem, type InsertSavedItem,
  type InsertFeedback,
} from "@shared/schema";

const client = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 1 });
export const db = drizzle(client);

export interface IStorage {
  createQuery(data: InsertQuery): Promise<Query>;
  getQuery(id: number): Promise<Query | undefined>;
  updateQueryStatus(id: number, status: string): Promise<void>;
  getQueryHistory(sessionId: string, limit?: number): Promise<Query[]>;

  createRecommendation(data: InsertRecommendation): Promise<Recommendation>;
  getRecommendation(queryId: number): Promise<Recommendation | undefined>;

  saveItem(data: InsertSavedItem): Promise<SavedItem>;
  getSavedItems(sessionId: string): Promise<SavedItem[]>;
  deleteSavedItem(id: number): Promise<void>;

  submitFeedback(data: InsertFeedback): Promise<void>;

  getPreferences(sessionId: string): Promise<UserPreferences | undefined>;
  upsertPreferences(sessionId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences>;

  getHistory(sessionId: string, limit?: number): Promise<Array<Query & { recommendation?: Recommendation }>>;
}

export const storage: IStorage = {
  async createQuery(data) {
    const [row] = await db.insert(queries).values({
      ...data,
      mood: JSON.stringify(data.mood ?? []),
      favoriteBrands: JSON.stringify(data.favoriteBrands ?? []),
      dislikedBrands: JSON.stringify(data.dislikedBrands ?? []),
      mustHaves: JSON.stringify(data.mustHaves ?? []),
      dealbreakers: JSON.stringify(data.dealbreakers ?? []),
    }).returning();
    return row;
  },

  async getQuery(id) {
    const [row] = await db.select().from(queries).where(eq(queries.id, id));
    return row;
  },

  async updateQueryStatus(id, status) {
    await db.update(queries).set({ status }).where(eq(queries.id, id));
  },

  async getQueryHistory(sessionId, limit = 20) {
    return db.select().from(queries)
      .where(eq(queries.sessionId, sessionId))
      .orderBy(desc(queries.id))
      .limit(limit);
  },

  async createRecommendation(data) {
    const [row] = await db.insert(recommendations).values({
      ...data,
      tradeoffs: JSON.stringify(data.tradeoffs ?? []),
      products: JSON.stringify(data.products ?? []),
    }).returning();
    return row;
  },

  async getRecommendation(queryId) {
    const [row] = await db.select().from(recommendations).where(eq(recommendations.queryId, queryId));
    return row;
  },

  async saveItem(data) {
    const [row] = await db.insert(savedItems).values(data).returning();
    return row;
  },

  async getSavedItems(sessionId) {
    return db.select().from(savedItems)
      .where(eq(savedItems.sessionId, sessionId))
      .orderBy(desc(savedItems.id));
  },

  async deleteSavedItem(id) {
    await db.delete(savedItems).where(eq(savedItems.id, id));
  },

  async submitFeedback(data) {
    await db.insert(feedback).values(data);
  },

  async getPreferences(sessionId) {
    const [row] = await db.select().from(userPreferences)
      .where(eq(userPreferences.userId, -1));
    return row;
  },

  async upsertPreferences(sessionId, prefs) {
    const [existing] = await db.select().from(userPreferences)
      .where(eq(userPreferences.userId, -1));

    if (existing) {
      const [row] = await db.update(userPreferences).set({
        categories: prefs.categories ?? existing.categories,
        budgetStyle: prefs.budgetStyle ?? existing.budgetStyle,
        favoriteBrands: prefs.favoriteBrands ?? existing.favoriteBrands,
        dislikedBrands: prefs.dislikedBrands ?? existing.dislikedBrands,
        moods: prefs.moods ?? existing.moods,
        occasions: prefs.occasions ?? existing.occasions,
        lifestyleTags: prefs.lifestyleTags ?? existing.lifestyleTags,
      }).where(eq(userPreferences.id, existing.id)).returning();
      return row;
    } else {
      const [row] = await db.insert(userPreferences).values({
        userId: -1,
        categories: JSON.stringify(prefs.categories ?? []),
        budgetStyle: prefs.budgetStyle ?? "balanced",
        favoriteBrands: JSON.stringify(prefs.favoriteBrands ?? []),
        dislikedBrands: JSON.stringify(prefs.dislikedBrands ?? []),
        moods: JSON.stringify(prefs.moods ?? []),
        occasions: JSON.stringify(prefs.occasions ?? []),
        lifestyleTags: JSON.stringify(prefs.lifestyleTags ?? []),
      }).returning();
      return row;
    }
  },

  async getHistory(sessionId, limit = 15) {
    const qs = await db.select().from(queries)
      .where(eq(queries.sessionId, sessionId))
      .orderBy(desc(queries.id))
      .limit(limit);

    return Promise.all(qs.map(async q => {
      const [rec] = await db.select().from(recommendations)
        .where(eq(recommendations.queryId, q.id));
      return { ...q, recommendation: rec };
    }));
  },
};
