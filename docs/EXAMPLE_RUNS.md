# Example Runs

This document showcases the raw inputs and structured outputs of the Meridian agent pipeline.

## Example 1: Public Tech Giant (NVIDIA)

**Input:** `nvda`

### Terminal Stream Logs
```text
◈ MERIDIAN — Initializing research pipeline...
◈ RESOLVED: NVIDIA Corporation (NVDA)
◈ WEB SIGNALS CAPTURED.
  Sentiment: positive (8/10)
◈ FINANCIALS PROCESSED.
  Health score: 8/10
◈ COMPETITIVE MAPPED.
  Moat: IP (9/10)
◈ SCORE: 8.45/10
◈ VERDICT LOCKED — INVEST (Confidence: 91%)
   Headline: NVIDIA's AI infrastructure dominance makes it the defining long-term growth story in semiconductors.
◈ BRIEF COMPILED
```

### JSON Output (Final Agent State)
```json
{
  "companyInfo": {
    "name": "NVIDIA Corporation",
    "ticker": "NVDA",
    "exchange": "NASDAQ",
    "sector": "Technology",
    "industry": "Semiconductors",
    "isPublic": true,
    "country": "USA"
  },
  "scores": {
    "growth": 9,
    "moat": 9,
    "financialHealth": 8,
    "sentiment": 8,
    "valuation": 6,
    "weightedTotal": 8.15
  },
  "verdict": "INVEST",
  "confidence": 91,
  "timeHorizon": "long-term (3yr+)",
  "headline": "NVIDIA's AI infrastructure dominance makes it the defining long-term growth story in semiconductors.",
  "investThesis": "NVIDIA holds a near-monopoly on GPU compute for AI training and inference. Record-breaking datacenter revenue growth and unmatched CUDA software lock-in provide a massive moat.",
  "watchFor": [
    "AMD or Intel gaining meaningful AI datacenter market share",
    "US export controls expanding to block H100/H200 sales to key markets",
    "Hyperscaler capex cycles cooling significantly"
  ],
  "comparableTo": "This company is like Cisco in 1999 but with a real moat — dominant infrastructure play for the current technological wave."
}
```

---

## Example 2: Private Startup (Zepto)

**Input:** `zepto quick commerce`

### JSON Output (Final Agent State)
```json
{
  "companyInfo": {
    "name": "Zepto",
    "ticker": null,
    "exchange": null,
    "sector": "Retail",
    "industry": "Quick Commerce",
    "isPublic": false,
    "country": "India"
  },
  "financialAnalysis": {
    "revenueGrowthYoY": "150% (Estimated)",
    "grossMargin": "-5% (Estimated)",
    "netMargin": null,
    "debtToEquity": null,
    "financialHealthScore": 4,
    "estimated": true
  },
  "scores": {
    "growth": 9,
    "moat": 6,
    "financialHealth": 4,
    "sentiment": 7,
    "valuation": 5,
    "weightedTotal": 6.25
  },
  "verdict": "WATCH",
  "confidence": 65,
  "timeHorizon": "medium-term (1-3yr)",
  "headline": "Hyper-growth quick commerce leader burning capital for market share in a highly competitive duopoly.",
  "investThesis": "Zepto is executing flawlessly on 10-minute delivery logistics, capturing massive GMV growth. However, unit economics remain deeply negative, and they are in a capital war of attrition with Blinkit and Swiggy Instamart.",
  "watchFor": [
    "Path to EBITDA profitability per dark store",
    "Blinkit price wars compressing gross margins",
    "Upcoming IPO valuation multiples"
  ],
  "comparableTo": "This company is like early DoorDash — massive top-line growth constrained by brutal unit economics and fierce local competition."
}
```
