// Node: Synthesis & Scoring Engine
// Acts as a VC partner synthesizing all research into weighted scores and rationales.

import { State } from "../state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const getLLM = () => new ChatGoogleGenerativeAI({ model: "gemini-2.0-flash", temperature: 0.1 });

export const synthesisEngine = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();
  const resolvedName = state.companyInfo?.name || state.companyInput;

  const companyInfo = `Sector: ${state.companyInfo?.sector}, Industry: ${state.companyInfo?.industry}, Founded: ${state.companyInfo?.founded}. ${state.companyInfo?.description}`;
  const webAnalysis = `Sentiment: ${state.webAnalysis?.sentiment}. ${state.webAnalysis?.sourceSummary}`;
  const financialAnalysis = `Health Score: ${state.financialAnalysis?.financialHealthScore}. Rationale: ${state.financialAnalysis?.financialHealthRationale}. Valuation Risk: ${state.financialAnalysis?.valuationRisk}.`;
  const competitiveAnalysis = `Position: ${state.competitiveAnalysis?.marketPosition}. Moat: ${state.competitiveAnalysis?.moatType}. Competitors: ${(state.competitiveAnalysis?.mainCompetitors || []).join(", ")}. ${state.competitiveAnalysis?.moatRationale}`;

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
  const growthScore = scores.growth || state.scores?.growth || 5;
  const moatScore = scores.moat || state.scores?.moat || 5;
  const financialHealthScore = scores.financialHealth || state.scores?.financialHealth || 5;
  const sentimentScore = scores.sentiment || state.scores?.sentiment || 5;
  const valuationScore = scores.valuation || state.scores?.valuation || 5;

  let synthesisScore = result.weightedTotal;
  if (typeof synthesisScore !== "number") {
    synthesisScore =
      growthScore * 0.25 +
      moatScore * 0.20 +
      financialHealthScore * 0.25 +
      sentimentScore * 0.15 +
      valuationScore * 0.15;
  }

  return {
    synthesis: {
      growthRationale: result.growthRationale || "",
      moatRationale: result.moatRationale || "",
      financialHealthRationale: result.financialHealthRationale || "",
      sentimentRationale: result.sentimentRationale || "",
      valuationRationale: result.valuationRationale || "",
      keyStrengths: result.keyStrengths || [],
      keyRisks: result.keyRisks || [],
    },
    scores: {
      growth: growthScore,
      moat: moatScore,
      financialHealth: financialHealthScore,
      sentiment: sentimentScore,
      valuation: valuationScore,
      weightedTotal: synthesisScore,
    },
    streamLog: [
      `✅ Synthesis Complete - Final Score: ${synthesisScore.toFixed(2)}/10`,
      `   (Growth: ${growthScore}, Moat: ${moatScore}, Health: ${financialHealthScore}, Sentiment: ${sentimentScore}, Val: ${valuationScore})`,
    ],
  };
};
