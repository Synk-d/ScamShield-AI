import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, analysesTable } from "@workspace/db";
import {
  AnalyzeTextBody,
  AnalyzeUrlBody,
  AnalyzeImageBody,
  GetAnalysisParams,
  DeleteAnalysisParams,
  ListAnalysesQueryParams,
} from "@workspace/api-zod";
import { analyzeContent, analyzeImage } from "../../lib/gemini";

const router: IRouter = Router();

// POST /analyses/text
router.post("/analyses/text", async (req, res): Promise<void> => {
  const parsed = AnalyzeTextBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { content, simpleMode = false } = parsed.data;

  const result = await analyzeContent("text", content, simpleMode);

  const [analysis] = await db
    .insert(analysesTable)
    .values({
      inputType: "text",
      inputContent: content,
      riskScore: result.riskScore,
      scamType: result.scamType,
      severity: result.severity,
      redFlags: result.redFlags,
      explanation: result.explanation,
      recommendations: result.recommendations,
      attackerGoal: result.attackerGoal,
      simpleMode,
    })
    .returning();

  res.json(analysis);
});

// POST /analyses/url
router.post("/analyses/url", async (req, res): Promise<void> => {
  const parsed = AnalyzeUrlBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { url, simpleMode = false } = parsed.data;

  const result = await analyzeContent("url", url, simpleMode);

  const [analysis] = await db
    .insert(analysesTable)
    .values({
      inputType: "url",
      inputContent: url,
      riskScore: result.riskScore,
      scamType: result.scamType,
      severity: result.severity,
      redFlags: result.redFlags,
      explanation: result.explanation,
      recommendations: result.recommendations,
      attackerGoal: result.attackerGoal,
      simpleMode,
    })
    .returning();

  res.json(analysis);
});

// POST /analyses/image
router.post("/analyses/image", async (req, res): Promise<void> => {
  const parsed = AnalyzeImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { imageBase64, mimeType, simpleMode = false } = parsed.data;

  const result = await analyzeImage(imageBase64, mimeType, simpleMode);

  const [analysis] = await db
    .insert(analysesTable)
    .values({
      inputType: "image",
      inputContent: "[Image uploaded]",
      riskScore: result.riskScore,
      scamType: result.scamType,
      severity: result.severity,
      redFlags: result.redFlags,
      explanation: result.explanation,
      recommendations: result.recommendations,
      attackerGoal: result.attackerGoal,
      simpleMode,
    })
    .returning();

  res.json(analysis);
});

// GET /analyses
router.get("/analyses", async (req, res): Promise<void> => {
  const params = ListAnalysesQueryParams.safeParse(req.query);
  const limit = params.success ? (params.data.limit ?? 20) : 20;
  const offset = params.success ? (params.data.offset ?? 0) : 0;

  const analyses = await db
    .select()
    .from(analysesTable)
    .orderBy(desc(analysesTable.createdAt))
    .limit(limit)
    .offset(offset);

  res.json(analyses);
});

// GET /analyses/:id
router.get("/analyses/:id", async (req, res): Promise<void> => {
  const params = GetAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [analysis] = await db
    .select()
    .from(analysesTable)
    .where(eq(analysesTable.id, params.data.id));

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.json(analysis);
});

// DELETE /analyses/:id
router.delete("/analyses/:id", async (req, res): Promise<void> => {
  const params = DeleteAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [analysis] = await db
    .delete(analysesTable)
    .where(eq(analysesTable.id, params.data.id))
    .returning();

  if (!analysis) {
    res.status(404).json({ error: "Analysis not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
