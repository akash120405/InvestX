"use client";

import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeContext";

export default function Header({
  aboutOpen,
  onToggleAbout,
  contactOpen,
  onToggleContact,
  onOpenHistory,
}: {
  aboutOpen: boolean;
  onToggleAbout: () => void;
  contactOpen: boolean;
  onToggleContact: () => void;
  onOpenHistory: () => void;
}) {
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="flex flex-wrap items-center gap-2 mb-6 font-mono text-xs uppercase tracking-wide">
      <NavButton onClick={onToggleAbout} active={aboutOpen}>
        About
      </NavButton>
      <NavButton onClick={onToggleContact} active={contactOpen}>
        Contact
      </NavButton>
      <NavButton onClick={onOpenHistory}>History</NavButton>
      <NavButton onClick={toggleTheme}>
        {theme === "night-route" ? "B&W mode" : "Color mode"}
      </NavButton>

      <div className="flex-1" />

      {status === "loading" ? null : session ? (
        <div className="flex items-center gap-2">
          <span className="text-slate normal-case">{session.user?.email}</span>
          <NavButton onClick={() => signOut({ callbackUrl: "/" })}>Sign out</NavButton>
        </div>
      ) : (
        <a
          href="/login"
          className="px-3 py-1.5 border border-ink-line rounded-sm hover:border-gold hover:text-gold transition"
        >
          Sign in
        </a>
      )}
    </nav>
  );
}

function NavButton({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 border rounded-sm transition ${
        active
          ? "border-gold text-gold"
          : "border-ink-line text-slate hover:border-gold hover:text-gold"
      }`}
    >
      {children}
    </button>
  );
}
