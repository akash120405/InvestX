"use client";

import { AnimatePresence, motion } from "framer-motion";

const LINKS = [
  { label: "Email", value: "akashvenkatesan112@gmail.com", href: "mailto:akashvenkatesan112@gmail.com" },
  { label: "LinkedIn", value: "linkedin.com/akash", href: "https://linkedin.com/in/akashvenkatesan12" },
  { label: "GitHub", value: "github.com/akash", href: "https://github.com/akash120405" },
  { label: "Portfolio", value: "portfolio/akash", href: "https://akash120405.github.io/portfolio/" },
];

export default function ContactSection({ open }: { open: boolean }) {
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
          <div className="bg-ink-panel border border-ink-line rounded-sm p-5 mb-8">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate mb-4">
              Built by Akash Venkatesan
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                  rel="noreferrer"
                  className="flex items-center justify-between px-3 py-2 border border-ink-line rounded-sm hover:border-gold transition group"
                >
                  <span className="font-mono text-xs uppercase tracking-wide text-slate group-hover:text-gold transition">
                    {link.label}
                  </span>
                  <span className="text-sm text-paper/85 truncate ml-3">{link.value}</span>
                </a>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
