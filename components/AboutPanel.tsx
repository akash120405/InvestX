"use client";

import { AnimatePresence, motion } from "framer-motion";

export default function AboutPanel({ open }: { open: boolean }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="bg-ink-panel border border-ink-line rounded-sm p-5 mb-8 text-sm leading-relaxed text-paper/85">
            <p className="mb-3">
              <strong className="text-gold">Ledger</strong> is an AI investment research agent.
              Give it a company name and it runs a six-node LangGraph.js pipeline: it resolves the
              company to a ticker, pulls recent news and live financial fundamentals in parallel,
              analyzes sentiment and narrative, assesses risk, and finally synthesizes all of that
              into a structured verdict — <strong>INVEST</strong>, <strong>PASS</strong>, or{" "}
              <strong>WATCH</strong> — complete with a confidence score, supporting reasons, and
              honest counter-arguments against its own call.
            </p>
            <p className="mb-3">
              Every step streams to this page live via Server-Sent Events as the agent works, so
              you can watch the reasoning unfold rather than waiting on a spinner.
            </p>
            <p className="text-paper/60">
              Built with Next.js, TypeScript, LangGraph.js, and an LLM of your choice (Groq, OpenRouter,
              OpenAI, or Anthropic) — see the README for architecture and design trade-offs.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
