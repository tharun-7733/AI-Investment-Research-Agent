// Node: Competitive Intelligence Analyst
// Analyzes market position, moat, competitors, and TAM.

import { State } from "../state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const getLLM = () => new ChatGoogleGenerativeAI({ model: "gemini-2.0-flash", temperature: 0.1 });

export const competitiveIntel = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();
  const resolvedName = state.companyInfo?.name || state.companyInput;
  const industry = state.companyInfo?.industry || state.companyInfo?.sector || "Unknown Industry";
  const webSearchSummary = state.webAnalysis?.sourceSummary || "No web context available.";

  const prompt = `Competitive Intelligence Analyst:

You are a strategy consultant specializing in competitive analysis. Analyze ${resolvedName} in the context of its industry: ${industry}.

Use this context:
${webSearchSummary}

Return ONLY a JSON object:
{
  "mainCompetitors": ["competitor1", "competitor2", "competitor3"],
  "marketPosition": "leader | challenger | niche | emerging",
  "moatType": "brand | network_effects | cost_advantage | switching_costs | IP | none",
  "moatStrength": <1-10>,
  "moatRationale": "2-3 sentences explaining the moat score",
  "differentiators": ["point 1", "point 2"],
  "threats": ["threat 1", "threat 2"],
  "marketSizeTAM": "<estimated TAM or null>",
  "competitiveScore": <1-10>
}

No markdown. Base answers on available data; note uncertainty where it exists.`;

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

  const moatScore = result.moatStrength || result.competitiveScore || 5;
  const competitiveScore = result.competitiveScore || moatScore;

  return {
    competitiveAnalysis: {
      mainCompetitors: result.mainCompetitors || [],
      marketPosition: result.marketPosition || "unknown",
      moatType: result.moatType || "none",
      moatStrength: moatScore,
      moatRationale: result.moatRationale || "",
      differentiators: result.differentiators || [],
      threats: result.threats || [],
      marketSizeTAM: result.marketSizeTAM || null,
      competitiveScore,
    },
    scores: {
      moat: moatScore,
    },
    streamLog: [
      `✅ Competitive Intel Complete - Score: ${competitiveScore}/10, Position: ${result.marketPosition || "unknown"}, Moat: ${result.moatType || "none"}`,
      `   Competitors: ${(result.mainCompetitors || []).join(", ") || "N/A"}`,
    ],
  };
};
