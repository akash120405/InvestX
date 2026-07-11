import { getChatModel } from "@/lib/llm";
import { SentimentSchema } from "../schema";
import type { AgentStateType } from "../state";

/**
 * Node 4 — Sentiment & Narrative Analysis.
 * Reads the gathered news articles and extracts a structured sentiment
 * read: what's the market narrative, what's positive, what's a red flag.
 */
export async function sentimentNode(state: AgentStateType) {
  const model = getChatModel(0.2).withStructuredOutput(SentimentSchema, { name: "sentiment" });
  const companyName = state.companyId?.companyName || state.input;
  const news = state.news;

  const articleDump = news?.articles?.length
    ? news.articles.map((a, i) => `[${i + 1}] ${a.title}\n${a.content}`).join("\n\n")
    : news?.answer || "No live news data available for this run.";

  const result = await model.invoke([
    {
      role: "system",
      content:
        "You are an equity research analyst reading recent news coverage for a company. " +
        "Extract overall sentiment, a numeric sentiment score, key positives, key negatives, " +
        "and any governance/legal/narrative red flags. Be specific and cite what's in the " +
        "articles — do not invent facts not present in the source text.",
    },
    {
      role: "user",
      content: `Company: ${companyName}\n\nRecent coverage:\n${articleDump}`,
    },
  ]);

  return { sentiment: result };
}
