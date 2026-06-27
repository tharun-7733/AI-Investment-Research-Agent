// Tool: Tavily Web Search
// Wraps the Tavily search API for use inside LangGraph nodes.

export const tavilySearch = async (query: string): Promise<string> => {
  try {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey) return "Tavily API key not configured.";

    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: true,
        max_results: 5,
      }),
    });

    const data = await response.json();
    return data.answer || JSON.stringify(data.results) || "No results found.";
  } catch (error) {
    console.error("Tavily Search Error:", error);
    return "Failed to search the web.";
  }
};
