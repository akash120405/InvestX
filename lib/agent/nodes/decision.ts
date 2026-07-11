import { getChatModel } from "@/lib/llm";
import { VerdictSchema } from "../schema";
import type { AgentStateType } from "../state";

/**
 * Node 6 — Decision Synthesis (final node).
 * Combines identification, fundamentals, sentiment, and risk into a single
 * structured verdict: INVEST / PASS / WATCH, with a thesis, supporting and
 * counter-reasons, a time horizon, and a suggested next action.
 *
 * Deliberately asks for counter-reasons too — a one-sided "why to invest"
 * output is a red flag in real research, and the assignment explicitly
 * wants "the reasoning behind its decision," not just the decision.
 */
export async function decisionNode(state: AgentStateType) {
  const model = getChatModel(0.3).withStructuredOutput(VerdictSchema, { name: "verdict" });

  const context = {
    company: state.companyId,
    fundamentals: state.fundamentals,
    sentiment: state.sentiment,
    risk: state.risk,
    dataGaps: state.errors,
  };

  const result = await model.invoke([
    {
      role: "system",
      content:
        "You are the lead decision-maker on an investment research desk. You have been " +
        "handed structured outputs from an identification analyst, a fundamentals analyst, " +
        "a sentiment analyst, and a risk analyst. Synthesize all of it into one verdict: " +
        "INVEST, PASS, or WATCH (use WATCH when signal is genuinely mixed and more data is " +
        "needed before either investing or passing). Give a confidence 0-100, a composite " +
        "investment score 0-100, a concise thesis, supporting reasons, honest counter-reasons " +
        "against your own call, a time horizon, and one concrete suggested next action. " +
        "If fundamentals or news data was unavailable, factor that uncertainty into your " +
        "confidence rather than ignoring it.",
    },
    { role: "user", content: JSON.stringify(context, null, 2) },
  ]);

  return { verdict: result };
}
