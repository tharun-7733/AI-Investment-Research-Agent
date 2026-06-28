import { ChatGroq } from "@langchain/groq";
import { AgentState } from "../types";
import { safeParseLlmJson, extractTextContent } from "../utils/parseJson";

export const identifierNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const companyInput = state.companyInput;
  if (!companyInput) {
    return {
      error: "No companyInput provided in state.",
      streamLog: ["⊗ ABORT — No input provided."],
    };
  }

  try {
    const llm = new ChatGroq({
      model: "llama-3.3-70b-versatile",
      temperature: 0,
      maxTokens: 1024,
    });

    const systemPrompt =
      "You are a financial data resolver. Return ONLY valid JSON, no markdown, no explanation.";
    const userPrompt = `Given this company name: ${companyInput}
Return this exact JSON:
{
  "resolvedName": "string",
  "ticker": "string | null",
  "exchange": "string | null",
  "country": "string",
  "sector": "string",
  "industry": "string",
  "isPublic": boolean,
  "founded": "string | null",
  "description": "string"
}
If company not found return: { "error": "Not found" }
ticker and exchange are null for private companies.`;

    const response = await llm.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    const raw = extractTextContent(response.content);
    const { data: parsedResult, error } = safeParseLlmJson(raw, "IdentifierNode");

    if (error || !parsedResult) {
      return {
        error: `Failed to parse company data: ${error}`,
        streamLog: [`⊗ PARSE FAULT — ${error}`],
      };
    }

    const result = parsedResult as Record<string, unknown>;

    if (result.error) {
      return {
        error: String(result.error),
        streamLog: [`⊗ IDENTIFIER FAULT — ${result.error}`],
      };
    }

    // Rename resolvedName → name to match AgentState CompanyInfo type
    const { resolvedName, ...rest } = result;
    const companyInfo = { name: resolvedName, ...rest };

    return {
      companyInfo: companyInfo as AgentState["companyInfo"],
      streamLog: [`◈ RESOLVED: ${resolvedName} (${(companyInfo as any).ticker ?? "Private"})`],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: `Failed to resolve company data: ${errorMessage}`,
      streamLog: [`⊗ IDENTIFIER FAULT — ${errorMessage}`],
    };
  }
};
