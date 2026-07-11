"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "night-route" | "mono";

const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: "night-route",
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("night-route");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("ledger-theme") as Theme | null;
    if (saved === "mono" || saved === "night-route") setTheme(saved);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("ledger-theme", theme);
  }, [theme, mounted]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === "night-route" ? "mono" : "night-route")),
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
