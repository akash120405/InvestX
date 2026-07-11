"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { HistoryEntry } from "@/lib/useHistory";

const STAMP_COLOR: Record<string, string> = {
  INVEST: "text-signal",
  PASS: "text-rust",
  WATCH: "text-gold",
};

export default function HistoryDrawer({
  open,
  onClose,
  entries,
  onSelect,
  onClear,
}: {
  open: boolean;
  onClose: () => void;
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 32 }}
            className="fixed top-0 right-0 h-full w-full sm:w-96 bg-ink-panel border-l border-ink-line z-50 overflow-y-auto"
          >
            <div className="flex items-center justify-between p-5 border-b border-ink-line">
              <h2 className="font-mono text-xs uppercase tracking-[0.2em] text-slate">
                Research History
              </h2>
              <button
                onClick={onClose}
                className="text-slate hover:text-gold transition font-mono text-sm"
                aria-label="Close history"
              >
                ✕
              </button>
            </div>

            {entries.length === 0 ? (
              <p className="p-5 text-sm text-slate italic">
                No research runs yet — completed lookups will appear here.
              </p>
            ) : (
              <>
                <div className="divide-y divide-ink-line">
                  {entries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => {
                        onSelect(entry);
                        onClose();
                      }}
                      className="w-full text-left p-4 hover:bg-ink transition"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display italic text-base">
                          {entry.companyId?.companyName || entry.input}
                        </span>
                        <span
                          className={`font-mono text-xs font-bold ${STAMP_COLOR[entry.verdict.decision]}`}
                        >
                          {entry.verdict.decision}
                        </span>
                      </div>
                      <p className="font-mono text-[11px] text-slate">
                        {new Date(entry.timestamp).toLocaleString()} · Score{" "}
                        {entry.verdict.investmentScore}/100
                      </p>
                    </button>
                  ))}
                </div>
                <div className="p-4">
                  <button
                    onClick={onClear}
                    className="w-full text-xs font-mono text-rust hover:text-rust-dim transition border border-ink-line rounded-sm py-2"
                  >
                    Clear history
                  </button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
