import { Annotation } from "@langchain/langgraph";
import {
  CompanyInfo,
  WebAnalysis,
  FinancialAnalysis,
  CompetitiveAnalysis,
  DimensionScores,
  SynthesisRationales,
} from "./types";

export const GraphState = Annotation.Root({
  companyInput: Annotation<string>(),

  companyInfo: Annotation<CompanyInfo>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({}),
  }),
  webAnalysis: Annotation<WebAnalysis>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({}),
  }),
  financialAnalysis: Annotation<FinancialAnalysis>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({}),
  }),
  competitiveAnalysis: Annotation<CompetitiveAnalysis>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({}),
  }),
  scores: Annotation<DimensionScores>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({}),
  }),
  synthesis: Annotation<SynthesisRationales>({
    reducer: (curr, update) => ({ ...curr, ...update }),
    default: () => ({}),
  }),

  verdict: Annotation<"INVEST" | "WATCH" | "PASS">(),
  confidence: Annotation<number>(),
  timeHorizon: Annotation<string>(),
  headline: Annotation<string>(),
  investThesis: Annotation<string>(),
  watchFor: Annotation<string[]>({
    reducer: (curr, update) => update, // overwrite
    default: () => [],
  }),
  comparableTo: Annotation<string>(),
  
  report: Annotation<string>(),

  streamLog: Annotation<string[]>({
    reducer: (curr, update) => [...curr, ...update],
    default: () => [],
  }),
  error: Annotation<string | null>(),
});

export type State = typeof GraphState.State;
