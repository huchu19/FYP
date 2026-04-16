"use client";

import { useEffect, useState } from "react";

import { badgeCyan, badgeViolet, cardElevated } from "@/lib/styles";

function formatElapsed(ms) {
  const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export default function GenerationDeck({
  eyebrow = "Live Generation",
  title,
  description,
  stages = [],
  launchedAt = 0,
  context = [],
  accent = "primary",
  footer = "Keep this tab open while the pipeline assembles the output.",
}) {
  const [now, setNow] = useState(launchedAt);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [launchedAt]);

  const elapsedMs = Math.max(now - launchedAt, 0);
  const activeStage = stages.length > 0
    ? Math.min(Math.floor(elapsedMs / 1800), stages.length - 1)
    : 0;
  const currentStage = stages[activeStage] || null;
  const badgeClass = accent === "accent" ? badgeViolet : badgeCyan;
  const toneClass = accent === "accent"
    ? "text-[var(--color-accent)] border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)]"
    : "text-[var(--color-primary)] border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)]";
  const beamClass = accent === "accent"
    ? "from-[var(--color-accent)]/0 via-[var(--color-accent)]/30 to-[var(--color-accent)]/0"
    : "from-[var(--color-primary)]/0 via-[var(--color-primary)]/30 to-[var(--color-primary)]/0";
  const meterClass = accent === "accent"
    ? "from-[var(--color-accent)]/25 via-[var(--color-accent)]/75 to-[var(--color-accent)]/35"
    : "from-[var(--color-primary)]/25 via-[var(--color-primary)]/75 to-[var(--color-primary)]/35";
  const liveDotClass = accent === "accent" ? "bg-[var(--color-accent)]" : "bg-[var(--color-primary)]";

  return (
    <div className={`${cardElevated} relative overflow-hidden p-0`}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent_36%)] opacity-80" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[var(--line-gradient)]" />

      <div className="relative grid gap-6 p-6 lg:grid-cols-[1.35fr_0.95fr] lg:p-7">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className={badgeClass}>{eyebrow}</span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${toneClass}`}>
              <span className={`generation-pulse h-2.5 w-2.5 rounded-full ${liveDotClass}`} />
              Signal Active
            </span>
            <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
              Elapsed {formatElapsed(elapsedMs)}
            </span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-[var(--text-heading)] sm:text-[2rem]">
              {title}
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-[var(--text-muted)] sm:text-base">
              {description}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {stages.map((stage, index) => {
              const state = index < activeStage ? "done" : index === activeStage ? "active" : "queued";
              const shellClass = state === "active"
                ? "border-[var(--border-strong)] bg-[var(--bg-card)] shadow-[var(--shadow-card)]"
                : state === "done"
                  ? "border-[var(--color-success)]/18 bg-emerald-500/6"
                  : "border-[var(--border-card)] bg-[var(--bg-sunken)]";
              const markerClass = state === "active"
                ? toneClass
                : state === "done"
                  ? "border-emerald-500/20 bg-emerald-500/10 text-[var(--color-success)]"
                  : "border-[var(--border-card)] bg-[var(--bg-muted)] text-[var(--text-faint)]";

              return (
                <div
                  key={stage.label}
                  className={`rounded-[1.25rem] border px-4 py-4 transition duration-300 ${shellClass}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-full border text-[0.72rem] font-semibold ${markerClass}`}>
                      {index + 1}
                    </span>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-[var(--text-heading)]">{stage.label}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{stage.detail}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {context.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {context.map((item) => (
                <div
                  key={item.label}
                  className="rounded-full border border-[var(--border-card)] bg-[var(--bg-sunken)] px-3 py-1.5 text-[0.72rem] text-[var(--text-secondary)]"
                >
                  <span className="font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    {item.label}
                  </span>
                  <span className="ml-2 text-[var(--text-heading)]">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="generation-drift relative overflow-hidden rounded-[1.6rem] border border-[var(--border-card)] bg-[var(--bg-sunken)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
          <div className={`generation-scan absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r ${beamClass} blur-2xl`} />

          <div className="relative space-y-5">
            <div className="rounded-[1.25rem] border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
                Current Focus
              </p>
              <p className="mt-2 text-lg font-semibold text-[var(--text-heading)]">
                {currentStage?.label || "Bootstrapping pipeline"}
              </p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                {currentStage?.detail || "Aligning the generation pipeline with the current brief."}
              </p>
            </div>

            <div className="rounded-[1.25rem] border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
                  Signal Trace
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {stages.length} stages
                </p>
              </div>

              <div className="flex h-28 items-end gap-2">
                {[44, 70, 56, 82, 48, 66, 58, 76].map((height, index) => (
                  <span
                    key={height + index}
                    className={`generation-meter w-full rounded-full bg-gradient-to-t ${meterClass}`}
                    style={{
                      height,
                      animationDelay: `${index * 120}ms`,
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-[1.25rem] border border-dashed border-[var(--border-card)] px-4 py-3 text-sm text-[var(--text-muted)]">
              {footer}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
