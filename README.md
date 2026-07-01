# MERIDIAN — AI Investment Research Agent

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=for-the-badge&logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![LangGraph](https://img.shields.io/badge/LangGraph-1.4.7-orange?style=for-the-badge)
![Groq](https://img.shields.io/badge/Groq-Llama--3.3--70B-red?style=for-the-badge)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green?style=for-the-badge&logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)

**Seven specialized AI agents. One investment verdict. Under a minute.**

*Not financial advice. Just sharper questions.*

[Live Demo](#) · [Report a Bug](https://github.com/tharun-7733/AI-Investment-Research-Agent/issues) · [Request Feature](https://github.com/tharun-7733/AI-Investment-Research-Agent/issues)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Agent Workflow](#-agent-workflow)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [How to Run](#-how-to-run)
- [Example Outputs](#-example-outputs)
- [Challenges Faced](#-challenges-faced)
- [Design Decisions](#-design-decisions)
- [Future Improvements](#-future-improvements)
- [License](#-license)

---

## 🔭 Overview

**Meridian** is a full-stack AI investment research platform that deploys a network of seven specialized LangGraph agents to analyze any public or private company — and delivers a structured investment verdict in under 60 seconds.

Type a company name. The agent network fans out: one node resolves the entity, two run in parallel (web intelligence + financial extraction), the results converge into a competitive analysis and synthesis, and a final committee-style decision node issues an `INVEST`, `WATCH`, or `PASS` verdict with a confidence score.

Every analysis is streamed live to the UI, persisted to a Supabase database under your account, and surfaced in an interactive Intelligence Report with score breakdowns, moat analysis, and a full markdown brief.

**It works for public companies** (NVIDIA, Apple) using real Alpha Vantage financial data, **and private companies** (Zepto, SpaceX) using LLM-estimated industry benchmarks.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **7-Node Agent Pipeline** | A LangGraph DAG with fan-out parallelism: identifier → [webSearch ‖ financials] → competitive → synthesis → decision → reporter |
| ⚡ **Streaming Live Trace** | Every agent logs to a real-time terminal-style UI via Server-Sent Events (SSE) |
| 📊 **Weighted Scoring Model** | 5-dimension score: Growth (25%) + Moat (20%) + Financial Health (25%) + Sentiment (15%) + Valuation (15%) |
| 🔐 **JWT Authentication** | Supabase Auth with `@supabase/ssr` — session stored in HTTP-only cookies, guarded by Next.js middleware |
| 💾 **Report Persistence** | Every completed analysis auto-saved to Supabase Postgres with Row Level Security |
| 📚 **Intelligence Page** | Full history of all saved analyses per user — view, browse, delete |
| 👀 **Watchlist Page** | All analyzed companies at a glance — latest verdict, score bar, re-analyze in one click |
| 🌐 **Tavily Web Search** | Real-time web intelligence via Tavily API for news, sentiment, and key developments |
| 💹 **Alpha Vantage Integration** | Live financial data: market cap, P/E ratio, gross margin, debt/equity, 52-week range |
| 🎨 **Premium Dark UI** | Playfair Display serif headers, JetBrains Mono terminal, gold accent (#dac769), glassmorphism nav |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        MERIDIAN — System Architecture                    │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   Browser ──► Next.js App Router (React 19, TypeScript)                  │
│       │                                                                  │
│       │  POST /api/research (SSE stream)                                 │
│       ▼                                                                  │
│   API Route Handler                                                      │
│       │  Validates input, creates SSE encoder                            │
│       ▼                                                                  │
│   LangGraph StateGraph  ←── GraphState (LangGraph Annotation)            │
│       │                                                                  │
│   [identifier] ──────────────────────────► Groq (Llama-3.3-70B)         │
│       │                                                                  │
│       ├──────────────────┬───────────────────────────────────────────    │
│       ▼                  ▼                                               │
│   [webSearch]       [financials] ◄── Alpha Vantage API                  │
│   Tavily API         Groq LLM                                            │
│       │                  │                                               │
│       ▼                  │                                               │
│   [competitive]          │         Groq (Llama-3.3-70B)                 │
│       │                  │                                               │
│       └──────────────────┘                                               │
│                   │ Fan-in                                               │
│                   ▼                                                      │
│           [synthesisNode] ──────────────► Groq (Llama-3.3-70B)          │
│                   │  Weighted scoring (5 dimensions)                     │
│                   ▼                                                      │
│            [decision] ──────────────────► Groq (Llama-3.3-70B)          │
│                   │  INVEST | WATCH | PASS                               │
│                   ▼                                                      │
│            [reporter] ──────────────────► Groq (Llama-3.3-70B)          │
│                   │  Markdown brief                                      │
│                   ▼                                                      │
│           Stream result → Client → Auto-save to Supabase                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
User Input (company name)
      ↓
SSE API Route (/api/research)
      ↓
LangGraph Graph Execution (streaming)
      ↓ (log events streamed to client in real-time)
AgentTrace UI (live terminal)
      ↓ (on completion)
IntelligenceReport UI (full structured report)
      ↓ (auto-saved)
Supabase DB (reports table, RLS-protected)
      ↓
Intelligence Page / Watchlist Page
```

---

## 🤖 Agent Workflow

The pipeline is a **directed acyclic graph (DAG)** with one fan-out and one fan-in:

```
START
  │
  ▼
[1] IdentifierNode
    ├─ Resolves company name → full entity metadata
    ├─ Extracts: ticker, exchange, sector, industry, country, isPublic
    └─ Output: CompanyInfo

  ┌────────────────────┬──────────────────────┐
  ▼                    ▼                      │
[2] WebSearchNode   [3] FinancialsNode        │
    ├─ Generates         ├─ Fetches Alpha      │
    │  3 search queries  │  Vantage OVERVIEW   │
    ├─ Tavily API        ├─ Groq LLM analysis  │
    └─ Output:           └─ Output:            │
       WebAnalysis          FinancialAnalysis  │
           │                      │           │
           ▼                      │           │
[4] CompetitiveNode               │           │
    ├─ Uses WebAnalysis context   │           │
    ├─ Maps competitors, moat     │           │
    └─ Output: CompetitiveAnalysis│           │
           │                      │           │
           └──────────┬───────────┘           │
                      ▼                       │
             [5] SynthesisNode                │
                 ├─ Aggregates all 4 outputs  │
                 ├─ Scores 5 dimensions (1-10)│
                 ├─ Calculates weighted total │
                 └─ Output: DimensionScores + │
                            SynthesisRationales

                      │
                      ▼
             [6] DecisionNode
                 ├─ Thresholds: INVEST≥7.0, WATCH≥5.5, PASS<5.5
                 ├─ Generates: verdict, confidence, timeHorizon
                 ├─ Writes: headline, investThesis, watchFor[]
                 └─ comparableTo: "This company is like X because..."

                      │
                      ▼
             [7] ReporterNode
                 ├─ Compiles full markdown intelligence brief
                 └─ Output: report (Markdown)

                      │
                     END
```

### Scoring Model

| Dimension | Weight | Data Source |
|---|---|---|
| Growth | 25% | Web analysis, financial trends |
| Financial Health | 25% | Alpha Vantage + LLM analysis |
| Moat | 20% | Competitive node (LLM) |
| Sentiment | 15% | Tavily web search, news |
| Valuation | 15% | P/E ratio, market cap, risk |
| **Weighted Total** | — | Σ (score × weight) |

### Verdict Thresholds

| Verdict | Condition |
|---|---|
| `INVEST` | `weightedTotal ≥ 7.0` AND no critical red flags |
| `WATCH` | `weightedTotal ≥ 5.5 AND < 7.0` OR score ≥ 7 with red flags |
| `PASS` | `weightedTotal < 5.5` OR critical structural risks |

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.2.9 | App Router, SSE API routes, SSR |
| React | 19.2.4 | UI components |
| TypeScript | 5.x | Type safety across all nodes and state |
| Tailwind CSS | 4.x | Utility classes |
| react-markdown | 10.x | Renders the AI-generated report markdown |
| Recharts | 3.x | Score visualization charts |

### AI / Agent Layer
| Technology | Version | Purpose |
|---|---|---|
| LangGraph (`@langchain/langgraph`) | 1.4.7 | Multi-node agent DAG with fan-out/fan-in |
| LangChain Core | 1.2.1 | Base abstractions for LLM calls |
| `@langchain/groq` | 1.3.1 | Groq API client for Llama 3.3 70B |
| Groq / Llama-3.3-70B-Versatile | — | LLM backbone for all 7 nodes |

### External APIs
| API | Purpose |
|---|---|
| **Tavily** | Real-time web search and news intelligence |
| **Alpha Vantage** | Public company financial data (P/E, market cap, margins, D/E) |
| **Groq** | Ultra-fast LLM inference (Llama 3.3 70B) |

### Backend / Auth / Database
| Technology | Purpose |
|---|---|
| Supabase (`@supabase/supabase-js`) | PostgreSQL database + Auth |
| `@supabase/ssr` | Server-side Supabase client for Next.js cookies |
| Next.js Middleware | Route protection — redirects unauthenticated users to `/login` |
| Supabase Row Level Security (RLS) | Per-user data isolation at the database level |
| JWT (via Supabase Auth) | Session token stored in HTTP-only cookies |

---

## 📁 Project Structure

```
ai-investment-research-agent/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── research/
│   │   │       └── route.ts          # SSE streaming API endpoint
│   │   ├── intelligence/
│   │   │   └── page.tsx              # Saved reports history
│   │   ├── login/
│   │   │   └── page.tsx              # Auth page (sign in / sign up)
│   │   ├── portfolio/
│   │   │   └── page.tsx              # Watchlist page
│   │   ├── globals.css               # Design tokens, animations
│   │   ├── layout.tsx                # Root layout (metadata)
│   │   └── page.tsx                  # Home (mounts ResearchUI + Hero)
│   │
│   ├── components/
│   │   ├── AgentTrace.tsx            # Live streaming log + pipeline sidebar
│   │   ├── DimensionChart.tsx        # Radar/bar chart for dimension scores
│   │   ├── Hero.tsx                  # Landing page with search + feature grid
│   │   ├── IntelligenceReport.tsx    # Full structured report component
│   │   ├── Navbar.tsx                # Glassmorphism nav with auth state
│   │   ├── ResearchUI.tsx            # Main state machine (idle→analyzing→done)
│   │   ├── ResearchReport.tsx        # Compact report variant
│   │   ├── ScoreCards.tsx            # Individual dimension score cards
│   │   ├── ScoreChart.tsx            # Weighted total score display
│   │   ├── StrengthsRisks.tsx        # Key strengths and risks lists
│   │   └── VerdictCard.tsx           # INVEST/WATCH/PASS verdict display
│   │
│   ├── lib/
│   │   ├── graph.ts                  # LangGraph StateGraph definition + runner
│   │   ├── state.ts                  # LangGraph Annotation state schema
│   │   ├── types.ts                  # All TypeScript interfaces (AgentState etc.)
│   │   │
│   │   ├── nodes/
│   │   │   ├── identifier.ts         # [Node 1] Entity resolution
│   │   │   ├── webSearch.ts          # [Node 2] Tavily web intelligence
│   │   │   ├── financials.ts         # [Node 3] Alpha Vantage + LLM financials
│   │   │   ├── competitive.ts        # [Node 4] Competitive landscape analysis
│   │   │   ├── synthesis.ts          # [Node 5] 5-dimension weighted scoring
│   │   │   ├── decision.ts           # [Node 6] INVEST/WATCH/PASS verdict
│   │   │   └── reporter.ts           # [Node 7] Full markdown report generation
│   │   │
│   │   ├── tools/
│   │   │   ├── alphaVantage.ts       # Alpha Vantage OVERVIEW endpoint wrapper
│   │   │   └── tavilySearch.ts       # Tavily search wrapper
│   │   │
│   │   ├── supabase/
│   │   │   ├── client.ts             # Browser Supabase client factory
│   │   │   └── server.ts             # Server Supabase client factory (cookies)
│   │   │
│   │   └── utils/
│   │       └── parseJson.ts          # safeParseLlmJson — robust JSON extraction
│   │
│   └── middleware.ts                 # Next.js route guard → /intelligence, /portfolio, /settings
│
├── .env                              # Environment variables (never commit)
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 📦 Installation

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- Accounts and API keys for:
  - [Groq](https://console.groq.com) — free tier available
  - [Tavily](https://tavily.com) — free tier (1,000 searches/month)
  - [Alpha Vantage](https://www.alphavantage.co) — free tier (25 requests/day)
  - [Supabase](https://supabase.com) — free tier

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/tharun-7733/AI-Investment-Research-Agent.git
cd AI-Investment-Research-Agent

# 2. Install dependencies
# NOTE: --legacy-peer-deps is required due to peer dependency conflicts
# between @langchain/community and @browserbasehq/stagehand
npm install --legacy-peer-deps

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see section below)

# 4. Set up Supabase database
# Run the SQL schema in your Supabase SQL Editor (see supabase_schema.sql)
```

### Supabase Schema

Run this in the [Supabase SQL Editor](https://supabase.com/dashboard) → **New Query**:

```sql
-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name TEXT NOT NULL,
  ticker       TEXT,
  verdict      TEXT,
  weighted_score NUMERIC,
  headline     TEXT,
  report_data  JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see their own reports
CREATE POLICY "Users can view own reports"
  ON public.reports FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: users can only insert their own reports
CREATE POLICY "Users can insert own reports"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: users can only delete their own reports
CREATE POLICY "Users can delete own reports"
  ON public.reports FOR DELETE
  USING (auth.uid() = user_id);
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
# ── AI / LLM ─────────────────────────────────────────
# Groq API key — powers all 7 LangGraph nodes via Llama 3.3 70B
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx

# ── Web Search ────────────────────────────────────────
# Tavily API key — real-time web intelligence for the webSearch node
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxx

# ── Financial Data ────────────────────────────────────
# Alpha Vantage API key — OVERVIEW endpoint for public company financials
# Free tier: 25 requests/day
ALPHA_VANTAGE_KEY=xxxxxxxxxxxxxxxxxxxx

# ── Database & Auth ───────────────────────────────────
# Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase publishable (anon) key — safe to expose in browser
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxxxxxxxxx
```

> **⚠️ Never commit your `.env` file.** It is already in `.gitignore`.

| Variable | Required | Notes |
|---|---|---|
| `GROQ_API_KEY` | ✅ Yes | Without this, all LLM calls will fail |
| `TAVILY_API_KEY` | ✅ Yes | Without this, web search node returns empty |
| `ALPHA_VANTAGE_KEY` | ⚠️ Optional | Gracefully falls back to LLM estimation if missing |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ Yes | Required for auth and report persistence |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ✅ Yes | Required for auth and report persistence |

---

## 🚀 How to Run

```bash
# Development server (with hot reload)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
# Type-check without emitting
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build
npm run start
```

### First Run Checklist

- [ ] `.env` file populated with all required keys
- [ ] Supabase schema executed (reports table created)
- [ ] Dev server running on port 3000
- [ ] Navigate to `/login` to create your account
- [ ] Type any company name in the terminal search bar
- [ ] Watch the 7-node pipeline execute live
- [ ] View your report in **Intelligence** → saved automatically

---

## 📊 Example Outputs

### Terminal Log (live stream)

```
◈ MERIDIAN — Initializing research pipeline...
◈ RESOLVED: NVIDIA Corporation (NVDA)
◈ WEB SIGNALS CAPTURED.
  Sentiment: positive (8/10)
◈ FINANCIALS PROCESSED.
  Health score: 8/10
◈ COMPETITIVE MAPPED.
  Moat: IP (9/10)
◈ SCORE: 8.45/10
◈ VERDICT LOCKED — INVEST (Confidence: 91%)
   Headline: NVIDIA's AI infrastructure dominance makes it the defining long-term growth story in semiconductors.
◈ BRIEF COMPILED
```

### Verdict Output (JSON shape)

```json
{
  "verdict": "INVEST",
  "confidence": 91,
  "timeHorizon": "long-term (3yr+)",
  "headline": "NVIDIA's AI infrastructure dominance makes it the defining long-term growth story in semiconductors.",
  "investThesis": "NVIDIA holds a near-monopoly on GPU compute for AI training and inference...",
  "watchFor": [
    "AMD or Intel gaining meaningful AI datacenter market share",
    "US export controls expanding to block H100/H200 sales to key markets",
    "Hyperscaler capex cycles cooling significantly"
  ],
  "comparableTo": "This company is like Cisco in 1999 but with a real moat — dominant infrastructure play for the current technological wave.",
  "scores": {
    "growth": 9,
    "moat": 9,
    "financialHealth": 8,
    "sentiment": 8,
    "valuation": 6,
    "weightedTotal": 8.35
  }
}
```

---

## 🧠 Challenges Faced

### 1. LLM JSON Parsing Reliability
The most persistent challenge. Groq/Llama outputs would occasionally wrap JSON in markdown fences (` ```json `), add trailing commas, or truncate mid-object. The solution was a robust `safeParseLlmJson()` utility that strips fences, trims whitespace, attempts direct `JSON.parse`, and logs the raw string on failure for debugging.

### 2. LangGraph Fan-in Synchronization
The graph has two branches (`webSearch` and `financials`) that must both complete before `synthesisNode` runs. LangGraph handles this with its `StateGraph` edge model, but the state reducers needed careful configuration — using object spread reducers (`(curr, update) => ({ ...curr, ...update })`) so partial updates from each parallel branch merge correctly.

### 3. Private Company Financial Data
Alpha Vantage only has data for publicly listed tickers. For private companies (e.g. Zepto, OpenAI), the `financialsNode` detects a null ticker and instructs the LLM to estimate based on industry benchmarks — setting `estimated: true` in the output so the UI can display a caveat.

### 4. Streaming Architecture
Next.js 16 App Router API routes don't natively expose `res.write()`. Instead, the route uses a `ReadableStream` with a `TransformStream`-based SSE encoder. The LangGraph stream events (logs, result, done) are serialized as `data: {...}\n\n` and parsed on the client with a manual SSE reader loop over `response.body.getReader()`.

### 5. Supabase SSR with Next.js App Router
The `@supabase/ssr` package requires separate browser and server client factories. Using a single client for both caused session loss during SSR. The fix was creating `client.ts` (browser, uses `createBrowserClient`) and `server.ts` (uses `createServerClient` with Next.js `cookies()` adapter).

### 6. Dependency Conflicts
`@langchain/community@1.1.29` has a peer dependency conflict with `@browserbasehq/stagehand`. This requires `npm install --legacy-peer-deps` as a workaround.

---

## 🎯 Design Decisions

### Why LangGraph over a simple sequential chain?
The parallelism is the key value: `webSearch` and `financials` run simultaneously, cutting the end-to-end latency by ~40% compared to a sequential pipeline. LangGraph's typed `Annotation` state also enforces a clear contract between nodes — each node knows exactly what it receives and what it must return.

### Why Groq + Llama 3.3 70B?
Two reasons: speed and cost. Groq's LPU inference is significantly faster than OpenAI/Anthropic for a streaming use case, and Llama 3.3 70B is capable enough for structured JSON extraction tasks with `temperature: 0`. The original implementation used Google Gemini Flash 2.0, but Groq offered lower latency at equivalent quality.

### Why Server-Sent Events instead of WebSockets?
SSE is simpler to implement in Next.js App Router API routes (no upgrade handshake, works over HTTP/1.1), unidirectional (we only stream server→client), and automatically reconnects. WebSockets would be overkill for this use case.

### Why inline styles over Tailwind for components?
The UI uses `Tailwind` for utility classes but relies on inline styles for dynamic values (e.g. animated widths, conditional border colors). This avoids the need for `arbitrary value` classes (`w-[${pct}%]`) which don't purge correctly and can't be computed at runtime with CSS custom properties alone.

### Why Supabase over a custom backend?
Supabase provides Postgres + Auth + RLS in one managed service. The Row Level Security policies enforce data isolation at the database level — even if application code has a bug, a user cannot read another user's reports. This is the right security primitive for a multi-tenant application.

---

## 🔮 Future Improvements

| Priority | Feature | Description |
|---|---|---|
| 🔴 High | **Portfolio Tracking** | Track price movements of INVEST verdicts against actual market performance |
| 🔴 High | **Re-analysis Scheduling** | Auto re-analyze watchlist companies on a weekly schedule |
| 🟡 Medium | **Comparative Analysis** | Side-by-side report for two companies (e.g. NVIDIA vs AMD) |
| 🟡 Medium | **PDF Export** | Export full intelligence report as a formatted PDF |
| 🟡 Medium | **SEC Filings Integration** | Pull 10-K/10-Q data directly from EDGAR for deeper financial analysis |
| 🟢 Low | **Email Alerts** | Notify user when watchlist company has a significant sentiment shift |
| 🟢 Low | **Custom Scoring Weights** | Let users adjust the dimension weights based on their investment style |
| 🟢 Low | **Team Workspaces** | Shared report libraries for investment teams |
| 🟢 Low | **API Mode** | Expose the agent pipeline as a REST API for programmatic access |

<div align="center">

Built with precision by **[Tharun Tej](https://tharunportfolio.me)**

*Not financial advice. Just sharper questions.*

</div>
