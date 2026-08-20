"use client";

import Link from "next/link";
import { useEffect } from "react";

import { btnPrimary, btnSecondary, pageSubtitle } from "@/lib/styles";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-xl text-center">
        <span className="inline-flex items-center rounded-[0.75rem] border border-[var(--color-danger)]/18 bg-[var(--color-danger-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-danger)]">
          Something broke
        </span>

        <h1 className="[font-family:var(--font-display)] mt-6 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-heading)] sm:text-4xl">
          This page could not be displayed
        </h1>

        <p className={`${pageSubtitle} mx-auto mt-4`}>
          An unexpected error interrupted the page. Trying again will often
          resolve it — the underlying data is unaffected.
        </p>

        {error?.digest ? (
          <p className="mt-5 text-[0.72rem] uppercase tracking-[0.2em] text-[var(--text-faint)]">
            Reference {error.digest}
          </p>
        ) : null}

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className={btnPrimary}
            aria-label="Try loading this page again"
          >
            Try again
          </button>
          <Link href="/" className={btnSecondary} aria-label="Return to the home page">
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
