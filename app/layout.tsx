import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

// NOTE: We intentionally do NOT use next/font/google here.
// next/font/google fetches font files from fonts.googleapis.com at BUILD
// time — if that request fails (corporate firewall, restricted network,
// offline dev, sandboxed CI), `next build` throws and the whole app fails
// to build. Swapping to a system/CSS font stack (defined in globals.css)
// keeps the exact same "Night-Route" typographic feel (serif display +
// clean sans body + mono accents) with zero network dependency, so the
// build can never fail for this reason.

export const metadata: Metadata = {
  title: "Ledger — AI Investment Research Agent | Multi-Agent LLM Pipeline",
  description:
    "An AI investment research agent built with Next.js, TypeScript, and LangGraph.js. " +
    "A six-node multi-agent orchestration pipeline streams live company research — " +
    "news sentiment analysis, financial fundamentals retrieval, and risk assessment — " +
    "into a structured INVEST / PASS / WATCH verdict via real-time Server-Sent Events. " +
    "Demonstrates full-stack engineering, LLM agent orchestration, structured output " +
    "validation with Zod, and production-grade API design.",
  keywords: [
    "AI investment research agent",
    "LangGraph.js",
    "multi-agent AI pipeline",
    "LLM orchestration",
    "Next.js TypeScript full-stack",
    "agentic AI system",
    "Server-Sent Events streaming",
    "structured output LLM",
    "financial data retrieval",
    "full-stack developer portfolio project",
  ],
  authors: [{ name: "Akash Venkatesan" }],
  openGraph: {
    title: "Ledger — AI Investment Research Agent",
    description:
      "A six-node LangGraph.js multi-agent pipeline that researches a company and " +
      "returns a structured, streamed investment verdict with full reasoning.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body bg-ink text-paper antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
