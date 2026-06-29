# ScamShield AI

A multimodal AI-powered scam detection platform that analyzes text, URLs, and images to identify phishing, job scams, UPI fraud, lottery scams, and other threats — powered by Google Gemini.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Required env: `GEMINI_API_KEY` — Google Gemini API key for scam analysis

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Wouter routing, TanStack Query, shadcn/ui, Recharts
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- AI: Google Gemini 2.5 Flash (via `@google/genai`)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/db/src/schema/analyses.ts` — DB schema for analyses table
- `artifacts/api-server/src/routes/analyses/` — Text, URL, image analysis routes
- `artifacts/api-server/src/routes/stats/` — Dashboard stats routes
- `artifacts/api-server/src/lib/gemini.ts` — Gemini AI analysis logic
- `artifacts/scamshield/src/` — React frontend

## Architecture decisions

- Gemini 2.5 Flash is used for both text/URL analysis and multimodal image analysis
- AI returns structured JSON with riskScore (0-100), scamType, severity, redFlags, explanation, recommendations, attackerGoal
- Simple Mode toggle switches the AI prompt to plain-language "Explain-like-I'm-60" output
- Images are base64-encoded in the browser and sent as JSON (no file upload server needed)
- Stats endpoints compute aggregates directly in SQL for performance

## Product

- **Analyze page**: Paste text, enter URL, or upload image — AI analyzes and returns threat report
- **Result page**: Full threat breakdown with risk gauge, red flags, recommendations, attacker goal
- **History page**: Paginated list of all past scans with delete
- **Dashboard**: Stats cards, scam type bar chart, recent high-risk threats feed

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Gemini client requires `GEMINI_API_KEY` env var (not the Replit AI integration vars)
- Image analysis uses Gemini's multimodal `inlineData` — max ~8MB base64
- Array columns in Drizzle: use `.array()` method, not `array()` function

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
