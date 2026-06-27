// Tool: Alpha Vantage Financial Data Fetcher
// Primary export: getFinancialData(ticker) — structured metrics from OVERVIEW.
// Legacy helpers: alphaVantageOverview / alphaVantageIncomeStatement preserved
//                 for backward-compatibility with existing callers.

import axios from "axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FinancialData {
  symbol: string;
  marketCap: string | null;
  peRatio: string | null;
  revenueGrowthYoY: string | null;
  grossMargin: string | null;
  netMargin: string | null;
  debtToEquity: string | null;
  weekHigh52: string | null;
  weekLow52: string | null;
  analystTarget: string | null;
  note?: string;
  raw: object;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

/** Return the value as-is if it is a meaningful string, else null. */
const clean = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t !== "" && t !== "None" && t !== "-" ? t : null;
};

/** Build a fully-null FinancialData shell with an explanatory note. */
const nullResult = (symbol: string, note: string): FinancialData => ({
  symbol,
  marketCap: null,
  peRatio: null,
  revenueGrowthYoY: null,
  grossMargin: null,
  netMargin: null,
  debtToEquity: null,
  weekHigh52: null,
  weekLow52: null,
  analystTarget: null,
  note,
  raw: {},
});

/**
 * Derive gross margin % from GrossProfitTTM and RevenueTTM.
 * Returns a 4-decimal percentage string, or null when data is unavailable.
 */
const deriveGrossMargin = (data: Record<string, unknown>): string | null => {
  const gp = parseFloat(data["GrossProfitTTM"] as string);
  const rev = parseFloat(data["RevenueTTM"] as string);
  if (!isNaN(gp) && !isNaN(rev) && rev !== 0) {
    return ((gp / rev) * 100).toFixed(4);
  }
  return null;
};

// ─── getFinancialData ─────────────────────────────────────────────────────────

/**
 * Fetches structured financial metrics for a publicly-listed company via the
 * Alpha Vantage OVERVIEW endpoint.
 *
 * @param ticker - Stock symbol (e.g. "AAPL"). Pass null for private companies.
 * @returns A FinancialData object. Never throws — errors surface as null fields
 *          plus an explanatory `note`.
 */
export const getFinancialData = async (
  ticker: string | null
): Promise<FinancialData> => {

  // ── Private-company shortcut ──────────────────────────────────────────────
  if (!ticker) {
    return nullResult("PRIVATE", "Private company - no public financial data");
  }

  const symbol = ticker.trim().toUpperCase();

  // ── API-key guard ─────────────────────────────────────────────────────────
  const apiKey = process.env.ALPHA_VANTAGE_KEY;
  if (!apiKey) {
    console.warn("[AlphaVantage] ALPHA_VANTAGE_KEY is not set.");
    return nullResult(symbol, "ALPHA_VANTAGE_KEY environment variable is not configured.");
  }

  // ── Fetch OVERVIEW ────────────────────────────────────────────────────────
  try {
    const { data } = await axios.get<Record<string, unknown>>(
      "https://www.alphavantage.co/query",
      {
        params: { function: "OVERVIEW", symbol, apikey: apiKey },
        timeout: 10_000, // 10 s — never block the agent indefinitely
      }
    );

    // Empty body → invalid ticker or upstream issue
    if (!data || Object.keys(data).length === 0) {
      return nullResult(
        symbol,
        "Alpha Vantage returned an empty response — ticker may be invalid."
      );
    }

    // API encodes rate-limit / error messages inside the JSON body
    const apiMsg =
      (data["Information"] ?? data["Note"] ?? data["Error Message"]) as
        | string
        | undefined;
    if (apiMsg) {
      console.warn(`[AlphaVantage] API message for ${symbol}: ${apiMsg}`);
      return nullResult(symbol, apiMsg);
    }

    // ── Map OVERVIEW fields → FinancialData ───────────────────────────────
    // All numeric values are returned as strings to avoid float precision loss.
    return {
      symbol,
      marketCap: clean(data["MarketCapitalization"]),
      peRatio: clean(data["PERatio"]),
      // OVERVIEW has no direct YoY revenue growth field; derive from
      // INCOME_STATEMENT via alphaVantageIncomeStatement if needed.
      revenueGrowthYoY: null,
      grossMargin: deriveGrossMargin(data),
      netMargin: clean(data["ProfitMargin"]),
      debtToEquity: clean(data["DebtToEquityRatio"]),
      weekHigh52: clean(data["52WeekHigh"]),
      weekLow52: clean(data["52WeekLow"]),
      analystTarget: clean(data["AnalystTargetPrice"]),
      raw: data as object,
    };

  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? `HTTP ${error.response?.status ?? "unknown"}: ${error.message}`
      : String(error);

    console.error(`[AlphaVantage] Request failed for ${symbol}:`, message);
    return nullResult(symbol, `API request failed: ${message}`);
  }
};

// ─── Legacy helpers (preserved for backward-compatibility) ────────────────────

export const alphaVantageOverview = async (ticker: string): Promise<string> => {
  try {
    // Support both env-var names so nothing breaks during migration
    const apiKey =
      process.env.ALPHA_VANTAGE_KEY ?? process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) return "Alpha Vantage API key not configured.";

    const { data } = await axios.get("https://www.alphavantage.co/query", {
      params: { function: "OVERVIEW", symbol: ticker, apikey: apiKey },
      timeout: 10_000,
    });

    if (data.Information) return data.Information;
    if (Object.keys(data).length === 0) return "No financial overview found.";
    return JSON.stringify(data);
  } catch (error) {
    console.error("Alpha Vantage Overview Error:", error);
    return "Failed to fetch financial overview.";
  }
};

export const alphaVantageIncomeStatement = async (
  ticker: string
): Promise<string> => {
  try {
    const apiKey =
      process.env.ALPHA_VANTAGE_KEY ?? process.env.ALPHA_VANTAGE_API_KEY;
    if (!apiKey) return "Alpha Vantage API key not configured.";

    const { data } = await axios.get("https://www.alphavantage.co/query", {
      params: { function: "INCOME_STATEMENT", symbol: ticker, apikey: apiKey },
      timeout: 10_000,
    });

    if (data.Information) return data.Information;
    if (Object.keys(data).length === 0) return "No income statement found.";
    return JSON.stringify(data.annualReports?.slice(0, 2) || data);
  } catch (error) {
    console.error("Alpha Vantage Income Statement Error:", error);
    return "Failed to fetch income statement.";
  }
};
