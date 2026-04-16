"use client";

import { card, btnPrimary, btnSecondary } from "@/lib/styles";

const CATEGORY_STYLES = {
  blind_spot: {
    badge: "border-red-500/20 bg-red-500/10 text-red-400",
    label: "Blind Spot",
    bar: "bg-red-400",
  },
  zpd: {
    badge: "border-[var(--color-primary)]/20 bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
    label: "Growth Edge",
    bar: "bg-[var(--color-primary)]",
  },
  low_mastery: {
    badge: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    label: "Needs Practice",
    bar: "bg-amber-400",
  },
};

export default function PracticeTargetsPanel({
  targets,
  loading,
  onGenerate,
  generating,
  onClose,
}) {
  if (loading) {
    return (
      <div className={`${card} p-6`}>
        <div className="animate-pulse space-y-4">
          <div className="h-5 w-48 rounded bg-[var(--bg-sunken)]" />
          <div className="h-16 rounded-xl bg-[var(--bg-sunken)]" />
          <div className="h-16 rounded-xl bg-[var(--bg-sunken)]" />
          <div className="h-16 rounded-xl bg-[var(--bg-sunken)]" />
        </div>
      </div>
    );
  }

  if (!targets || targets.length === 0) {
    return (
      <div className={`${card} p-6`}>
        <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--color-success)]">
          All concepts mastered
        </h2>
        <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
          Great work — no weak concepts found. Try a harder quiz type or explore
          new lessons to add more concepts to your map.
        </p>
        {onClose && (
          <button onClick={onClose} className={`${btnSecondary} mt-4`}>
            Close
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`${card} border-[var(--color-primary)]/20 p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            Targeted Practice
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {targets.length} concept{targets.length !== 1 ? "s" : ""} selected
            based on your mastery data
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-[var(--text-faint)] transition hover:text-[var(--text-heading)]"
            aria-label="Close practice panel"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <div className="mt-5 space-y-3">
        {targets.map((target) => {
          const style = CATEGORY_STYLES[target.category] || CATEGORY_STYLES.low_mastery;
          const masteryPct = Math.round(target.mastery * 100);

          return (
            <div
              key={target.concept_id}
              className="rounded-[1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-semibold text-[var(--text-heading)]">
                  {target.concept_name}
                </h3>
                <span
                  className={`shrink-0 rounded-lg border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] ${style.badge}`}
                >
                  {style.label}
                </span>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                <div
                  className={`h-2 rounded-full transition-all ${style.bar}`}
                  style={{ width: `${Math.max(masteryPct, 4)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-[var(--text-faint)]">
                {masteryPct}% mastery
              </p>

              <p className="mt-2 text-sm leading-relaxed text-[var(--text-muted)]">
                {target.reason}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={onGenerate}
          disabled={generating}
          className={btnPrimary}
          aria-label="Generate practice quiz"
        >
          {generating ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating Quiz...
            </>
          ) : (
            "Generate Practice Quiz"
          )}
        </button>
        {onClose && (
          <button onClick={onClose} disabled={generating} className={btnSecondary}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
