"use client";

import { use, useState } from "react";
import Link from "next/link";

import { apiPost } from "@/lib/api";

const card = "rounded-xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-md";
const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30";
const btnPrimary = "rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 disabled:opacity-60 disabled:shadow-none";
const btnSecondary = "rounded-lg border border-slate-600 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-500/40 hover:text-white disabled:opacity-60";

export default function NewLessonPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [prompt, setPrompt] = useState("Teach Newton's three laws of motion with real-world examples and simple analogies");
  const [audience, setAudience] = useState("Year 10 physics students");
  const [length, setLength] = useState("30 minutes");
  const [status, setStatus] = useState({ message: "", kind: "" });
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function buildPayload() {
    const fullPrompt = [prompt, audience && `Audience: ${audience}`, length && `Length: ${length}`].filter(Boolean).join("\n");
    return { classroom_id: Number(params.id), title: prompt ? prompt.slice(0, 60) : "Untitled lesson", prompt: fullPrompt, outline: [], body: null };
  }

  async function handleGenerate(event) {
    event.preventDefault();
    setStatus({ message: "", kind: "" });
    setSubmitting(true);
    try {
      const lesson = await apiPost("/lessons?generate=true", buildPayload());
      setPreview(lesson);
      setStatus({ message: "AI lesson generated!", kind: "success" });
    } catch (err) {
      setStatus({ message: err.message || "Failed to generate lesson", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveDraft() {
    setStatus({ message: "", kind: "" });
    setSubmitting(true);
    try {
      const lesson = await apiPost("/lessons?generate=false", buildPayload());
      setPreview(lesson);
      setStatus({ message: "Draft saved!", kind: "success" });
    } catch (err) {
      setStatus({ message: err.message || "Failed to save draft", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <Link className="transition hover:text-cyan-400" href={`/teacher/classrooms/${params.id}`}>&larr; Classroom</Link>
        <Link className="transition hover:text-cyan-400" href="/teacher">Teacher dashboard</Link>
        <Link className="transition hover:text-cyan-400" href="/">Home</Link>
      </div>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Lessons</p>
        <h1 className="text-3xl font-bold text-white">New lesson for class {params.id}</h1>
        <p className="text-slate-400">Describe what you want; we'll draft a lesson outline and quiz.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className={`${card} p-6 lg:col-span-2`}>
          <form className="space-y-4" onSubmit={handleGenerate}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-400">Prompt</span>
              <textarea rows={6} className={inputClass} placeholder="e.g. Teach Newton's laws with simple examples and a short 5-question quiz." value={prompt} onChange={(e) => setPrompt(e.target.value)} />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-400">Audience</span>
                <input type="text" className={inputClass} placeholder="Year 10 physics" value={audience} onChange={(e) => setAudience(e.target.value)} />
              </label>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-slate-400">Length</span>
                <input type="text" className={inputClass} placeholder="30 minutes" value={length} onChange={(e) => setLength(e.target.value)} />
              </label>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className={btnPrimary} disabled={submitting}>
                {submitting ? "Generating..." : "Generate lesson"}
              </button>
              <button type="button" className={btnSecondary} disabled={submitting} onClick={handleSaveDraft}>
                Save draft
              </button>
            </div>
          </form>
        </div>

        <div className={`${card} space-y-4 p-6`}>
          <h2 className="text-lg font-semibold text-white">Preview</h2>

          {status.message && (
            <div className={`rounded-lg border px-3 py-2 text-sm ${
              status.kind === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                : "border-red-500/30 bg-red-500/10 text-red-400"
            }`}>
              {status.message}
            </div>
          )}

          {preview ? (
            <div className="space-y-3 rounded-lg border border-slate-700/50 bg-slate-800/40 p-4 text-sm">
              <p className="font-semibold text-white">{preview.title}</p>
              <p className="text-xs text-slate-500">
                Classroom {preview.classroom_id}
                {preview.generated_by_ai && (
                  <span className="ml-2 rounded border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-cyan-400">AI Generated</span>
                )}
              </p>
              {preview.outline?.length > 0 && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Outline</p>
                  <ol className="list-decimal space-y-1 pl-5 text-slate-300">
                    {preview.outline.map((item, idx) => <li key={idx}>{item}</li>)}
                  </ol>
                </>
              )}
              {preview.body && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Content</p>
                  <div className="max-h-64 overflow-y-auto whitespace-pre-wrap text-slate-300">{preview.body}</div>
                </>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-700/50 bg-slate-800/30 p-4 text-sm text-slate-500">
              Outline and quiz preview will show here after generation.
            </div>
          )}

          <div className="space-y-2 text-sm">
            <p className="font-medium text-slate-300">Tips</p>
            <ul className="list-disc space-y-1 pl-5 text-slate-500">
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
