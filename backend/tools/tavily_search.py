"""
tavily_search.py — Tavily Web Search tool
Port of src/lib/tools/tavilySearch.ts
"""

import asyncio
import logging
import os
from typing import Optional

logger = logging.getLogger(__name__)


def _get_client():
    """Build a synchronous Tavily client (used inside thread executor)."""
    from tavily import TavilyClient

    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key:
        raise ValueError("TAVILY_API_KEY is not set in environment variables.")
    return TavilyClient(api_key=api_key)


async def run_tavily_search(query: str, max_results: int = 5) -> list[dict]:
    """
    Run a single Tavily search asynchronously and return structured results.
    On failure, logs the error and returns an empty list (never raises).
    """
    try:
        client = _get_client()
        response = await asyncio.to_thread(
            client.search,
            query,
            search_depth="advanced",
            include_answer=True,
            max_results=max_results,
        )
        results = response.get("results") or []
        return [
            {
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "content": r.get("content", ""),
                "score": r.get("score", 0),
            }
            for r in results
        ]
    except Exception as exc:
        logger.error('[TavilySearch] Failed for query "%s": %s', query, exc)
        return []


async def run_multiple_searches(
    queries: list[str], max_results_per_query: int = 5
) -> list[dict]:
    """
    Run multiple queries in parallel, merge all results into a flat list,
    and deduplicate by URL (keeping the highest-scoring entry per URL).
    """
    tasks = [run_tavily_search(q, max_results_per_query) for q in queries]
    settled = await asyncio.gather(*tasks, return_exceptions=True)

    all_results: list[dict] = []
    for result in settled:
        if isinstance(result, list):
            all_results.extend(result)
        # exceptions already handled inside run_tavily_search

    # Deduplicate by URL, keeping highest score
    seen: dict[str, dict] = {}
    for item in all_results:
        url = item["url"]
        if url not in seen or item["score"] > seen[url]["score"]:
            seen[url] = item

    # Sort descending by score
    return sorted(seen.values(), key=lambda x: x["score"], reverse=True)
