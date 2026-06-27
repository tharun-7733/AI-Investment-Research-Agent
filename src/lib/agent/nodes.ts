import { State } from "./state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { tavilySearch, alphaVantageOverview, alphaVantageIncomeStatement } from "./tools";

// Initialize LLM (we'll assume keys are in environment)
const getLLM = () => new ChatGoogleGenerativeAI({ model: "gemini-3.0-pro", temperature: 0.1 });

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

  // Step 3: Synthesize into sentiment score + context
  const schema = z.object({
    sentimentScore: z
      .number()
      .min(1)
      .max(10)
      .describe("Sentiment score from 1 (very negative) to 10 (very positive)"),
    webSearchContext: z
      .string()
      .describe(
        "A comprehensive summary of recent news, controversies, outlook, and overall sentiment"
      ),
  });

  const structuredLlm = llm.withStructuredOutput(schema);
  const synthesisPrompt = `You are a financial research analyst. Based on the following web search results about ${name} (${ticker}), provide:
1. A sentiment score (1-10) reflecting the overall investment sentiment
2. A comprehensive summary covering: recent news, competitive position, leadership/red flags, and future outlook

Search Results:
${combinedResults.substring(0, 6000)}`;

  const result = await structuredLlm.invoke(synthesisPrompt);

  return {
    sentimentScore: result.sentimentScore,
    webSearchContext: result.webSearchContext,
    logs: [
      `✅ Web Search Complete — Generated ${queries.length} queries, gathered ${searchResults.length} results`,
      `   Sentiment Score: ${result.sentimentScore}/10`,
      `   Queries: ${queries.map((q, i) => `\n     ${i + 1}. ${q}`).join("")}`,
    ],
  };
};


export const financialAnalyst = async (state: State): Promise<Partial<State>> => {
  let overview = "No financial data found.";
  let income = "No income statement found.";
  
  if (state.isPublic && state.ticker) {
    overview = await alphaVantageOverview(state.ticker);
    income = await alphaVantageIncomeStatement(state.ticker);
  }

  const llm = getLLM();
  const schema = z.object({
    financialHealthScore: z.number().min(1).max(10).describe("Financial health score (1-10) based on margins, debt, etc."),
    valuationScore: z.number().min(1).max(10).describe("Valuation score (1-10) based on P/E, EV/EBITDA, etc."),
    growthScore: z.number().min(1).max(10).describe("Growth score (1-10) based on revenue and earnings growth."),
    financialContext: z.string().describe("A summary of the financial health, valuation, and growth prospects."),
  });
  
  const structuredLlm = llm.withStructuredOutput(schema);
  const prompt = `Analyze the following financial data for ${state.resolvedName || state.companyName}${state.ticker ? ` (${state.ticker})` : ""} and provide scores (1-10) for Financial Health, Valuation, and Growth, along with a summary.
  
  Overview Data:
  ${overview.substring(0, 2000)}
  
  Income Statement Data:
  ${income.substring(0, 2000)}`;
  
  const result = await structuredLlm.invoke(prompt);
  
  return {
    financialHealthScore: result.financialHealthScore,
    valuationScore: result.valuationScore,
    growthScore: result.growthScore,
    financialContext: result.financialContext,
    logs: [`✅ Financial Analysis Complete - Health: ${result.financialHealthScore}, Valuation: ${result.valuationScore}, Growth: ${result.growthScore}`],
  };
};

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
