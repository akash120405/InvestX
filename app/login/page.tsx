"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Continue with Google",
  twitter: "Continue with X (Twitter)",
  facebook: "Continue with Facebook",
};

export default function LoginPage() {
  const [providers, setProviders] = useState<Record<string, any> | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    let settled = false;

    getProviders()
      .then((p) => {
        settled = true;
        setProviders(p || {});
      })
      .catch(() => {
        settled = true;
        setLoadFailed(true);
      });

    // Defensive fallback: if getProviders() hasn't resolved within 5s for
    // any reason (slow network, a blocked request in a restrictive webview,
    // etc.), stop showing an infinite "Loading…" and tell the person what
    // to do instead of leaving them staring at a spinner forever.
    const timer = setTimeout(() => {
      if (!settled) setLoadFailed(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm bg-ink-panel border border-ink-line rounded-sm p-8 text-center"
      >
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-gold mb-2">Ledger</p>
        <h1 className="font-display italic text-2xl mb-6">Sign in to save your research</h1>

        {providers === null && !loadFailed && (
          <p className="text-sm text-slate">Loading sign-in options…</p>
        )}

        {loadFailed && (
          <p className="text-sm text-slate leading-relaxed">
            Couldn't load sign-in options. If you're viewing this inside an embedded browser
            (e.g. VS Code's built-in preview), open{" "}
            <code className="text-gold">http://localhost:3000</code> in a real browser tab
            instead — Google blocks sign-in from embedded webviews. Otherwise, refresh the page.
          </p>
        )}

        {providers && Object.keys(providers).length === 0 && !loadFailed && (
          <p className="text-sm text-slate leading-relaxed">
            No sign-in providers are configured yet. Add Google, Twitter, or Facebook OAuth
            credentials to <code className="text-gold">.env.local</code> to enable this — see the
            README for exact steps. You can still use the research agent without signing in.
          </p>
        )}

        {providers &&
          Object.values(providers).map((provider: any) => (
            <button
              key={provider.id}
              onClick={() => signIn(provider.id, { callbackUrl: "/" })}
              className="w-full mb-3 px-4 py-3 bg-paper text-ink font-body font-semibold rounded-sm hover:bg-paper-dim transition"
            >
              {PROVIDER_LABELS[provider.id] || `Continue with ${provider.name}`}
            </button>
          ))}

        <a href="/" className="block mt-6 text-xs font-mono text-slate hover:text-gold transition">
          ← Back to the research agent
        </a>
      </motion.div>
    </main>
  );
}
