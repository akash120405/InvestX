import { getChatModel } from "@/lib/llm";
import { CompanyIdSchema } from "../schema";
import type { AgentStateType } from "../state";

/**
 * Node 1 — Identify.
 * Turns whatever the user typed ("Zomato", "the company that makes the
 * iPhone", "TCS") into a clean company name plus a best-guess ticker and
 * exchange, using the LLM's world knowledge. Downstream tool calls
 * (Alpha Vantage) use this as a hint but re-verify independently.
 */
export async function identifyNode(state: AgentStateType) {
  const model = getChatModel(0).withStructuredOutput(CompanyIdSchema, { name: "company_id" });

  const result = await model.invoke([
    {
      role: "system",
      content:
        "You identify companies for a financial research pipeline. Given a user's " +
        "free-text input, return the canonical company name, its most likely public " +
        "stock ticker and primary exchange (or null if private/unknown), its sector, " +
        "and a one-line reasoning. Be conservative — if unsure whether it is public, say so.",
    },
    { role: "user", content: state.input },
  ]);

  return { companyId: result };
}
