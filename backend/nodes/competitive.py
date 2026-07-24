"""
nodes/competitive.py — Competitive Analysis Node
Port of src/lib/nodes/competitive.ts
"""

import logging
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from state import AgentState
from utils.parse_json import safe_parse_llm_json

logger = logging.getLogger(__name__)


def _empty_analysis() -> dict:
    return {
        "mainCompetitors": [],
        "marketPosition": "challenger",
        "moatType": "none",
        "moatStrength": 5,
        "moatRationale": "Unknown due to error.",
        "differentiators": [],
        "threats": [],
        "marketSizeTAM": None,
        "competitiveScore": 5,
    }


async def competitive_node(state: AgentState) -> dict:
    company_info = state.get("companyInfo") or {}

    if not company_info.get("name"):
        return {
            "streamLog": ["⊗ ABORT — No entity resolved for Competitive."],
            "competitiveAnalysis": _empty_analysis(),
        }

    resolved_name = company_info["name"]
    industry = company_info.get("industry") or "their sector"

    # competitive runs AFTER webSearch — webAnalysis is guaranteed to be present
    web_analysis = state.get("webAnalysis") or {}
    web_summary = web_analysis.get("sourceSummary") or "No web search summary available. Use general knowledge about the company."
    recent_events_list = web_analysis.get("recentEvents") or []
    recent_events = ", ".join(recent_events_list) if recent_events_list else "No recent events from search."

    try:
        model = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=2048,
        )

        system_prompt = (
            "You are a strategy consultant specializing in competitive analysis.\n"
            "Return ONLY valid JSON, no markdown."
        )
        user_prompt = (
            f"Analyze the competitive position of {resolved_name} in the {industry} industry.\n\n"
            f"Context from web research:\n{web_summary}\n"
            f"Recent events: {recent_events}\n\n"
            f"Return this exact JSON:\n"
            f'{{\n'
            f'  "mainCompetitors": ["string"],\n'
            f'  "marketPosition": "leader" | "challenger" | "niche" | "emerging",\n'
            f'  "moatType": "brand" | "network_effects" | "cost_advantage" | "switching_costs" | "IP" | "none",\n'
            f'  "moatStrength": number,\n'
            f'  "moatRationale": "string",\n'
            f'  "differentiators": ["string"],\n'
            f'  "threats": ["string"],\n'
            f'  "marketSizeTAM": "string | null",\n'
            f'  "competitiveScore": number\n'
            f'}}\n\n'
            f"moatStrength and competitiveScore must be 1-10.\n"
            f"Be specific. Use real competitor names.\n"
            f"Base moat score strictly on evidence from context."
        )

        response = await model.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ])
        raw = response.content if isinstance(response.content, str) else str(response.content)
        parsed_result, error = safe_parse_llm_json(raw, "CompetitiveNode")

        result = parsed_result or {}
        if error:
            logger.warning("[CompetitiveNode] Using fallback analysis due to parse error.")

        moat_strength = result.get("moatStrength", 5)
        if not isinstance(moat_strength, (int, float)):
            moat_strength = 5
        competitive_score = result.get("competitiveScore", 5)
        if not isinstance(competitive_score, (int, float)):
            competitive_score = 5

        analysis = {
            "mainCompetitors": result.get("mainCompetitors") if isinstance(result.get("mainCompetitors"), list) else [],
            "marketPosition": result.get("marketPosition") or "challenger",
            "moatType": result.get("moatType") or "none",
            "moatStrength": moat_strength,
            "moatRationale": result.get("moatRationale") or "No data available.",
            "differentiators": result.get("differentiators") if isinstance(result.get("differentiators"), list) else [],
            "threats": result.get("threats") if isinstance(result.get("threats"), list) else [],
            "marketSizeTAM": result.get("marketSizeTAM") or None,
            "competitiveScore": competitive_score,
        }

        return {
            "competitiveAnalysis": analysis,
            "streamLog": [f"◈ COMPETITIVE MAPPED. \n  Moat: {analysis['moatType']} ({analysis['moatStrength']}/10)"],
        }

    except Exception as exc:
        error_message = str(exc)
        return {
            "streamLog": [f"⊗ COMPETITIVE FAULT — {error_message}"],
            "competitiveAnalysis": _empty_analysis(),
        }
