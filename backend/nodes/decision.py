"""
nodes/decision.py — Investment Decision Node
Port of src/lib/nodes/decision.ts

Final investment committee verdict: INVEST | WATCH | PASS
"""

import json
import logging
from langchain_groq import ChatGroq

from state import AgentState
from utils.parse_json import safe_parse_llm_json

logger = logging.getLogger(__name__)


async def decision_node(state: AgentState) -> dict:
    llm = ChatGroq(
        model="openai/gpt-oss-120b",
        temperature=0.2,
        max_tokens=2048,
    )

    resolved_name = (state.get("companyInfo") or {}).get("name") or state.get("companyInput")
    scores = state.get("scores") or {}
    synthesis = state.get("synthesis") or {}
    weighted_total = float(scores.get("weightedTotal") or 5)

    scores_obj = json.dumps({
        "growth": scores.get("growth"),
        "moat": scores.get("moat"),
        "financialHealth": scores.get("financialHealth"),
        "sentiment": scores.get("sentiment"),
        "valuation": scores.get("valuation"),
    })
    key_strengths = json.dumps(synthesis.get("keyStrengths") or [])
    key_risks = json.dumps(synthesis.get("keyRisks") or [])

    prompt = f"""Investment Decision Node:

You are the final decision-maker at an investment committee. Based on the synthesis below, issue a formal investment verdict.

Company: {resolved_name}
Weighted Score: {weighted_total:.2f} / 10
Scores: {scores_obj}
Strengths: {key_strengths}
Risks: {key_risks}

Decision thresholds:
- INVEST: weightedTotal >= 7.0 AND no critical red flags
- WATCH: weightedTotal >= 5.5 AND < 7.0 OR score >= 7 but red flags present
- PASS: weightedTotal < 5.5 OR critical structural risks exist

Return ONLY a JSON object:
{{
  "verdict": "INVEST",
  "confidence": 75,
  "timeHorizon": "medium-term (1-3yr)",
  "headline": "One punchy sentence summarizing the verdict",
  "investThesis": "3-4 sentences explaining why this is or is not a good investment RIGHT NOW",
  "watchFor": ["trigger 1 to revisit", "trigger 2"],
  "comparableTo": "This company is like [well-known comparable] because [reason]"
}}

No markdown. verdict must be one of: INVEST, WATCH, PASS. The verdict must be defensible from the score data."""

    raw_response = await llm.ainvoke(prompt)
    raw_text = raw_response.content if isinstance(raw_response.content, str) else str(raw_response.content)

    parsed_result, error = safe_parse_llm_json(raw_text, "DecisionNode")
    if error:
        logger.warning("[DecisionNode] Using fallback decision due to parse error.")

    result = parsed_result or {}

    # Validate / fallback verdict
    valid_verdicts = {"INVEST", "WATCH", "PASS"}
    verdict = (result.get("verdict") or "").upper()
    if verdict not in valid_verdicts:
        if weighted_total >= 7:
            verdict = "INVEST"
        elif weighted_total >= 5.5:
            verdict = "WATCH"
        else:
            verdict = "PASS"

    confidence = result.get("confidence", 50)
    if not isinstance(confidence, (int, float)):
        confidence = 50

    return {
        "verdict": verdict,
        "confidence": int(confidence),
        "timeHorizon": result.get("timeHorizon") or "N/A",
        "headline": result.get("headline") or f"{verdict} rating assigned based on score of {weighted_total:.2f}",
        "investThesis": result.get("investThesis") or "",
        "watchFor": result.get("watchFor") if isinstance(result.get("watchFor"), list) else [],
        "comparableTo": result.get("comparableTo") or "",
        "streamLog": [
            f"◈ VERDICT LOCKED — {verdict} (Confidence: {confidence}%)",
            f"   Headline: {result.get('headline') or 'N/A'}",
        ],
    }
