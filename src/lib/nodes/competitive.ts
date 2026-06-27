import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState, CompetitiveAnalysis } from "../types";

export const competitiveNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const companyInfo = state.companyInfo;
  
  if (!companyInfo?.name) {
    return {
      streamLog: ["❌ Error: No company name available for Competitive Node."],
      competitiveAnalysis: getEmptyAnalysis()
    };
  }

  const resolvedName = companyInfo.name;
  const industry = companyInfo.industry || "their sector";
  const webSummary = state.webAnalysis?.sourceSummary || "No web search summary available. Use general knowledge about the company.";
  const recentEvents = state.webAnalysis?.recentEvents?.length 
    ? state.webAnalysis.recentEvents.join(", ") 
    : "No recent events from search.";

  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
      maxOutputTokens: 600,
    });

    const systemPrompt = "You are a strategy consultant specializing in competitive analysis.\nReturn ONLY valid JSON, no markdown.";
    const userPrompt = `Analyze the competitive position of ${resolvedName} in the ${industry} industry.\n\nContext from web research:\n${webSummary}\nRecent events: ${recentEvents}\n\nReturn this exact JSON:\n{\n  "mainCompetitors": ["string"], // (top 3-5)\n  "marketPosition": "leader"|"challenger"|"niche"|"emerging",\n  "moatType": "brand"|"network_effects"|"cost_advantage"|"switching_costs"|"IP"|"none",\n  "moatStrength": number (1-10),\n  "moatRationale": "string",\n  "differentiators": ["string"],\n  "threats": ["string"],\n  "marketSizeTAM": "string | null",\n  "competitiveScore": number (1-10)\n}\n\nBe specific. Use real competitor names.\nBase moat score strictly on evidence from context.`;

    const response = await model.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    const content = typeof response.content === 'string' 
      ? response.content 
      : (Array.isArray(response.content) && response.content.length > 0 && 'text' in response.content[0]) 
        ? String((response.content[0] as any).text) 
        : '';
        
    const jsonStr = content.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
    
    let parsedResult: any;
    try {
      parsedResult = JSON.parse(jsonStr);
    } catch (e) {
      console.error("[CompetitiveNode] Failed to parse JSON:", e);
      parsedResult = getEmptyAnalysis();
    }
    
    const analysis: CompetitiveAnalysis = {
      mainCompetitors: Array.isArray(parsedResult.mainCompetitors) ? parsedResult.mainCompetitors : [],
      marketPosition: parsedResult.marketPosition || "challenger",
      moatType: parsedResult.moatType || "none",
      moatStrength: typeof parsedResult.moatStrength === 'number' ? parsedResult.moatStrength : 5,
      moatRationale: parsedResult.moatRationale || "No data available.",
      differentiators: Array.isArray(parsedResult.differentiators) ? parsedResult.differentiators : [],
      threats: Array.isArray(parsedResult.threats) ? parsedResult.threats : [],
      marketSizeTAM: parsedResult.marketSizeTAM || null,
      competitiveScore: typeof parsedResult.competitiveScore === 'number' ? parsedResult.competitiveScore : 5
    };

    return {
      competitiveAnalysis: analysis,
      streamLog: [`✅ Competitive analysis done. \n  Moat: ${analysis.moatType} (${analysis.moatStrength}/10)`]
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      streamLog: [`❌ Error in Competitive Node: ${errorMessage}`],
      competitiveAnalysis: getEmptyAnalysis()
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
    competitiveScore: 5
  };
}
