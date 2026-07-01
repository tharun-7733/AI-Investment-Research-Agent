# Meridian — AI Investment Research Agent

![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)
![LangGraph](https://img.shields.io/badge/LangGraph-1.4.7-orange)
![Groq](https://img.shields.io/badge/Groq-Llama--3.3--70B-red)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-green?logo=supabase)
![License](https://img.shields.io/badge/License-MIT-yellow)

Meridian is a small research agent I built to answer one question quickly: "should I even be looking at this company?" You type in a name, seven LLM-driven agents go off and do their thing, and about a minute later you get back a structured verdict — INVEST, WATCH, or PASS — along with the reasoning behind it.

It's not investment advice, and it won't replace actually reading a 10-K. Think of it more as a first-pass filter that asks sharper questions than you'd get from a quick Google search.

[Live Demo](#) · [Report a Bug](https://github.com/tharun-7733/AI-Investment-Research-Agent/issues) · [Request a Feature](https://github.com/tharun-7733/AI-Investment-Research-Agent/issues)

---

## Table of Contents

- [What it does](#what-it-does)
- [Features](#features)
- [How it's built](#how-its-built)
- [The agent pipeline](#the-agent-pipeline)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting it running](#getting-it-running)
- [Environment variables](#environment-variables)
- [Running the app](#running-the-app)
- [What the output looks like](#what-the-output-looks-like)
- [Problems I ran into](#problems-i-ran-into)
- [Why I made these choices](#why-i-made-these-choices)
- [What's next](#whats-next)
- [License](#license)

---

## What it does

Meridian is a full-stack app that runs a company through a network of seven LangGraph agents and comes back with a structured investment verdict — usually in under a minute.

Here's roughly what happens under the hood: one node figures out who the company actually is, then two more run in parallel — one pulling in web intelligence, the other pulling financial data. Those results feed into a competitive analysis step, then a synthesis step, and finally a decision node that acts like a mini investment committee, weighing everything and handing back a verdict with a confidence score.

You can watch all of this happen live in the UI as it streams in, and once it's done, the report gets saved to your account in Supabase so you can come back to it later. Each report includes a score breakdown, a look at the company's competitive moat, and a full written brief.

It works for public companies like NVIDIA or Apple, where it pulls real numbers from Alpha Vantage, and it also works for private companies like Zepto or SpaceX — in those cases it leans on the LLM to estimate financials based on industry benchmarks, and flags them clearly as estimates.

---

## Features

| Feature | What it means |
|---|---|
| **7-node agent pipeline** | A LangGraph DAG that fans out and back in: identifier → [web search ‖ financials] → competitive → synthesis → decision → reporter |
| **Live streaming trace** | Watch each agent's progress in a terminal-style UI, pushed over Server-Sent Events |
| **Weighted scoring** | Five dimensions — growth (25%), moat (20%), financial health (25%), sentiment (15%), valuation (15%) |
| **Auth via Supabase** | JWT sessions in HTTP-only cookies, with Next.js middleware guarding protected routes |
| **Reports get saved** | Every finished analysis is written to Postgres with Row Level Security so it's tied to your account |
| **Intelligence page** | Browse, revisit, or delete past analyses |
| **Watchlist** | See all the companies you've looked at, with the latest verdict and a one-click re-analyze |
| **Web search via Tavily** | Pulls recent news and sentiment context |
| **Financials via Alpha Vantage** | Market cap, P/E, gross margin, debt/equity, 52-week range |
| **Dark UI** | Playfair Display for headers, JetBrains Mono for the terminal feel, a gold accent, glassmorphism nav |

---

## How it's built

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

### Data flow, in short

```
User types a company name
      ↓
SSE API route (/api/research)
      ↓
LangGraph runs the graph, streaming as it goes
      ↓
Live log events show up in the terminal UI
      ↓
Once finished, the full report renders
      ↓
Report auto-saves to Supabase (RLS-protected)
      ↓
Shows up on the Intelligence page and Watchlist
```

---

## The agent pipeline

The whole thing is a directed acyclic graph — one fan-out, one fan-in:

```
START
  │
  ▼
[1] IdentifierNode
    ├─ Resolves the company name into full entity metadata
    ├─ Pulls out: ticker, exchange, sector, industry, country, isPublic
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
    ├─ Uses the WebAnalysis context           │
    ├─ Maps out competitors and moat          │
    └─ Output: CompetitiveAnalysis│           │
           │                      │           │
           └──────────┬───────────┘           │
                      ▼                       │
             [5] SynthesisNode                │
                 ├─ Pulls together all 4 prior outputs
                 ├─ Scores 5 dimensions (1–10)
                 ├─ Calculates the weighted total
                 └─ Output: DimensionScores + SynthesisRationales

                      │
                      ▼
             [6] DecisionNode
                 ├─ Thresholds: INVEST ≥ 7.0, WATCH ≥ 5.5, PASS < 5.5
                 ├─ Generates: verdict, confidence, timeHorizon
                 ├─ Writes: headline, investThesis, watchFor[]
                 └─ comparableTo: "This company is like X because..."

                      │
                      ▼
             [7] ReporterNode
                 ├─ Writes up the full markdown brief
                 └─ Output: report (Markdown)

                      │
                     END
```

### How the scoring works

| Dimension | Weight | Where it comes from |
|---|---|---|
| Growth | 25% | Web analysis, financial trends |
| Financial Health | 25% | Alpha Vantage data + LLM analysis |
| Moat | 20% | Competitive node (LLM judgment) |
| Sentiment | 15% | Tavily web search, recent news |
| Valuation | 15% | P/E ratio, market cap, risk factors |
| **Weighted Total** | — | Sum of (score × weight) |

### How the verdict gets decided

| Verdict | Condition |
|---|---|
| `INVEST` | Weighted total ≥ 7.0, and no critical red flags |
| `WATCH` | Weighted total between 5.5 and 7.0, or ≥ 7 but with red flags |
| `PASS` | Weighted total under 5.5, or serious structural risks |

---

## Tech stack

### Frontend
| Technology | Version | Used for |
|---|---|---|
| Next.js | 16.2.9 | App Router, SSE API routes, SSR |
| React | 19.2.4 | UI components |
| TypeScript | 5.x | Type safety throughout |
| Tailwind CSS | 4.x | Utility classes |
| react-markdown | 10.x | Renders the AI-generated report |
| Recharts | 3.x | Score visualization |

### AI / agent layer
| Technology | Version | Used for |
|---|---|---|
| LangGraph (`@langchain/langgraph`) | 1.4.7 | The multi-node agent DAG, fan-out/fan-in |
| LangChain Core | 1.2.1 | Base LLM abstractions |
| `@langchain/groq` | 1.3.1 | Groq client for Llama 3.3 70B |
| Groq / Llama-3.3-70B-Versatile | — | The LLM behind all 7 nodes |

### External APIs
| API | Purpose |
|---|---|
| **Tavily** | Real-time web search and news |
| **Alpha Vantage** | Public company financials (P/E, market cap, margins, D/E) |
| **Groq** | Fast LLM inference |

### Backend / auth / database
| Technology | Purpose |
|---|---|
| Supabase (`@supabase/supabase-js`) | Postgres database + auth |
| `@supabase/ssr` | Server-side Supabase client for Next.js |
| Next.js Middleware | Redirects unauthenticated users to `/login` |
| Supabase RLS | Keeps each user's data isolated at the DB level |
| JWT (via Supabase Auth) | Session token in HTTP-only cookies |

---

## Project structure

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

## Getting it running

### You'll need

- Node.js ≥ 18
- npm ≥ 9
- API keys from:
  - [Groq](https://console.groq.com) — free tier available
  - [Tavily](https://tavily.com) — free tier gives you 1,000 searches/month
  - [Alpha Vantage](https://www.alphavantage.co) — free tier gives you 25 requests/day
  - [Supabase](https://supabase.com) — free tier

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/tharun-7733/AI-Investment-Research-Agent.git
cd AI-Investment-Research-Agent

# 2. Install dependencies
# You'll need --legacy-peer-deps here — @langchain/community and
# @browserbasehq/stagehand have a peer dependency conflict
npm install --legacy-peer-deps

# 3. Set up your environment variables
cp .env.example .env
# then fill in your keys (see below)

# 4. Set up the Supabase database
# Run the SQL schema below in your Supabase SQL Editor
```

### Supabase schema

Paste this into the [Supabase SQL Editor](https://supabase.com/dashboard) under New Query:

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

## Environment variables

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

> Don't commit your `.env` file — it's already in `.gitignore`, but worth double-checking.

| Variable | Required? | Notes |
|---|---|---|
| `GROQ_API_KEY` | Yes | Without it, every LLM call fails |
| `TAVILY_API_KEY` | Yes | Without it, the web search node comes back empty |
| `ALPHA_VANTAGE_KEY` | Optional | Falls back to LLM estimation if it's missing |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Needed for auth and saving reports |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Needed for auth and saving reports |

---

## Running the app

```bash
# Development server (with hot reload)
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

```bash
# Type-check without emitting
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build
npm run start
```

### First run checklist

- [ ] `.env` filled out with all required keys
- [ ] Supabase schema run (reports table exists)
- [ ] Dev server running on port 3000
- [ ] Head to `/login` and create an account
- [ ] Type a company name into the terminal search bar
- [ ] Watch the 7-node pipeline run live
- [ ] Check the **Intelligence** page — your report should already be saved

---

## What the output looks like

### The live terminal log

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

### The verdict, as JSON

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

## Problems I ran into

**Getting the LLM to output clean JSON, reliably.** This was probably the most annoying part. Groq/Llama would sometimes wrap its JSON in markdown fences, throw in a trailing comma, or just cut off mid-object. I ended up writing a `safeParseLlmJson()` helper that strips the fences, trims whitespace, tries a direct `JSON.parse`, and logs the raw string when it still fails so I can see what went wrong.

**Making sure the parallel branches actually finish before merging.** The `webSearch` and `financials` nodes run in parallel, and both need to finish before `synthesisNode` can run. LangGraph's `StateGraph` handles the sequencing, but I had to be careful with how the state reducers were set up — using an object-spread reducer (`(curr, update) => ({ ...curr, ...update })`) so partial updates from each branch merge correctly instead of overwriting each other.

**Private companies don't have public financials.** Alpha Vantage only covers listed tickers, so for private companies like Zepto or OpenAI, the `financialsNode` checks for a null ticker and asks the LLM to estimate based on industry benchmarks instead — and flags the output with `estimated: true` so the UI can show a caveat.

**Streaming in the Next.js App Router.** API routes in Next.js 16 don't give you a plain `res.write()`. Instead I used a `ReadableStream` with a `TransformStream`-based SSE encoder, serialized the LangGraph events as `data: {...}\n\n`, and read them back on the client with a manual loop over `response.body.getReader()`.

**Supabase SSR and session handling.** `@supabase/ssr` wants separate client factories for browser and server — trying to use one client for both caused sessions to get lost during SSR. Fixed by splitting into `client.ts` (uses `createBrowserClient`) and `server.ts` (uses `createServerClient` with Next.js's `cookies()` adapter).

**A dependency conflict that won't go away.** `@langchain/community@1.1.29` conflicts with `@browserbasehq/stagehand` on a peer dependency, so `npm install --legacy-peer-deps` is required for now.

---

## Why I made these choices

**LangGraph instead of a simple sequential chain.** The parallelism is really the whole point — `webSearch` and `financials` run at the same time, which cuts total latency by roughly 40% compared to running them one after another. LangGraph's typed `Annotation` state also forces a clear contract between nodes, so each one knows exactly what it's getting and what it needs to hand off.

**Groq + Llama 3.3 70B.** Mostly speed and cost. Groq's inference is noticeably faster than OpenAI or Anthropic for a streaming use case like this, and Llama 3.3 70B is good enough at structured JSON extraction when you run it at `temperature: 0`. I actually started with Gemini Flash 2.0, but switched once Groq turned out to be faster at a similar quality level.

**Server-Sent Events over WebSockets.** SSE is just simpler here — no upgrade handshake, works fine over HTTP/1.1, reconnects on its own, and I only ever need to stream server → client anyway. WebSockets would've been more machinery than the problem needed.

**Inline styles alongside Tailwind.** Tailwind handles the utility classes, but for dynamic values — animated widths, conditional border colors — I use inline styles instead. Arbitrary-value classes like `w-[${pct}%]` don't purge properly and can't be computed at runtime from CSS custom properties alone.

**Supabase instead of a custom backend.** It bundles Postgres, auth, and RLS into one managed service, and Row Level Security enforces data isolation at the database level — so even if there's a bug in the app code, one user still can't read another user's reports. For a multi-tenant app, that felt like the right place to put that guarantee.

---

## What's next

| Priority | Feature | What it'd do |
|---|---|---|
| High | Portfolio tracking | Track how INVEST verdicts actually perform against the market over time |
| High | Scheduled re-analysis | Auto re-run watchlist companies on a weekly cadence |
| Medium | Side-by-side comparisons | Compare two companies directly (e.g. NVIDIA vs AMD) |
| Medium | PDF export | Export a full report as a formatted PDF |
| Medium | SEC filings integration | Pull 10-K/10-Q data from EDGAR for deeper financial analysis |
| Low | Email alerts | Notify when a watchlist company has a significant sentiment shift |
| Low | Custom scoring weights | Let users tune the dimension weights to match their own investment style |
| Low | Team workspaces | Shared report libraries for investment teams |
| Low | API mode | Expose the pipeline as a REST API for programmatic use |

---

Built by **[Tharun Tej](https://tharunportfolio.me)**

*Not financial advice. Just sharper questions.*
