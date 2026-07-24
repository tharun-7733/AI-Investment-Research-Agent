"""
nodes/identifier.py — Company Identifier Node
Port of src/lib/nodes/identifier.ts
"""

import logging
from langchain_groq import ChatGroq
from langchain_core.messages import SystemMessage, HumanMessage

from state import AgentState
from utils.parse_json import safe_parse_llm_json

logger = logging.getLogger(__name__)


async def identifier_node(state: AgentState) -> dict:
    company_input = state.get("companyInput")
    if not company_input:
        return {
            "error": "No companyInput provided in state.",
            "streamLog": ["⊗ ABORT — No input provided."],
        }

    try:
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0,
            max_tokens=1024,
        )

        system_prompt = (
            "You are a financial data resolver. Return ONLY valid JSON, no markdown, no explanation."
        )
        user_prompt = f"""Given this company name: {company_input}
Return this exact JSON:
{{
  "resolvedName": "string",
  "ticker": "string | null",
  "exchange": "string | null",
  "country": "string",
  "sector": "string",
  "industry": "string",
  "isPublic": true or false,
  "founded": "string | null",
  "description": "string"
}}
If company not found return: {{ "error": "Not found" }}
ticker and exchange are null for private companies."""

        response = await llm.ainvoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_prompt),
        ])

        raw = response.content if isinstance(response.content, str) else str(response.content)
        data, error = safe_parse_llm_json(raw, "IdentifierNode")

        if error or data is None:
            return {
                "error": f"Failed to parse company data: {error}",
                "streamLog": [f"⊗ PARSE FAULT — {error}"],
            }

        if "error" in data:
            return {
                "error": str(data["error"]),
                "streamLog": [f"⊗ IDENTIFIER FAULT — {data['error']}"],
            }

        # Map resolvedName → name (matches the TS rename pattern)
        resolved_name = data.pop("resolvedName", None)
        company_info = {"name": resolved_name, **data}

        return {
            "companyInfo": company_info,
            "streamLog": [f"◈ RESOLVED: {resolved_name} ({company_info.get('ticker') or 'Private'})"],
        }

    except Exception as exc:
        error_message = str(exc)
        return {
            "error": f"Failed to resolve company data: {error_message}",
            "streamLog": [f"⊗ IDENTIFIER FAULT — {error_message}"],
        }
