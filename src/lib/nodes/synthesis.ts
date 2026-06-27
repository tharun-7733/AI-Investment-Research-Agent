import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState, DimensionScores, SynthesisRationales } from "../types";

export const synthesisNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const companyInfo = state.companyInfo;
  
  if (!companyInfo?.name) {
    return {
      streamLog: ["❌ Error: No company name available for Synthesis Node."],
      scores: getEmptyScores(),
      synthesis: getEmptySynthesis()
    };
  }

  const resolvedName = companyInfo.name;
  
  const webSentimentScore = state.webAnalysis?.sentimentScore ?? 5;
  const financialHealthScore = state.financialAnalysis?.financialHealthScore ?? 5;
  const competitiveScore = state.competitiveAnalysis?.competitiveScore ?? 5;
  const redFlags = state.webAnalysis?.redFlags?.join(", ") || "None found";
  const moatType = state.competitiveAnalysis?.moatType || "none";
  const moatStrength = state.competitiveAnalysis?.moatStrength ?? 5;
  const valuationRisk = state.financialAnalysis?.valuationRisk || "unknown";
  const keyDevelopments = state.webAnalysis?.keyDevelopments?.join(", ") || "None found";

  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
      maxOutputTokens: 800,
    });

    const systemPrompt = "You are a partner at a top-tier investment firm.\nReturn ONLY valid JSON, no markdown.";
    const userPrompt = `Score ${resolvedName} across 5 investment dimensions.
  
  Research data:
  - Web sentiment score: ${webSentimentScore}/10
  - Financial health score: ${financialHealthScore}/10
  - Competitive score: ${competitiveScore}/10
  - Red flags: ${redFlags}
  - Moat: ${moatType} 
    strength ${moatStrength}/10
  - Valuation risk: ${valuationRisk}
  - Key developments: ${keyDevelopments}
  
  Score each dimension 1-10 strictly based on data above.
  Then calculate weightedTotal using:
  Growth×0.25 + Moat×0.20 + FinancialHealth×0.25 + 
  Sentiment×0.15 + Valuation×0.15
  
  Return this exact JSON:
  {
    "scores": {
      "growth": number,
      "moat": number,
      "financialHealth": number,
      "sentiment": number,
      "valuation": number,
      "weightedTotal": number
    },
    "growthRationale": "string",
    "moatRationale": "string",
    "financialHealthRationale": "string",
    "sentimentRationale": "string",
    "valuationRationale": "string",
    "keyStrengths": ["string"],
    "keyRisks": ["string"]
  }`;

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
      console.error("[SynthesisNode] Failed to parse JSON:", e);
      parsedResult = { scores: getEmptyScores() };
    }

    const rawScores = parsedResult.scores || getEmptyScores();
    const s_growth = typeof rawScores.growth === 'number' ? rawScores.growth : 5;
    const s_moat = typeof rawScores.moat === 'number' ? rawScores.moat : 5;
    const s_fin = typeof rawScores.financialHealth === 'number' ? rawScores.financialHealth : 5;
    const s_sent = typeof rawScores.sentiment === 'number' ? rawScores.sentiment : 5;
    const s_val = typeof rawScores.valuation === 'number' ? rawScores.valuation : 5;

    const calculated = (
      s_growth * 0.25 +
      s_moat * 0.20 +
      s_fin * 0.25 +
      s_sent * 0.15 +
      s_val * 0.15
    );

    const scores: DimensionScores = {
      growth: s_growth,
      moat: s_moat,
      financialHealth: s_fin,
      sentiment: s_sent,
      valuation: s_val,
      weightedTotal: Number(calculated.toFixed(2))
    };

    const synthesis: SynthesisRationales = {
      growthRationale: parsedResult.growthRationale || "No rationale provided",
      moatRationale: parsedResult.moatRationale || "No rationale provided",
      financialHealthRationale: parsedResult.financialHealthRationale || "No rationale provided",
      sentimentRationale: parsedResult.sentimentRationale || "No rationale provided",
      valuationRationale: parsedResult.valuationRationale || "No rationale provided",
      keyStrengths: Array.isArray(parsedResult.keyStrengths) ? parsedResult.keyStrengths : [],
      keyRisks: Array.isArray(parsedResult.keyRisks) ? parsedResult.keyRisks : [],
    };

    return {
      scores,
      synthesis,
      streamLog: [`✅ Score: ${scores.weightedTotal}/10`]
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      streamLog: [`❌ Error in Synthesis Node: ${errorMessage}`],
      scores: getEmptyScores(),
      synthesis: getEmptySynthesis()
    };
  }
};

function getEmptyScores(): DimensionScores {
  return {
    growth: 5,
    moat: 5,
    financialHealth: 5,
    sentiment: 5,
    valuation: 5,
    weightedTotal: 5.00
  };
}

function getEmptySynthesis(): SynthesisRationales {
  return {
    growthRationale: "Failed to evaluate",
    moatRationale: "Failed to evaluate",
    financialHealthRationale: "Failed to evaluate",
    sentimentRationale: "Failed to evaluate",
    valuationRationale: "Failed to evaluate",
    keyStrengths: [],
    keyRisks: []
  };
}
