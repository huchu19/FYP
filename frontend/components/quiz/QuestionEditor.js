"use client";

import { inputClass, btnPrimary, btnDanger, btnGhost, card } from "@/lib/styles";

const BLANK_QUESTION = {
  question: "",
  options: ["", "", "", ""],
  correct_answer: "",
  explanation: "",
  hints: ["", "", ""],
  concept_tags: [],
};

export default function QuestionEditor({ questions, setQuestions, quizType = "standard" }) {
  function updateQuestion(idx, field, value) {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, [field]: value } : q)));
  }

  function updateOption(qIdx, optIdx, value) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...(q.options || [])];
        opts[optIdx] = value;
        return { ...q, options: opts };
      })
    );
  }

  function addOption(qIdx) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === qIdx ? { ...q, options: [...(q.options || []), ""] } : q))
    );
  }

  function removeOption(qIdx, optIdx) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = (q.options || []).filter((_, oi) => oi !== optIdx);
        const corrected = q.correct_answer === q.options[optIdx] ? "" : q.correct_answer;
        return { ...q, options: opts, correct_answer: corrected };
      })
    );
  }

  function updateHint(qIdx, hintIdx, value) {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const hints = [...(q.hints || ["", "", ""])];
        hints[hintIdx] = value;
        return { ...q, hints };
      })
    );
  }

  function addQuestion() {
    setQuestions((prev) => [...prev, { ...BLANK_QUESTION, options: ["", "", "", ""], hints: ["", "", ""] }]);
  }

  function removeQuestion(idx) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  function moveQuestion(idx, direction) {
    setQuestions((prev) => {
      const arr = [...prev];
      const target = idx + direction;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  }

  return (
    <div className="space-y-4">
      {questions.map((q, idx) => (
        <div key={idx} className={`${card} relative space-y-4`}>
          {/* Header row */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">
              Question {idx + 1}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveQuestion(idx, -1)}
                disabled={idx === 0}
                className={`${btnGhost} px-2 py-1 text-xs disabled:opacity-30`}
                aria-label="Move question up"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveQuestion(idx, 1)}
                disabled={idx === questions.length - 1}
                className={`${btnGhost} px-2 py-1 text-xs disabled:opacity-30`}
                aria-label="Move question down"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removeQuestion(idx)}
                className={`${btnDanger} px-2 py-1 text-xs`}
                aria-label={`Delete question ${idx + 1}`}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Question text */}
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Question</label>
            <textarea
              value={q.question || ""}
              onChange={(e) => updateQuestion(idx, "question", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Enter the question text..."
              aria-label="Question text"
            />
          </div>

          {/* Options */}
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Options</label>
            <div className="space-y-2">
              {(q.options || []).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${idx}`}
                    checked={q.correct_answer === opt && opt !== ""}
                    onChange={() => updateQuestion(idx, "correct_answer", opt)}
                    className="accent-[var(--color-success)]"
                    title="Mark as correct answer"
                    aria-label={`Mark option ${oi + 1} as correct`}
                  />
                  <input
                    value={opt}
                    onChange={(e) => updateOption(idx, oi, e.target.value)}
                    className={`${inputClass} flex-1`}
                    placeholder={`Option ${oi + 1}`}
                    aria-label={`Option ${oi + 1}`}
                  />
                  {(q.options || []).length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx, oi)}
                      className="text-xs text-[var(--color-danger)] hover:underline"
                      aria-label={`Remove option ${oi + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {(q.options || []).length < 6 && (
              <button
                type="button"
                onClick={() => addOption(idx)}
                className={`${btnGhost} mt-2 text-xs`}
                aria-label="Add option"
              >
                + Add Option
              </button>
            )}
          </div>

          {/* Explanation */}
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">Explanation</label>
            <textarea
              value={q.explanation || ""}
              onChange={(e) => updateQuestion(idx, "explanation", e.target.value)}
              rows={2}
              className={inputClass}
              placeholder="Explain why the correct answer is right..."
              aria-label="Explanation"
            />
          </div>

          {/* Hints */}
          <div>
            <label className="mb-1 block text-xs text-[var(--text-muted)]">
              Hints (progressive scaffolding, optional)
            </label>
            <div className="space-y-2">
              {[0, 1, 2].map((hintIdx) => (
                <input
                  key={hintIdx}
                  value={(q.hints || [])[hintIdx] || ""}
                  onChange={(e) => updateHint(idx, hintIdx, e.target.value)}
                  className={inputClass}
                  placeholder={`Hint ${hintIdx + 1} — ${hintIdx === 0 ? "gentle nudge" : hintIdx === 1 ? "more specific" : "nearly gives it away"}`}
                  aria-label={`Hint ${hintIdx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Metacognitive fields */}
          {quizType === "metacognitive" && (
            <div>
              <label className="mb-1 block text-xs text-[var(--text-muted)]">Reasoning Prompt</label>
              <input
                value={q.reasoning_prompt || ""}
                onChange={(e) => updateQuestion(idx, "reasoning_prompt", e.target.value)}
                className={inputClass}
                placeholder="Ask the student to explain their thinking..."
                aria-label="Reasoning prompt"
              />
            </div>
          )}

          {/* Kahoot fields */}
          {quizType === "kahoot" && (
            <div className="flex gap-3">
              <div className="w-32">
                <label className="mb-1 block text-xs text-[var(--text-muted)]">Time (sec)</label>
                <input
                  type="number"
                  value={q.time_limit_seconds || 30}
                  onChange={(e) => updateQuestion(idx, "time_limit_seconds", Number(e.target.value))}
                  className={inputClass}
                  min={5}
                  max={120}
                  aria-label="Time limit in seconds"
                />
              </div>
              <div className="w-32">
                <label className="mb-1 block text-xs text-[var(--text-muted)]">Points</label>
                <input
                  type="number"
                  value={q.points || 100}
                  onChange={(e) => updateQuestion(idx, "points", Number(e.target.value))}
                  className={inputClass}
                  min={10}
                  max={1000}
                  aria-label="Points"
                />
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={addQuestion}
        className={`${btnPrimary} w-full justify-center`}
        aria-label="Add question"
      >
        + Add Question
      </button>
    </div>
  );
}
