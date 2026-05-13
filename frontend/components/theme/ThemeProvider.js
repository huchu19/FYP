"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Versioned key — bumping this clears any stored preference from previous sessions
const THEME_KEY = "edunexus_theme_v2";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "light";
    const stored = window.localStorage.getItem(THEME_KEY);
    return stored === "dark" ? "dark" : "light";
  });

  // ThemeProvider owns the data-theme attribute on <html> — layout.js must not set it
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  function toggleTheme() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
    document.documentElement.setAttribute("data-theme", next);
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
