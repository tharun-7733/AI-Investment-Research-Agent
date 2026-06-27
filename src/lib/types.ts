// ─── Agent State ────────────────────────────────────────────────────────────
// Central type used across all LangGraph nodes.
// All fields are optional (?) so partial state updates work cleanly.

export interface CompanyInfo {
  name?: string;
  ticker?: string | null;
  exchange?: string | null;
  sector?: string;
  industry?: string;
  isPublic?: boolean;
  country?: string;
  founded?: string | null;
  description?: string;
}

export interface WebAnalysis {
  keyDevelopments?: string[];
  sentiment?: "positive" | "neutral" | "negative";
  sentimentScore?: number;           // 1-10
  redFlags?: string[];
  tailwinds?: string[];
  recentEvents?: string[];
  sourceSummary?: string;
}

export interface FinancialAnalysis {
  revenueGrowthYoY?: string | null;  // e.g. "18.5%"
  grossMargin?: string | null;        // e.g. "42%"
  netMargin?: string | null;
  debtToEquity?: number | string | null;
  peRatio?: number | string | null;
  marketCap?: string | null;          // e.g. "$4.2B"
  cashPosition?: string | null;
  burnRate?: string | null;           // monthly burn for startups
  financialHealthScore?: number;      // 1-10
  financialHealthRationale?: string;
  valuationRisk?: "low" | "medium" | "high";
  valuationRationale?: string;
  estimated?: boolean;                // true if data was estimated
}

export interface CompetitiveAnalysis {
  mainCompetitors?: string[];
  marketPosition?: "leader" | "challenger" | "niche" | "emerging";
  moatType?: "brand" | "network_effects" | "cost_advantage" | "switching_costs" | "IP" | "none";
  moatStrength?: number;              // 1-10
  moatRationale?: string;
  differentiators?: string[];
  threats?: string[];
  marketSizeTAM?: string | null;
  competitiveScore?: number;          // 1-10
}

export interface DimensionScores {
  growth?: number;                    // 1-10, weight 25%
  moat?: number;                      // 1-10, weight 20%
  financialHealth?: number;           // 1-10, weight 25%
  sentiment?: number;                 // 1-10, weight 15%
  valuation?: number;                 // 1-10, weight 15%
  weightedTotal?: number;             // calculated, 2 decimal places
}

export interface SynthesisRationales {
  growthRationale?: string;
  moatRationale?: string;
  financialHealthRationale?: string;
  sentimentRationale?: string;
  valuationRationale?: string;
  keyStrengths?: string[];
  keyRisks?: string[];
}

export interface AgentState {
  // ── Input ──────────────────────────────────────────────────────────────────
  companyInput?: string;

  // ── Node outputs ───────────────────────────────────────────────────────────
  companyInfo?: CompanyInfo;
  webAnalysis?: WebAnalysis;
  financialAnalysis?: FinancialAnalysis;
  competitiveAnalysis?: CompetitiveAnalysis;
  scores?: DimensionScores;
  synthesis?: SynthesisRationales;

  // ── Final decision ─────────────────────────────────────────────────────────
  verdict?: "INVEST" | "WATCH" | "PASS";
  confidence?: number;               // 50-99
  timeHorizon?: string;              // "short-term (<1yr)" | "medium-term (1-3yr)" | "long-term (3yr+)" | "N/A"
  headline?: string;
  investThesis?: string;
  watchFor?: string[];
  comparableTo?: string;

  // ── Report ─────────────────────────────────────────────────────────────────
  report?: string;                   // full markdown report

  // ── Runtime ────────────────────────────────────────────────────────────────
  streamLog?: string[];              // live trace for the UI
  error?: string | null;
}
