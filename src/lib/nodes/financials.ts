import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState, FinancialAnalysis } from "../types";
import { getFinancialData } from "../tools/alphaVantage";

export const financialsNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const companyInfo = state.companyInfo;
  
  if (!companyInfo?.name) {
    return {
      streamLog: ["❌ Error: No company name available for Financials Node."],
      financialAnalysis: getEmptyAnalysis()
    };
  }

  const resolvedName = companyInfo.name;
  const ticker = companyInfo.ticker || null;
  const sector = companyInfo.sector || "their sector";

  try {
    // Step 1 — Fetch data
    const financialData = await getFinancialData(ticker);

    // Step 2 — Analyze with Gemini (per latest instructions)
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
      maxOutputTokens: 600,
    });

    const systemPrompt = "You are a CFA-level financial analyst.\nReturn ONLY valid JSON, no markdown, no explanation.";
    const userPrompt = `Analyze this financial data for ${resolvedName}:\n${JSON.stringify(financialData, null, 2)}\n\nReturn this exact JSON:\n{\n  "revenueGrowthYoY": number | null,\n  "grossMargin": number | null,\n  "netMargin": number | null,\n  "debtToEquity": number | null,\n  "peRatio": number | null,\n  "marketCap": "string | null",\n  "financialHealthScore": number (1-10),\n  "financialHealthRationale": "string",\n  "valuationRisk": "low" | "medium" | "high",\n  "valuationRationale": "string"\n}\n\nFor private companies with no data, estimate using \nindustry benchmarks for ${sector} and set \nestimated: true in the response.\nScore conservatively if data is unavailable.`;

    const response = await model.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    const content = typeof response.content === 'string' 
      ? response.content 
      : (Array.isArray(response.content) && response.content.length > 0 && 'text' in response.content[0]) 
        ? String((response.content[0] as any).text) 
        : '';
        
    const match = content.match(/\{[\s\S]*\}/);
    const jsonStr = match ? match[0] : content;
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(jsonStr);
    } catch (e) {
      console.error("[FinancialsNode] Failed to parse JSON:", e);
      parsedResult = getEmptyAnalysis();
    }

    // Always return a valid financialHealthScore even if estimated
    const healthScore = typeof parsedResult.financialHealthScore === 'number' 
      ? parsedResult.financialHealthScore 
      : 5;
    
    // Safely cast fields expecting string|null in the AgentState types
    const toStr = (val: any) => (val !== null && val !== undefined) ? String(val) : null;

    const analysis: FinancialAnalysis = {
      revenueGrowthYoY: toStr(parsedResult.revenueGrowthYoY),
      grossMargin: toStr(parsedResult.grossMargin),
      netMargin: toStr(parsedResult.netMargin),
      debtToEquity: parsedResult.debtToEquity,
      peRatio: parsedResult.peRatio,
      marketCap: toStr(parsedResult.marketCap),
      financialHealthScore: healthScore,
      financialHealthRationale: parsedResult.financialHealthRationale || "No data available to determine health.",
      valuationRisk: parsedResult.valuationRisk || "medium",
      valuationRationale: parsedResult.valuationRationale || "No data available to determine valuation.",
      estimated: !!parsedResult.estimated
    };

    // Step 3
    return {
      financialAnalysis: analysis,
      streamLog: [`✅ Financials analyzed. \n  Health score: ${healthScore}/10`]
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      streamLog: [`❌ Error in Financials Node: ${errorMessage}`],
      financialAnalysis: getEmptyAnalysis()
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
    estimated: true
  };
}
