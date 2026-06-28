import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState, CompetitiveAnalysis } from "../types";
import { safeParseLlmJson, extractTextContent } from "../utils/parseJson";

export const competitiveNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const companyInfo = state.companyInfo;

  if (!companyInfo?.name) {
    return {
      streamLog: ["❌ Error: No company name available for Competitive Node."],
      competitiveAnalysis: getEmptyAnalysis(),
    };
  }

  const resolvedName = companyInfo.name;
  const industry = companyInfo.industry || "their sector";
  // webAnalysis is guaranteed to be present — competitive runs AFTER webSearch
  const webSummary =
    state.webAnalysis?.sourceSummary ||
    "No web search summary available. Use general knowledge about the company.";
  const recentEvents =
    state.webAnalysis?.recentEvents?.length
      ? state.webAnalysis.recentEvents.join(", ")
      : "No recent events from search.";

  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.1,
      maxOutputTokens: 2048,
    });

    const systemPrompt =
      "You are a strategy consultant specializing in competitive analysis.\nReturn ONLY valid JSON, no markdown.";
    const userPrompt = `Analyze the competitive position of ${resolvedName} in the ${industry} industry.\n\nContext from web research:\n${webSummary}\nRecent events: ${recentEvents}\n\nReturn this exact JSON:\n{\n  "mainCompetitors": ["string"],\n  "marketPosition": "leader" | "challenger" | "niche" | "emerging",\n  "moatType": "brand" | "network_effects" | "cost_advantage" | "switching_costs" | "IP" | "none",\n  "moatStrength": number,\n  "moatRationale": "string",\n  "differentiators": ["string"],\n  "threats": ["string"],\n  "marketSizeTAM": "string | null",\n  "competitiveScore": number\n}\n\nmoatStrength and competitiveScore must be 1-10.\nBe specific. Use real competitor names.\nBase moat score strictly on evidence from context.`;

    const response = await model.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const raw = extractTextContent(response.content);
    const { data: parsedResult, error } = safeParseLlmJson(raw, "CompetitiveNode");

    const result = (parsedResult ?? {}) as Record<string, unknown>;
    if (error) {
      console.warn("[CompetitiveNode] Using fallback analysis due to parse error.");
    }

    const analysis: CompetitiveAnalysis = {
      mainCompetitors: Array.isArray(result.mainCompetitors) ? result.mainCompetitors as string[] : [],
      marketPosition:
        (result.marketPosition as CompetitiveAnalysis["marketPosition"]) || "challenger",
      moatType: (result.moatType as CompetitiveAnalysis["moatType"]) || "none",
      moatStrength: typeof result.moatStrength === "number" ? result.moatStrength : 5,
      moatRationale: (result.moatRationale as string) || "No data available.",
      differentiators: Array.isArray(result.differentiators) ? result.differentiators as string[] : [],
      threats: Array.isArray(result.threats) ? result.threats as string[] : [],
      marketSizeTAM: (result.marketSizeTAM as string) || null,
      competitiveScore: typeof result.competitiveScore === "number" ? result.competitiveScore : 5,
    };

    return {
      competitiveAnalysis: analysis,
      streamLog: [
        `✅ Competitive analysis done. \n  Moat: ${analysis.moatType} (${analysis.moatStrength}/10)`,
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      streamLog: [`❌ Error in Competitive Node: ${errorMessage}`],
      competitiveAnalysis: getEmptyAnalysis(),
    };
  }
};

function getEmptyAnalysis(): CompetitiveAnalysis {
  return {
    mainCompetitors: [],
    marketPosition: "challenger",
    moatType: "none",
    moatStrength: 5,
    moatRationale: "Unknown due to error.",
    differentiators: [],
    threats: [],
    marketSizeTAM: null,
    competitiveScore: 5,
  };
}
