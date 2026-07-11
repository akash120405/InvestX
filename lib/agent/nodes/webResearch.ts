import { searchCompanyNews } from "../tools/search";
import type { AgentStateType } from "../state";

/**
 * Node 2 — Web Research.
 * Pulls recent news, earnings coverage, and controversy signals via Tavily.
 * Runs in parallel with the fundamentals node (see graph.ts) since neither
 * depends on the other's output.
 */
export async function webResearchNode(state: AgentStateType) {
  const companyName = state.companyId?.companyName || state.input;
  try {
    const news = await searchCompanyNews(companyName);
    return { news };
  } catch (err: any) {
    return {
      news: { query: companyName, articles: [], answer: undefined },
      errors: [`Web research failed: ${err.message}`],
    };
  }
}
