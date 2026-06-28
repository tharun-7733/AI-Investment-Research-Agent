// Node: Investment Decision
// Final investment committee verdict: INVEST | WATCH | PASS.

import { State } from "../state";
import { ChatGroq } from "@langchain/groq";
import { safeParseLlmJson, extractTextContent } from "../utils/parseJson";

const getLLM = () =>
  new ChatGroq({
    model: "llama-3.3-70b-versatile",
    temperature: 0.2,
    maxTokens: 2048,
  });

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
  "verdict": "INVEST",
  "confidence": 75,
  "timeHorizon": "medium-term (1-3yr)",
  "headline": "One punchy sentence summarizing the verdict",
  "investThesis": "3-4 sentences explaining why this is or is not a good investment RIGHT NOW",
  "watchFor": ["trigger 1 to revisit", "trigger 2"],
  "comparableTo": "This company is like [well-known comparable] because [reason]"
}

No markdown. verdict must be one of: INVEST, WATCH, PASS. The verdict must be defensible from the score data.`;

  const raw = await llm.invoke(prompt);
  const rawText = extractTextContent(raw.content);

  const { data: parsedResult, error } = safeParseLlmJson(rawText, "DecisionNode");

  if (error) {
    console.warn("[DecisionNode] Using fallback decision due to parse error.");
  }

  const result = (parsedResult ?? {}) as Record<string, unknown>;

  const validVerdicts = ["INVEST", "WATCH", "PASS"];
  let verdict = typeof result.verdict === "string" ? result.verdict.toUpperCase() : "";
  if (!validVerdicts.includes(verdict)) {
    if (weightedTotal >= 7) verdict = "INVEST";
    else if (weightedTotal >= 5.5) verdict = "WATCH";
    else verdict = "PASS";
  }

  return {
    verdict: verdict as "INVEST" | "WATCH" | "PASS",
    confidence: typeof result.confidence === "number" ? result.confidence : 50,
    timeHorizon: (result.timeHorizon as string) || "N/A",
    headline:
      (result.headline as string) ||
      `${verdict} rating assigned based on score of ${weightedTotal.toFixed(2)}`,
    investThesis: (result.investThesis as string) || "",
    watchFor: Array.isArray(result.watchFor) ? result.watchFor as string[] : [],
    comparableTo: (result.comparableTo as string) || "",
    streamLog: [
      `◈ VERDICT LOCKED — ${verdict} (Confidence: ${result.confidence ?? 50}%)`,
      `   Headline: ${(result.headline as string) || "N/A"}`,
    ],
  };
};
