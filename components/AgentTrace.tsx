"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { TraceStep } from "@/types";

const ALL_STEPS: { step: string; label: string }[] = [
  { step: "identify", label: "Resolving company & ticker" },
  { step: "webResearch", label: "Scanning recent news & coverage" },
  { step: "fundamentalsStep", label: "Pulling financial fundamentals" },
  { step: "sentimentStep", label: "Analyzing sentiment & narrative" },
  { step: "riskStep", label: "Assessing risk profile" },
  { step: "decision", label: "Synthesizing investment verdict" },
];

export default function AgentTrace({ trace, isRunning }: { trace: TraceStep[]; isRunning: boolean }) {
  const doneSteps = new Set(trace.map((t) => t.step));
  const nextIndex = ALL_STEPS.findIndex((s) => !doneSteps.has(s.step));
  const currentStep = isRunning ? nextIndex : -1;
  const completedCount = doneSteps.size;

  return (
    <div className="bg-ink-panel border border-ink-line rounded-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">Research Trace</h2>
        {isRunning && (
          <span className="flex items-center gap-1.5 font-mono text-xs text-gold">
            <motion.span
              className="w-1.5 h-1.5 rounded-full bg-gold"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            />
            live
          </span>
        )}
      </div>

      {/* Overall progress bar — fills as steps complete, not just a decorative sweep */}
      <div className="h-1 w-full bg-ink-line rounded-full mb-4 overflow-hidden">
        <motion.div
          className="h-full bg-gold rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / ALL_STEPS.length) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      <ol className="space-y-0">
        {ALL_STEPS.map((s, i) => {
          const isDone = doneSteps.has(s.step);
          const isCurrent = i === currentStep;
          return (
            <motion.li
              key={s.step}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className="flex items-start gap-3 py-2.5 border-b border-ink-line last:border-0"
            >
              <span
                className={`font-mono text-xs mt-0.5 w-5 shrink-0 ${
                  isDone ? "text-signal" : isCurrent ? "text-gold" : "text-slate/40"
                }`}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={`font-body text-sm ${
                    isDone ? "text-paper" : isCurrent ? "text-gold" : "text-slate/50"
                  }`}
                >
                  {s.label}
                </p>
              </div>
              <span className="font-mono text-xs shrink-0 w-16 text-right">
                <AnimatePresence mode="wait">
                  {isDone ? (
                    <motion.span
                      key="done"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="text-signal inline-block"
                    >
                      ✓ done
                    </motion.span>
                  ) : isCurrent ? (
                    <motion.span
                      key="running"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.1, repeat: Infinity }}
                      className="text-gold inline-block"
                    >
                      running…
                    </motion.span>
                  ) : (
                    <motion.span key="queued" className="text-slate/40 inline-block">
                      queued
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}
