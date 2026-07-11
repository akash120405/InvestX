"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/Header";
import AboutPanel from "@/components/AboutPanel";
import ContactSection from "@/components/ContactSection";
import HistoryDrawer from "@/components/HistoryDrawer";
import CompanyForm from "@/components/CompanyForm";
import AgentTrace from "@/components/AgentTrace";
import VerdictCard from "@/components/VerdictCard";
import MetricsPanel from "@/components/MetricsPanel";
import { useHistory, type HistoryEntry } from "@/lib/useHistory";
import type { TraceStep, CompanyId, Fundamentals, Sentiment, Risk, Verdict } from "@/types";

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [trace, setTrace] = useState<TraceStep[]>([]);
  const [companyId, setCompanyId] = useState<CompanyId | null>(null);
  const [fundamentals, setFundamentals] = useState<Fundamentals | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [risk, setRisk] = useState<Risk | null>(null);
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastInput, setLastInput] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const [aboutOpen, setAboutOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { entries, addEntry, clearHistory } = useHistory();

  function loadFromHistory(entry: HistoryEntry) {
    setTrace([
      { step: "identify", label: "Resolving company & ticker", status: "done", timestamp: entry.timestamp },
      { step: "webResearch", label: "Scanning recent news & coverage", status: "done", timestamp: entry.timestamp },
      { step: "fundamentalsStep", label: "Pulling financial fundamentals", status: "done", timestamp: entry.timestamp },
      { step: "sentimentStep", label: "Analyzing sentiment & narrative", status: "done", timestamp: entry.timestamp },
      { step: "riskStep", label: "Assessing risk profile", status: "done", timestamp: entry.timestamp },
      { step: "decision", label: "Synthesizing investment verdict", status: "done", timestamp: entry.timestamp },
    ]);
    setCompanyId(entry.companyId);
    setFundamentals(entry.fundamentals);
    setSentiment(entry.sentiment);
    setRisk(entry.risk);
    setVerdict(entry.verdict);
    setError(null);
    setIsRunning(false);
  }

  async function runResearch(company: string) {
    // reset state for a fresh run
    setIsRunning(true);
    setTrace([]);
    setCompanyId(null);
    setFundamentals(null);
    setSentiment(null);
    setRisk(null);
    setVerdict(null);
    setError(null);
    setLastInput(company);

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // local snapshots so we can save a complete history entry once the
    // "verdict" event lands, without waiting on React state batching
    let finalCompanyId: CompanyId | null = null;
    let finalFundamentals: Fundamentals | null = null;
    let finalSentiment: Sentiment | null = null;
    let finalRisk: Risk | null = null;

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company }),
        signal: controller.signal,
      });

      if (!res.body) throw new Error("No response stream from server.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const raw of events) {
          if (!raw.trim()) continue;
          const lines = raw.split("\n");
          const eventLine = lines.find((l) => l.startsWith("event:"));
          const dataLine = lines.find((l) => l.startsWith("data:"));
          if (!eventLine || !dataLine) continue;

          const eventName = eventLine.replace("event:", "").trim();
          const data = JSON.parse(dataLine.replace("data:", "").trim());

          switch (eventName) {
            case "trace":
              setTrace((prev) => [...prev, data]);
              break;
            case "companyId":
              finalCompanyId = data;
              setCompanyId(data);
              break;
            case "fundamentals":
              finalFundamentals = data;
              setFundamentals(data);
              break;
            case "sentiment":
              finalSentiment = data;
              setSentiment(data);
              break;
            case "risk":
              finalRisk = data;
              setRisk(data);
              break;
            case "verdict":
              setVerdict(data);
              addEntry({
                input: company,
                companyId: finalCompanyId,
                fundamentals: finalFundamentals,
                sentiment: finalSentiment,
                risk: finalRisk,
                verdict: data,
              });
              break;
            case "error":
              setError(data.message);
              break;
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") setError(err.message || "Something went wrong.");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <main className="relative min-h-screen max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-16 overflow-hidden">
      {/* Ambient animated background blobs — pure CSS/motion, no images, so
          this can never fail to load regardless of network conditions. */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-24 w-[420px] h-[420px] rounded-full bg-gold/10 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-32 w-[380px] h-[380px] rounded-full bg-signal/10 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />

      <Header
        aboutOpen={aboutOpen}
        onToggleAbout={() => setAboutOpen((v) => !v)}
        contactOpen={contactOpen}
        onToggleContact={() => setContactOpen((v) => !v)}
        onOpenHistory={() => setHistoryOpen(true)}
      />

      <AboutPanel open={aboutOpen} />
      <ContactSection open={contactOpen} />

      <motion.header
        className="relative mb-10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold mb-3">Altuni AI Labs · Analyst Desk</p>
        <h1 className="font-display text-4xl sm:text-5xl leading-[1.05] mb-3">
          Give it a name.
          <br />
          <span className="italic gradient-sheen">It brings back a verdict.</span>
        </h1>
        <p className="text-slate max-w-xl">
          An AI research agent that pulls live news, fundamentals, and sentiment on any company,
          weighs the risk, and stamps its call — INVEST, PASS, or WATCH — with the reasoning shown in full.
        </p>
      </motion.header>

      <motion.div
        className="relative mb-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
      >
        <CompanyForm onSubmit={runResearch} isRunning={isRunning} />
      </motion.div>

      <AnimatePresence mode="popLayout">
        {error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 32 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="border border-rust/50 bg-rust/10 text-rust rounded-sm px-4 py-3 text-sm overflow-hidden"
          >
            {error}
          </motion.div>
        )}

        {(trace.length > 0 || isRunning) && (
          <motion.div
            key="trace"
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mb-8"
          >
            <AgentTrace trace={trace} isRunning={isRunning} />
          </motion.div>
        )}

        {(fundamentals || sentiment || risk) && (
          <motion.div
            key="metrics"
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut", delay: 0.05 }}
            className="mb-8"
          >
            <MetricsPanel fundamentals={fundamentals} sentiment={sentiment} risk={risk} />
          </motion.div>
        )}

        {verdict && (
          <motion.div
            key="verdict"
            layout
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
          >
            <VerdictCard verdict={verdict} companyId={companyId} />
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="relative mt-16 pt-6 border-t border-ink-line font-mono text-xs text-slate/60">
        Built with Next.js · LangGraph.js · Claude — orchestrated as a six-node research pipeline.
      </footer>

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={entries}
        onSelect={loadFromHistory}
        onClear={clearHistory}
      />
    </main>
  );
}
