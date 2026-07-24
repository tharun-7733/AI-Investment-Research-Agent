"""
main.py — FastAPI application entry point
Exposes POST /research that runs the LangGraph investment agent
and streams SSE events back to the Next.js proxy (or directly to the browser).
"""

import json
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

# Load .env for local development (no-op in production where env vars are injected)
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import graph here so LangGraph compiles on startup, not on first request.
    from graph import investment_graph  # noqa: F401
    logger.info("Investment graph compiled and ready.")
    yield


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Meridian AI Backend",
    description="LangGraph investment research agent — Python backend",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Allows Next.js (localhost:3000 or Vercel) to call this backend directly.
# In production the Next.js proxy is the only caller, so CORS is mainly for dev.
_frontend_url = os.environ.get("FRONTEND_URL", "")
_allowed_origins = [
    "http://localhost:3000",
    "https://ai-investment-research-agent-mauve.vercel.app",
]
if _frontend_url and _frontend_url not in _allowed_origins:
    _allowed_origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ─── Schema ───────────────────────────────────────────────────────────────────

class ResearchRequest(BaseModel):
    company: str

    @field_validator("company")
    @classmethod
    def company_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("company name must not be empty")
        return v


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok"}


# ─── Research endpoint ────────────────────────────────────────────────────────

@app.post("/research")
async def research(body: ResearchRequest):
    """
    Runs the 7-node LangGraph investment pipeline and streams SSE events.

    SSE event shapes (mirrors the TypeScript route exactly):
      data: {"type": "log",    "message": "◈ RESOLVED: Apple (AAPL)"}
      data: {"type": "result", "data": { ...full AgentState... }}
      data: {"type": "error",  "message": "Something went wrong"}
      data: [DONE]
    """
    from graph import investment_graph

    company = body.company

    async def generate():
        prev_log_count = 0
        final_state: dict = {}

        try:
            async for state in investment_graph.astream(
                {"companyInput": company, "streamLog": []},
                stream_mode="values",
            ):
                final_state = state

                # Emit any new log lines since last state emission
                current_logs: list[str] = state.get("streamLog") or []
                new_logs = current_logs[prev_log_count:]
                for log in new_logs:
                    yield f"data: {json.dumps({'type': 'log', 'message': log})}\n\n"
                prev_log_count = len(current_logs)

            # Emit the full final state as the result
            yield f"data: {json.dumps({'type': 'result', 'data': final_state})}\n\n"

        except Exception as exc:
            logger.exception("[/research] Pipeline error for company=%s", company)
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

        finally:
            yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",   # prevents nginx/proxy buffering
        },
    )
