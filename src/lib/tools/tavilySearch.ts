// Tool: Tavily Web Search
// Wraps the @tavily/core package for use inside LangGraph nodes.

import { tavily } from "@tavily/core";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

// ─── Client Factory ──────────────────────────────────────────────────────────

const getClient = () => {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY is not set in environment variables.");
  return tavily({ apiKey });
};

// ─── runTavilySearch ─────────────────────────────────────────────────────────
// Runs a single Tavily search and returns structured results.
// On failure, logs the error and returns an empty array (never throws).

export const runTavilySearch = async (
  query: string,
  maxResults: number = 5
): Promise<TavilyResult[]> => {
  try {
    const client = getClient();

    const response = await client.search(query, {
      searchDepth: "advanced",
      includeAnswer: true,
      maxResults,
    });

    const results: TavilyResult[] = (response.results ?? []).map((r) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      content: r.content ?? "",
      score: r.score ?? 0,
    }));

    return results;
  } catch (error) {
    console.error(`[TavilySearch] Failed for query "${query}":`, error);
    return [];
  }
};

// ─── runMultipleSearches ─────────────────────────────────────────────────────
// Runs multiple queries in parallel, merges all results into a flat array,
// and deduplicates by URL before returning.

export const runMultipleSearches = async (
  queries: string[],
  maxResultsPerQuery: number = 5
): Promise<TavilyResult[]> => {
  const settled = await Promise.allSettled(
    queries.map((q) => runTavilySearch(q, maxResultsPerQuery))
  );

  const allResults: TavilyResult[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") {
      allResults.push(...result.value);
    }
    // rejected means runTavilySearch already handled the error and returned []
    // so this branch is unreachable in practice, but we're defensive here
  }

  // Deduplicate by URL, keeping the highest-scoring entry for each URL
  const seen = new Map<string, TavilyResult>();
  for (const item of allResults) {
    const existing = seen.get(item.url);
    if (!existing || item.score > existing.score) {
      seen.set(item.url, item);
    }
  }

  // Sort descending by score before returning
  return Array.from(seen.values()).sort((a, b) => b.score - a.score);
};
