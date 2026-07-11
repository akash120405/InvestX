export interface NewsResult {
  query: string;
  articles: { title: string; url: string; content: string; publishedDate?: string }[];
  answer?: string;
}

/**
 * Thin wrapper around the Tavily search API (generous free tier, built for
 * LLM agents — returns clean snippets instead of raw HTML). We call it
 * directly with fetch rather than through @langchain/community so we have
 * full control over query shaping, error handling, and the trace we stream
 * to the UI.
 */
export async function searchCompanyNews(companyName: string): Promise<NewsResult> {
  const apiKey = process.env.TAVILY_API_KEY;
  const query = `${companyName} latest news, earnings, controversies, and market outlook`;

  if (!apiKey) {
    // Graceful degradation: the agent still runs end-to-end without a
    // Tavily key, just with a note instead of live headlines. This keeps
    // the demo usable for anyone reviewing the repo without every key.
    return {
      query,
      articles: [],
      answer:
        "TAVILY_API_KEY not configured — skipped live news search. Add a key in .env to enable real-time news research.",
    };
  }

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      include_answer: true,
      max_results: 6,
    }),
  });

  if (!res.ok) {
    throw new Error(`Tavily search failed: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    query,
    answer: data.answer,
    articles: (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      publishedDate: r.published_date,
    })),
  };
}
