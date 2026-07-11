"use client";

import { motion } from "framer-motion";
import type { Fundamentals, Sentiment, Risk } from "@/types";

const RISK_COLOR: Record<Risk["overallRiskLevel"], string> = {
  low: "text-signal",
  medium: "text-gold",
  high: "text-rust",
  severe: "text-rust",
};

const SENTIMENT_COLOR: Record<Sentiment["overallSentiment"], string> = {
  positive: "text-signal",
  neutral: "text-slate",
  mixed: "text-gold",
  negative: "text-rust",
};

export default function MetricsPanel({
  fundamentals,
  sentiment,
  risk,
}: {
  fundamentals: Fundamentals | null;
  sentiment: Sentiment | null;
  risk: Risk | null;
}) {
  return (
    <div className="grid sm:grid-cols-3 gap-4">
      <Panel title="Fundamentals" index={0}>
        {fundamentals?.available && fundamentals.overview ? (
          <div className="space-y-1.5 font-mono text-xs">
            <Row label="Market cap" value={fundamentals.overview.marketCap} />
            <Row label="P/E" value={fundamentals.overview.peRatio} />
            <Row label="EPS" value={fundamentals.overview.eps} />
            <Row label="Rev growth YoY" value={fundamentals.overview.revenueGrowthYoY} />
            <Row label="Profit margin" value={fundamentals.overview.profitMargin} />
            <Row label="Beta" value={fundamentals.overview.beta} />
          </div>
        ) : (
          <p className="text-xs text-slate italic">{fundamentals?.note || "No fundamentals data."}</p>
        )}
      </Panel>

      <Panel title="Sentiment" index={1}>
        {sentiment ? (
          <div className="space-y-2">
            <p className={`font-mono text-sm capitalize ${SENTIMENT_COLOR[sentiment.overallSentiment]}`}>
              {sentiment.overallSentiment} ({sentiment.sentimentScore.toFixed(2)})
            </p>
            <p className="text-xs text-paper/80 leading-relaxed">{sentiment.summary}</p>
            {sentiment.redFlags.length > 0 && (
              <div className="pt-1">
                <p className="font-mono text-[10px] uppercase tracking-wide text-rust mb-1">Red flags</p>
                <ul className="text-xs space-y-0.5">
                  {sentiment.redFlags.map((f, i) => (
                    <li key={i} className="text-paper/70">
                      · {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate italic">Awaiting news analysis.</p>
        )}
      </Panel>

      <Panel title="Risk" index={2}>
        {risk ? (
          <div className="space-y-2">
            <p className={`font-mono text-sm capitalize ${RISK_COLOR[risk.overallRiskLevel]}`}>
              {risk.overallRiskLevel} risk ({risk.riskScore.toFixed(1)}/10)
            </p>
            <div className="h-1 w-full bg-ink-line rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${
                  risk.overallRiskLevel === "low"
                    ? "bg-signal"
                    : risk.overallRiskLevel === "medium"
                    ? "bg-gold"
                    : "bg-rust"
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${(risk.riskScore / 10) * 100}%` }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wide text-slate mb-1">Mitigants</p>
              <ul className="text-xs space-y-0.5">
                {risk.mitigatingFactors.slice(0, 3).map((f, i) => (
                  <li key={i} className="text-paper/70">
                    · {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate italic">Awaiting risk assessment.</p>
        )}
      </Panel>
    </div>
  );
}

function Panel({ title, index, children }: { title: string; index: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: "easeOut" }}
      whileHover={{ y: -2, borderColor: "rgba(201,162,39,0.4)" }}
      className="bg-ink-panel border border-ink-line rounded-sm p-4 transition-colors"
    >
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate mb-3">{title}</p>
      {children}
    </motion.div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate">{label}</span>
      <span className="text-paper">{value || "—"}</span>
    </div>
  );
}
