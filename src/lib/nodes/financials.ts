// Node: Financial Analyst (CFA-level)
// Fetches Alpha Vantage data and runs financial analysis via LLM.

import { State } from "../agent/state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { alphaVantageOverview, alphaVantageIncomeStatement } from "../tools/alphaVantage";

const getLLM = () => new ChatGoogleGenerativeAI({ model: "gemini-2.0-flash", temperature: 0.1 });

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

  // Seed downstream scores from qualitative metrics
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
    financialContext: result.financialHealthRationale
      ? `${result.financialHealthRationale} ${result.valuationRationale || ""}`
      : "Financial data processed.",
    logs: [
      `✅ Financial Analysis Complete - Health: ${result.financialHealthScore || 5}/10, Valuation Risk: ${result.valuationRisk || "N/A"}`,
    ],
  };
};
