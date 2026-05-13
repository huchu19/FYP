"use client";

import { useRouter } from "next/navigation";
import { card, btnPrimary } from "@/lib/styles";

/**
 * Post-quiz panel showing per-concept mastery changes.
 *
 * Shown on the quiz results page after submitting. Displays a before→after
 * mastery bar for each concept touched by the quiz and offers a deep-link
 * to the knowledge map that highlights those specific nodes.
 */
export default function ConceptMasteryDiff({ conceptDeltas = [], classroomId }) {
  const router = useRouter();

  if (!conceptDeltas.length) return null;

  const changedIds = conceptDeltas.map((d) => d.concept_id).join(",");

  function handleViewMap() {
    router.push(`/student/classrooms/${classroomId}/knowledge-graph?changed=${changedIds}`);
  }

  return (
    <div className={`${card} border-[var(--color-primary)]/25 p-6`}>
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-[var(--color-primary)]">
            Knowledge Map Updated
          </p>
          <h3 className="mt-1 font-display text-[1.8rem] font-semibold tracking-[-0.04em] text-[var(--text-heading)]">
            {conceptDeltas.length} concept{conceptDeltas.length !== 1 ? "s" : ""} updated
          </h3>
        </div>
        <button
          onClick={handleViewMap}
          className={`${btnPrimary} shrink-0`}
          aria-label="View updated knowledge map"
        >
          View your map →
        </button>
      </div>

      <div className="space-y-4">
        {conceptDeltas.map((d) => {
          const before = Math.round(d.mastery_before * 100);
          const after = Math.round(d.mastery_after * 100);
          const delta = Math.round(d.delta * 100);
          const improved = delta > 0;
          const declined = delta < 0;

          const afterColor = after >= 70
            ? "bg-[var(--color-success)]"
            : after >= 40
              ? "bg-amber-500"
              : "bg-[var(--color-danger)]";

          return (
            <div key={d.concept_id} className="rounded-[1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[var(--text-heading)]">{d.concept_name}</p>
                <span className={`shrink-0 text-sm font-bold ${
                  improved ? "text-[var(--color-success)]" : declined ? "text-[var(--color-danger)]" : "text-[var(--text-faint)]"
                }`}>
                  {improved ? "+" : ""}{delta}%
                </span>
              </div>

              {/* Before / After bar */}
              <div className="mt-3 space-y-1.5">
                <div className="flex items-center gap-3">
                  <span className="w-12 text-right text-[0.65rem] text-[var(--text-faint)]">Before</span>
                  <div className="flex-1 h-2 overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                    <div
                      className="h-2 rounded-full bg-[var(--bg-muted)] opacity-60 transition-all"
                      style={{ width: `${Math.max(before, 3)}%` }}
                    />
                  </div>
                  <span className="w-8 text-[0.65rem] text-[var(--text-faint)]">{before}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="w-12 text-right text-[0.65rem] text-[var(--text-faint)]">After</span>
                  <div className="flex-1 h-2 overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                    <div
                      className={`h-2 rounded-full transition-all ${afterColor}`}
                      style={{ width: `${Math.max(after, 3)}%` }}
                    />
                  </div>
                  <span className="w-8 text-[0.65rem] font-semibold text-[var(--text-heading)]">{after}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
