"use client";

import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = [
  "from-red-500 to-red-600",
  "from-blue-500 to-blue-600",
  "from-amber-500 to-amber-600",
  "from-emerald-500 to-emerald-600",
];

export default function KahootQuiz({ questions = [], onComplete }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [allAnswers, setAllAnswers] = useState({});
  const timerRef = useRef(null);
  const questionStartRef = useRef(null);

  const question = questions[currentQ];
  const timeLimit = question?.time_limit_seconds || 20;
  const maxPoints = question?.points || 1000;

  const handleTimeout = useCallback(() => {
    if (!showResult && selected === null) {
      setShowResult(true);
      setStreak(0);
    }
  }, [showResult, selected]);

  // Timer
  useEffect(() => {
    if (gameOver || showResult) return;
    setTimeLeft(timeLimit);
    questionStartRef.current = Date.now();

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentQ, gameOver, showResult, timeLimit, handleTimeout]);

  if (!questions.length) {
    return <p className="text-[var(--text-muted)]">No questions available.</p>;
  }

  function handleSelect(option) {
    if (showResult || selected !== null) return;
    clearInterval(timerRef.current);

    const isCorrect = option === question.correct_answer;
    const elapsed = (Date.now() - questionStartRef.current) / 1000;
    const timeBonus = Math.max(0, 1 - elapsed / timeLimit);
    const points = isCorrect ? Math.round(maxPoints * (0.5 + 0.5 * timeBonus)) : 0;

    setSelected(option);
    setShowResult(true);
    setAllAnswers((prev) => ({ ...prev, [currentQ]: option }));

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setTotalPoints((prev) => prev + points);
      setStreak((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  }

  function handleNext() {
    if (currentQ + 1 >= questions.length) {
      setGameOver(true);
      if (onComplete) {
        onComplete({ score, totalPoints, total: questions.length, answers: { ...allAnswers } });
      }
      return;
    }
    setCurrentQ((prev) => prev + 1);
    setSelected(null);
    setShowResult(false);
  }

  function handleRestart() {
    setCurrentQ(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setTotalPoints(0);
    setStreak(0);
    setAllAnswers({});
    setGameOver(false);
  }

  // Game over screen
  if (gameOver) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center space-y-6 py-16">
        <div className="text-6xl">
          {percentage >= 80 ? "\uD83C\uDFC6" : percentage >= 50 ? "\u2B50" : "\uD83D\uDCAA"}
        </div>
        <h2 className="text-3xl font-bold text-[var(--text-heading)]">Game Over!</h2>
        <div className="space-y-2 text-center">
          <p className="text-4xl font-bold text-[var(--color-warning)]">{totalPoints.toLocaleString()} pts</p>
          <p className="text-lg text-[var(--text-secondary)]">
            {score}/{questions.length} correct ({percentage}%)
          </p>
        </div>
        <button
          onClick={handleRestart}
          className="rounded-lg bg-gradient-to-r from-violet-500 to-pink-500 px-8 py-3 text-sm font-bold text-white shadow-lg transition hover:shadow-violet-500/40"
        >
          Play again
        </button>
      </div>
    );
  }

  const timerPct = (timeLeft / timeLimit) * 100;

  return (
    <div className="space-y-6">
      {/* Header: score + streak + progress */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="rounded-lg bg-amber-500/20 px-3 py-1 text-sm font-bold text-[var(--color-warning)]">
            {totalPoints.toLocaleString()} pts
          </span>
          {streak >= 2 && (
            <span className="rounded-lg bg-orange-500/20 px-3 py-1 text-sm font-bold text-orange-400">
              {streak}x streak!
            </span>
          )}
        </div>
        <span className="text-sm text-[var(--text-muted)]">
          {currentQ + 1} / {questions.length}
        </span>
      </div>

      {/* Timer bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)]">
        <div
          className={`h-2 rounded-full transition-all duration-1000 ${
            timerPct > 50 ? "bg-emerald-500"
              : timerPct > 25 ? "bg-amber-500"
              : "bg-red-500"
          }`}
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Question */}
      <div className="rounded-xl bg-[var(--bg-elevated)] p-6 text-center">
        <p className="text-xl font-bold text-[var(--text-heading)]">{question.question}</p>
        {!showResult && (
          <p className="mt-2 text-4xl font-bold text-[var(--text-heading)]">{timeLeft}s</p>
        )}
      </div>

      {/* Options (Kahoot grid) */}
      <div className="grid grid-cols-2 gap-3">
        {(question.options || []).map((opt, idx) => {
          const isSelected = selected === opt;
          const isCorrect = opt === question.correct_answer;

          let extraClasses = "";
          if (showResult && isCorrect) {
            extraClasses = "ring-4 ring-white scale-105";
          } else if (showResult && isSelected && !isCorrect) {
            extraClasses = "opacity-50 scale-95";
          } else if (showResult) {
            extraClasses = "opacity-30";
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(opt)}
              disabled={showResult}
              className={`rounded-xl bg-gradient-to-br ${COLORS[idx % 4]} p-4 text-left text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-default ${extraClasses}`}
            >
              <span className="text-lg font-bold">{opt}</span>
            </button>
          );
        })}
      </div>

      {/* Result feedback */}
      {showResult && (
        <div className="space-y-3 text-center">
          {selected === null ? (
            <p className="text-lg font-bold text-[var(--color-danger)]">Time&apos;s up!</p>
          ) : selected === question.correct_answer ? (
            <p className="text-lg font-bold text-[var(--color-success)]">Correct!</p>
          ) : (
            <p className="text-lg font-bold text-[var(--color-danger)]">
              Wrong! Answer: {question.correct_answer}
            </p>
          )}
          {question.explanation && (
            <p className="text-sm text-[var(--text-muted)]">{question.explanation}</p>
          )}
          <button
            onClick={handleNext}
            className="rounded-lg bg-[var(--bg-hover)] px-6 py-2 text-sm font-semibold text-[var(--text-heading)] transition hover:bg-[var(--bg-muted)]"
          >
            {currentQ + 1 >= questions.length ? "See results" : "Next question"}
          </button>
        </div>
      )}
    </div>
  );
}
