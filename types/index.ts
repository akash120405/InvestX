export interface CompanyId {
  companyName: string;
  ticker: string | null;
  exchange: string | null;
  isPublic: boolean;
  sector: string | null;
  reasoning: string;
}

export interface FundamentalsOverview {
  name: string;
  sector: string;
  marketCap: string;
  peRatio: string;
  pegRatio: string;
  eps: string;
  profitMargin: string;
  revenueTTM: string;
  revenueGrowthYoY: string;
  grossProfitTTM: string;
  fiftyTwoWeekHigh: string;
  fiftyTwoWeekLow: string;
  analystTargetPrice: string;
  beta: string;
  dividendYield: string;
}

export interface Fundamentals {
  ticker: string | null;
  available: boolean;
  overview?: FundamentalsOverview;
  note?: string;
}

export interface Sentiment {
  overallSentiment: "positive" | "neutral" | "negative" | "mixed";
  sentimentScore: number;
  keyPositives: string[];
  keyNegatives: string[];
  redFlags: string[];
  summary: string;
}

export interface Risk {
  overallRiskLevel: "low" | "medium" | "high" | "severe";
  riskScore: number;
  financialRisks: string[];
  marketRisks: string[];
  competitiveRisks: string[];
  mitigatingFactors: string[];
}

export interface Verdict {
  decision: "INVEST" | "PASS" | "WATCH";
  confidence: number;
  investmentScore: number;
  thesis: string;
  supportingReasons: string[];
  counterReasons: string[];
  timeHorizon: "short-term" | "medium-term" | "long-term";
  suggestedAction: string;
}

export interface TraceStep {
  step: string;
  label: string;
  status: "running" | "done" | "error";
  timestamp: number;
}
