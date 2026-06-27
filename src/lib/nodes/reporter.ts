import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AgentState } from "../types";

export const reporterNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  const companyInfo = state.companyInfo || {};
  const scores = state.scores || {};
  const synth = state.synthesis || {};
  const comp = state.competitiveAnalysis || {};
  
  const resolvedName = companyInfo.name || state.companyInput || "the company";
  const verdict = state.verdict || "UNKNOWN";
  const confidence = state.confidence || 0;
  const weightedTotal = scores.weightedTotal || 5;
  const headline = state.headline || "No headline provided";
  const sector = companyInfo.sector || "Unknown sector";
  const country = companyInfo.country || "Unknown country";
  const description = companyInfo.description || "No description provided";
  const keyStrengths = synth.keyStrengths?.join(", ") || "None listed";
  const keyRisks = synth.keyRisks?.join(", ") || "None listed";
  
  const growth = scores.growth || 5;
  const moat = scores.moat || 5;
  const financialHealth = scores.financialHealth || 5;
  const sentiment = scores.sentiment || 5;
  const valuation = scores.valuation || 5;
  
  const investThesis = state.investThesis || "No thesis provided";
  const watchFor = state.watchFor?.join(", ") || "Nothing specified";
  const mainCompetitors = comp.mainCompetitors?.join(", ") || "None listed";
  const moatType = comp.moatType || "none";
  const moatStrength = comp.moatStrength || 5;

  const dateStr = new Date().toISOString().split('T')[0];

  try {
    const model = new ChatGoogleGenerativeAI({
      model: "gemini-2.5-flash",
      temperature: 0.3,
      maxOutputTokens: 1500,
    });

    const systemPrompt = "You are a senior equity research analyst writing a client-facing investment brief.\nWrite in clean markdown. Be direct and factual.\nEvery sentence must add information.";
    
    const userPrompt = `Write a full investment research brief for ${resolvedName} using this data:
  
  Verdict: ${verdict} | Score: ${weightedTotal}/10 | Confidence: ${confidence}%
  Headline: ${headline}
  Sector: ${sector} | Country: ${country}
  Description: ${description}
  Strengths: ${keyStrengths}
  Risks: ${keyRisks}
  Scores: Growth ${growth} | Moat ${moat} | Health ${financialHealth} | Sentiment ${sentiment} | Valuation ${valuation}
  Investment Thesis: ${investThesis}
  Watch For: ${watchFor}
  Competitors: ${mainCompetitors}
  Moat: ${moatType} (${moatStrength}/10)
  
  Use this EXACT markdown structure:
  
  # ${resolvedName} — Investment Research Brief
  ## Verdict: ${verdict} (${confidence}% confidence)
  > ${headline}
  ## Company Snapshot
  ## Investment Thesis
  ## Scorecard
  (markdown table with all 5 dimensions + weights)
  ## Key Strengths
  ## Key Risks  
  ## Competitive Position
  ## What to Watch
  ## Analyst Note
  ---
  *AI Investment Agent · ${dateStr} · Informational only*`;

    const response = await model.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ]);

    let content = typeof response.content === 'string' 
      ? response.content 
      : (Array.isArray(response.content) && response.content.length > 0 && 'text' in response.content[0]) 
        ? String((response.content[0] as any).text) 
        : '';
        
    // If Claude/Gemini wraps in code block, strip the backticks
    if (content.startsWith("\`\`\`markdown")) {
      content = content.replace(/^\`\`\`markdown\n?/, '').replace(/\`\`\`\n?$/, '').trim();
    } else if (content.startsWith("\`\`\`")) {
      content = content.replace(/^\`\`\`\n?/, '').replace(/\`\`\`\n?$/, '').trim();
    }
    
    return {
      report: content,
      streamLog: ["✅ Report generated"]
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      streamLog: [`❌ Error in Reporter Node: ${errorMessage}`],
      report: `# ${resolvedName} — Investment Research Brief\n\nFailed to generate report due to error: ${errorMessage}`
    };
  }
};
