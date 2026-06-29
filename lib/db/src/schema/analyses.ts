import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const analysesTable = pgTable("analyses", {
  id: serial("id").primaryKey(),
  inputType: text("input_type").notNull(), // "text" | "url" | "image"
  inputContent: text("input_content").notNull(),
  riskScore: integer("risk_score").notNull(),
  scamType: text("scam_type").notNull(),
  severity: text("severity").notNull(), // "low" | "medium" | "high" | "critical"
  redFlags: text("red_flags").array().notNull().default([]),
  explanation: text("explanation").notNull(),
  recommendations: text("recommendations").array().notNull().default([]),
  attackerGoal: text("attacker_goal").notNull(),
  simpleMode: boolean("simple_mode").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnalysisSchema = createInsertSchema(analysesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analysesTable.$inferSelect;
