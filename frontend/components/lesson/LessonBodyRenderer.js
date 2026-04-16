"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import SlideViewer from "./SlideViewer";
import { cardElevated, proseWrapper, emptyState, btnSecondary, btnPrimary } from "@/lib/styles";

/**
 * Renders lesson body differently based on content_format:
 * - slides: paginated slide deck (SlideViewer)
 * - pdf_report: scrollable document with report styling
 * - presentation: slides with speaker notes highlighted
 * - flashcards: falls through to slides (flashcards shown separately)
 */
export default function LessonBodyRenderer({ markdown, lessonTitle, contentFormat }) {
  if (!markdown) return null;

  if (contentFormat === "pdf_report") {
    return <ReportView markdown={markdown} title={lessonTitle} />;
  }

  if (contentFormat === "presentation") {
    return <PresentationView markdown={markdown} title={lessonTitle} />;
  }

  // slides + flashcards both use SlideViewer for the body
  return <SlideViewer markdown={markdown} lessonTitle={lessonTitle} />;
}

/* ---------- PDF Report View ---------- */
function ReportView({ markdown, title }) {
  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-elevated)] shadow-[var(--shadow-elevated)]">
      {/* Report header */}
      <div className="border-b border-[var(--border-card)] bg-gradient-to-r from-[var(--color-primary-soft)] to-[var(--color-accent-soft)] px-8 py-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">Report</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--text-heading)]">{title}</h1>
      </div>

      {/* Report body — single scrollable document */}
      <div className="px-8 py-6">
        <div className={proseWrapper}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

/* ---------- Presentation View ---------- */
function parsePresentationSlides(markdown) {
  if (!markdown) return [];
  const lines = markdown.split("\n");
  const slides = [];
  let current = { title: "", content: [], speakerNotes: [] };

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)/);
    if (headingMatch) {
      if (current.title || current.content.length > 0) {
        slides.push({
          title: current.title,
          body: current.content.join("\n").trim(),
          speakerNotes: current.speakerNotes.join("\n").trim(),
        });
      }
      current = { title: headingMatch[1], content: [], speakerNotes: [] };
    } else if (line.match(/^>\s*Speaker notes?:/i)) {
      current.speakerNotes.push(line.replace(/^>\s*Speaker notes?:\s*/i, ""));
    } else if (current.speakerNotes.length > 0 && line.startsWith("> ")) {
      current.speakerNotes.push(line.replace(/^>\s*/, ""));
    } else {
      current.content.push(line);
    }
  }
  if (current.title || current.content.length > 0) {
    slides.push({
      title: current.title,
      body: current.content.join("\n").trim(),
      speakerNotes: current.speakerNotes.join("\n").trim(),
    });
  }
  return slides;
}

function PresentationView({ markdown, title }) {
  const slides = parsePresentationSlides(markdown);
  const [current, setCurrent] = useState(0);

  if (slides.length === 0) {
    return <div className={emptyState}>No presentation content to display.</div>;
  }

  const slide = slides[current];

  return (
    <div className="space-y-4">
      {/* Slide */}
      <div className="relative min-h-[420px] overflow-hidden rounded-2xl border border-[var(--border-card)] bg-[var(--bg-elevated)] shadow-[var(--shadow-elevated)]">
        <div className="absolute right-4 top-4 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] px-3 py-1 text-xs text-[var(--text-muted)]">
          {current + 1} / {slides.length}
        </div>

        <div className="p-8 sm:p-10">
          <h2 className="mb-6 text-2xl font-bold text-[var(--text-heading)] sm:text-3xl">
            {slide.title || title || "Introduction"}
          </h2>
          <div className={proseWrapper}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{slide.body}</ReactMarkdown>
          </div>
        </div>
      </div>

      {/* Speaker notes */}
      {slide.speakerNotes && (
        <div className="rounded-xl border border-[var(--color-warning)]/20 bg-amber-500/5 px-5 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-warning)]">Speaker Notes</p>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{slide.speakerNotes}</p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrent((c) => c - 1)}
          disabled={current === 0}
          className={`${btnSecondary} disabled:cursor-not-allowed disabled:opacity-30`}
        >
          Previous
        </button>
        <div className="flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrent(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === current ? "w-6 bg-[var(--color-accent)]" : "w-2 bg-[var(--bg-muted)] hover:bg-[var(--text-faint)]"
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrent((c) => c + 1)}
          disabled={current === slides.length - 1}
          className={`${btnPrimary} disabled:cursor-not-allowed disabled:opacity-30`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
