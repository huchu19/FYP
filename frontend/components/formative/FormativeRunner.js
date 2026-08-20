"use client";

import { useCallback, useEffect, useState } from "react";
import { apiPost } from "@/lib/api";
import { btnPrimary, btnSecondary, btnGhost, alertError } from "@/lib/styles";

/* ------------------------------------------------------------------ */
/*  FormativeRunner — runs any formative assessment (pulse / diagnostic  */
/*  / inventory) in a modal: question flow, confidence, submit, results. */
/* ------------------------------------------------------------------ */

const TYPE_LABELS = {
  pulse: "Pulse Check",
  diagnostic: "Prerequisite Diagnostic",
  inventory: "Concept Inventory",
};

const CONFIDENCE_LEVELS = [
  { value: 1, label: "Guessing" },
  { value: 2, label: "Unsure" },
  { value: 3, label: "Maybe" },
  { value: 4, label: "Confident" },
  { value: 5, label: "Certain" },
];

export default function FormativeRunner({ assessment, onClose }) {
  const questions = assessment?.questions ?? [];
  const label = TYPE_LABELS[assessment?.assessment_type] || "Assessment";

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qIndex]: selectedOption }
  const [confidence, setConfidence] = useState({}); // { [qIndex]: 1-5 }
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const total = questions.length;
  const current = questions[index];
  const selected = answers[index];
  const allAnswered = questions.every((_, i) => answers[i] != null);

  const choose = useCallback(
    (option) => setAnswers((prev) => ({ ...prev, [index]: option })),
    [index]
  );

  async function submit() {
    setSubmitting(true);
    setError("");
    try {
      const responses = questions.map((_, i) => ({
        question_index: i,
        selected_answer: answers[i] ?? "",
        confidence: confidence[i] ?? null,
      }));
      const res = await apiPost("/formative-assessments/submit", {
        assessment_id: assessment.assessment_id,
        responses,
      });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Keyboard: number keys pick an option, arrows navigate.
  useEffect(() => {
    if (result) return undefined;
    function onKey(e) {
      if (e.key >= "1" && e.key <= "9" && current) {
        const optIdx = Number(e.key) - 1;
        if (optIdx < current.options.length) choose(current.options[optIdx]);
      } else if (e.key === "ArrowLeft" && index > 0) {
        setIndex((i) => i - 1);
      } else if (e.key === "ArrowRight" && index < total - 1) {
        setIndex((i) => i + 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, index, total, result, choose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[1.5rem] border border-[var(--border-card)] bg-[var(--bg-card)] p-6 shadow-2xl sm:p-8">
        {result ? (
          <Results result={result} label={label} onClose={onClose} />
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
                {label}
              </p>
              <button className={btnGhost} onClick={onClose} aria-label="Close assessment">
                Close
              </button>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="mb-1.5 flex justify-between text-xs text-[var(--text-muted)]">
                <span>Question {index + 1} of {total}</span>
                <span>{Object.keys(answers).length}/{total} answered</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${((index + 1) / total) * 100}%` }}
                />
              </div>
            </div>

            {current && (
              <div className="space-y-5">
                {current.concept_name && (
                  <span className="inline-block rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                    {current.concept_name}
                  </span>
                )}
                <h3 className="text-lg font-semibold leading-snug text-[var(--text-heading)]">
                  {current.question}
                </h3>

                <div className="space-y-2.5" role="radiogroup" aria-label="Answer options">
                  {current.options.map((option, i) => {
                    const active = selected === option;
                    return (
                      <button
                        key={i}
                        role="radio"
                        aria-checked={active}
                        onClick={() => choose(option)}
                        className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                          active
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--text-heading)]"
                            : "border-[var(--border-card)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]/50"
                        }`}
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--border-card)] text-xs font-semibold">
                          {i + 1}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {/* Confidence */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--text-faint)]">
                    How confident are you?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {CONFIDENCE_LEVELS.map((c) => {
                      const active = confidence[index] === c.value;
                      return (
                        <button
                          key={c.value}
                          onClick={() => setConfidence((prev) => ({ ...prev, [index]: c.value }))}
                          aria-label={`Confidence: ${c.label}`}
                          aria-pressed={active}
                          className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                            active
                              ? "bg-[var(--color-accent)] text-white"
                              : "bg-[var(--bg-sunken)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                          }`}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {error && <p className={alertError}>{error}</p>}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    className={btnSecondary}
                    onClick={() => setIndex((i) => Math.max(0, i - 1))}
                    disabled={index === 0}
                    aria-label="Previous question"
                  >
                    Back
                  </button>
                  {index < total - 1 ? (
                    <button
                      className={btnPrimary}
                      onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
                      aria-label="Next question"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      className={btnPrimary}
                      onClick={submit}
                      disabled={submitting || !allAnswered}
                      aria-label="Submit assessment"
                    >
                      {submitting ? "Scoring..." : "Submit"}
                    </button>
                  )}
                </div>
                {!allAnswered && index === total - 1 && (
                  <p className="text-right text-xs text-[var(--text-muted)]">
                    Answer all questions to submit.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Results view                                                        */
/* ------------------------------------------------------------------ */

function Results({ result, label, onClose }) {
  const score = result.score ?? 0;
  const pct = Math.round(score * 100);
  const scoreColor =
    score >= 0.8 ? "var(--color-success)" :
    score >= 0.5 ? "var(--color-accent)" :
    "var(--color-danger)";

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
          {label} · Results
        </p>
        <div
          className="mx-auto mt-4 flex h-24 w-24 items-center justify-center rounded-full border-4"
          style={{ borderColor: scoreColor }}
        >
          <span className="text-2xl font-bold" style={{ color: scoreColor }}>{pct}%</span>
        </div>
        {result.summary && (
          <p className="mt-3 text-sm text-[var(--text-secondary)]">{result.summary}</p>
        )}
      </div>

      {/* Per-question breakdown */}
      <div className="space-y-2">
        {(result.responses ?? []).map((r, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-card)] p-3 text-sm"
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ backgroundColor: r.is_correct ? "var(--color-success)" : "var(--color-danger)" }}
                aria-label={r.is_correct ? "Correct" : "Incorrect"}
              >
                {r.is_correct ? "✓" : "✕"}
              </span>
              <span className="text-[var(--text-secondary)]">
                Your answer: <strong className="text-[var(--text-heading)]">{r.selected_answer || "—"}</strong>
              </span>
            </div>
            {!r.is_correct && (
              <p className="mt-1.5 pl-7 text-xs text-[var(--text-muted)]">
                Correct: <strong className="text-[var(--color-success)]">{r.correct_answer}</strong>
                {r.explanation ? ` — ${r.explanation}` : ""}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {result.recommended_actions?.length > 0 && (
        <div className="rounded-xl border border-[var(--color-accent)]/20 bg-[var(--color-accent-soft)] p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
            What to review next
          </h4>
          <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-secondary)]">
            {result.recommended_actions.map((a, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 text-[var(--color-accent)]">→</span>
                <span><strong>{a.concept}</strong>{a.reason ? ` — ${a.reason}` : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-end">
        <button className={btnPrimary} onClick={onClose} aria-label="Finish and close">
          Done
        </button>
      </div>
    </div>
  );
}
