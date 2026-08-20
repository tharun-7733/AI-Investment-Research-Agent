"""
nodes/reporter.py — Investment Report Generator Node
Port of src/lib/nodes/reporter.ts
"""

import logging
from datetime import date
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from state import AgentState

logger = logging.getLogger(__name__)


async def reporter_node(state: AgentState) -> dict:
    company_info = state.get("companyInfo") or {}
    scores = state.get("scores") or {}
    synthesis = state.get("synthesis") or {}
    comp = state.get("competitiveAnalysis") or {}

    resolved_name = company_info.get("name") or state.get("companyInput") or "the company"
    verdict = state.get("verdict") or "UNKNOWN"
    confidence = state.get("confidence") or 0
    weighted_total = scores.get("weightedTotal") or 5
    headline = state.get("headline") or "No headline provided"
    sector = company_info.get("sector") or "Unknown sector"
    country = company_info.get("country") or "Unknown country"
    description = company_info.get("description") or "No description provided"

    key_strengths = ", ".join(synthesis.get("keyStrengths") or []) or "None listed"
    key_risks = ", ".join(synthesis.get("keyRisks") or []) or "None listed"

    growth = scores.get("growth") or 5
    moat = scores.get("moat") or 5
    financial_health = scores.get("financialHealth") or 5
    sentiment = scores.get("sentiment") or 5
    valuation = scores.get("valuation") or 5

    invest_thesis = state.get("investThesis") or "No thesis provided"
    watch_for = ", ".join(state.get("watchFor") or []) or "Nothing specified"
    main_competitors = ", ".join(comp.get("mainCompetitors") or []) or "None listed"
    moat_type = comp.get("moatType") or "none"
    moat_strength = comp.get("moatStrength") or 5

    date_str = date.today().isoformat()

    try:
        model = ChatGroq(
            model="openai/gpt-oss-120b",
            temperature=0.3,
            max_tokens=2048,
        )

        system_prompt = (
            "You are a senior equity research analyst writing a client-facing investment brief.\n"
            "Write in clean markdown. Be direct and factual.\n"
            "Every sentence must add information."
        )

        user_prompt = f"""Write a full investment research brief for {resolved_name} using this data:

Verdict: {verdict} | Score: {weighted_total}/10 | Confidence: {confidence}%
Headline: {headline}
Sector: {sector} | Country: {country}
Description: {description}
Strengths: {key_strengths}
Risks: {key_risks}
Scores: Growth {growth} | Moat {moat} | Health {financial_health} | Sentiment {sentiment} | Valuation {valuation}
Investment Thesis: {invest_thesis}
Watch For: {watch_for}
Competitors: {main_competitors}
Moat: {moat_type} ({moat_strength}/10)

Use this EXACT markdown structure:

# {resolved_name} — Investment Research Brief
## Verdict: {verdict} ({confidence}% confidence)
> {headline}
## Company Snapshot
## Investment Thesis
## Scorecard
(markdown table with all 5 dimensions + weights)
## Key Strengths
## Key Risks
## Competitive Position
## What to Watch
## Analyst Note
---
*AI Investment Agent · {date_str} · Informational only*"""

        response = await model.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ])

        content = response.content if isinstance(response.content, str) else str(response.content)

        # Strip markdown code-block wrapper if the model wraps the whole report
        if content.startswith("```markdown"):
            content = content.removeprefix("```markdown").removesuffix("```").strip()
        elif content.startswith("```"):
            content = content.removeprefix("```").removesuffix("```").strip()

        return {
            "report": content,
            "streamLog": ["◈ BRIEF COMPILED"],
        }

    except Exception as exc:
        error_message = str(exc)
        return {
            "streamLog": [f"⊗ REPORTER FAULT — {error_message}"],
            "report": f"# {resolved_name} — Investment Research Brief\n\nFailed to generate report due to error: {error_message}",
        }
