export interface FundamentalsResult {
  ticker: string | null;
  available: boolean;
  overview?: {
    name: string;
    sector: string;
    marketCap: string;
    peRatio: string;
    pegRatio: string;
    eps: string;
    profitMargin: string;
    revenueTTM: string;
    revenueGrowthYoY: string;
    grossProfitTTM: string;
    fiftyTwoWeekHigh: string;
    fiftyTwoWeekLow: string;
    analystTargetPrice: string;
    beta: string;
    dividendYield: string;
  };
  note?: string;
}

const AV_BASE = "https://www.alphavantage.co/query";

/** fetch() with a hard timeout — Alpha Vantage occasionally hangs rather
 * than erroring cleanly, and Node's raw "fetch failed" gives no detail
 * about why, so we bound how long we wait and surface the real cause. */
async function fetchJson(url: string, timeoutMs = 8000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return await res.json();
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error(`Alpha Vantage request timed out after ${timeoutMs}ms`);
    }
    // Node's undici wraps the real network error in `.cause` — surface it
    // instead of the generic "fetch failed" so the actual problem is visible.
    const cause = err.cause?.message || err.cause?.code || err.message;
    throw new Error(`Network error reaching Alpha Vantage: ${cause}`);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Resolves a free-text company name to a ticker via Alpha Vantage's
 * SYMBOL_SEARCH, then pulls the OVERVIEW endpoint for core fundamentals.
 * Alpha Vantage's free tier is rate-limited (25 requests/day as of their
 * current policy) — when that's exhausted, it still returns HTTP 200 with
 * an `Information` field instead of real data, so we check for that
 * explicitly rather than treating it as a missing-ticker case.
 */
export async function getFundamentals(
  companyName: string,
  hintedTicker?: string | null
): Promise<FundamentalsResult> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

  if (!apiKey) {
    return {
      ticker: hintedTicker || null,
      available: false,
      note: "ALPHA_VANTAGE_API_KEY not configured — skipped live fundamentals. Add a key in .env to pull real financial statements.",
    };
  }

  let ticker = hintedTicker || null;

  if (!ticker) {
    const searchData = await fetchJson(
      `${AV_BASE}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(companyName)}&apikey=${apiKey}`
    );
    if (searchData?.Information || searchData?.Note) {
      return {
        ticker: null,
        available: false,
        note: `Alpha Vantage rate limit reached: ${searchData.Information || searchData.Note}`,
      };
    }
    const bestMatch = searchData?.bestMatches?.[0];
    ticker = bestMatch ? bestMatch["1. symbol"] : null;
  }

  if (!ticker) {
    return { ticker: null, available: false, note: "Could not resolve a ticker for this company." };
  }

  const o = await fetchJson(`${AV_BASE}?function=OVERVIEW&symbol=${ticker}&apikey=${apiKey}`);

  if (o?.Information || o?.Note) {
    return {
      ticker,
      available: false,
      note: `Alpha Vantage rate limit reached (free tier is capped per day): ${o.Information || o.Note}`,
    };
  }

  if (!o || !o.Symbol) {
    return {
      ticker,
      available: false,
      note: "Ticker resolved but Alpha Vantage returned no overview data (common for non-US listings on the free tier).",
    };
  }

  return {
    ticker,
    available: true,
    overview: {
      name: o.Name,
      sector: o.Sector,
      marketCap: o.MarketCapitalization,
      peRatio: o.PERatio,
      pegRatio: o.PEGRatio,
      eps: o.EPS,
      profitMargin: o.ProfitMargin,
      revenueTTM: o.RevenueTTM,
      revenueGrowthYoY: o.QuarterlyRevenueGrowthYOY,
      grossProfitTTM: o.GrossProfitTTM,
      fiftyTwoWeekHigh: o["52WeekHigh"],
      fiftyTwoWeekLow: o["52WeekLow"],
      analystTargetPrice: o.AnalystTargetPrice,
      beta: o.Beta,
      dividendYield: o.DividendYield,
    },
  };
}
