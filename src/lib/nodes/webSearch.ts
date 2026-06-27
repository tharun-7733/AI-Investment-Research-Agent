import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../types";
import { runMultipleSearches } from "../tools/tavilySearch";

export const webSearchNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const companyInfo = state.companyInfo;
  const resolvedName = companyInfo?.name || state.companyInput || "the company";
  const sector = companyInfo?.sector || "their sector";

  try {
    // Step 1 — Generate search queries
    const queryModel = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
    });

    const systemPrompt1 = "You are a financial research analyst.\nReturn ONLY a JSON array of 5 strings. \nNo markdown, no explanation.";
    const userPrompt1 = `Generate 5 targeted investment research \nsearch queries for: ${resolvedName} in ${sector}.\nCover: latest financials or funding, recent news, \ncompetitors, leadership or controversies, \nfuture outlook.`;

    const queryResponse = await queryModel.invoke([
      { role: "system", content: systemPrompt1 },
      { role: "user", content: userPrompt1 }
    ]);

    const queryContent = typeof queryResponse.content === 'string' 
      ? queryResponse.content 
      : (Array.isArray(queryResponse.content) && queryResponse.content.length > 0 && 'text' in queryResponse.content[0]) 
        ? String((queryResponse.content[0] as any).text) 
        : '';
        
    const queryJsonStr = queryContent.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
    
    let queries: string[] = [];
    try {
      queries = JSON.parse(queryJsonStr);
      if (!Array.isArray(queries)) {
        queries = [];
      }
    } catch (e) {
      console.error("[WebSearchNode] Failed to parse queries:", e);
    }

    // Step 2 — Run searches
    let searchResultsStr = "";
    if (queries.length > 0) {
      const searchResults = await runMultipleSearches(queries);
      if (searchResults.length > 0) {
        searchResultsStr = searchResults
          .map(r => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}`)
          .join("\n\n---\n\n");
      }
    }

    if (!searchResultsStr) {
      searchResultsStr = "No search results found.";
    }

    // Step 3 — Synthesize results
    const synthModel = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0,
    });

    const systemPrompt2 = "You are a senior equity research analyst.\nReturn ONLY valid JSON, no markdown.";
    const userPrompt2 = `Analyze these search results about ${resolvedName}:\n${searchResultsStr}\n\nReturn this exact JSON:\n{\n  "keyDevelopments": ["string"],\n  "sentiment": "positive" | "neutral" | "negative",\n  "sentimentScore": number (1-10),\n  "redFlags": ["string"],\n  "tailwinds": ["string"],\n  "recentEvents": ["string"],\n  "sourceSummary": "string"\n}\nIf data is missing use null for that field.`;

    const synthResponse = await synthModel.invoke([
      { role: "system", content: systemPrompt2 },
      { role: "user", content: userPrompt2 }
    ]);

    const synthContent = typeof synthResponse.content === 'string' 
      ? synthResponse.content 
      : (Array.isArray(synthResponse.content) && synthResponse.content.length > 0 && 'text' in synthResponse.content[0]) 
        ? String((synthResponse.content[0] as any).text) 
        : '';

    const synthJsonStr = synthContent.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();
    
    let parsedResult;
    try {
      parsedResult = JSON.parse(synthJsonStr);
    } catch (e) {
      console.error("[WebSearchNode] Failed to parse synthesis:", e);
      parsedResult = {
        keyDevelopments: null,
        sentiment: "neutral",
        sentimentScore: 5,
        redFlags: null,
        tailwinds: null,
        recentEvents: null,
        sourceSummary: null
      };
    }

    // Step 4
    const sentiment = parsedResult.sentiment ?? 'neutral';
    const score = parsedResult.sentimentScore ?? 5;
    
    return {
      webAnalysis: parsedResult,
      streamLog: [`✅ Web research complete. \n  Sentiment: ${sentiment} (${score}/10)`]
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      streamLog: [`❌ Error in Web Search Node: ${errorMessage}`],
      // Never throw, always return partial state
      webAnalysis: {
        sentiment: "neutral",
        sentimentScore: 5,
      }
    };
  }
};
