"""
nodes/web_search.py — Web Research Node
Port of src/lib/nodes/webSearch.ts
"""

import logging
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from state import AgentState
from utils.parse_json import safe_parse_llm_json
from tools.tavily_search import run_multiple_searches

logger = logging.getLogger(__name__)


async def web_search_node(state: AgentState) -> dict:
    company_info = state.get("companyInfo") or {}
    resolved_name = company_info.get("name") or state.get("companyInput") or "the company"
    sector = company_info.get("sector") or "their sector"

    try:
        # ── Step 1: Generate search queries ────────────────────────────────────
        query_llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.1,
            max_tokens=1024,
        )

        sys1 = (
            "You are a financial research analyst.\n"
            "Return ONLY a JSON array of 5 strings.\n"
            "No markdown, no explanation."
        )
        usr1 = (
            f"Generate 5 targeted investment research\n"
            f"search queries for: {resolved_name} in {sector}.\n"
            f"Cover: latest financials or funding, recent news,\n"
            f"competitors, leadership or controversies,\n"
            f"future outlook."
        )

        query_response = await query_llm.ainvoke([
            SystemMessage(content=sys1),
            HumanMessage(content=usr1),
        ])
        query_raw = query_response.content if isinstance(query_response.content, str) else str(query_response.content)
        queries_data, query_error = safe_parse_llm_json(query_raw, "WebSearchNode/queries")

        queries: list[str] = queries_data if isinstance(queries_data, list) else []
        if query_error:
            logger.warning("[WebSearchNode] Could not parse queries, proceeding with empty list.")

        # ── Step 2: Run searches ────────────────────────────────────────────────
        search_results_str = ""
        if queries:
            search_results = await run_multiple_searches(queries)
            if search_results:
                search_results = search_results[:10]  # Limit to top 10 results
                search_results_str = "\n\n---\n\n".join(
                    f"Title: {r['title']}\nURL: {r['url']}\nContent: {r['content'][:1000]}"
                    for r in search_results
                )

        if not search_results_str:
            search_results_str = "No search results found."

        # ── Step 3: Synthesize ──────────────────────────────────────────────────
        summary_llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=2048,
        )

        sys2 = "You are a senior equity research analyst.\nReturn ONLY valid JSON, no markdown."
        usr2 = (
            f"Analyze these search results about {resolved_name}:\n{search_results_str}\n\n"
            f"Return this exact JSON:\n"
            f'{{\n'
            f'  "keyDevelopments": ["string"],\n'
            f'  "sentiment": "positive" | "neutral" | "negative",\n'
            f'  "sentimentScore": number (1-10),\n'
            f'  "redFlags": ["string"],\n'
            f'  "tailwinds": ["string"],\n'
            f'  "recentEvents": ["string"],\n'
            f'  "sourceSummary": "string"\n'
            f'}}\n'
            f"If data is missing use null for that field."
        )

        synth_response = await summary_llm.ainvoke([
            SystemMessage(content=sys2),
            HumanMessage(content=usr2),
        ])
        synth_raw = synth_response.content if isinstance(synth_response.content, str) else str(synth_response.content)
        parsed_result, synth_error = safe_parse_llm_json(synth_raw, "WebSearchNode/synthesis")

        web_analysis = parsed_result or {
            "keyDevelopments": None,
            "sentiment": "neutral",
            "sentimentScore": 5,
            "redFlags": None,
            "tailwinds": None,
            "recentEvents": None,
            "sourceSummary": None,
        }

        if synth_error:
            logger.warning("[WebSearchNode] Using fallback web analysis due to parse error.")

        sentiment = web_analysis.get("sentiment", "neutral")
        score = web_analysis.get("sentimentScore", 5)

        return {
            "webAnalysis": web_analysis,
            "streamLog": [f"◈ WEB SIGNALS CAPTURED. \n  Sentiment: {sentiment} ({score}/10)"],
        }

    except Exception as exc:
        error_message = str(exc)
        return {
            "streamLog": [f"⊗ WEB SEARCH FAULT — {error_message}"],
            "webAnalysis": {"sentiment": "neutral", "sentimentScore": 5},
        }
