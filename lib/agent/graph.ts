import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState } from "./state";
import { identifyNode } from "./nodes/identify";
import { webResearchNode } from "./nodes/webResearch";
import { fundamentalsNode } from "./nodes/fundamentals";
import { sentimentNode } from "./nodes/sentiment";
import { riskNode } from "./nodes/risk";
import { decisionNode } from "./nodes/decision";

/**
 * The pipeline, visually:
 *
 *        START
 *          |
 *       identify                     (resolve name -> ticker/exchange)
 *        /    \
 *  webResearch  fundamentalsStep      (fan out — independent data pulls)
 *        \    /
 *      sentimentStep                  (needs news)
 *          |
 *        riskStep                     (needs fundamentals + sentiment)
 *          |
 *      decision                       (needs everything)
 *          |
 *         END
 *
 * fundamentalsStep and webResearch have no dependency on each other, so they
 * run concurrently — LangGraph fans out from `identify` to both and only
 * proceeds to `sentimentStep` once both have completed (implicit join via
 * the shared state object), which keeps end-to-end latency down.
 *
 * NOTE ON NODE NAMES: newer @langchain/langgraph versions reject a node name
 * that's identical to a state channel name (e.g. a node called "fundamentals"
 * colliding with the `fundamentals` key in AgentState) — it throws
 * "X is already being used as a state attribute ... cannot also be used as
 * a node name" at graph-build time. So the node names below use a "Step"
 * suffix wherever they'd otherwise match a channel name; the STATE key
 * they write to (via the returned patch, e.g. `{ fundamentals: ... }`) is
 * unaffected and stays exactly as the frontend types expect.
 */
export function buildResearchGraph() {
  const graph = new StateGraph(AgentState)
    .addNode("identify", identifyNode)
    .addNode("webResearch", webResearchNode)
    .addNode("fundamentalsStep", fundamentalsNode)
    .addNode("sentimentStep", sentimentNode)
    .addNode("riskStep", riskNode)
    .addNode("decision", decisionNode)
    .addEdge(START, "identify")
    .addEdge("identify", "webResearch")
    .addEdge("identify", "fundamentalsStep")
    .addEdge("webResearch", "sentimentStep")
    .addEdge("fundamentalsStep", "sentimentStep")
    .addEdge("sentimentStep", "riskStep")
    .addEdge("riskStep", "decision")
    .addEdge("decision", END);

  return graph.compile();
}
