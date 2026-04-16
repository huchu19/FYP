"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { btnPrimary, btnSecondary, emptyState, proseWrapper } from "@/lib/styles";

/**
 * Splits a Markdown body into slides on ## headings.
 */
function parseSlides(markdown) {
  if (!markdown) return [];

  const lines = markdown.split("\n");
  const slides = [];
  let current = { title: "", content: [] };

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)/);
    if (match) {
      if (current.title || current.content.length > 0) {
        slides.push({ title: current.title, body: current.content.join("\n").trim() });
      }
      current = { title: match[1], content: [] };
    } else {
      current.content.push(line);
    }
  }
  if (current.title || current.content.length > 0) {
    slides.push({ title: current.title, body: current.content.join("\n").trim() });
  }

  return slides;
}

export default function SlideViewer({ markdown, lessonTitle }) {
  const slides = parseSlides(markdown);
  const [current, setCurrent] = useState(0);

  if (slides.length === 0) {
    return <div className={emptyState}>No lesson content to display.</div>;
  }

  const slide = slides[current];
  const isFirst = current === 0;
  const isLast = current === slides.length - 1;

  return (
    <div className="space-y-4">
      {/* Slide card */}
      <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-elevated)] shadow-[var(--shadow-elevated)]">
        {/* Slide number badge */}
        <div className="absolute right-4 top-4 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] px-3 py-1 text-xs text-[var(--text-muted)]">
          {current + 1} / {slides.length}
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="mb-6 text-2xl font-bold text-[var(--text-heading)] sm:text-3xl">
            {slide.title || lessonTitle || "Introduction"}
          </h2>

          <div className={proseWrapper}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide.body}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => c - 1)}
          disabled={isFirst}
          className={`${btnSecondary} disabled:cursor-not-allowed disabled:opacity-30`}
        >
          Previous
        </button>

        {/* Slide dots */}
        <div className="flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === current
                  ? "w-6 bg-[var(--color-primary)]"
                  : "w-2 bg-[var(--bg-muted)] hover:bg-[var(--text-faint)]"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent((c) => c + 1)}
          disabled={isLast}
          className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-30`}
        >
          Next
        </button>
      </div>

      {/* Outline / jump-to */}
      {slides.length > 1 && (
        <details className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)]">
          <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-heading)]">
            Slide overview
          </summary>
          <ol className="space-y-1 px-5 pb-4">
            {slides.map((s, idx) => (
              <li key={idx}>
                <button
                  onClick={() => setCurrent(idx)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                    idx === current
                      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-heading)]"
                  }`}
                >
                  <span className="mr-2 text-xs text-[var(--text-faint)]">{idx + 1}.</span>
                  {s.title || "Introduction"}
                </button>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  );
}
