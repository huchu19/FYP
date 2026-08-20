"use client";

import { useEffect, useState } from "react";

import { onApiWaking } from "@/lib/api";

/**
 * Explains the delay when the API is starting from cold.
 *
 * The backend runs on a free tier that suspends after inactivity, so the
 * first request from a visitor can take up to a minute. Without this the
 * app just looks broken while it waits.
 */
export default function WakingNotice() {
  const [waking, setWaking] = useState(false);

  useEffect(() => onApiWaking(setWaking), []);

  if (!waking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-5"
    >
      <div className="flex items-center gap-3 rounded-[1.1rem] border border-[var(--border-card)] bg-[var(--bg-elevated)] px-4 py-3 shadow-[var(--shadow-elevated)] backdrop-blur-xl">
        <span
          aria-hidden="true"
          className="h-2.5 w-2.5 shrink-0 animate-pulse rounded-full bg-[var(--color-primary)]"
        />
        <p className="text-[0.82rem] leading-5 text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-heading)]">
            Waking the server.
          </span>{" "}
          The free hosting tier sleeps when idle — this takes up to a minute.
        </p>
      </div>
    </div>
  );
}
