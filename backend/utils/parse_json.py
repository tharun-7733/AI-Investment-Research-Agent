"""
parse_json.py — LLM JSON parsing utility
Port of src/lib/utils/parseJson.ts

Handles all common LLM response formats:
  - Plain JSON:             { ... }
  - Markdown fenced:        ```json\\n{ ... }\\n```
  - Fenced without lang:    ```\\n{ ... }\\n```
  - JSON buried in prose:   "Here is the result:\\n{ ... }\\nDone."
"""

import re
import json
import logging
from typing import Any, Optional, Tuple

logger = logging.getLogger(__name__)


def clean_llm_json(raw: str) -> str:
    """Strip markdown code fences and extract the first JSON object or array."""
    # 1. Remove opening fence (```json, ```JSON, ```, etc.)
    s = re.sub(r"^```[a-zA-Z]*\n?", "", raw).strip()
    # 2. Remove closing fence
    s = re.sub(r"```\s*$", "", s).strip()
    # 3. Strip any remaining fences (multi-fence responses)
    s = re.sub(r"```[a-zA-Z]*\n?", "", s)
    s = re.sub(r"```", "", s).strip()

    # 4. Extract first JSON object {...} or array [...]
    obj_match = re.search(r"\{[\s\S]*\}", s)
    arr_match = re.search(r"\[[\s\S]*\]", s)

    if obj_match and arr_match:
        # Return whichever appears first
        return (
            obj_match.group()
            if obj_match.start() <= arr_match.start()
            else arr_match.group()
        )

    return obj_match.group() if obj_match else (arr_match.group() if arr_match else s)


def safe_parse_llm_json(raw: str, node_name: str) -> Tuple[Optional[Any], Optional[str]]:
    """
    Safely parse an LLM response as JSON.

    Args:
        raw:       Raw LLM response string.
        node_name: Node/file name for logging (e.g. "FinancialsNode").

    Returns:
        (data, error) where error is None on success.
    """
    cleaned = clean_llm_json(raw)

    logger.debug("[%s] Raw LLM response (first 300): %s", node_name, raw[:300])
    logger.debug("[%s] Cleaned JSON (first 300): %s", node_name, cleaned[:300])

    try:
        data = json.loads(cleaned)
        return data, None
    except json.JSONDecodeError as exc:
        error_msg = str(exc)
        logger.error("[%s] JSON parse error: %s", node_name, error_msg)
        logger.error("[%s] Problematic string: %s", node_name, cleaned[:500])
        return None, error_msg
