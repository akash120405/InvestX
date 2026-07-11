import { Annotation } from "@langchain/langgraph";
import type { CompanyId, Sentiment, Risk, Verdict } from "./schema";
import type { FundamentalsResult } from "./tools/financials";
import type { NewsResult } from "./tools/search";

/**
 * Shared state that flows through every node of the graph.
 * Each node reads what it needs and returns a partial patch;
 * LangGraph merges patches into this state between steps.
 */
export const AgentState = Annotation.Root({
  input: Annotation<string>(),

  companyId: Annotation<CompanyId | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  news: Annotation<NewsResult | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  fundamentals: Annotation<FundamentalsResult | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  sentiment: Annotation<Sentiment | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  risk: Annotation<Risk | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  verdict: Annotation<Verdict | null>({
    reducer: (_, next) => next,
    default: () => null,
  }),

  errors: Annotation<string[]>({
    reducer: (curr, next) => curr.concat(next),
    default: () => [],
  }),
});

export type AgentStateType = typeof AgentState.State;
