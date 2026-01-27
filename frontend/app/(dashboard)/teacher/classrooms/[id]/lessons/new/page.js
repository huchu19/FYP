"use client";

import { useState } from "react";
import Link from "next/link";

import { apiPost } from "@/lib/api";

export default function NewLessonPage({ params }) {
  const [prompt, setPrompt] = useState("");
  const [audience, setAudience] = useState("");
  const [length, setLength] = useState("");
  const [status, setStatus] = useState({ message: "", kind: "" });
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleGenerate(event) {
    event.preventDefault();
    setStatus({ message: "", kind: "" });
    setSubmitting(true);
    try {
      const payload = {
        classroom_id: Number(params.id),
        title: prompt ? prompt.slice(0, 60) : "Untitled lesson",
        prompt,
        outline: [],
        body: null,
      };
      const lesson = await apiPost("/lessons", payload);
      setPreview(lesson);
      setStatus({ message: "Lesson draft created", kind: "success" });
    } catch (err) {
      setStatus({ message: err.message || "Failed to generate lesson", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-teal-700">
        <Link className="hover:underline" href={`/teacher/classrooms/${params.id}`}>← Classroom</Link>
        <Link className="hover:underline" href="/teacher">Teacher dashboard</Link>
        <Link className="hover:underline" href="/">Home</Link>
      </div>
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-slate-500">Lessons</p>
        <h1 className="text-3xl font-semibold text-slate-900">New lesson for class {params.id}</h1>
        <p className="text-slate-600">Describe what you want; we’ll draft a lesson outline and quiz.</p>
      </header>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <form className="space-y-4" onSubmit={handleGenerate}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-700">Prompt</span>
              <textarea
                rows={6}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                placeholder="e.g. Teach Newton's laws with simple examples and a short 5-question quiz."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Audience</span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="Year 10 physics"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-700">Length</span>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                  placeholder="30 minutes"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="submit"
                className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 disabled:opacity-70"
                disabled={submitting}
              >
                {submitting ? "Generating…" : "Generate lesson"}
              </button>
              <button type="button" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50">
                Save draft
              </button>
            </div>
          </form>
        </div>
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
          {status.message && (
            <div
              className={`rounded-lg border px-3 py-2 text-sm ${
                status.kind === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {status.message}
            </div>
          )}
          {preview ? (
            <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="text-sm font-semibold text-slate-900">{preview.title}</p>
              <p className="text-xs text-slate-500">Classroom {preview.classroom_id}</p>
              <p className="text-slate-700">{preview.prompt}</p>
              {preview.outline?.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {preview.outline.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              Outline and quiz preview will show here after generation.
            </div>
          )}
          <div className="space-y-2 text-sm text-slate-700">
            <p className="font-medium text-slate-800">Tips</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Mention the learning goal and reading level.</li>
              <li>Ask for question types (MCQ, short answer).</li>
              <li>Keep prompts short for quick iterations.</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
