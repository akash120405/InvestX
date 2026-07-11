import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRedis } from "@/lib/redis";
import type { HistoryEntry } from "@/lib/useHistory";

const MAX_ENTRIES = 50;

function historyKey(userId: string) {
  return `ledger:history:${userId}`;
}

/** GET /api/history — returns the signed-in user's saved research runs. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const redis = getRedis();
  if (!redis) {
    // No database configured — the client falls back to localStorage in
    // this case, so an empty list here is a safe, honest default rather
    // than an error the user has to reason about.
    return NextResponse.json({ entries: [], persisted: false });
  }

  const userId = (session.user as any).id || session.user.email;
  const raw = await redis.lrange<HistoryEntry>(historyKey(userId), 0, MAX_ENTRIES - 1);
  return NextResponse.json({ entries: raw || [], persisted: true });
}

/** POST /api/history — appends one completed research run for the signed-in user. */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ persisted: false });
  }

  const body = await req.json();
  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    input: body.input,
    companyId: body.companyId ?? null,
    fundamentals: body.fundamentals ?? null,
    sentiment: body.sentiment ?? null,
    risk: body.risk ?? null,
    verdict: body.verdict,
  };

  const userId = (session.user as any).id || session.user.email;
  const key = historyKey(userId);
  await redis.lpush(key, entry);
  await redis.ltrim(key, 0, MAX_ENTRIES - 1); // keep the list bounded

  return NextResponse.json({ persisted: true, entry });
}

/** DELETE /api/history — clears the signed-in user's history. */
export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const redis = getRedis();
  if (!redis) {
    return NextResponse.json({ persisted: false });
  }

  const userId = (session.user as any).id || session.user.email;
  await redis.del(historyKey(userId));
  return NextResponse.json({ ok: true });
}
