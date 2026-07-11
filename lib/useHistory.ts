"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import type { CompanyId, Fundamentals, Sentiment, Risk, Verdict } from "@/types";

export interface HistoryEntry {
  id: string;
  timestamp: number;
  input: string;
  companyId: CompanyId | null;
  fundamentals: Fundamentals | null;
  sentiment: Sentiment | null;
  risk: Risk | null;
  verdict: Verdict;
}

type NewEntry = Omit<HistoryEntry, "id" | "timestamp">;

/**
 * Research history.
 *
 * Signed-in users: persisted server-side in a real database (Upstash Redis,
 * see /api/history) keyed to their account, so it follows them across
 * devices/browsers — this is what makes "sign in to save your research"
 * actually mean something.
 *
 * Signed-out (guest) users: there's no account to tie data to, so history
 * falls back to browser localStorage under a "guest" key. This is a
 * deliberate, disclosed trade-off — guest history is local-only and won't
 * follow them to another browser, which is the expected behavior for
 * unauthenticated usage.
 */
export function useHistory() {
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [persisted, setPersisted] = useState(false);
  const guestKey = "ledger-history:guest";

  // Load history whenever auth status settles.
  useEffect(() => {
    if (status === "loading") return;

    if (isSignedIn) {
      fetch("/api/history")
        .then((res) => res.json())
        .then((data) => {
          setEntries(data.entries || []);
          setPersisted(Boolean(data.persisted));
        })
        .catch(() => {
          setEntries([]);
          setPersisted(false);
        });
    } else {
      try {
        const raw = window.localStorage.getItem(guestKey);
        setEntries(raw ? JSON.parse(raw) : []);
      } catch {
        setEntries([]);
      }
      setPersisted(false);
    }
  }, [status, isSignedIn]);

  const addEntry = useCallback(
    async (entry: NewEntry) => {
      if (isSignedIn) {
        try {
          const res = await fetch("/api/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(entry),
          });
          const data = await res.json();
          if (data.entry) {
            setEntries((prev) => [data.entry, ...prev].slice(0, 50));
            setPersisted(Boolean(data.persisted));
            return;
          }
        } catch {
          // Network hiccup saving to the DB — fall through to local state
          // below so the entry still shows up in this session's UI.
        }
      }
      // Guest mode, or the DB save above failed — keep it local so the
      // person still sees their run in the history drawer this session.
      setEntries((prev) => {
        const next = [
          { ...entry, id: crypto.randomUUID(), timestamp: Date.now() },
          ...prev,
        ].slice(0, 50);
        if (!isSignedIn) {
          try {
            window.localStorage.setItem(guestKey, JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    },
    [isSignedIn]
  );

  const clearHistory = useCallback(async () => {
    setEntries([]);
    if (isSignedIn) {
      try {
        await fetch("/api/history", { method: "DELETE" });
      } catch {}
    } else {
      try {
        window.localStorage.removeItem(guestKey);
      } catch {}
    }
  }, [isSignedIn]);

  return { entries, addEntry, clearHistory, isSignedIn, persisted };
}
