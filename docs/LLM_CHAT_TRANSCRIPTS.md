# LLM Chat Transcripts

Meridian uses highly structured zero-shot prompting to force the LLM to output valid JSON. Below are examples of the exact system and user prompts sent to Groq/Llama-3.3-70B during pipeline execution.

## 1. Identifier Node

**System Prompt:**
```text
You are a financial data resolver. Return ONLY valid JSON, no markdown, no explanation.
```

**User Prompt:**
```text
Given this company name: nvidia
Return this exact JSON:
{
  "resolvedName": "string",
  "ticker": "string | null",
  "exchange": "string | null",
  "country": "string",
  "sector": "string",
  "industry": "string",
  "isPublic": boolean,
  "founded": "string | null",
  "description": "string"
}
If company not found return: { "error": "Not found" }
ticker and exchange are null for private companies.
```

**LLM Response:**
```json
{
  "resolvedName": "NVIDIA Corporation",
  "ticker": "NVDA",
  "exchange": "NASDAQ",
  "country": "USA",
  "sector": "Technology",
  "industry": "Semiconductors",
  "isPublic": true,
  "founded": "1993",
  "description": "NVIDIA Corporation is a multinational technology company known for designing graphics processing units (GPUs) and application programming interfaces (APIs) for data science and high-performance computing as well as system on a chip units (SoCs) for the mobile computing and automotive market."
}
```

---

## 2. Decision Node

**System Prompt:**
```text
You are the final decision-maker at an investment committee. Based on the synthesis below, issue a formal investment verdict. Return ONLY valid JSON, no markdown.
```

**User Prompt:**
```text
Company: NVIDIA Corporation
Weighted Score: 8.45 / 10
Scores: {"growth":9,"moat":9,"financialHealth":8,"sentiment":8,"valuation":6}
Strengths: ["Monopoly in AI compute", "Record datacenter revenue", "CUDA software moat"]
Risks: ["Geopolitical export controls", "High valuation multiples", "Hyperscaler custom silicon threats"]

Decision thresholds:
- INVEST: weightedTotal >= 7.0 AND no critical red flags
- WATCH: weightedTotal >= 5.5 AND < 7.0 OR score >= 7 but red flags present
- PASS: weightedTotal < 5.5 OR critical structural risks exist

Return ONLY a JSON object:
{
  "verdict": "INVEST",
  "confidence": 75,
  "timeHorizon": "medium-term (1-3yr)",
  "headline": "One punchy sentence summarizing the verdict",
  "investThesis": "3-4 sentences explaining why this is or is not a good investment RIGHT NOW",
  "watchFor": ["trigger 1 to revisit", "trigger 2"],
  "comparableTo": "This company is like [well-known comparable] because [reason]"
}
```

**LLM Response:**
```json
{
  "verdict": "INVEST",
  "confidence": 92,
  "timeHorizon": "long-term (3yr+)",
  "headline": "Unrivaled AI infrastructure dominance justifies premium valuation.",
  "investThesis": "NVIDIA is currently the undisputed leader in AI hardware and software infrastructure. Its CUDA ecosystem creates a formidable moat, locking in developers and enterprise customers. While valuation multiples are high, the unprecedented capex spend by hyperscalers provides near-term revenue visibility that supports the premium.",
  "watchFor": [
    "Expansion of US export controls to China and the Middle East",
    "Meaningful adoption of custom ASICs by Microsoft, Google, or AWS",
    "Softening in AI datacenter capital expenditures"
  ],
  "comparableTo": "This company is like Cisco during the early internet boom because they are selling the foundational pick-and-shovel infrastructure for a massive technological shift."
}
```
