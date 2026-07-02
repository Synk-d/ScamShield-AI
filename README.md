# ScamShield AI

A multimodal AI-powered scam detection platform. Paste a suspicious message, enter a URL, upload a screenshot, or scan a QR code with your camera — Gemini AI analyzes it and returns a full threat report with a risk score, red flags, attacker goal, and recommendations.

![ScamShield Dashboard](https://i.imgur.com/placeholder.png)

## Features

- **Text analysis** — paste emails, SMS, or any suspicious message
- **URL scanning** — check links before you click them
- **Image analysis** — upload screenshots of suspicious content
- **QR code scanner** — use your device camera to scan and analyze QR codes
- **Simple Mode** — plain-language explanations for non-technical users
- **Scan history** — review all past analyses
- **Dashboard** — stats, threat breakdown chart, and recent high-risk alerts

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite, Wouter, TanStack Query, shadcn/ui, Recharts |
| Backend | Express 5, Node.js 24 |
| Database | PostgreSQL + Drizzle ORM |
| AI | Google Gemini 2.5 Flash |
| Language | TypeScript (monorepo via pnpm workspaces) |

---

## Local Setup

### Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | [nodejs.org](https://nodejs.org) |
| pnpm | latest | `npm install -g pnpm` |
| PostgreSQL | 14+ | [postgresql.org](https://www.postgresql.org/download/) or use [Neon](https://neon.tech) (free hosted) |
| Gemini API key | — | [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

### 1. Clone the repository

```bash
git clone https://github.com/your-username/scamshield-ai.git
cd scamshield-ai
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string
DATABASE_URL=postgresql://youruser:yourpassword@localhost:5432/scamshield

# Google Gemini API key (get one free at https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# Any random string used to sign sessions
SESSION_SECRET=your_random_secret_here
```

> **Tip:** If you don't want to install PostgreSQL locally, create a free database at [neon.tech](https://neon.tech) and paste the connection string they provide.

### 4. Push the database schema

```bash
pnpm --filter @workspace/db run push
```

This creates all the required tables in your database.

### 5. (Optional) Seed demo data

```bash
pnpm --filter @workspace/db run seed
```

Adds 5 sample scans so the dashboard and history aren't empty on first launch.

### 6. Start the servers

Open **two terminal windows**:

**Terminal 1 — API server** (runs on port 5000):
```bash
PORT=5000 pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend** (runs on port 3000):
```bash
PORT=3000 BASE_URL=/ pnpm --filter @workspace/scamshield run dev
```

### 7. Open the app

```
http://localhost:3000
```

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/          # Express API backend
│   │   └── src/
│   │       ├── routes/
│   │       │   ├── analyses/    # Text, URL, image analysis endpoints
│   │       │   └── stats/       # Dashboard stats endpoints
│   │       └── lib/
│   │           └── gemini.ts    # Gemini AI client & prompt logic
│   └── scamshield/          # React + Vite frontend
│       └── src/
│           ├── pages/           # Home, Result, History, Dashboard
│           └── components/      # UI components (gauge, qr-scanner, layout)
├── lib/
│   ├── api-spec/            # OpenAPI spec (source of truth for the API contract)
│   ├── api-client-react/    # Auto-generated TanStack Query hooks
│   ├── api-zod/             # Auto-generated Zod validation schemas
│   └── db/                  # Drizzle ORM schema & migrations
└── pnpm-workspace.yaml
```

---

## Available Scripts

| Command | Description |
|---|---|
| `pnpm --filter @workspace/api-server run dev` | Start API server in dev mode |
| `pnpm --filter @workspace/scamshield run dev` | Start frontend in dev mode |
| `pnpm --filter @workspace/db run push` | Push schema to database |
| `pnpm --filter @workspace/api-spec run codegen` | Regenerate API hooks from OpenAPI spec |
| `pnpm run typecheck` | Full TypeScript check across all packages |

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `SESSION_SECRET` | Yes | Secret string for session signing |

---

## License

MIT
