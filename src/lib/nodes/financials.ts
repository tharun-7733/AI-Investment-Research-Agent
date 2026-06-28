import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState, FinancialAnalysis } from "../types";
import { getFinancialData } from "../tools/alphaVantage";
import { safeParseLlmJson, extractTextContent } from "../utils/parseJson";

export const financialsNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const companyInfo = state.companyInfo;

  if (!companyInfo?.name) {
    return {
      streamLog: ["❌ Error: No company name available for Financials Node."],
      financialAnalysis: getEmptyAnalysis(),
    };
  }

  const resolvedName = companyInfo.name;
  const ticker = companyInfo.ticker || null;
  const sector = companyInfo.sector || "their sector";

  try {
    // Step 1 — Fetch financial data (graceful if API key missing)
    const financialData = await getFinancialData(ticker);

    // Step 2 — Analyze with Gemini
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.1,
      maxOutputTokens: 2048,
    });

    const systemPrompt =
      "You are a CFA-level financial analyst.\nReturn ONLY valid JSON, no markdown, no explanation.";
    const userPrompt = `Analyze this financial data for ${resolvedName}:\n${JSON.stringify(
      financialData,
      null,
      2
    )}\n\nReturn this exact JSON:\n{\n  "revenueGrowthYoY": number | null,\n  "grossMargin": number | null,\n  "netMargin": number | null,\n  "debtToEquity": number | null,\n  "peRatio": number | null,\n  "marketCap": "string | null",\n  "financialHealthScore": number,\n  "financialHealthRationale": "string",\n  "valuationRisk": "low" | "medium" | "high",\n  "valuationRationale": "string",\n  "estimated": boolean\n}\n\nfinancialHealthScore must be 1-10.\nFor private companies with no data, estimate using industry benchmarks for ${sector} and set estimated: true.\nScore conservatively if data is unavailable.`;

    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const raw = extractTextContent(response.content);
    const { data: parsedResult, error } = safeParseLlmJson(raw, "FinancialsNode");

    const result = (parsedResult ?? {}) as Record<string, unknown>;
    if (error) {
      console.warn("[FinancialsNode] Using fallback analysis due to parse error.");
    }

    // Safely cast fields
    const toStr = (val: unknown) =>
      val !== null && val !== undefined ? String(val) : null;

    const healthScore =
      typeof result.financialHealthScore === "number" ? result.financialHealthScore : 5;

    const analysis: FinancialAnalysis = {
      revenueGrowthYoY: toStr(result.revenueGrowthYoY),
      grossMargin: toStr(result.grossMargin),
      netMargin: toStr(result.netMargin),
      debtToEquity: result.debtToEquity as number | null,
      peRatio: result.peRatio as number | null,
      marketCap: toStr(result.marketCap),
      financialHealthScore: healthScore,
      financialHealthRationale:
        (result.financialHealthRationale as string) ||
        "No data available to determine health.",
      valuationRisk: (result.valuationRisk as "low" | "medium" | "high") || "medium",
      valuationRationale:
        (result.valuationRationale as string) ||
        "No data available to determine valuation.",
      estimated: !!result.estimated,
    };

    return {
      financialAnalysis: analysis,
      streamLog: [`✅ Financials analyzed. \n  Health score: ${healthScore}/10`],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      streamLog: [`❌ Error in Financials Node: ${errorMessage}`],
      financialAnalysis: getEmptyAnalysis(),
    };
  }
};

function getEmptyAnalysis(): FinancialAnalysis {
  return {
    revenueGrowthYoY: null,
    grossMargin: null,
    netMargin: null,
    debtToEquity: null,
    peRatio: null,
    marketCap: null,
    financialHealthScore: 5,
    financialHealthRationale: "Failed to fetch or parse financial data.",
    valuationRisk: "medium",
    valuationRationale: "Unknown due to error.",
    estimated: true,
  };
}
