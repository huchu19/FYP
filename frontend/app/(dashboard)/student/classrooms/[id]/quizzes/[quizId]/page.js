"use client";

import { use, useEffect, useState, useRef } from "react";
import Link from "next/link";

import { apiGet, apiPost } from "@/lib/api";
import KahootQuiz from "@/components/quiz/KahootQuiz";
import {
  cardElevated, btnPrimary, btnSecondary, breadcrumb, breadcrumbLink,
  pageSection, inputClass, loadingText, badgeViolet,
} from "@/lib/styles";

const CONFIDENCE_LABELS = ["", "Guessing", "Low", "Moderate", "Confident", "Very confident"];
const MAX_HINT_LEVELS = 3;

function formatScore(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return "0";
  if (Number.isInteger(value)) return `${value}`;
  return value.toFixed(2).replace(/\.?0+$/, "");
}

function getHintCredit(hintsUsed) {
  const boundedHints = Math.min(Math.max(hintsUsed || 0, 0), MAX_HINT_LEVELS);
  return Math.max(0.25, 1 - (0.25 * boundedHints));
}

export default function StudentQuizPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({});
  const [confidence, setConfidence] = useState({});
  const [reasoning, setReasoning] = useState({});
  const [hintsUsed, setHintsUsed] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [reflection, setReflection] = useState("");
  const [selfRating, setSelfRating] = useState(0);
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const startTime = useRef(Date.now());
  const questionStartTimes = useRef({});

  useEffect(() => {
    apiGet(`/quizzes/${params.quizId}`)
      .then(setQuiz)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.quizId]);

  if (loading) return <p className={`py-10 ${loadingText}`}>Loading quiz...</p>;
  if (error) return <p className="py-10 text-[var(--color-danger)]">{error}</p>;

  const questions = quiz.questions || [];
  const totalQuestions = questions.length;
  const isMetacognitive = quiz.quiz_type === "metacognitive";
  const isKahoot = quiz.quiz_type === "kahoot";

  function handleSelect(questionIdx, option) {
    if (submitted) return;
    if (!questionStartTimes.current[questionIdx]) {
      questionStartTimes.current[questionIdx] = Date.now();
    }
    setAnswers((prev) => ({ ...prev, [questionIdx]: option }));
  }

  function handleConfidence(questionIdx, level) {
    if (submitted) return;
    setConfidence((prev) => ({ ...prev, [questionIdx]: level }));
  }

  function handleReasoning(questionIdx, text) {
    if (submitted) return;
    setReasoning((prev) => ({ ...prev, [questionIdx]: text }));
  }

  function handleRevealHint(questionIdx, totalHints) {
    if (submitted) return;
    if (!questionStartTimes.current[questionIdx]) {
      questionStartTimes.current[questionIdx] = Date.now();
    }
    setHintsUsed((prev) => ({
      ...prev,
      [questionIdx]: Math.min((prev[questionIdx] || 0) + 1, totalHints, MAX_HINT_LEVELS),
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000);

      const detailedAnswers = {};
      for (const [idx, answer] of Object.entries(answers)) {
        const conf = confidence[idx];
        const reason = reasoning[idx];
        const hints = hintsUsed[idx] || 0;
        const timeSpent = questionStartTimes.current[idx]
          ? Date.now() - questionStartTimes.current[idx]
          : null;

        if (conf || reason || timeSpent || hints > 0) {
          detailedAnswers[idx] = {
            selected_answer: answer,
            confidence_level: conf || null,
            reasoning_text: reason || null,
            reasoning_steps: timeSpent ? { time_spent_ms: timeSpent } : null,
            hints_used: hints,
          };
        } else {
          detailedAnswers[idx] = answer;
        }
      }

      const attemptResult = await apiPost(`/quizzes/${params.quizId}/attempts`, {
        answers: detailedAnswers,
        time_taken_seconds: timeTaken,
      });
      setResult(attemptResult);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReflectionSubmit() {
    if (!reflection.trim() && !selfRating) return;
    try {
      await apiPost(`/attempts/${result.id}/reflection`, {
        reflection: reflection.trim() || null,
        self_rated_understanding: selfRating || null,
      });
      setReflectionSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  }

  function handleRetry() {
    setAnswers({});
    setConfidence({});
    setReasoning({});
    setHintsUsed({});
    setSubmitted(false);
    setResult(null);
    setReflection("");
    setSelfRating(0);
    setReflectionSubmitted(false);
    startTime.current = Date.now();
    questionStartTimes.current = {};
  }

  async function handleKahootComplete({ score: kahootScore, totalPoints, total, answers: kahootAnswers }) {
    try {
      const timeTaken = Math.round((Date.now() - startTime.current) / 1000);
      const attemptResult = await apiPost(`/quizzes/${params.quizId}/attempts`, {
        answers: kahootAnswers || {},
        time_taken_seconds: timeTaken,
      });
      setResult(attemptResult);
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    }
  }

  const score = result?.score ?? 0;
  const maxScore = result?.max_score ?? totalQuestions;
  const xpEarned = result?.xp_earned ?? 0;
  const calibrationScore = result?.calibration_score;

  return (
    <section className={pageSection}>
      <div className={breadcrumb}>
        <Link className={breadcrumbLink} href={`/student/classrooms/${params.id}`}>&larr; Classroom</Link>
        <Link className={breadcrumbLink} href="/student">Dashboard</Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-[var(--text-heading)]">{quiz.title}</h1>
          <p className="text-sm text-[var(--text-muted)]">
            {totalQuestions} questions · {quiz.difficulty} difficulty
            {quiz.quiz_type && quiz.quiz_type !== "standard" && (
              <span className={`ml-2 ${badgeViolet}`}>{quiz.quiz_type}</span>
            )}
          </p>
        </div>
        {submitted && result && (
          <div className={`${cardElevated} px-6 py-4 text-center`}>
            <p className="text-3xl font-bold text-[var(--text-heading)]">
              {formatScore(score)}/{formatScore(maxScore)}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {score === maxScore ? "Perfect score!" : score >= maxScore * 0.6 ? "Good job!" : "Keep practising!"}
            </p>
            {xpEarned > 0 && (
              <p className="mt-1 text-sm font-semibold text-[var(--color-primary)]">+{xpEarned} XP</p>
            )}
            {calibrationScore !== null && calibrationScore !== undefined && (
              <p className="mt-1 text-xs text-[var(--color-warning)]">
                Self-assessment accuracy: {Math.round(calibrationScore * 100)}%
              </p>
            )}
          </div>
        )}
      </header>

      {isKahoot && !submitted && (
        <KahootQuiz questions={questions} onComplete={handleKahootComplete} />
      )}

      {isKahoot && submitted && result && (
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const serverResponse = result?.responses?.find((r) => r.question_index === idx);
            return (
              <div key={idx} className={`${cardElevated} p-5`}>
                <p className="mb-3 font-medium text-[var(--text-heading)]">
                  <span className="mr-2 text-[var(--color-primary)]">{idx + 1}.</span>
                  {q.question}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {(q.options || []).map((opt, oi) => (
                    <div
                      key={oi}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        opt === q.correct_answer
                          ? "border-emerald-500/30 bg-emerald-500/10 text-[var(--color-success)]"
                          : "border-[var(--border-card)] bg-[var(--bg-sunken)] text-[var(--text-secondary)]"
                      }`}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <p className="mt-3 text-xs text-[var(--text-faint)]">
                    <span className="font-semibold text-[var(--text-muted)]">Explanation:</span> {q.explanation}
                  </p>
                )}
                {serverResponse && (
                  <p className="mt-1 text-xs text-[var(--color-primary)]/70">
                    {serverResponse.is_correct ? `+${serverResponse.awarded_xp} XP` : "0 XP"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!isKahoot && <div className="space-y-4">
        {questions.map((q, idx) => {
          const selected = answers[idx];
          const serverResponse = result?.responses?.find((r) => r.question_index === idx);
          const qType = q.type || "mcq";
          const hasOptions = Array.isArray(q.options) && q.options.length > 0;
          const requiresReasoning = q.requires_reasoning || isMetacognitive || !hasOptions;
          const availableHints = Array.isArray(q.hints) ? q.hints : [];
          const revealedHintCount = hintsUsed[idx] || 0;
          const revealedHints = availableHints.slice(0, revealedHintCount);

          return (
            <div key={idx} className={`${cardElevated} p-5`}>
              {qType !== "mcq" && <span className={`mb-2 inline-block ${badgeViolet}`}>{qType.replace("_", " ")}</span>}

              <div className="mb-4 flex items-start justify-between gap-3">
                <p className="font-medium text-[var(--text-heading)]">
                  <span className="mr-2 text-[var(--color-primary)]">{idx + 1}.</span>
                  {q.question}
                </p>
                {isKahoot && (
                  <div className="flex shrink-0 gap-2 text-xs">
                    {q.time_limit_seconds && (
                      <span className="rounded-md bg-[var(--color-warning-soft)] px-2 py-1 font-semibold text-[var(--color-warning)]">
                        ⏱ {q.time_limit_seconds}s
                      </span>
                    )}
                    {q.points && (
                      <span className="rounded-md bg-[var(--color-success-soft)] px-2 py-1 font-semibold text-[var(--color-success)]">
                        ★ {q.points} pts
                      </span>
                    )}
                  </div>
                )}
              </div>

              {q.steps && q.steps.length > 0 && !submitted && (
                <div className="mb-4 rounded-lg border border-[var(--border-card)] bg-[var(--bg-sunken)] p-3">
                  <p className="mb-2 text-xs font-semibold text-[var(--text-muted)]">Work through these steps:</p>
                  <ol className="list-inside list-decimal space-y-1 text-sm text-[var(--text-secondary)]">
                    {q.steps.map((step, si) => <li key={si}>{step}</li>)}
                  </ol>
                </div>
              )}

              {!submitted && availableHints.length > 0 && (
                <div className="mb-4 rounded-xl border border-[var(--color-info)]/20 bg-[var(--bg-sunken)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-info)]">
                        Need a hint?
                      </p>
                      <p className="mt-1 text-sm text-[var(--text-secondary)]">
                        Reveal scaffolded prompts one level at a time. Each hint reduces the credit for this question.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRevealHint(idx, availableHints.length)}
                      disabled={revealedHintCount >= availableHints.length}
                      className={`${btnSecondary} px-4 py-2 text-xs uppercase tracking-[0.18em] disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      {revealedHintCount === 0
                        ? "Reveal Hint 1"
                        : revealedHintCount < availableHints.length
                          ? `Reveal Hint ${revealedHintCount + 1}`
                          : "All Hints Used"}
                    </button>
                  </div>

                  {revealedHints.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {revealedHints.map((hint, hintIdx) => (
                        <div
                          key={hintIdx}
                          className="rounded-lg border border-[var(--color-info)]/15 bg-[var(--bg-card)] px-3 py-2"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--color-info)]">
                            Hint {hintIdx + 1}
                          </p>
                          <p className="mt-1 text-sm text-[var(--text-secondary)]">{hint}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="mt-3 text-xs text-[var(--text-faint)]">
                    Current max credit: {formatScore(getHintCredit(revealedHintCount))}/1.0
                  </p>
                </div>
              )}

              {/* Options */}
              {!hasOptions && (
                <div className="rounded-lg border border-dashed border-[var(--border-card)] bg-[var(--bg-sunken)] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    Open-ended question
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Write your answer and reasoning in the box below — this question has no multiple-choice options.
                  </p>
                </div>
              )}
              {hasOptions && (
              <div className="grid gap-2 sm:grid-cols-2">
                {(q.options || []).map((opt, oi) => {
                  const isSelected = selected === opt;
                  const isCorrectOption = submitted && opt === q.correct_answer;

                  let borderClass = "border-[var(--border-card)] bg-[var(--bg-sunken)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]/40 hover:text-[var(--text-heading)]";
                  if (submitted && isCorrectOption) {
                    borderClass = "border-emerald-500/50 bg-emerald-500/10 text-[var(--color-success)]";
                  } else if (submitted && isSelected && !isCorrectOption) {
                    borderClass = "border-red-500/50 bg-red-500/10 text-[var(--color-danger)]";
                  } else if (!submitted && isSelected) {
                    borderClass = "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]";
                  }

                  return (
                    <button
                      key={oi}
                      onClick={() => handleSelect(idx, opt)}
                      disabled={submitted}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm transition ${borderClass} disabled:cursor-default`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              )}

              {/* Confidence rating */}
              {!submitted && (selected || !hasOptions) && (
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xs text-[var(--text-faint)]">Confidence:</span>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => handleConfidence(idx, level)}
                      className={`h-7 w-7 rounded-full text-xs font-semibold transition ${
                        confidence[idx] === level
                          ? "bg-[var(--color-warning)] text-white"
                          : "bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                      }`}
                      title={CONFIDENCE_LABELS[level]}
                    >
                      {level}
                    </button>
                  ))}
                  {confidence[idx] && (
                    <span className="text-xs text-[var(--color-warning)]/70">{CONFIDENCE_LABELS[confidence[idx]]}</span>
                  )}
                </div>
              )}

              {/* Reasoning text input */}
              {!submitted && requiresReasoning && (selected || !hasOptions) && (
                <div className="mt-3">
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">
                    {q.reasoning_prompt || (hasOptions ? "Explain why you chose this answer:" : "Write your answer:")}
                  </label>
                  <textarea
                    value={reasoning[idx] || ""}
                    onChange={(e) => {
                      handleReasoning(idx, e.target.value);
                      // For open-ended questions, count reasoning text as the answer so submit unlocks
                      if (!hasOptions) handleSelect(idx, e.target.value);
                    }}
                    placeholder={hasOptions ? "Write your reasoning..." : "Write your answer..."}
                    rows={hasOptions ? 2 : 4}
                    className={inputClass}
                  />
                </div>
              )}

              {/* Post-submit feedback */}
              {submitted && q.explanation && (
                <p className="mt-3 text-xs text-[var(--text-faint)]">
                  <span className="font-semibold text-[var(--text-muted)]">Explanation:</span> {q.explanation}
                </p>
              )}

              {submitted && serverResponse && serverResponse.confidence_level && (
                <p className={`mt-1 text-xs ${
                  serverResponse.is_correct && serverResponse.confidence_level >= 4
                    ? "text-[var(--color-success)]"
                    : !serverResponse.is_correct && serverResponse.confidence_level >= 4
                    ? "text-[var(--color-warning)]"
                    : serverResponse.is_correct && serverResponse.confidence_level <= 2
                    ? "text-[var(--color-info)]"
                    : "text-[var(--text-faint)]"
                }`}>
                  {serverResponse.is_correct && serverResponse.confidence_level >= 4 && "Confident and correct!"}
                  {!serverResponse.is_correct && serverResponse.confidence_level >= 4 && "Confident but incorrect — review this topic"}
                  {serverResponse.is_correct && serverResponse.confidence_level <= 2 && "Correct despite low confidence — trust yourself!"}
                  {!serverResponse.is_correct && serverResponse.confidence_level <= 2 && "Knew you were unsure — good self-awareness"}
                </p>
              )}

              {submitted && serverResponse && (
                <p className="mt-1 text-xs text-[var(--color-primary)]/70">
                  {serverResponse.is_correct ? `+${serverResponse.awarded_xp} XP` : "0 XP"}
                </p>
              )}

              {submitted && serverResponse && serverResponse.hints_used > 0 && (
                <p className="mt-1 text-xs text-[var(--color-info)]/80">
                  Used {serverResponse.hints_used} hint{serverResponse.hints_used === 1 ? "" : "s"} on this question.
                </p>
              )}
            </div>
          );
        })}
      </div>}

      {/* Post-quiz reflection */}
      {submitted && !reflectionSubmitted && (
        <div className="space-y-4 rounded-xl border border-[var(--color-accent)]/30 bg-[var(--color-accent-soft)] p-5">
          <h3 className="text-lg font-semibold text-[var(--color-accent)]">Reflect on your learning</h3>

          <div>
            <label className="mb-1 block text-sm text-[var(--text-muted)]">
              How well do you feel you understand this topic? (1-5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelfRating(level)}
                  className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                    selfRating === level
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--bg-muted)] text-[var(--text-muted)] hover:bg-[var(--bg-hover)]"
                  }`}
                >
                  {level}
                </button>
              ))}
              {selfRating > 0 && (
                <span className="self-center text-xs text-[var(--color-accent)]/70">
                  {["", "Very low", "Low", "Moderate", "Good", "Excellent"][selfRating]}
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-[var(--text-muted)]">
              What did you find most challenging? What would you study more?
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Write your reflection..."
              rows={3}
              className={inputClass}
            />
          </div>

          <button
            onClick={handleReflectionSubmit}
            disabled={!reflection.trim() && !selfRating}
            className="rounded-lg bg-[var(--color-accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] transition hover:opacity-80 disabled:opacity-40"
          >
            Save reflection
          </button>
        </div>
      )}

      {reflectionSubmitted && (
        <p className="text-sm text-[var(--color-accent)]">Reflection saved. Great metacognitive practice!</p>
      )}

      {!isKahoot && (
        <div className="flex gap-3 pt-2">
          {!submitted ? (
            <button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length < totalQuestions || submitting}
              className={`${btnPrimary} disabled:opacity-40`}
            >
              {submitting ? "Submitting..." : `Submit answers (${Object.keys(answers).length}/${totalQuestions})`}
            </button>
          ) : (
            <>
              <button onClick={handleRetry} className={btnSecondary}>
                Try again
              </button>
              <Link
                href={`/student/classrooms/${params.id}/knowledge-graph`}
                className={btnPrimary}
              >
                Return to Knowledge Map
              </Link>
            </>
          )}
        </div>
      )}
    </section>
  );
}
