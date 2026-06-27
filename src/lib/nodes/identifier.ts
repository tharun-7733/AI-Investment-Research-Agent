// Node: Company Identifier
// Resolves a user-supplied company name into structured company info.

import { State } from "../agent/state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const getLLM = () => new ChatGoogleGenerativeAI({ model: "gemini-2.0-flash", temperature: 0.1 });

export const companyIdentifier = async (state: State): Promise<Partial<State>> => {
  const llm = getLLM();

  const prompt = `You are a financial data resolver. Given a company name, extract and return ONLY a JSON object with no markdown, no explanation.

Input: "${state.companyName}"

Return this exact structure:
{
  "resolvedName": "Official company name",
  "ticker": "Stock ticker or null if private",
  "exchange": "NSE/BSE/NASDAQ/NYSE/null",
  "country": "Country of headquarters",
  "sector": "Primary sector",
  "industry": "Specific industry",
  "isPublic": true/false,
  "founded": "Year or null",
  "description": "One sentence describing what the company does"
}

Rules:
- If the company is private (startup, unlisted), set ticker and exchange to null
- If you cannot resolve the company, return { "error": "Company not found" }
- Never wrap in markdown or backticks`;

  const raw = await llm.invoke(prompt);
  const rawText = typeof raw.content === "string" ? raw.content : JSON.stringify(raw.content);

  let result: {
    resolvedName?: string;
    ticker?: string | null;
    exchange?: string | null;
    country?: string;
    sector?: string;
    industry?: string;
    isPublic?: boolean;
    founded?: string | null;
    description?: string;
    error?: string;
  } = {};

  try {
    result = JSON.parse(rawText.trim());
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) result = JSON.parse(match[0]);
  }

  if (result.error) throw new Error(`Company Identifier: ${result.error}`);

  const ticker = result.ticker || null;
  const exchange = result.exchange && result.exchange !== "null" ? result.exchange : null;

  return {
    resolvedName: result.resolvedName ?? state.companyName,
    ticker,
    exchange,
    country: result.country ?? "Unknown",
    sector: result.sector ?? "Unknown",
    industry: result.industry ?? "Unknown",
    isPublic: result.isPublic ?? false,
    founded: result.founded ?? null,
    companyDescription: result.description ?? "",
    logs: [
      `✅ Identified: ${result.resolvedName} (${ticker ?? "PRIVATE"})`,
      `   Exchange: ${exchange ?? "N/A"} | Sector: ${result.sector} | Industry: ${result.industry}`,
      `   HQ: ${result.country} | Founded: ${result.founded ?? "Unknown"} | Public: ${result.isPublic}`,
    ],
  };
};
