import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../types";

export const identifierNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const companyInput = state.companyInput;
  if (!companyInput) {
    return {
      error: "No companyInput provided in state.",
      streamLog: ["❌ Error: No companyInput provided in state."],
    };
  }

  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash", // Good default for simple parsing tasks
      temperature: 0,
      maxOutputTokens: 500,
    });

    const systemPrompt = "You are a financial data resolver. Return ONLY valid JSON, no markdown, no explanation.";
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

    const response = await model.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    const content = typeof response.content === 'string' ? response.content : (Array.isArray(response.content) && response.content.length > 0 && 'text' in response.content[0]) ? String((response.content[0] as any).text) : '';
    
    // Attempt to extract JSON if it was wrapped in markdown despite instructions
    const jsonStr = content.replace(/```json\n?/, '').replace(/```\n?$/, '').trim();

    const parsedResult = JSON.parse(jsonStr);

    if (parsedResult.error) {
      return {
        error: parsedResult.error,
        streamLog: [`❌ Identifier Error: ${parsedResult.error}`],
      };
    }

    // Rename resolvedName to name to match the AgentState CompanyInfo type
    const { resolvedName, ...rest } = parsedResult;
    const companyInfo = {
      name: resolvedName,
      ...rest,
    };

    return {
      companyInfo,
      streamLog: [`✅ Identified: ${resolvedName} (${companyInfo.ticker ?? 'Private'})`],
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      error: `Failed to resolve company data: ${errorMessage}`,
      streamLog: [`❌ Error in Identifier Node: ${errorMessage}`],
    };
  }
};
