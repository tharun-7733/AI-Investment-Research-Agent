"""
state.py — LangGraph agent state
Port of src/lib/state.ts + src/lib/types.ts
"""

import operator
from typing import Annotated, Any, Optional
from typing_extensions import TypedDict


# ─── Reducers ─────────────────────────────────────────────────────────────────


def _merge_dicts(a: Optional[dict], b: Optional[dict]) -> Optional[dict]:
    """Shallow-merge two dicts; mirrors the TS `(curr, update) => ({...curr, ...update})` reducer."""
    if a is None:
        return b
    if b is None:
        return a
    return {**a, **b}


# ─── AgentState ───────────────────────────────────────────────────────────────


class AgentState(TypedDict, total=False):
    # ── Input ──────────────────────────────────────────────────────────────────
    companyInput: str

    # ── Node outputs ────────────────────────────────────────────────────────────
    # Merge reducers match the TS `(curr, update) => ({...curr, ...update})` pattern.
    companyInfo: Annotated[Optional[dict], _merge_dicts]
    webAnalysis: Annotated[Optional[dict], _merge_dicts]
    financialAnalysis: Annotated[Optional[dict], _merge_dicts]
    competitiveAnalysis: Annotated[Optional[dict], _merge_dicts]
    scores: Annotated[Optional[dict], _merge_dicts]
    synthesis: Annotated[Optional[dict], _merge_dicts]

    # ── Final decision ──────────────────────────────────────────────────────────
    verdict: Optional[str]            # "INVEST" | "WATCH" | "PASS"
    confidence: Optional[int]         # 50-99
    timeHorizon: Optional[str]
    headline: Optional[str]
    investThesis: Optional[str]
    watchFor: Optional[list]          # overwrite reducer (default last-write-wins)
    comparableTo: Optional[str]

    # ── Report ──────────────────────────────────────────────────────────────────
    report: Optional[str]             # full markdown report

    # ── Runtime ─────────────────────────────────────────────────────────────────
    # operator.add → append reducer (matches TS `[...curr, ...update]`)
    streamLog: Annotated[list[str], operator.add]
    error: Optional[str]
