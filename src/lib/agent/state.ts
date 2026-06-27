import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  companyName: Annotation<string>(),

  // Company Identifier outputs
  resolvedName: Annotation<string>(),
  ticker: Annotation<string | null>(),
  exchange: Annotation<string | null>(),
  country: Annotation<string>(),
  sector: Annotation<string>(),
  industry: Annotation<string>(),
  isPublic: Annotation<boolean>(),
  founded: Annotation<string | null>(),
  companyDescription: Annotation<string>(),

  // Web Search Synthesizer outputs
  webSearchContext: Annotation<string>(),           // sourceSummary 2-sentence summary
  sentiment: Annotation<string>(),                  // "positive" | "neutral" | "negative"
  keyDevelopments: Annotation<string[]>(),
  redFlags: Annotation<string[]>(),
  tailwinds: Annotation<string[]>(),
  recentEvents: Annotation<string[]>(),
  sourceSummary: Annotation<string>(),

  // Financial & Competitive Contexts
  financialContext: Annotation<string>(),
  revenueGrowthYoY: Annotation<string | null>(),
  grossMargin: Annotation<string | null>(),
  netMargin: Annotation<string | null>(),
  debtToEquity: Annotation<number | string | null>(),
  peRatio: Annotation<number | string | null>(),
  marketCap: Annotation<string | null>(),
  cashPosition: Annotation<string | null>(),
  burnRate: Annotation<string | null>(),
  financialHealthRationale: Annotation<string>(),
  valuationRisk: Annotation<string>(),
  valuationRationale: Annotation<string>(),
  competitiveContext: Annotation<string>(),

  // Scores (1-10)
  sentimentScore: Annotation<number>(),
  financialHealthScore: Annotation<number>(),
  valuationScore: Annotation<number>(),
  growthScore: Annotation<number>(),
  moatScore: Annotation<number>(),

  // Final Outputs
  synthesisScore: Annotation<number>(),
  verdict: Annotation<"INVEST" | "WATCH" | "PASS">(),
  report: Annotation<string>(),
  
  // Traces for UI
  logs: Annotation<string[]>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
});

export type State = typeof GraphState.State;
