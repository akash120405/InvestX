import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import type { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Returns a chat model based on LLM_PROVIDER env var.
 * Supports four providers, all through the same factory so no node ever
 * imports a concrete class directly:
 *
 *   - "anthropic"  -> Claude, direct API
 *   - "openai"     -> GPT, direct API
 *   - "openrouter" -> any model OpenRouter proxies (OpenAI-compatible
 *                     endpoint, just a different baseURL + key)
 *   - "groq"       -> Groq's hosted open models (also OpenAI-compatible)
 *
 * OpenRouter and Groq both speak the same `/chat/completions` shape as
 * OpenAI, so they're implemented as `ChatOpenAI` pointed at a different
 * `baseURL` rather than separate SDKs — no new dependency needed.
 *
 * Typed as the shared BaseChatModel interface (rather than the union of
 * the concrete classes) so `.withStructuredOutput()` resolves to one
 * consistent overload set for every caller, regardless of which provider
 * is active at runtime.
 */
export function getChatModel(temperature = 0.2): BaseChatModel {
  const provider = (process.env.LLM_PROVIDER || "anthropic").toLowerCase();

  switch (provider) {
    case "openai": {
      requireEnv("OPENAI_API_KEY", provider);
      return new ChatOpenAI({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        temperature,
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    case "openrouter": {
      requireEnv("OPENROUTER_API_KEY", provider);
      return new ChatOpenAI(
        {
          // OpenRouter model IDs are "vendor/model", e.g. "openai/gpt-4o",
          // "anthropic/claude-3.5-sonnet", "meta-llama/llama-3.3-70b-instruct".
          model: process.env.OPENROUTER_MODEL || "openai/gpt-4o",
          temperature,
          apiKey: process.env.OPENROUTER_API_KEY,
        },
        {
          baseURL: "https://openrouter.ai/api/v1",
          defaultHeaders: {
            // OpenRouter uses these for its public leaderboard/analytics —
            // not required, but recommended by their docs.
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "Ledger — AI Investment Research Agent",
          },
        }
      );
    }

    case "groq": {
      requireEnv("GROQ_API_KEY", provider);
      return new ChatOpenAI(
        {
          // llama-3.3-70b-versatile is a solid default for structured
          // output via tool calling on Groq's free tier.
          model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
          temperature,
          apiKey: process.env.GROQ_API_KEY,
        },
        { baseURL: "https://api.groq.com/openai/v1" }
      );
    }

    case "anthropic":
    default: {
      requireEnv("ANTHROPIC_API_KEY", provider);
      return new ChatAnthropic({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5",
        temperature,
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }
}

function requireEnv(key: string, provider: string) {
  if (!process.env[key]) {
    throw new Error(`${key} is not set but LLM_PROVIDER=${provider}`);
  }
}
