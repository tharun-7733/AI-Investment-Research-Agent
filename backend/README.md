# Meridian — Python Backend

Standalone **FastAPI + LangGraph** service that runs the AI investment research pipeline. The Next.js frontend proxies all `/api/research` calls here.

## Architecture

```
POST /research  →  LangGraph 7-node pipeline  →  SSE stream
```

### Nodes (same as the original TypeScript graph)
| Order | Node | What it does |
|---|---|---|
| 1 | `identifier` | Resolves company name → ticker, sector, etc. |
| 2a | `webSearch` | Generates queries → Tavily search → sentiment |
| 2b | `financials` | Alpha Vantage OVERVIEW → CFA analysis *(parallel with 2a)* |
| 3 | `competitive` | Competitive moat & market position |
| 4 | `synthesisNode` | 5-dimension scoring with weighted total *(fan-in)* |
| 5 | `decision` | Investment verdict: INVEST / WATCH / PASS |
| 6 | `reporter` | Full markdown research brief |

## Local Development

```bash
# 1. Set up a virtual environment
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Create .env from the example
cp .env.example .env
# Then fill in your API keys in .env

# 4. Start the backend
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`.  
Visit `http://localhost:8000/docs` for the interactive Swagger UI.

Set in your Next.js `.env.local`:
```
PYTHON_BACKEND_URL=http://localhost:8000
```

Then run Next.js normally with `npm run dev`.

## Production Deployment (Railway)

1. Connect your GitHub repo to Railway.
2. Railway auto-detects `railway.toml` at the repo root and uses it.
3. Set these environment variables in the Railway dashboard:

| Variable | Value |
|---|---|
| `GROQ_API_KEY` | your Groq API key |
| `TAVILY_API_KEY` | your Tavily API key |
| `ALPHA_VANTAGE_API_KEY` | your Alpha Vantage key |
| `FRONTEND_URL` | `https://ai-investment-research-agent-mauve.vercel.app` |

4. After Railway gives you a deployment URL (e.g. `https://meridian-backend.railway.app`), add it to Vercel:

| Variable | Value |
|---|---|
| `PYTHON_BACKEND_URL` | `https://meridian-backend.railway.app` |

5. Redeploy on Vercel — done!

## API Reference

### `POST /research`

**Request**
```json
{ "company": "Apple" }
```

**Response** — `text/event-stream` SSE:
```
data: {"type": "log", "message": "◈ RESOLVED: Apple (AAPL)"}

data: {"type": "log", "message": "◈ WEB SIGNALS CAPTURED. ..."}

data: {"type": "result", "data": { ...full AgentState... }}

data: [DONE]
```

### `GET /health`
```json
{ "status": "ok" }
```
