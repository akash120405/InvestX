import { z } from "zod";

/** Output of the "resolve company" node — turns a free-text name into a ticker. */
export const CompanyIdSchema = z.object({
  companyName: z.string().describe("Cleaned, canonical company name"),
  ticker: z.string().nullable().describe("Best-guess public ticker symbol, or null if not public"),
  exchange: z.string().nullable().describe("Primary listing exchange, e.g. NASDAQ, NSE, BSE"),
  isPublic: z.boolean(),
  sector: z.string().nullable(),
  reasoning: z.string().describe("One line on how the ticker was identified/confirmed"),
});
export type CompanyId = z.infer<typeof CompanyIdSchema>;

/** Output of the sentiment/news-analysis node. */
export const SentimentSchema = z.object({
  overallSentiment: z.enum(["positive", "neutral", "negative", "mixed"]),
  sentimentScore: z.number().min(-1).max(1).describe("-1 very negative, +1 very positive"),
  keyPositives: z.array(z.string()).max(5),
  keyNegatives: z.array(z.string()).max(5),
  redFlags: z.array(z.string()).max(5).describe("Governance, legal, or narrative red flags found in coverage"),
  summary: z.string(),
});
export type Sentiment = z.infer<typeof SentimentSchema>;

/** Output of the risk-assessment node. */
export const RiskSchema = z.object({
  overallRiskLevel: z.enum(["low", "medium", "high", "severe"]),
  riskScore: z.number().min(0).max(10),
  financialRisks: z.array(z.string()).max(5),
  marketRisks: z.array(z.string()).max(5),
  competitiveRisks: z.array(z.string()).max(5),
  mitigatingFactors: z.array(z.string()).max(5),
});
export type Risk = z.infer<typeof RiskSchema>;

/** Final decision node output — this is what the UI renders as the verdict. */
export const VerdictSchema = z.object({
  decision: z.enum(["INVEST", "PASS", "WATCH"]),
  confidence: z.number().min(0).max(100).describe("Confidence in the decision, 0-100"),
  investmentScore: z.number().min(0).max(100).describe("Composite score across fundamentals, sentiment, risk"),
  thesis: z.string().describe("2-3 sentence investment thesis explaining the call"),
  supportingReasons: z.array(z.string()).min(2).max(6),
  counterReasons: z.array(z.string()).min(1).max(6).describe("Strongest reasons against this call, for balance"),
  timeHorizon: z.enum(["short-term", "medium-term", "long-term"]),
  suggestedAction: z.string().describe("One concrete next step for a human analyst reviewing this"),
});
export type Verdict = z.infer<typeof VerdictSchema>;

/** A single entry in the live research trace shown in the UI. */
export interface TraceEvent {
  step: string;
  label: string;
  status: "running" | "done" | "error";
  detail?: string;
  timestamp: number;
}
