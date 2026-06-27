// Tool: Alpha Vantage
// Fetches company overview and income statement from Alpha Vantage.

export const alphaVantageOverview = async (ticker: string): Promise<string> => {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) return "Alpha Vantage API key not configured.";

    const response = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`
    );
    const data = await response.json();

    if (data.Information) return data.Information;
    if (Object.keys(data).length === 0) return "No financial overview found.";

    return JSON.stringify(data);
  } catch (error) {
    console.error("Alpha Vantage Overview Error:", error);
    return "Failed to fetch financial overview.";
  }
};

export const alphaVantageIncomeStatement = async (ticker: string): Promise<string> => {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) return "Alpha Vantage API key not configured.";

    const response = await fetch(
      `https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`
    );
    const data = await response.json();

    if (data.Information) return data.Information;
    if (Object.keys(data).length === 0) return "No income statement found.";

    return JSON.stringify(data.annualReports?.slice(0, 2) || data);
  } catch (error) {
    console.error("Alpha Vantage Income Statement Error:", error);
    return "Failed to fetch income statement.";
  }
};
