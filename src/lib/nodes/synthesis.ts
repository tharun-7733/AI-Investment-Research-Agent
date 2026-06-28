import { ChatGroq } from "@langchain/groq";
import { AgentState, DimensionScores, SynthesisRationales } from "../types";
import { safeParseLlmJson, extractTextContent } from "../utils/parseJson";

export const synthesisNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const companyInfo = state.companyInfo;

  if (!companyInfo?.name) {
    return {
      streamLog: ["⊗ ABORT — No entity resolved for Synthesis."],
      scores: getEmptyScores(),
      synthesis: getEmptySynthesis(),
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
    const model = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      maxTokens: 2048,
    });

    const systemPrompt =
      "You are a partner at a top-tier investment firm.\nReturn ONLY valid JSON, no markdown.";
    const userPrompt = `Score ${resolvedName} across 5 investment dimensions.

Research data:
- Web sentiment score: ${webSentimentScore}/10
- Financial health score: ${financialHealthScore}/10
- Competitive score: ${competitiveScore}/10
- Red flags: ${redFlags}
- Moat: ${moatType}, strength ${moatStrength}/10
- Valuation risk: ${valuationRisk}
- Key developments: ${keyDevelopments}

Score each dimension 1-10 strictly based on data above.
Then calculate weightedTotal using:
Growth x 0.25 + Moat x 0.20 + FinancialHealth x 0.25 + Sentiment x 0.15 + Valuation x 0.15

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
      { role: "user", content: userPrompt },
    ]);

    const raw = extractTextContent(response.content);
    const { data: parsedResult, error } = safeParseLlmJson(raw, "SynthesisNode");

    const result = (parsedResult ?? {}) as Record<string, unknown>;
    if (error) {
      console.warn("[SynthesisNode] Using fallback scores due to parse error.");
    }

    const rawScores = (result.scores as Record<string, unknown>) || {};
    const s_growth = typeof rawScores.growth === "number" ? rawScores.growth : 5;
    const s_moat = typeof rawScores.moat === "number" ? rawScores.moat : 5;
    const s_fin = typeof rawScores.financialHealth === "number" ? rawScores.financialHealth : 5;
    const s_sent = typeof rawScores.sentiment === "number" ? rawScores.sentiment : 5;
    const s_val = typeof rawScores.valuation === "number" ? rawScores.valuation : 5;

    const calculated =
      s_growth * 0.25 + s_moat * 0.2 + s_fin * 0.25 + s_sent * 0.15 + s_val * 0.15;

    const scores: DimensionScores = {
      growth: s_growth,
      moat: s_moat,
      financialHealth: s_fin,
      sentiment: s_sent,
      valuation: s_val,
      weightedTotal: Number(calculated.toFixed(2)),
    };

    const synthesis: SynthesisRationales = {
      growthRationale: (result.growthRationale as string) || "No rationale provided",
      moatRationale: (result.moatRationale as string) || "No rationale provided",
      financialHealthRationale:
        (result.financialHealthRationale as string) || "No rationale provided",
      sentimentRationale: (result.sentimentRationale as string) || "No rationale provided",
      valuationRationale: (result.valuationRationale as string) || "No rationale provided",
      keyStrengths: Array.isArray(result.keyStrengths) ? result.keyStrengths as string[] : [],
      keyRisks: Array.isArray(result.keyRisks) ? result.keyRisks as string[] : [],
    };

    return {
      scores,
      synthesis,
      streamLog: [`◈ SCORE: ${scores.weightedTotal}/10`],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      streamLog: [`⊗ SYNTHESIS FAULT — ${errorMessage}`],
      scores: getEmptyScores(),
      synthesis: getEmptySynthesis(),
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
    weightedTotal: 5.0,
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
    keyRisks: [],
  };
}
