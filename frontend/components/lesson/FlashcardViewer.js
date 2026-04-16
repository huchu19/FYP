"use client";

import { useState } from "react";
import { btnPrimary, btnSecondary, emptyState, progressTrack, progressBar } from "@/lib/styles";

export default function FlashcardViewer({ flashcards = [] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [studied, setStudied] = useState(new Set());

  if (!flashcards.length) {
    return <div className={emptyState}>No flashcards available for this lesson.</div>;
  }

  const card = flashcards[currentIndex];
  const total = flashcards.length;
  const studiedCount = studied.size;

  function handleFlip() {
    setFlipped((prev) => !prev);
  }

  function handleNext() {
    setStudied((prev) => new Set(prev).add(currentIndex));
    setFlipped(false);
    setCurrentIndex((prev) => Math.min(prev + 1, total - 1));
  }

  function handlePrev() {
    setFlipped(false);
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  }

  function handleReset() {
    setCurrentIndex(0);
    setFlipped(false);
    setStudied(new Set());
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>Card {currentIndex + 1} of {total}</span>
        <span>{studiedCount}/{total} studied</span>
      </div>
      <div className={progressTrack}>
        <div className={progressBar} style={{ width: `${(studiedCount / total) * 100}%` }} />
      </div>

      {/* Card */}
      <div
        onClick={handleFlip}
        className="relative min-h-[200px] cursor-pointer select-none rounded-xl border border-[var(--border-card)] bg-[var(--bg-elevated)] p-8 text-center transition-all hover:border-[var(--color-primary)]/30"
        style={{ perspective: "1000px" }}
      >
        <div
          className="transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {!flipped ? (
            <div className="space-y-3">
              {card.topic && (
                <span className="inline-block rounded bg-[var(--color-primary-soft)] px-2 py-0.5 text-xs text-[var(--color-primary)]">
                  {card.topic}
                </span>
              )}
              <p className="text-lg font-medium text-[var(--text-heading)]">{card.front}</p>
              <p className="text-xs text-[var(--text-faint)]">Click to reveal answer</p>
            </div>
          ) : (
            <div className="space-y-3" style={{ transform: "rotateY(180deg)" }}>
              <span className="inline-block rounded bg-emerald-500/10 px-2 py-0.5 text-xs text-[var(--color-success)]">
                Answer
              </span>
              <p className="text-lg text-[var(--text-secondary)]">{card.back}</p>
              <p className="text-xs text-[var(--text-faint)]">Click to see question</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className={`${btnSecondary} disabled:opacity-30`}
        >
          Previous
        </button>

        <button
          onClick={handleFlip}
          className="rounded-lg bg-[var(--bg-muted)] px-4 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover)]"
        >
          Flip
        </button>

        {currentIndex < total - 1 ? (
          <button onClick={handleNext} className={btnPrimary}>
            Next
          </button>
        ) : (
          <button
            onClick={handleReset}
            className="rounded-lg border border-[var(--color-accent)]/50 bg-[var(--color-accent-soft)] px-4 py-2 text-sm font-semibold text-[var(--color-accent)] transition hover:bg-[var(--color-accent-soft)]"
          >
            Start over
          </button>
        )}
      </div>

      {studiedCount === total && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-center text-sm text-[var(--color-success)]">
          All flashcards studied! Great job reviewing.
        </div>
      )}
    </div>
  );
}
