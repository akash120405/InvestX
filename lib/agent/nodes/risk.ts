import { getChatModel } from "@/lib/llm";
import { RiskSchema } from "../schema";
import type { AgentStateType } from "../state";

/**
 * Node 5 — Risk Assessment.
 * Synthesizes fundamentals + sentiment into a structured risk profile:
 * financial risk (leverage, margins, valuation stretch), market risk
 * (volatility, beta, cyclicality), and competitive risk (moat, narrative).
 */
export async function riskNode(state: AgentStateType) {
  const model = getChatModel(0.2).withStructuredOutput(RiskSchema, { name: "risk" });
  const companyName = state.companyId?.companyName || state.input;

  const fundamentalsText = state.fundamentals?.available
    ? JSON.stringify(state.fundamentals.overview, null, 2)
    : `No live fundamentals available. Note: ${state.fundamentals?.note || "unknown"}`;

  const sentimentText = state.sentiment
    ? JSON.stringify(state.sentiment, null, 2)
    : "No sentiment data available.";

  const result = await model.invoke([
    {
      role: "system",
      content:
        "You are a risk analyst. Given a company's fundamentals and recent sentiment, " +
        "assess overall risk level and score (0=riskless, 10=extreme), broken into " +
        "financial, market, and competitive risk factors, plus mitigating factors. " +
        "If fundamentals data is missing, reason qualitatively from sentiment and say so " +
        "explicitly rather than fabricating numbers.",
    },
    {
      role: "user",
      content: `Company: ${companyName}\n\nFundamentals:\n${fundamentalsText}\n\nSentiment:\n${sentimentText}`,
    },
  ]);

  return { risk: result };
}
