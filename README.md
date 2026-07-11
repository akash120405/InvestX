# Ledger — AI Investment Research Agent

A six-node LangGraph.js pipeline that takes a company name, researches it (live news +
financial fundamentals), weighs sentiment and risk, and returns a structured
**INVEST / PASS / WATCH** verdict with full reasoning — streamed live to a
terminal-inspired UI so you can watch the agent think.

Built for the InsideIIM × Altuni AI Labs AI Product Development Engineer (Intern) take-home.

---

## Overview

**What it does:** you type a company name (e.g. "Zomato", "Nvidia", "Tata Motors"). The
agent:

1. Resolves it to a canonical name, ticker, and exchange.
2. In parallel, pulls recent news/coverage and financial fundamentals.
3. Analyzes sentiment and narrative risk from that coverage.
4. Assesses financial, market, and competitive risk.
5. Synthesizes everything into one verdict — with a thesis, supporting reasons, honest
   counter-reasons, a confidence score, a time horizon, and a suggested next action.

Every step streams to the UI live as it completes (Server-Sent Events), so the "research
trace" panel fills in step-by-step rather than showing a spinner for 20 seconds.

The verdict is intentionally **not** a one-sided pitch. The decision node is explicitly
prompted to produce counter-reasons against its own call, because a research agent that
only ever finds reasons to agree with itself isn't a research agent — it's a hype machine.

## How to run it

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Required? | Where to get it |
|---|---|---|
| `LLM_PROVIDER` | No (defaults to `anthropic`) | `anthropic`, `openai`, `openrouter`, or `groq` |
| `ANTHROPIC_API_KEY` | Yes, if `LLM_PROVIDER=anthropic` | [console.anthropic.com](https://console.anthropic.com) |
| `OPENAI_API_KEY` | Yes, if `LLM_PROVIDER=openai` | [platform.openai.com](https://platform.openai.com) |
| `OPENROUTER_API_KEY` | Yes, if `LLM_PROVIDER=openrouter` | [openrouter.ai/keys](https://openrouter.ai/keys) |
| `GROQ_API_KEY` | Yes, if `LLM_PROVIDER=groq` | [console.groq.com/keys](https://console.groq.com/keys) |
| `TAVILY_API_KEY` | Recommended | [tavily.com](https://tavily.com) — free tier, built for LLM agents |
| `ALPHA_VANTAGE_API_KEY` | Recommended | [alphavantage.co/support/#api-key](https://www.alphavantage.co/support/#api-key) — free tier |

**Only one LLM key is required** — pick whichever provider you actually have a key for
and set `LLM_PROVIDER` accordingly. `TAVILY_API_KEY` / `ALPHA_VANTAGE_API_KEY` are optional;
see the graceful-degradation note below.

**The agent runs without `TAVILY_API_KEY` or `ALPHA_VANTAGE_API_KEY`** — it degrades
gracefully and tells you in the UI which data source was skipped, and factors that
uncertainty into its confidence score. Only an LLM key is strictly required. This was a
deliberate choice so a reviewer can clone the repo and see the full pipeline run with just
one key, without needing to provision four separate accounts to evaluate it.

### 2b. (Optional) Sign-in with Google / X / Facebook

Sign-in is optional — the research agent works fully without it. It exists so research
runs can be saved to a personal history. If you skip this section, the app still runs;
the login page just shows "no sign-in providers configured" and history is saved under
a shared "guest" bucket in the browser instead of per-account.

To enable it, set `NEXTAUTH_SECRET` (any random string — `openssl rand -base64 32`
generates one) and `NEXTAUTH_URL` (`http://localhost:3000` locally, your Vercel URL in
production), then add credentials for whichever provider(s) you want:

| Provider | Where to create the app | Redirect URI to register |
|---|---|---|
| Google | [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) → "OAuth client ID" → Web application | `http://localhost:3000/api/auth/callback/google` |
| X (Twitter) | [developer.twitter.com/en/portal/dashboard](https://developer.twitter.com/en/portal/dashboard) → create app → enable OAuth 2.0 | `http://localhost:3000/api/auth/callback/twitter` |
| Facebook | [developers.facebook.com/apps](https://developers.facebook.com/apps) → create app → add "Facebook Login" product | `http://localhost:3000/api/auth/callback/facebook` |

Each provider only activates once **both** its client ID and secret are set — you don't
need all three, one is enough to enable sign-in.

### 3. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), type a company name, hit **Open File**.

### 4. Deploy (optional, for bonus points)

```bash
npm i -g vercel
vercel
```

Add the same environment variables in the Vercel project settings — including
`NEXTAUTH_URL` set to your actual deployed URL (not `localhost`), and update each OAuth
provider's redirect URI to point at `https://your-app.vercel.app/api/auth/callback/...`
once you know the final domain. No other config needed — this is a standard Next.js App
Router project.

---

## How it works

### Architecture

```
        START
          |
       identify                (LLM: free text -> canonical name, ticker, exchange)
        /    \
  webResearch  fundamentals     (Tavily news search  |  Alpha Vantage OVERVIEW)
        \    /
      sentiment                 (LLM: reads news -> sentiment score, red flags)
          |
        risk                    (LLM: fundamentals + sentiment -> risk profile)
          |
      decision                  (LLM: everything -> INVEST/PASS/WATCH + reasoning)
          |
         END
```

This is a `StateGraph` from `@langchain/langgraph` (see `lib/agent/graph.ts`). A single
shared `AgentState` (see `lib/agent/state.ts`) flows through every node; each node reads
what it needs and returns a partial patch that LangGraph merges in.

`webResearch` and `fundamentals` have no dependency on each other, so they're wired to run
concurrently off `identify`, and `sentiment` only fires once both have completed (an
implicit join — LangGraph waits for all incoming edges into a node before running it).
This keeps a full run to roughly the latency of 5 sequential LLM calls instead of 6, plus
two tool calls done in parallel rather than serially.

### Structured output, not free text parsing

Every node that returns data uses `.withStructuredOutput(zodSchema)` (see
`lib/agent/schema.ts`). This means the LLM's output is validated against a schema at the
API boundary rather than regex-parsed from prose — the same reason the decision node can
guarantee `decision` is always exactly `"INVEST" | "PASS" | "WATCH"` and never a
half-sentence the UI can't render.

### Streaming

`app/api/research/route.ts` calls `graph.stream(input, { streamMode: "updates" })`, which
yields the state delta after each node finishes. The route turns each delta into a
Server-Sent Event (`trace`, plus a named event per data type: `companyId`, `news`,
`fundamentals`, `sentiment`, `risk`, `verdict`). The client (`app/page.tsx`) reads the SSE
stream manually with `ReadableStream`/`TextDecoder` rather than pulling in a client library,
since the event shape is simple and fully under our control.

### Tools

- **`lib/agent/tools/search.ts`** — thin `fetch` wrapper around the Tavily search API
  (`search_depth: "advanced"`, `include_answer: true`). Chosen over a generic Google/Bing
  wrapper because Tavily is purpose-built for LLM agents: it returns clean, deduplicated
  snippets instead of raw HTML the LLM would have to parse.
- **`lib/agent/tools/financials.ts`** — Alpha Vantage `SYMBOL_SEARCH` (name → ticker) +
  `OVERVIEW` (fundamentals). Free tier, no card required, good enough for a demo-scale
  research agent. See trade-offs below for its limits.

### Provider-agnostic LLM layer

`lib/llm.ts` is the single place any node touches to get a chat model. Every node imports
`getChatModel()` — switching `LLM_PROVIDER` requires no changes anywhere else in the
codebase. Four providers are supported:

- **`anthropic`** / **`openai`** — direct SDKs (`@langchain/anthropic`, `@langchain/openai`).
- **`openrouter`** / **`groq`** — both implemented as `ChatOpenAI` pointed at a different
  `baseURL`, since both expose an OpenAI-compatible `/chat/completions` endpoint. No extra
  SDK needed — just a different base URL and key.

This was worth the small abstraction cost because the assignment explicitly says "use any
LLM provider," and because in practice candidates often only have one working key at
submission time — the pipeline shouldn't care which.

**Caveat worth knowing:** `withStructuredOutput()` relies on tool/function calling under
the hood. Every OpenAI and Anthropic model supports this reliably. On OpenRouter and Groq,
model support varies — stick to models explicitly documented as supporting tool calling
(e.g. `openai/gpt-4o` or `anthropic/claude-3.5-sonnet` via OpenRouter, `llama-3.3-70b-versatile`
on Groq). If a chosen model doesn't support tool calling, the structured-output nodes will
throw rather than silently returning malformed data — which is the correct failure mode for
something a UI renders directly.

---

## Key decisions & trade-offs

- **LangGraph over a hand-rolled chain.** A linear chain of `.pipe()` calls would have
  been simpler to write, but wouldn't demonstrate the fan-out/fan-in parallelism, wouldn't
  give clean per-node streaming for the UI, and wouldn't scale gracefully if a future
  iteration wanted conditional edges (e.g. skip risk analysis entirely for a company with
  no fundamentals data). LangGraph's explicit state + edges model matches "how a research
  desk actually works" — different analysts handing off structured findings — better than
  a single prompt chain would.

- **Structured output over "ask the LLM to output JSON and hope."** Using
  `withStructuredOutput` + Zod means malformed output fails loudly at the API boundary
  instead of silently breaking the UI three components downstream. The trade-off is
  slightly more upfront schema design, which felt like the right side to err on for
  something a UI renders directly.

- **Graceful degradation over hard failure when a tool key is missing.** I considered
  making `TAVILY_API_KEY` and `ALPHA_VANTAGE_API_KEY` mandatory and failing fast if absent.
  I chose instead to let the agent run with a "data unavailable" note that gets explicitly
  fed into the risk and decision prompts, so confidence drops honestly instead of the LLM
  quietly hallucinating numbers it doesn't have. This also means a reviewer without four
  API keys can still see the full six-node pipeline execute end-to-end.

- **Alpha Vantage over a paid financial data API.** Free, no card, sufficient depth
  (market cap, P/E, PEG, margins, growth, beta) for a demo. Trade-off: the free tier is
  rate-limited (5 req/min) and its `SYMBOL_SEARCH` is noticeably weaker for Indian tickers
  (NSE/BSE) than US ones — a known gap called out explicitly in the fundamentals node's
  output rather than papered over.

- **Verdict includes a `WATCH` option, not just binary invest/pass.** A forced binary
  choice on genuinely mixed signal would push the LLM toward manufacturing false
  confidence. `WATCH` is used when the model itself says the signal doesn't clear the bar
  either way — I'd rather the agent say "I don't know yet" than fabricate certainty.

- **Counter-reasons are mandatory in the schema (`min(1)`), not optional.** Otherwise the
  decision node reliably degenerates into a one-sided pitch for whatever it already
  decided — I saw this in early testing before adding the constraint.

- **OAuth sign-in (Google / X / Facebook) via NextAuth, each provider optional and
  independently gated.** A provider only appears on the sign-in page once both its client
  ID and secret are present in the environment — the same graceful-degradation pattern
  used for the LLM/tool keys elsewhere in this project. Sign-in is not required to use the
  agent; it exists purely so research runs can be tied to an account rather than the
  browser they happened to run in.

- **Research history in `localStorage`, not a database.** Every completed verdict is
  saved client-side, namespaced by the signed-in user's email (or `"guest"` if not signed
  in) so different accounts on one browser don't see each other's runs. This was a
  deliberate scope trade-off: a real account-based history that syncs across devices needs
  a database (e.g. Postgres via Vercel Postgres + Prisma), which is a meaningful addition
  in its own right and didn't feel worth the added infrastructure surface for a 7-day
  take-home. It's called out explicitly below as the natural next step.

- **What I left out:** no persistent server-side database (history lives in the browser,
  not synced across devices), no portfolio-level comparison across multiple companies, no
  rate limiting on the API route itself, no automated tests. All are called out below
  under "what I'd improve," not because they weren't considered but because 7 days favored
  depth on the reasoning pipeline over breadth of surrounding product features.

- **Ambiguity call:** the brief leaves "what it researches" and "how it shows results"
  open. I chose news sentiment + public fundamentals (the two most decision-relevant, most
  universally available signals for any public company) over, say, SEC filings or
  founder background checks, since those require either paid data providers or much
  heavier document parsing than a 7-day scope supports well.

---

## Example runs

> Fill this section in with 3–4 real runs once you have API keys configured — this is
> exactly what the assignment asks for. Suggested candidates to run and paste in below
> (mix of geographies/sectors so the pipeline's range is visible):
>
> - **Nvidia** (large-cap, strong fundamentals, likely `INVEST` or `WATCH` depending on
>   valuation stretch at run time)
> - **Zomato** (Indian consumer tech, more mixed signal — good test of the `WATCH` path)
> - **Paytm** (public company with a genuinely rocky sentiment history — good test of
>   whether red flags surface correctly)
> - **A private/early-stage company** (tests the `isPublic: false` / no-fundamentals
>   degradation path end to end)
>
> For each, paste: the input you typed, a screenshot or copy of the final verdict card,
> and 2–3 lines on whether the reasoning felt sound to you as a human reviewer — the
> assignment cares about your judgment on the output, not just that it ran.

---

## What I would improve with more time

- **Real filings, not just news + overview.** Pull actual 10-K/10-Q or Indian equivalent
  (BSE/NSE filings) for a proper fundamentals-only signal instead of relying on Alpha
  Vantage's summarized `OVERVIEW` endpoint, which is sometimes stale.
- **Conditional edges.** If `fundamentals.available === false`, route to a
  qualitative-only risk path instead of always running the same five nodes regardless of
  what data actually came back.
- **Caching + rate-limit handling.** Alpha Vantage's free tier is 5 req/min; a production
  version would cache ticker resolution and fundamentals per company for a few hours.
- **Persisted history.** Save past runs (Postgres/SQLite) so a user can compare today's
  verdict on a company against last week's, and the agent can eventually reason about
  *drift* in its own prior calls.
- **Multi-company comparison mode.** Run the graph over 3–5 companies and rank them,
  useful for actual portfolio screening rather than one-off lookups.
- **Evals.** A small labeled set of "company + expected direction of verdict" pairs to
  catch prompt regressions before they ship, since right now correctness is judged by eye.
- **Source-level citations in the UI**, not just a sentiment summary — link each red flag
  or positive back to the specific article it came from.

---

## Tech stack

- **Frontend/Backend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Agent orchestration:** LangGraph.js (`@langchain/langgraph`)
- **LLM:** Claude (`@langchain/anthropic`) by default, OpenAI supported via env var swap
- **Tools:** Tavily (news/search), Alpha Vantage (fundamentals)
- **Streaming:** Server-Sent Events over a Next.js Route Handler

## Project structure

```
app/
  api/research/route.ts     — SSE endpoint that runs the graph
  page.tsx                  — main UI, consumes the SSE stream
  layout.tsx, globals.css   — fonts, theme
components/
  CompanyForm.tsx           — input + example chips
  AgentTrace.tsx            — live step-by-step research log
  MetricsPanel.tsx          — fundamentals / sentiment / risk cards
  VerdictCard.tsx           — the final stamped verdict
lib/
  llm.ts                    — provider-agnostic chat model factory
  agent/
    state.ts                — LangGraph shared state definition
    schema.ts                — Zod schemas for every structured LLM output
    graph.ts                 — StateGraph wiring (the pipeline itself)
    nodes/                   — one file per node
    tools/                   — search.ts (Tavily), financials.ts (Alpha Vantage)
types/index.ts               — frontend-side mirror of the schema types
```

---

## A note on AI usage in building this

This project was built with Claude as a pair-programming collaborator, as the assignment
mandates. The chat session used to architect and write this code is included/available as
required for bonus points — it captures the actual back-and-forth: why LangGraph over a
plain chain, why a fan-out/fan-in shape for the two independent data pulls, why
counter-reasons had to be a hard schema constraint rather than a suggestion in the prompt,
and the UI direction (a research-desk "ledger" aesthetic instead of a generic dashboard).
