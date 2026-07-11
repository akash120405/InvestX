import { Redis } from "@upstash/redis";

/**
 * Upstash Redis — chosen over a relational DB (Postgres/Prisma) specifically
 * because it's REST-based rather than a persistent socket connection, which
 * is exactly what Vercel's serverless functions need (they're short-lived
 * and spin up/down per request; a pooled TCP connection to a normal Postgres
 * instance is a common source of "too many connections" errors on Vercel's
 * free tier). Upstash's free tier (10k commands/day, 256MB) is comfortably
 * enough for a per-user research history list.
 *
 * Returns null if not configured, so every caller can degrade gracefully
 * (same pattern as the LLM/Tavily/Alpha Vantage integrations elsewhere in
 * this project) instead of crashing when the env vars are missing.
 */
export function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}
