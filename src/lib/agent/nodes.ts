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
  const schema = z.object({
    moatScore: z.number().min(1).max(10).describe("Competitive moat score (1-10)"),
    competitiveContext: z.string().describe("A summary of the company's competitive advantage (moat) and key competitors."),
  });
  
  const structuredLlm = llm.withStructuredOutput(schema);
  const prompt = `Analyze the competitive landscape for ${state.companyName} (${state.ticker}) in the ${state.sector} sector. 
  Identify key competitors and assess the strength of its competitive moat. Provide a moat score (1-10) and a summary.`;
  
  const result = await structuredLlm.invoke(prompt);
  
  return {
    moatScore: result.moatScore,
    competitiveContext: result.competitiveContext,
    logs: [`✅ Competitive Intel Complete - Moat Score: ${result.moatScore}/10`],
  };
};


// 11. Synthesis Engine Node
export const synthesisEngine = async (state: State): Promise<Partial<State>> => {
  // Weights: Growth 25%, Moat 20%, Financial Health 25%, Sentiment 15%, Valuation 15%
  const growthScore = state.growthScore || 5;
  const moatScore = state.moatScore || 5;
  const healthScore = state.financialHealthScore || 5;
  const sentimentScore = state.sentimentScore || 5;
  const valuationScore = state.valuationScore || 5;

  const synthesisScore = 
    (growthScore * 0.25) + 
    (moatScore * 0.20) + 
    (healthScore * 0.25) + 
    (sentimentScore * 0.15) + 
    (valuationScore * 0.15);

  return {
    synthesisScore,
    logs: [`✅ Synthesis Complete - Final Score: ${synthesisScore.toFixed(2)}/10`],
  };
};

export const decisionNode = async (state: State): Promise<Partial<State>> => {
  const score = state.synthesisScore || 5;
  let verdict: "INVEST" | "WATCH" | "PASS" = "PASS";
  
  if (score >= 7) {
    verdict = "INVEST";
  } else if (score >= 5.5) {
    verdict = "WATCH";
  } else {
    verdict = "PASS";
  }

  return {
    verdict,
    logs: [`✅ Decision Made - Verdict: ${verdict}`],
  };
};



// 30. Report Generator Node
export const reportGenerator = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();
  const prompt = `You are a Senior AI Investment Analyst. Generate a comprehensive investment research report in Markdown format for ${state.companyName} (${state.ticker}).

  Here is the collected data:
  Sector: ${state.sector}
  Country: ${state.country}
  
  Final Verdict: ${state.verdict}
  Overall Score: ${state.synthesisScore?.toFixed(2)}/10
  
  Dimension Scores:
  - Growth: ${state.growthScore}/10
  - Moat: ${state.moatScore}/10
  - Financial Health: ${state.financialHealthScore}/10
  - Sentiment: ${state.sentimentScore}/10
  - Valuation: ${state.valuationScore}/10
  
  Contexts:
  1. Web & Sentiment: ${state.webSearchContext}
  2. Financials: ${state.financialContext}
  3. Competitive Landscape: ${state.competitiveContext}
  
  Please format the report nicely with headers, bullet points, and a professional tone. End with the final verdict and a brief justification.`;

  const result = await llm.invoke(prompt);
  
  return {
    report: result.content as string,
    logs: [`✅ Report Generated`],
  };
};
