"""
graph.py — LangGraph StateGraph
Port of src/lib/graph.ts

Topology (identical to the TypeScript graph):

  START
    │
  identifier
  ┌──┴──┐
  webSearch  financials        ← parallel fan-out
     │
  competitive
  └──┬──┘
  synthesisNode                ← fan-in (waits for financials + competitive)
     │
  decision
     │
  reporter
     │
   END
"""


from langgraph.graph import StateGraph, START, END

from state import AgentState
from nodes.identifier import identifier_node
from nodes.web_search import web_search_node
from nodes.financials import financials_node
from nodes.competitive import competitive_node
from nodes.synthesis import synthesis_node
from nodes.decision import decision_node
from nodes.reporter import reporter_node

# ─── Build graph ──────────────────────────────────────────────────────────────

builder = StateGraph(AgentState)

builder.add_node("identifier", identifier_node)
builder.add_node("webSearch", web_search_node)
builder.add_node("financials", financials_node)
builder.add_node("competitive", competitive_node)
builder.add_node("synthesisNode", synthesis_node)
builder.add_node("decision", decision_node)
builder.add_node("reporter", reporter_node)

builder.add_edge(START, "identifier")

# webSearch and financials run in parallel after identifier
builder.add_edge("identifier", "webSearch")
builder.add_edge("identifier", "financials")

# competitive runs after webSearch (it uses webAnalysis context)
builder.add_edge("webSearch", "competitive")

# Fan-in: synthesisNode waits for financials + competitive
builder.add_edge("financials", "synthesisNode")
builder.add_edge("competitive", "synthesisNode")

builder.add_edge("synthesisNode", "decision")
builder.add_edge("decision", "reporter")
builder.add_edge("reporter", END)

investment_graph = builder.compile()
