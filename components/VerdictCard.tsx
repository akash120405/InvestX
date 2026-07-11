"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Verdict, CompanyId } from "@/types";

const STAMP_STYLES: Record<Verdict["decision"], string> = {
  INVEST: "stamp-invest",
  PASS: "stamp-pass",
  WATCH: "stamp-watch",
};

export default function VerdictCard({ verdict, companyId }: { verdict: Verdict; companyId: CompanyId | null }) {
  return (
    <div className="relative bg-paper text-ink rounded-sm p-6 sm:p-8 overflow-hidden">
      <div className="flex items-start justify-between mb-6">
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/50 mb-1">Research Ledger</p>
          <h2 className="font-display italic text-2xl sm:text-3xl">
            {companyId?.companyName || "Subject Company"}
          </h2>
          {companyId?.ticker && (
            <p className="font-mono text-sm text-ink/60 mt-1">
              {companyId.ticker} · {companyId.exchange || "—"}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ scale: 2.4, rotate: -18, opacity: 0 }}
          animate={{ scale: 1, rotate: -8, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.15 }}
          className={`shrink-0 border-[3px] rounded-md px-4 py-2 ${STAMP_STYLES[verdict.decision]}`}
          style={{ fontFamily: "var(--font-plex-mono)" }}
        >
          <span className="font-bold text-xl sm:text-2xl tracking-wider">{verdict.decision}</span>
        </motion.div>
      </div>

      <motion.div
        className="grid grid-cols-3 gap-4 mb-6 pb-6 border-b border-ink/15"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
      >
        <AnimatedStat label="Confidence" value={verdict.confidence} suffix="%" />
        <AnimatedStat label="Score" value={verdict.investmentScore} suffix="/100" />
        <Stat label="Horizon" value={verdict.timeHorizon.replace("-", " ")} />
      </motion.div>

      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.35 }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/50 mb-2">Thesis</p>
        <p className="font-display text-lg leading-snug">{verdict.thesis}</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 gap-6 mb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-signal-dim mb-2">
            For — {verdict.supportingReasons.length}
          </p>
          <ul className="space-y-1.5 text-sm">
            {verdict.supportingReasons.map((r, i) => (
              <motion.li
                key={i}
                className="flex gap-2"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05, duration: 0.25 }}
              >
                <span className="text-signal-dim">+</span>
                <span>{r}</span>
              </motion.li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-rust-dim mb-2">
            Against — {verdict.counterReasons.length}
          </p>
          <ul className="space-y-1.5 text-sm">
            {verdict.counterReasons.map((r, i) => (
              <motion.li
                key={i}
                className="flex gap-2"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.05, duration: 0.25 }}
              >
                <span className="text-rust-dim">−</span>
                <span>{r}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>

      <motion.div
        className="bg-ink/[0.04] rounded-sm p-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
      >
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-ink/50 mb-1">Suggested next step</p>
        <p className="text-sm">{verdict.suggestedAction}</p>
      </motion.div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/45">{label}</p>
      <p className="font-display text-xl capitalize">{value}</p>
    </div>
  );
}

/** Counts up from 0 to `value` over ~0.7s — small touch, but makes the
 * verdict card's headline numbers feel alive rather than just appearing. */
function AnimatedStat({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const duration = 700;
    const delay = 300;
    const tick = (now: number) => {
      const elapsed = now - start - delay;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      setN(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink/45">{label}</p>
      <p className="font-display text-xl">
        {n}
        {suffix}
      </p>
    </div>
  );
}
