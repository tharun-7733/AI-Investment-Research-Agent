"""
nodes/financials.py — Financial Analysis Node
Port of src/lib/nodes/financials.ts
"""

import json
import logging
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from state import AgentState
from utils.parse_json import safe_parse_llm_json
from tools.alpha_vantage import get_financial_data

logger = logging.getLogger(__name__)


def _empty_analysis() -> dict:
    return {
        "revenueGrowthYoY": None,
        "grossMargin": None,
        "netMargin": None,
        "debtToEquity": None,
        "peRatio": None,
        "marketCap": None,
        "financialHealthScore": 5,
        "financialHealthRationale": "Failed to fetch or parse financial data.",
        "valuationRisk": "medium",
        "valuationRationale": "Unknown due to error.",
        "estimated": True,
    }


def _to_str(val: object) -> object:
    """Return str(val) if not None, else None."""
    return str(val) if val is not None else None


async def financials_node(state: AgentState) -> dict:
    company_info = state.get("companyInfo") or {}

    if not company_info.get("name"):
        return {
            "streamLog": ["⊗ ABORT — No entity resolved for Financials."],
            "financialAnalysis": _empty_analysis(),
        }

    resolved_name = company_info["name"]
    ticker = company_info.get("ticker") or None
    sector = company_info.get("sector") or "their sector"

    try:
        # ── Step 1: Fetch Alpha Vantage data ────────────────────────────────────
        financial_data = await get_financial_data(ticker)

        # ── Step 2: Analyse with Groq ───────────────────────────────────────────
        llm = ChatGroq(
            model="openai/gpt-oss-120b",
            temperature=0.1,
            max_tokens=2048,
        )

        system_prompt = (
            "You are a CFA-level financial analyst.\n"
            "Return ONLY valid JSON, no markdown, no explanation."
        )
        user_prompt = (
            f"Analyze this financial data for {resolved_name}:\n"
            f"{json.dumps(financial_data, indent=2)}\n\n"
            f"Return this exact JSON:\n"
            f'{{\n'
            f'  "revenueGrowthYoY": number | null,\n'
            f'  "grossMargin": number | null,\n'
            f'  "netMargin": number | null,\n'
            f'  "debtToEquity": number | null,\n'
            f'  "peRatio": number | null,\n'
            f'  "marketCap": "string | null",\n'
            f'  "financialHealthScore": number,\n'
            f'  "financialHealthRationale": "string",\n'
            f'  "valuationRisk": "low" | "medium" | "high",\n'
            f'  "valuationRationale": "string",\n'
            f'  "estimated": true or false\n'
            f'}}\n\n'
            f"financialHealthScore must be 1-10.\n"
            f"For private companies with no data, estimate using industry benchmarks for {sector} and set estimated: true.\n"
            f"Score conservatively if data is unavailable."
        )

        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ])
        raw = response.content if isinstance(response.content, str) else str(response.content)
        parsed_result, error = safe_parse_llm_json(raw, "FinancialsNode")

        result = parsed_result or {}
        if error:
            logger.warning("[FinancialsNode] Using fallback analysis due to parse error.")

        health_score = result.get("financialHealthScore", 5)
        if not isinstance(health_score, (int, float)):
            health_score = 5

        analysis = {
            "revenueGrowthYoY": _to_str(result.get("revenueGrowthYoY")),
            "grossMargin": _to_str(result.get("grossMargin")),
            "netMargin": _to_str(result.get("netMargin")),
            "debtToEquity": result.get("debtToEquity"),
            "peRatio": result.get("peRatio"),
            "marketCap": _to_str(result.get("marketCap")),
            "financialHealthScore": health_score,
            "financialHealthRationale": result.get("financialHealthRationale") or "No data available to determine health.",
            "valuationRisk": result.get("valuationRisk") or "medium",
            "valuationRationale": result.get("valuationRationale") or "No data available to determine valuation.",
            "estimated": bool(result.get("estimated", False)),
        }

        return {
            "financialAnalysis": analysis,
            "streamLog": [f"◈ FINANCIALS PROCESSED. \n  Health score: {health_score}/10"],
        }

    except Exception as exc:
        error_message = str(exc)
        return {
            "streamLog": [f"⊗ FINANCIALS FAULT — {error_message}"],
            "financialAnalysis": _empty_analysis(),
        }
