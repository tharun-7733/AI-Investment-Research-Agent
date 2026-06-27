import { State } from "./state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { tavilySearch, alphaVantageOverview, alphaVantageIncomeStatement } from "./tools";

// Initialize LLM (we'll assume keys are in environment)
const getLLM = () => new ChatGoogleGenerativeAI({ model: "gemini-3.0-pro", temperature: 0.1 });

// 6. Company Identifier Node
export const companyIdentifier = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();

  // User-specified prompt: returns raw JSON, no markdown
  const prompt = `You are a financial data resolver. Given a company name, extract and return ONLY a JSON object with no markdown, no explanation.

Input: "${state.companyName}"

Return this exact structure:
{
  "resolvedName": "Official company name",
  "ticker": "Stock ticker or null if private",
  "exchange": "NSE/BSE/NASDAQ/NYSE/null",
  "country": "Country of headquarters",
  "sector": "Primary sector",
  "industry": "Specific industry",
  "isPublic": true/false,
  "founded": "Year or null",
  "description": "One sentence describing what the company does"
}

Rules:
- If the company is private (startup, unlisted), set ticker and exchange to null
- If you cannot resolve the company, return { "error": "Company not found" }
- Never wrap in markdown or backticks`;

  const raw = await llm.invoke(prompt);
  const rawText = typeof raw.content === "string" ? raw.content : JSON.stringify(raw.content);

  let result: {
    resolvedName?: string;
    ticker?: string | null;
    exchange?: string | null;
    country?: string;
    sector?: string;
    industry?: string;
    isPublic?: boolean;
    founded?: string | null;
    description?: string;
    error?: string;
  } = {};

  try {
    result = JSON.parse(rawText.trim());
  } catch {
    // Fallback: try to extract JSON from any surrounding text
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) result = JSON.parse(match[0]);
  }

  if (result.error) {
    throw new Error(`Company Identifier: ${result.error}`);
  }

  const ticker = result.ticker || null;
  const exchange = result.exchange && result.exchange !== "null" ? result.exchange : null;

  return {
    resolvedName: result.resolvedName ?? state.companyName,
    ticker,
    exchange,
    country: result.country ?? "Unknown",
    sector: result.sector ?? "Unknown",
    industry: result.industry ?? "Unknown",
    isPublic: result.isPublic ?? false,
    founded: result.founded ?? null,
    companyDescription: result.description ?? "",
    logs: [
      `✅ Identified: ${result.resolvedName} (${ticker ?? "PRIVATE"})`,
      `   Exchange: ${exchange ?? "N/A"} | Sector: ${result.sector} | Industry: ${result.industry}`,
      `   HQ: ${result.country} | Founded: ${result.founded ?? "Unknown"} | Public: ${result.isPublic}`,
    ],
  };
};

// 7. Web Search Agent Node
export const webSearchAgent = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();
  const name = state.resolvedName || state.companyName;
  const ticker = state.ticker ?? "N/A";
  const sector = state.sector ?? "Unknown";

  // Step 1: Generate 5 targeted search queries via LLM
  const queryGenPrompt = `You are a financial research analyst. Given a company, generate exactly 5 targeted web search queries to gather investment-relevant information.

Company: ${name} (${ticker}, ${sector})

Generate queries covering:
1. Latest financial results or funding round
2. Recent news (last 6 months)
3. Competitive landscape and market position
4. Leadership, controversies, or red flags
5. Future outlook, expansion plans, or analyst ratings

Return ONLY a JSON array of 5 strings. No markdown, no explanation.
Example: ["query one", "query two", ...]`;

  const queryGenRaw = await llm.invoke(queryGenPrompt);
  const queryGenText =
    typeof queryGenRaw.content === "string"
      ? queryGenRaw.content
      : JSON.stringify(queryGenRaw.content);

  let queries: string[] = [];
  try {
    const cleaned = queryGenText.trim().replace(/^```json|```$/g, "").trim();
    queries = JSON.parse(cleaned);
  } catch {
    const match = queryGenText.match(/\[[\s\S]*\]/);
    if (match) queries = JSON.parse(match[0]);
  }

  // Fallback: if parsing failed, use a sensible default set
  if (!Array.isArray(queries) || queries.length === 0) {
    queries = [
      `${name} latest financial results`,
      `${name} news 2024 2025`,
      `${name} competitors market share`,
      `${name} CEO controversies red flags`,
      `${name} expansion analyst outlook`,
    ];
  }

  // Step 2: Run all 5 searches in parallel
  const searchResults = await Promise.all(
    queries.map((q) => tavilySearch(q).catch(() => "No results found."))
  );

  const combinedResults = queries
    .map((q, i) => `Query: ${q}\nResult: ${searchResults[i]}`)
    .join("\n\n---\n\n");


  // Step 3: Synthesize with full equity analyst schema
  const schema = z.object({
    keyDevelopments: z
      .array(z.string())
      .describe("Key recent developments about the company (3 bullets)"),
    sentiment: z
      .enum(["positive", "neutral", "negative"])
      .describe("Overall investment sentiment"),
    sentimentScore: z
      .number()
      .min(1)
      .max(10)
      .describe("Sentiment score from 1 (very negative) to 10 (very positive)"),
    redFlags: z
      .array(z.string())
      .describe("Red flags, controversies, or risks identified. Empty array if none."),
    tailwinds: z
      .array(z.string())
      .describe("Positive tailwinds or growth catalysts. Empty array if none."),
    recentEvents: z
      .array(z.string())
      .describe("Notable recent events (earnings, product launches, leadership changes, etc.)"),
    sourceSummary: z
      .string()
      .describe("2-sentence summary of what the web reveals about this company right now"),
  });

  const structuredLlm = llm.withStructuredOutput(schema);
  const synthesisPrompt = `You are a senior equity research analyst. Below are raw web search results about ${name}.

Search Results:
${combinedResults.substring(0, 6000)}

Extract and return a structured analysis with:
- keyDevelopments: 3 key bullet points
- sentiment: "positive", "neutral", or "negative"
- sentimentScore: 1-10 (1=very negative, 10=very positive)
- redFlags: any controversies, risks, or warning signs (empty array if none)
- tailwinds: positive growth catalysts (empty array if none)
- recentEvents: notable recent events (earnings, leadership changes, product launches)
- sourceSummary: 2-sentence summary of what the web reveals about this company right now

Be factual. If data is missing for a field, use an empty array or a note saying data unavailable.`;

  const result = await structuredLlm.invoke(synthesisPrompt);

  return {
    sentimentScore: result.sentimentScore,
    sentiment: result.sentiment,
    keyDevelopments: result.keyDevelopments,
    redFlags: result.redFlags,
    tailwinds: result.tailwinds,
    recentEvents: result.recentEvents,
    sourceSummary: result.sourceSummary,
    webSearchContext: result.sourceSummary, // kept for downstream compatibility
    logs: [
      `✅ Web Search Complete — ${queries.length} queries, sentiment: ${result.sentiment} (${result.sentimentScore}/10)`,
      `   Key Developments: ${result.keyDevelopments.length} | Red Flags: ${result.redFlags.length} | Tailwinds: ${result.tailwinds.length}`,
      `   Queries: ${queries.map((q, i) => `\n     ${i + 1}. ${q}`).join("")}`,
    ],
  };
};

// 8. Financial Analyst Node
export const financialAnalyst = async (state: State): Promise<Partial<State>> => {
  let overview = "No financial data found.";
  let income = "No income statement found.";
  
  if (state.isPublic && state.ticker) {
    overview = await alphaVantageOverview(state.ticker);
    income = await alphaVantageIncomeStatement(state.ticker);
  }

  const llm = getLLM();
  const financialData = `Overview Data:\n${overview.substring(0, 2000)}\n\nIncome Statement Data:\n${income.substring(0, 2000)}`;
  
  const prompt = `Financial Analyst:
You are a CFA-level financial analyst. Analyze the following financial data for ${state.resolvedName || state.companyName}.

Financial Data:
${financialData}

Return ONLY a JSON object:
{
  "revenueGrowthYoY": "<% or null>",
  "grossMargin": "<% or null>",
  "netMargin": "<% or null>",
  "debtToEquity": <ratio or null>,
  "peRatio": <number or null>,
  "marketCap": "<value with unit, e.g. $4.2B or null>",
  "cashPosition": "<value or null>",
  "burnRate": "<monthly burn for startups or null>",
  "financialHealthScore": <1-10>,
  "financialHealthRationale": "2-3 sentences explaining the score",
  "valuationRisk": "low | medium | high",
  "valuationRationale": "1-2 sentences"
}

If this is a private company and data is unavailable, estimate where possible using industry benchmarks and flag it with an "estimated": true field.
No markdown, no extra text.`;

  const raw = await llm.invoke(prompt);
  const rawText = typeof raw.content === "string" ? raw.content : JSON.stringify(raw.content);

  let result: any = {};
  try {
    const cleaned = rawText.trim().replace(/^```json|```$/g, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) result = JSON.parse(match[0]);
  }

  // Fallbacks for downstream nodes (Synthesis Engine)
  let valuationScore = 5;
  if (result.valuationRisk?.toLowerCase() === "low") valuationScore = 8;
  else if (result.valuationRisk?.toLowerCase() === "high") valuationScore = 3;

  let growthScore = 5;
  if (result.revenueGrowthYoY) {
    const val = parseFloat(result.revenueGrowthYoY);
    if (!isNaN(val)) {
      if (val > 20) growthScore = 8;
      else if (val > 10) growthScore = 6;
      else if (val > 0) growthScore = 5;
      else growthScore = 3;
    }
  }

  return {
    revenueGrowthYoY: result.revenueGrowthYoY || null,
    grossMargin: result.grossMargin || null,
    netMargin: result.netMargin || null,
    debtToEquity: result.debtToEquity || null,
    peRatio: result.peRatio || null,
    marketCap: result.marketCap || null,
    cashPosition: result.cashPosition || null,
    burnRate: result.burnRate || null,
    financialHealthScore: result.financialHealthScore || 5,
    financialHealthRationale: result.financialHealthRationale || "",
    valuationRisk: result.valuationRisk || "medium",
    valuationRationale: result.valuationRationale || "",
    valuationScore,
    growthScore,
    financialContext: result.financialHealthRationale ? `${result.financialHealthRationale} ${result.valuationRationale || ""}` : "Financial data processed.",
    logs: [
      `✅ Financial Analysis Complete - Health: ${result.financialHealthScore || 5}/10, Valuation Risk: ${result.valuationRisk || "N/A"}`,
    ],
  };
};

// 9. Competitive Intelligence Node
export const competitiveIntel = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();
  const resolvedName = state.resolvedName || state.companyName;
  const industry = state.industry || state.sector || "Unknown Industry";
  const webSearchSummary = state.sourceSummary || state.webSearchContext || "No web context available.";

  const prompt = `Competitive Intelligence Analyst:

You are a strategy consultant specializing in competitive analysis. Analyze ${resolvedName} in the context of its industry: ${industry}.

Use this context:
${webSearchSummary}

Return ONLY a JSON object:
{
  "mainCompetitors": ["competitor1", "competitor2", "competitor3"],
  "marketPosition": "leader | challenger | niche | emerging",
  "moatType": "brand | network_effects | cost_advantage | switching_costs | IP | none",
  "moatStrength": <1-10>,
  "moatRationale": "2-3 sentences explaining the moat score",
  "differentiators": ["point 1", "point 2"],
  "threats": ["threat 1", "threat 2"],
  "marketSizeTAM": "<estimated TAM or null>",
  "competitiveScore": <1-10>
}

No markdown. Base answers on available data; note uncertainty where it exists.`;

  const raw = await llm.invoke(prompt);
  const rawText = typeof raw.content === "string" ? raw.content : JSON.stringify(raw.content);

  let result: any = {};
  try {
    const cleaned = rawText.trim().replace(/^```json|```$/g, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) result = JSON.parse(match[0]);
  }

  const moatScore = result.moatStrength || result.competitiveScore || 5;
  const competitiveScore = result.competitiveScore || moatScore;

  return {
    mainCompetitors: result.mainCompetitors || [],
    marketPosition: result.marketPosition || "unknown",
    moatType: result.moatType || "none",
    moatScore,
    moatRationale: result.moatRationale || "",
    differentiators: result.differentiators || [],
    threats: result.threats || [],
    marketSizeTAM: result.marketSizeTAM || null,
    competitiveScore,
    competitiveContext: result.moatRationale
      ? `${result.moatRationale} Market position: ${result.marketPosition}. Moat type: ${result.moatType}.`
      : "Competitive analysis processed.",
    logs: [
      `✅ Competitive Intel Complete - Score: ${competitiveScore}/10, Position: ${result.marketPosition || "unknown"}, Moat: ${result.moatType || "none"}`,
      `   Competitors: ${(result.mainCompetitors || []).join(", ") || "N/A"}`,
    ],
  };
};


// 11. Synthesis Engine Node
export const synthesisEngine = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();
  const resolvedName = state.resolvedName || state.companyName;
  
  const companyInfo = `Sector: ${state.sector}, Industry: ${state.industry}, Founded: ${state.founded}. ${state.companyDescription}`;
  const webAnalysis = `Sentiment: ${state.sentiment}. ${state.sourceSummary}`;
  const financialAnalysis = `Health Score: ${state.financialHealthScore}. Rationale: ${state.financialHealthRationale}. Valuation Risk: ${state.valuationRisk}.`;
  const competitiveAnalysis = `Position: ${state.marketPosition}. Moat: ${state.moatType}. Competitors: ${(state.mainCompetitors || []).join(", ")}. ${state.moatRationale}`;

  const prompt = `Synthesis & Scoring Engine:

You are a partner at a top-tier venture capital / equity research firm. You have completed research on ${resolvedName}. Synthesize all findings into a final investment score.

Research Package:
- Company Info: ${companyInfo}
- Web Sentiment: ${webAnalysis}
- Financials: ${financialAnalysis}
- Competitive Intel: ${competitiveAnalysis}

Score each dimension from 1–10 using the rubric below, then compute a weighted total.

Rubric:
- Growth (25%): Revenue growth rate, market expansion, user/revenue trajectory
- Moat (20%): Competitive defensibility, switching costs, network effects
- Financial Health (25%): Margins, debt, cash, sustainability
- Market Sentiment (15%): News tone, analyst consensus, public perception
- Valuation (15%): Price vs. intrinsic value, risk-adjusted return potential

Return ONLY a JSON object:
{
  "scores": {
    "growth": <1-10>,
    "moat": <1-10>,
    "financialHealth": <1-10>,
    "sentiment": <1-10>,
    "valuation": <1-10>
  },
  "weightedTotal": <calculated 1-10, two decimal places>,
  "growthRationale": "1-2 sentences",
  "moatRationale": "1-2 sentences",
  "financialHealthRationale": "1-2 sentences",
  "sentimentRationale": "1-2 sentences",
  "valuationRationale": "1-2 sentences",
  "keyStrengths": ["strength 1", "strength 2", "strength 3"],
  "keyRisks": ["risk 1", "risk 2", "risk 3"]
}

No markdown. Be rigorous — a score of 7+ must be genuinely justified.`;

  const raw = await llm.invoke(prompt);
  const rawText = typeof raw.content === "string" ? raw.content : JSON.stringify(raw.content);

  let result: any = {};
  try {
    const cleaned = rawText.trim().replace(/^```json|```$/g, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) result = JSON.parse(match[0]);
  }

  const scores = result.scores || {};
  const growthScore = scores.growth || state.growthScore || 5;
  const moatScore = scores.moat || state.moatScore || 5;
  const financialHealthScore = scores.financialHealth || state.financialHealthScore || 5;
  const sentimentScore = scores.sentiment || state.sentimentScore || 5;
  const valuationScore = scores.valuation || state.valuationScore || 5;

  let synthesisScore = result.weightedTotal;
  if (typeof synthesisScore !== 'number') {
    synthesisScore = 
      (growthScore * 0.25) + 
      (moatScore * 0.20) + 
      (financialHealthScore * 0.25) + 
      (sentimentScore * 0.15) + 
      (valuationScore * 0.15);
  }

  return {
    growthScore,
    moatScore,
    financialHealthScore,
    sentimentScore,
    valuationScore,
    synthesisScore,
    synthesisGrowthRationale: result.growthRationale || "",
    synthesisMoatRationale: result.moatRationale || "",
    synthesisFinancialHealthRationale: result.financialHealthRationale || "",
    synthesisSentimentRationale: result.sentimentRationale || "",
    synthesisValuationRationale: result.valuationRationale || "",
    keyStrengths: result.keyStrengths || [],
    keyRisks: result.keyRisks || [],
    logs: [
      `✅ Synthesis Complete - Final Score: ${synthesisScore.toFixed(2)}/10`,
      `   (Growth: ${growthScore}, Moat: ${moatScore}, Health: ${financialHealthScore}, Sentiment: ${sentimentScore}, Val: ${valuationScore})`
    ],
  };
};

export const decisionNode = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();
  const resolvedName = state.resolvedName || state.companyName;
  const weightedTotal = state.synthesisScore || 5;
  const scoresObj = JSON.stringify({
    growth: state.growthScore,
    moat: state.moatScore,
    financialHealth: state.financialHealthScore,
    sentiment: state.sentimentScore,
    valuation: state.valuationScore
  });
  const keyStrengths = JSON.stringify(state.keyStrengths || []);
  const keyRisks = JSON.stringify(state.keyRisks || []);

  const prompt = `Investment Decision Node:

You are the final decision-maker at an investment committee. Based on the synthesis below, issue a formal investment verdict.

Company: ${resolvedName}
Weighted Score: ${weightedTotal.toFixed(2)} / 10
Scores: ${scoresObj}
Strengths: ${keyStrengths}
Risks: ${keyRisks}

Decision thresholds:
- INVEST: weightedTotal >= 7.0 AND no critical red flags
- WATCH: weightedTotal >= 5.5 AND < 7.0 OR score >= 7 but red flags present
- PASS: weightedTotal < 5.5 OR critical structural risks exist

Return ONLY a JSON object:
{
  "verdict": "INVEST | WATCH | PASS",
  "confidence": <50-99 integer, your confidence in this verdict>,
  "timeHorizon": "short-term (< 1yr) | medium-term (1-3yr) | long-term (3yr+) | N/A",
  "headline": "One punchy sentence summarizing the verdict (like a Bloomberg headline)",
  "investThesis": "3-4 sentences: why this is or isn't a good investment RIGHT NOW",
  "watchFor": ["trigger 1 to revisit", "trigger 2"] or [],
  "comparableTo": "This company is like [well-known comparable] because [reason]"
}

No markdown. The verdict must be defensible from the score data.`;

  const raw = await llm.invoke(prompt);
  const rawText = typeof raw.content === "string" ? raw.content : JSON.stringify(raw.content);

  let result: any = {};
  try {
    const cleaned = rawText.trim().replace(/^```json|```$/g, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) result = JSON.parse(match[0]);
  }

  const validVerdicts = ["INVEST", "WATCH", "PASS"];
  let verdict = result.verdict?.toUpperCase();
  if (!validVerdicts.includes(verdict)) {
    if (weightedTotal >= 7) verdict = "INVEST";
    else if (weightedTotal >= 5.5) verdict = "WATCH";
    else verdict = "PASS";
  }

  return {
    verdict: verdict as "INVEST" | "WATCH" | "PASS",
    confidence: result.confidence || 50,
    timeHorizon: result.timeHorizon || "N/A",
    headline: result.headline || `${verdict} rating assigned based on score of ${weightedTotal.toFixed(2)}`,
    investThesis: result.investThesis || "",
    watchFor: Array.isArray(result.watchFor) ? result.watchFor : [],
    comparableTo: result.comparableTo || "",
    logs: [
      `✅ Decision Made - Verdict: ${verdict} (Confidence: ${result.confidence || 50}%)`,
      `   Headline: ${result.headline || "N/A"}`
    ],
  };
};



// 30. Report Generator Node
export const reportGenerator = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();
  const resolvedName = state.resolvedName || state.companyName;
  const date = new Date().toISOString().split("T")[0];
  
  const fullResearchPackage = JSON.stringify({
    companyInfo: {
      sector: state.sector,
      industry: state.industry,
      description: state.companyDescription,
      founded: state.founded,
      country: state.country
    },
    synthesis: {
      synthesisScore: state.synthesisScore,
      investThesis: state.investThesis,
      watchFor: state.watchFor,
      comparableTo: state.comparableTo,
      keyStrengths: state.keyStrengths,
      keyRisks: state.keyRisks,
      growthRationale: state.synthesisGrowthRationale,
      moatRationale: state.synthesisMoatRationale,
      financialHealthRationale: state.synthesisFinancialHealthRationale,
      sentimentRationale: state.synthesisSentimentRationale,
      valuationRationale: state.synthesisValuationRationale
    },
    scores: {
      growth: state.growthScore,
      moat: state.moatScore,
      financialHealth: state.financialHealthScore,
      sentiment: state.sentimentScore,
      valuation: state.valuationScore
    }
  }, null, 2);

  const prompt = `Report Generator:

You are a senior equity research analyst writing a client-facing investment brief. Using all research data, write a structured markdown report.

Data:
${fullResearchPackage}

Write the report in this EXACT structure:

# ${resolvedName} — Investment Research Brief

## Verdict: ${state.verdict} (${state.confidence || 50}% confidence)
> ${state.headline || "Investment Analysis Complete"}

## Company Snapshot
[2-3 sentences: what they do, where they operate, stage of business]

## Investment Thesis
[3-4 sentences making the core case for or against]

## Scorecard
| Dimension | Score | Weight | Weighted |
|-----------|-------|--------|---------|
| Growth | X/10 | 25% | X.X |
| Moat | X/10 | 20% | X.X |
| Financial Health | X/10 | 25% | X.X |
| Sentiment | X/10 | 15% | X.X |
| Valuation | X/10 | 15% | X.X |
| **Total** | | | **X.X/10** |

## Key Strengths
- Strength 1
- Strength 2
- Strength 3

## Key Risks
- Risk 1
- Risk 2
- Risk 3

## What to Watch
[2-3 triggers that would change this verdict]

## Analyst Note
[1-2 sentences of honest uncertainty or caveats about data quality]

---
*Research generated by AI Investment Agent · ${date} · For informational purposes only*

Write in a professional but direct tone. No fluff. Every sentence must add information.`;

  const result = await llm.invoke(prompt);
  
  return {
    report: result.content as string,
    logs: [`✅ Report Generated`],
  };
};
