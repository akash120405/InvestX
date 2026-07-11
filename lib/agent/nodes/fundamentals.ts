import { getFundamentals } from "../tools/financials";
import type { AgentStateType } from "../state";

/**
 * Node 3 — Fundamentals.
 * Pulls market cap, valuation ratios, margins, and growth from Alpha Vantage.
 * Runs in parallel with webResearchNode.
 */
export async function fundamentalsNode(state: AgentStateType) {
  const companyName = state.companyId?.companyName || state.input;
  const hintedTicker = state.companyId?.ticker;
  try {
    const fundamentals = await getFundamentals(companyName, hintedTicker);
    return { fundamentals };
  } catch (err: any) {
    return {
      fundamentals: { ticker: hintedTicker || null, available: false, note: err.message },
      errors: [`Fundamentals lookup failed: ${err.message}`],
    };
  }
}
