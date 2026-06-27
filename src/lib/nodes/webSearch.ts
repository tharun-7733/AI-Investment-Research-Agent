// Node: Web Search Agent
// Runs 5 targeted searches via Tavily and synthesizes web intelligence.

import { State } from "../state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import { runMultipleSearches, TavilyResult } from "../tools/tavilySearch";

const getLLM = () => new ChatGoogleGenerativeAI({ model: "gemini-2.0-flash", temperature: 0.1 });

export const webSearchAgent = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();
  const name = state.companyInfo?.name || state.companyInput;
  const ticker = state.companyInfo?.ticker ?? "N/A";
  const sector = state.companyInfo?.sector ?? "Unknown";

  // Step 1: Generate 5 targeted search queries via LLM
  const queryGenPrompt = `You are a financial research analyst. Given a company, generate exactly 5 targeted web search queries to gather investment-relevant information.

Company: ${name} (${ticker}, ${sector})

Generate queries covering:
1. Latest financial results or funding round
2. Recent news (last 6 months)
3. Competitive landscape and market position
4. Leadership, controversies, or red flags
5. Future outlook, expansion plans, or analyst ratings

Return ONLY a JSON array of 5 strings. No markdown, no explanation.
Example: ["query one", "query two", ...]`;

  const queryGenRaw = await llm.invoke(queryGenPrompt);
  const queryGenText =
    typeof queryGenRaw.content === "string" ? queryGenRaw.content : JSON.stringify(queryGenRaw.content);

  let queries: string[] = [];
  try {
    const cleaned = queryGenText.trim().replace(/^```json|```$/g, "").trim();
    queries = JSON.parse(cleaned);
  } catch {
    const match = queryGenText.match(/\[[\s\S]*\]/);
    if (match) queries = JSON.parse(match[0]);
  }

  if (!Array.isArray(queries) || queries.length === 0) {
    queries = [
      `${name} latest financial results`,
      `${name} news 2024 2025`,
      `${name} competitors market share`,
      `${name} CEO controversies red flags`,
      `${name} expansion analyst outlook`,
    ];
  }

  // Step 2: Run all searches in parallel, deduplicated by URL
  const results: TavilyResult[] = await runMultipleSearches(queries, 5);

  const combinedResults = results
    .map((r) => `[${r.title}](${r.url})\n${r.content}`)
    .join("\n\n---\n\n");

  // Step 3: Synthesize with structured output
  const schema = z.object({
    keyDevelopments: z.array(z.string()).describe("Key recent developments (3 bullets)"),
    sentiment: z.enum(["positive", "neutral", "negative"]).describe("Overall investment sentiment"),
    sentimentScore: z.number().min(1).max(10).describe("Sentiment score 1-10"),
    redFlags: z.array(z.string()).describe("Red flags or risks. Empty array if none."),
    tailwinds: z.array(z.string()).describe("Growth catalysts. Empty array if none."),
    recentEvents: z.array(z.string()).describe("Notable recent events"),
    sourceSummary: z.string().describe("2-sentence summary of what the web reveals"),
  });

  const structuredLlm = llm.withStructuredOutput(schema);
  const synthesisPrompt = `You are a senior equity research analyst. Below are raw web search results about ${name}.

Search Results:
${combinedResults.substring(0, 6000)}

Extract and return a structured analysis with:
- keyDevelopments: 3 key bullet points
- sentiment: "positive", "neutral", or "negative"
- sentimentScore: 1-10
- redFlags: any controversies, risks, or warning signs (empty array if none)
- tailwinds: positive growth catalysts (empty array if none)
- recentEvents: notable recent events
- sourceSummary: 2-sentence summary of what the web reveals right now

Be factual. If data is missing, use an empty array or note data unavailable.`;

  const result = await structuredLlm.invoke(synthesisPrompt);

  return {
    webAnalysis: {
      sentimentScore: result.sentimentScore,
      sentiment: result.sentiment,
      keyDevelopments: result.keyDevelopments,
      redFlags: result.redFlags,
      tailwinds: result.tailwinds,
      recentEvents: result.recentEvents,
      sourceSummary: result.sourceSummary,
    },
    scores: {
      sentiment: result.sentimentScore,
    },
    streamLog: [
      `✅ Web Search Complete — ${queries.length} queries, sentiment: ${result.sentiment} (${result.sentimentScore}/10)`,
      `   Key Developments: ${result.keyDevelopments.length} | Red Flags: ${result.redFlags.length} | Tailwinds: ${result.tailwinds.length}`,
      `   Queries: ${queries.map((q, i) => `\n     ${i + 1}. ${q}`).join("")}`,
    ],
  };
};
