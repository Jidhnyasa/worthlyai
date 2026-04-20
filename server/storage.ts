import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { eq, desc } from "drizzle-orm";
import {
  queries, recommendations, savedItems, feedback, userPreferences,
  type Query, type InsertQuery,
  type Recommendation, type InsertRecommendation,
  type SavedItem, type InsertSavedItem,
  type InsertFeedback,
  type UserPreferences,
  type RecommendationResult,
} from "@shared/schema";

const client = postgres(process.env.DATABASE_URL!, { ssl: "require", max: 1 });
export const db = drizzle(client);

export interface IStorage {
  createQuery(data: {
    sessionId?: string;
    userId?: string;
    rawQuery: string;
    category?: string;
    budgetMin?: number;
    budgetMax?: number;
    mood?: string;
    occasion?: string;
    queryType?: string;
  }): Promise<Query>;

  updateQueryStatus(id: string, status: string): Promise<void>;

  createRecommendation(data: {
    queryId: string;
    userId?: string;
    result: RecommendationResult;
  }): Promise<Recommendation>;

  getRecommendation(queryId: string): Promise<Recommendation | undefined>;

  saveItem(data: { userId: string; recommendationId?: string; notes?: string }): Promise<SavedItem>;
  getSavedItems(userId: string): Promise<SavedItem[]>;
  deleteSavedItem(id: string): Promise<void>;

  submitFeedback(data: {
    userId?: string;
    queryId?: string;
    recommendationId?: string;
    helpful?: boolean;
    outcome?: string;
    notes?: string;
  }): Promise<void>;

  getPreferences(userId: string): Promise<UserPreferences | undefined>;
  upsertPreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences>;

  getHistory(sessionId: string, limit?: number): Promise<Array<Query & { recommendation?: Recommendation }>>;
}

export const storage: IStorage = {
  async createQuery(data) {
    const [row] = await db.insert(queries).values({
      sessionId:  data.sessionId,
      userId:     data.userId ?? null,
      rawQuery:   data.rawQuery,
      category:   data.category,
      budgetMin:  data.budgetMin?.toString(),
      budgetMax:  data.budgetMax?.toString(),
      mood:       data.mood,
      occasion:   data.occasion,
      queryType:  data.queryType ?? "recommendation",
    }).returning();
    return row;
  },

  // queries table has no status column — kept for API compatibility
  async updateQueryStatus(_id, _status) {},

  async createRecommendation({ queryId, userId, result }) {
    const top = result.topChoice;
    const [row] = await db.insert(recommendations).values({
      queryId,
      userId:          userId ?? null,
      resultJson:      result as any,
      buyWaitSkip:     result.verdict,
      confidenceScore: result.confidenceScore?.toString(),
      fitScore:        top?.scores?.fitScore?.toString(),
      valueScore:      top?.scores?.valueScore?.toString(),
      regretScore:     top?.scores?.regretScore?.toString(),
      explanation:     result.explanation,
    }).returning();
    return row;
  },

  async getRecommendation(queryId) {
    const [row] = await db.select().from(recommendations)
      .where(eq(recommendations.queryId, queryId));
    return row;
  },

  async saveItem(data) {
    const [row] = await db.insert(savedItems).values({
      userId:           data.userId,
      recommendationId: data.recommendationId ?? null,
      notes:            data.notes,
    }).returning();
    return row;
  },

  async getSavedItems(userId) {
    return db.select().from(savedItems)
      .where(eq(savedItems.userId, userId))
      .orderBy(desc(savedItems.createdAt));
  },

  async deleteSavedItem(id) {
    await db.delete(savedItems).where(eq(savedItems.id, id));
  },

  async submitFeedback(data) {
    await db.insert(feedback).values({
      userId:           data.userId ?? null,
      queryId:          data.queryId ?? null,
      recommendationId: data.recommendationId ?? null,
      helpful:          data.helpful,
      outcome:          data.outcome,
      notes:            data.notes,
    });
  },

  async getPreferences(userId) {
    const [row] = await db.select().from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return row;
  },

  async upsertPreferences(userId, prefs) {
    const [existing] = await db.select().from(userPreferences)
      .where(eq(userPreferences.userId, userId));

    if (existing) {
      const [row] = await db.update(userPreferences).set({
        ...prefs,
        updatedAt: new Date(),
      }).where(eq(userPreferences.userId, userId)).returning();
      return row;
    }

    const [row] = await db.insert(userPreferences).values({
      userId,
      ...prefs,
    }).returning();
    return row;
  },

  async getHistory(sessionId, limit = 15) {
    const qs = await db.select().from(queries)
      .where(eq(queries.sessionId, sessionId))
      .orderBy(desc(queries.createdAt))
      .limit(limit);

    return Promise.all(qs.map(async q => {
      const [rec] = await db.select().from(recommendations)
        .where(eq(recommendations.queryId, q.id));
      return { ...q, recommendation: rec };
    }));
  },
};
