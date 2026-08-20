"use client";

import { useEffect } from "react";

import "./globals.css";

/**
 * Replaces the root layout when an error escapes it, so it cannot rely on
 * providers, fonts, or shared components and must render its own document.
 */
export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("Fatal application error:", error);
  }, [error]);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-[var(--bg-surface)] text-[var(--text-primary)] antialiased">
        <main className="flex min-h-screen items-center justify-center px-5 py-16">
          <div className="w-full max-w-xl text-center">
            <h1 className="[font-family:var(--font-display)] text-3xl font-semibold tracking-[-0.04em] text-[var(--text-heading)] sm:text-4xl">
              EduNexus could not start
            </h1>

            <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-[var(--text-muted)]">
              A fatal error stopped the application from loading. Reloading
              usually clears it.
            </p>

            {error?.digest ? (
              <p className="mt-5 text-[0.72rem] uppercase tracking-[0.2em] text-[var(--text-faint)]">
                Reference {error.digest}
              </p>
            ) : null}

            <button
              type="button"
              onClick={reset}
              aria-label="Reload the application"
              className="mt-9 inline-flex cursor-pointer items-center justify-center rounded-[0.95rem] border border-[var(--button-border)] [background:var(--button-fill)] px-5 py-3 text-sm font-semibold tracking-[-0.01em] text-[var(--button-text)] shadow-[var(--button-shadow)] transition duration-300 hover:-translate-y-0.5"
            >
              Reload
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
