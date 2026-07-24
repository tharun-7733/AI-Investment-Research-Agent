"""
nodes/synthesis.py — Investment Synthesis & Scoring Node
Port of src/lib/nodes/synthesis.ts
"""

import logging
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from state import AgentState
from utils.parse_json import safe_parse_llm_json

logger = logging.getLogger(__name__)


def _empty_scores() -> dict:
    return {
        "growth": 5,
        "moat": 5,
        "financialHealth": 5,
        "sentiment": 5,
        "valuation": 5,
        "weightedTotal": 5.0,
    }


def _empty_synthesis() -> dict:
    return {
        "growthRationale": "Failed to evaluate",
        "moatRationale": "Failed to evaluate",
        "financialHealthRationale": "Failed to evaluate",
        "sentimentRationale": "Failed to evaluate",
        "valuationRationale": "Failed to evaluate",
        "keyStrengths": [],
        "keyRisks": [],
    }


def _safe_num(val: object, default: float = 5.0) -> float:
    return float(val) if isinstance(val, (int, float)) else default


async def synthesis_node(state: AgentState) -> dict:
    company_info = state.get("companyInfo") or {}

    if not company_info.get("name"):
        return {
            "streamLog": ["⊗ ABORT — No entity resolved for Synthesis."],
            "scores": _empty_scores(),
            "synthesis": _empty_synthesis(),
        }

    resolved_name = company_info["name"]

    web_analysis = state.get("webAnalysis") or {}
    financial_analysis = state.get("financialAnalysis") or {}
    competitive_analysis = state.get("competitiveAnalysis") or {}

    web_sentiment_score = _safe_num(web_analysis.get("sentimentScore"), 5)
    financial_health_score = _safe_num(financial_analysis.get("financialHealthScore"), 5)
    competitive_score = _safe_num(competitive_analysis.get("competitiveScore"), 5)
    red_flags = ", ".join(web_analysis.get("redFlags") or []) or "None found"
    moat_type = competitive_analysis.get("moatType") or "none"
    moat_strength = _safe_num(competitive_analysis.get("moatStrength"), 5)
    valuation_risk = financial_analysis.get("valuationRisk") or "unknown"
    key_developments = ", ".join(web_analysis.get("keyDevelopments") or []) or "None found"

    try:
        model = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=2048,
        )

        system_prompt = (
            "You are a partner at a top-tier investment firm.\n"
            "Return ONLY valid JSON, no markdown."
        )
        user_prompt = f"""Score {resolved_name} across 5 investment dimensions.

Research data:
- Web sentiment score: {web_sentiment_score}/10
- Financial health score: {financial_health_score}/10
- Competitive score: {competitive_score}/10
- Red flags: {red_flags}
- Moat: {moat_type}, strength {moat_strength}/10
- Valuation risk: {valuation_risk}
- Key developments: {key_developments}

Score each dimension 1-10 strictly based on data above.
Then calculate weightedTotal using:
Growth x 0.30 + Moat x 0.25 + Sentiment x 0.20 + FinancialHealth x 0.15 + Valuation x 0.10

Return this exact JSON:
{{
  "scores": {{
    "growth": number,
    "moat": number,
    "financialHealth": number,
    "sentiment": number,
    "valuation": number,
    "weightedTotal": number
  }},
  "growthRationale": "string",
  "moatRationale": "string",
  "financialHealthRationale": "string",
  "sentimentRationale": "string",
  "valuationRationale": "string",
  "keyStrengths": ["string"],
  "keyRisks": ["string"]
}}"""

        response = await model.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ])
        raw = response.content if isinstance(response.content, str) else str(response.content)
        parsed_result, error = safe_parse_llm_json(raw, "SynthesisNode")

        result = parsed_result or {}
        if error:
            logger.warning("[SynthesisNode] Using fallback scores due to parse error.")

        raw_scores = result.get("scores") or {}
        s_growth = _safe_num(raw_scores.get("growth"), 5)
        s_moat = _safe_num(raw_scores.get("moat"), 5)
        s_fin = _safe_num(raw_scores.get("financialHealth"), 5)
        s_sent = _safe_num(raw_scores.get("sentiment"), 5)
        s_val = _safe_num(raw_scores.get("valuation"), 5)

        # Recalculate locally to ensure accuracy
        calculated = round(s_growth * 0.30 + s_moat * 0.25 + s_sent * 0.20 + s_fin * 0.15 + s_val * 0.10, 2)

        scores = {
            "growth": s_growth,
            "moat": s_moat,
            "financialHealth": s_fin,
            "sentiment": s_sent,
            "valuation": s_val,
            "weightedTotal": calculated,
        }

        synthesis = {
            "growthRationale": result.get("growthRationale") or "No rationale provided",
            "moatRationale": result.get("moatRationale") or "No rationale provided",
            "financialHealthRationale": result.get("financialHealthRationale") or "No rationale provided",
            "sentimentRationale": result.get("sentimentRationale") or "No rationale provided",
            "valuationRationale": result.get("valuationRationale") or "No rationale provided",
            "keyStrengths": result.get("keyStrengths") if isinstance(result.get("keyStrengths"), list) else [],
            "keyRisks": result.get("keyRisks") if isinstance(result.get("keyRisks"), list) else [],
        }

        return {
            "scores": scores,
            "synthesis": synthesis,
            "streamLog": [f"◈ SCORE: {calculated}/10"],
        }

    except Exception as exc:
        error_message = str(exc)
        return {
            "streamLog": [f"⊗ SYNTHESIS FAULT — {error_message}"],
            "scores": _empty_scores(),
            "synthesis": _empty_synthesis(),
        }
