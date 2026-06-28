import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../types";
import { safeParseLlmJson, extractTextContent } from "../utils/parseJson";
import { runMultipleSearches } from "../tools/tavilySearch";

export const webSearchNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const companyInfo = state.companyInfo;
  const resolvedName = companyInfo?.name || state.companyInput || "the company";
  const sector = companyInfo?.sector || "their sector";

  try {
    // Step 1 — Generate search queries
    const queryLlm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.1,
      maxOutputTokens: 1024,
    });

    const systemPrompt1 =
      "You are a financial research analyst.\nReturn ONLY a JSON array of 5 strings. \nNo markdown, no explanation.";
    const userPrompt1 = `Generate 5 targeted investment research \nsearch queries for: ${resolvedName} in ${sector}.\nCover: latest financials or funding, recent news, \ncompetitors, leadership or controversies, \nfuture outlook.`;

    const queryResponse = await queryLlm.invoke([
      { role: "system", content: systemPrompt1 },
      { role: "user", content: userPrompt1 },
    ]);

    const queryRaw = extractTextContent(queryResponse.content);
    const { data: queriesData, error: queryError } = safeParseLlmJson<string[]>(
      queryRaw,
      "WebSearchNode/queries"
    );

    const queries: string[] = Array.isArray(queriesData) ? queriesData : [];
    if (queryError) {
      console.warn("[WebSearchNode] Could not parse queries, proceeding with empty list.");
    }

    // Step 2 — Run searches
    let searchResultsStr = "";
    if (queries.length > 0) {
      const searchResults = await runMultipleSearches(queries);
      if (searchResults.length > 0) {
        searchResultsStr = searchResults
          .map((r) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
          .join("\n\n---\n\n");
      }
    }

    if (!searchResultsStr) {
      searchResultsStr = "No search results found.";
    }

    // Step 3 — Synthesize results
    const summaryLlm = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.2,
      maxOutputTokens: 2048,
    });

    const systemPrompt2 =
      "You are a senior equity research analyst.\nReturn ONLY valid JSON, no markdown.";
    const userPrompt2 = `Analyze these search results about ${resolvedName}:\n${searchResultsStr}\n\nReturn this exact JSON:\n{\n  "keyDevelopments": ["string"],\n  "sentiment": "positive" | "neutral" | "negative",\n  "sentimentScore": number (1-10),\n  "redFlags": ["string"],\n  "tailwinds": ["string"],\n  "recentEvents": ["string"],\n  "sourceSummary": "string"\n}\nIf data is missing use null for that field.`;

    const synthResponse = await summaryLlm.invoke([
      { role: "system", content: systemPrompt2 },
      { role: "user", content: userPrompt2 },
    ]);

    const synthRaw = extractTextContent(synthResponse.content);
    const { data: parsedResult, error: synthError } = safeParseLlmJson(
      synthRaw,
      "WebSearchNode/synthesis"
    );

    const webAnalysis = parsedResult ?? {
      keyDevelopments: null,
      sentiment: "neutral",
      sentimentScore: 5,
      redFlags: null,
      tailwinds: null,
      recentEvents: null,
      sourceSummary: null,
    };

    if (synthError) {
      console.warn("[WebSearchNode] Using fallback web analysis due to parse error.");
    }

    const sentiment = (webAnalysis as any).sentiment ?? "neutral";
    const score = (webAnalysis as any).sentimentScore ?? 5;

    return {
      webAnalysis: webAnalysis as AgentState["webAnalysis"],
      streamLog: [`✅ Web research complete. \n  Sentiment: ${sentiment} (${score}/10)`],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      streamLog: [`❌ Error in Web Search Node: ${errorMessage}`],
      webAnalysis: {
        sentiment: "neutral",
        sentimentScore: 5,
      },
    };
  }
};
