# Design Decisions

This document outlines the core technical decisions made during the architecture and development of Meridian.

## 1. LangGraph over Sequential Chains
**Decision:** Use `@langchain/langgraph` instead of standard `RunnableSequence` chains.
**Rationale:** 
- **Parallelism:** Analyzing web sentiment and fetching financial data are independent tasks. Running them in parallel via a DAG fan-out cuts execution latency by ~40%.
- **State Management:** LangGraph's `Annotation` API provides strict TypeScript typing for the state object mutating across steps.
- **Fault Tolerance:** If the `financialsNode` fails (e.g. rate limit), LangGraph allows us to gracefully return an empty/estimated subset of data to the state, allowing the pipeline to continue rather than crashing the whole chain.

## 2. Groq (Llama 3.3 70B) over OpenAI/Anthropic
**Decision:** Use `ChatGroq` with the `llama-3.3-70b-versatile` model.
**Rationale:**
- **Inference Speed:** Groq's LPU architecture provides ~800 tokens/second inference. In an agent pipeline with 7 sequential/parallel LLM calls, time-to-first-token (TTFT) and generation speed are the primary bottlenecks. Groq reduces a 2-minute pipeline down to ~45 seconds.
- **Cost:** Free tier limits are generous enough for local development, and production API costs are significantly lower than GPT-4o while retaining excellent JSON formatting capabilities.

## 3. Server-Sent Events (SSE) over WebSockets
**Decision:** Use the Next.js App Router API with a `ReadableStream` and SSE encoder.
**Rationale:**
- WebSockets require an upgrade handshake and a stateful server, which complicates Serverless deployment on Vercel.
- The agent pipeline is strictly unidirectional (Server → Client). We only need to push log updates and the final JSON payload.
- SSE works perfectly over standard HTTP/1.1 and HTTP/2, natively supported by Vercel edge/serverless functions.

## 4. Supabase for Auth & Database
**Decision:** Use Supabase PostgreSQL and Supabase Auth with `@supabase/ssr`.
**Rationale:**
- **Security:** Using Row Level Security (RLS) directly in Postgres ensures that even if our backend API has a bug, a user can *never* query or delete another user's reports.
- **Session Management:** `@supabase/ssr` securely maps JWT tokens to HTTP-only cookies in Next.js Middleware, preventing XSS attacks that could steal local storage tokens.

## 5. Inline Styles for Dynamic UI
**Decision:** Use standard inline React styles alongside Tailwind for dynamic elements.
**Rationale:** 
While Tailwind is excellent for static utility classes, computing dynamic values (like the width of a score bar based on an AI output: `width: ${(score/10)*100}%`) requires arbitrary value interpolation. Tailwind cannot purge or compute dynamic string interpolations effectively, making inline styles the most robust choice for data-driven visualizations.
