"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const EXAMPLES = ["Zomato", "Tata Consultancy Services", "Nvidia", "Paytm"];

export default function CompanyForm({
  onSubmit,
  isRunning,
}: {
  onSubmit: (company: string) => void;
  isRunning: boolean;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim() && !isRunning) onSubmit(value.trim());
      }}
      className="w-full"
    >
      <label htmlFor="company" className="block font-mono text-xs uppercase tracking-[0.2em] text-slate mb-2">
        Ticket No. 001 — Subject Company
      </label>
      <div className="flex items-stretch gap-3">
        <motion.div
          className="flex-1 relative rounded-sm"
          animate={{
            boxShadow: focused
              ? "0 0 0 3px rgba(201,162,39,0.18)"
              : "0 0 0 0px rgba(201,162,39,0)",
          }}
          transition={{ duration: 0.2 }}
        >
          <input
            id="company"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. Zomato, Tata Motors, Nvidia…"
            disabled={isRunning}
            className="w-full bg-ink-panel border border-ink-line rounded-sm px-4 py-3 font-display text-xl italic text-paper placeholder:text-slate/60 focus:border-gold focus:outline-none transition-colors disabled:opacity-50"
          />
        </motion.div>
        <motion.button
          type="submit"
          disabled={isRunning || !value.trim()}
          whileHover={!isRunning && value.trim() ? { scale: 1.03 } : {}}
          whileTap={!isRunning && value.trim() ? { scale: 0.96 } : {}}
          className="shrink-0 px-6 py-3 bg-gold text-ink font-body font-semibold tracking-wide rounded-sm hover:bg-gold/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <span className="flex items-center gap-2">
              <motion.span
                className="w-3.5 h-3.5 rounded-full border-2 border-ink/30 border-t-ink"
                animate={{ rotate: 360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              />
              Researching…
            </span>
          ) : (
            "Open File"
          )}
        </motion.button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLES.map((ex, i) => (
          <motion.button
            key={ex}
            type="button"
            disabled={isRunning}
            onClick={() => setValue(ex)}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 * i }}
            whileHover={!isRunning ? { y: -1, borderColor: "rgba(201,162,39,0.6)" } : {}}
            className="text-xs font-mono text-slate hover:text-gold border border-ink-line rounded-sm px-2.5 py-1 transition disabled:opacity-40"
          >
            {ex}
          </motion.button>
        ))}
      </div>
    </form>
  );
}
