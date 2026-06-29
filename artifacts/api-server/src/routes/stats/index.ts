import { Router, type IRouter } from "express";
import { desc, gte, sql } from "drizzle-orm";
import { db, analysesTable } from "@workspace/db";

const router: IRouter = Router();

// GET /stats/summary
router.get("/stats/summary", async (_req, res): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totals] = await db
    .select({
      totalAnalyses: sql<number>`count(*)::int`,
      highRiskCount: sql<number>`count(*) filter (where ${analysesTable.severity} in ('high', 'critical'))::int`,
      safeCount: sql<number>`count(*) filter (where ${analysesTable.riskScore} < 30)::int`,
      averageRiskScore: sql<number>`coalesce(avg(${analysesTable.riskScore}), 0)::float`,
    })
    .from(analysesTable);

  const [todayResult] = await db
    .select({
      scamsBlockedToday: sql<number>`count(*)::int`,
    })
    .from(analysesTable)
    .where(gte(analysesTable.createdAt, today));

  res.json({
    totalAnalyses: totals?.totalAnalyses ?? 0,
    highRiskCount: totals?.highRiskCount ?? 0,
    safeCount: totals?.safeCount ?? 0,
    averageRiskScore: Math.round((totals?.averageRiskScore ?? 0) * 10) / 10,
    scamsBlockedToday: todayResult?.scamsBlockedToday ?? 0,
  });
});

// GET /stats/recent
router.get("/stats/recent", async (_req, res): Promise<void> => {
  const recent = await db
    .select()
    .from(analysesTable)
    .where(sql`${analysesTable.riskScore} >= 60`)
    .orderBy(desc(analysesTable.createdAt))
    .limit(10);

  res.json(recent);
});

// GET /stats/breakdown
router.get("/stats/breakdown", async (_req, res): Promise<void> => {
  const breakdown = await db
    .select({
      scamType: analysesTable.scamType,
      count: sql<number>`count(*)::int`,
    })
    .from(analysesTable)
    .groupBy(analysesTable.scamType)
    .orderBy(desc(sql`count(*)`));

  res.json(breakdown);
});

export default router;
