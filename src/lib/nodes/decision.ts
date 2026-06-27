// Node: Investment Decision
// Final investment committee verdict: INVEST | WATCH | PASS.

import { State } from "../state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const getLLM = () => new ChatGoogleGenerativeAI({ model: "gemini-2.0-flash", temperature: 0.1 });

export const decisionNode = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();
  const resolvedName = state.companyInfo?.name || state.companyInput;
  const weightedTotal = state.scores?.weightedTotal || 5;

  const scoresObj = JSON.stringify({
    growth: state.scores?.growth,
    moat: state.scores?.moat,
    financialHealth: state.scores?.financialHealth,
    sentiment: state.scores?.sentiment,
    valuation: state.scores?.valuation,
  });
  const keyStrengths = JSON.stringify(state.synthesis?.keyStrengths || []);
  const keyRisks = JSON.stringify(state.synthesis?.keyRisks || []);

  const prompt = `Investment Decision Node:

You are the final decision-maker at an investment committee. Based on the synthesis below, issue a formal investment verdict.

Company: ${resolvedName}
Weighted Score: ${weightedTotal.toFixed(2)} / 10
Scores: ${scoresObj}
Strengths: ${keyStrengths}
Risks: ${keyRisks}

Decision thresholds:
- INVEST: weightedTotal >= 7.0 AND no critical red flags
- WATCH: weightedTotal >= 5.5 AND < 7.0 OR score >= 7 but red flags present
- PASS: weightedTotal < 5.5 OR critical structural risks exist

Return ONLY a JSON object:
{
  "verdict": "INVEST | WATCH | PASS",
  "confidence": <50-99 integer, your confidence in this verdict>,
  "timeHorizon": "short-term (< 1yr) | medium-term (1-3yr) | long-term (3yr+) | N/A",
  "headline": "One punchy sentence summarizing the verdict (like a Bloomberg headline)",
  "investThesis": "3-4 sentences: why this is or isn't a good investment RIGHT NOW",
  "watchFor": ["trigger 1 to revisit", "trigger 2"] or [],
  "comparableTo": "This company is like [well-known comparable] because [reason]"
}

No markdown. The verdict must be defensible from the score data.`;

  const raw = await llm.invoke(prompt);
  const rawText = typeof raw.content === "string" ? raw.content : JSON.stringify(raw.content);

  let result: any = {};
  try {
    const cleaned = rawText.trim().replace(/^```json|```$/g, "").trim();
    result = JSON.parse(cleaned);
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      result = JSON.parse(match[0]);
    }
  }

  const validVerdicts = ["INVEST", "WATCH", "PASS"];
  let verdict = result.verdict?.toUpperCase();
  if (!validVerdicts.includes(verdict)) {
    if (weightedTotal >= 7) verdict = "INVEST";
    else if (weightedTotal >= 5.5) verdict = "WATCH";
    else verdict = "PASS";
  }

  return {
    verdict: verdict as "INVEST" | "WATCH" | "PASS",
    confidence: result.confidence || 50,
    timeHorizon: result.timeHorizon || "N/A",
    headline: result.headline || `${verdict} rating assigned based on score of ${weightedTotal.toFixed(2)}`,
    investThesis: result.investThesis || "",
    watchFor: Array.isArray(result.watchFor) ? result.watchFor : [],
    comparableTo: result.comparableTo || "",
    streamLog: [
      `✅ Decision Made - Verdict: ${verdict} (Confidence: ${result.confidence || 50}%)`,
      `   Headline: ${result.headline || "N/A"}`,
    ],
  };
};
