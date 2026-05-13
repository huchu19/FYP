"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiGet, apiPost, getAccessToken } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
import GenerationDeck from "@/components/ui/GenerationDeck";
import {
  alertError,
  alertSuccess,
  btnPrimary,
  btnSecondary,
  card,
  emptyState,
  inputClass,
  pageSection,
} from "@/lib/styles";
import {
  ArrowRightIcon,
  BookIcon,
  FileIcon,
  SparkIcon,
} from "@/components/layout/icons";

const FORMAT_OPTIONS = [
  { value: "slides", label: "Slides", desc: "Slide-style sections" },
  { value: "pdf_report", label: "PDF Report", desc: "Formal report layout" },
  { value: "presentation", label: "Presentation", desc: "Bullet points and notes" },
  { value: "flashcards", label: "Flashcards", desc: "Q&A study cards" },
];

const FORMAT_LABELS = Object.fromEntries(FORMAT_OPTIONS.map((f) => [f.value, f.label]));

export default function NewLessonPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();

  // Mode toggle
  const [mode, setMode] = useState("ai"); // "ai" | "manual"

  // Shared fields
  const [contentFormat, setContentFormat] = useState("slides");
  const [status, setStatus] = useState({ message: "", kind: "" });
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [generationStartedAt, setGenerationStartedAt] = useState(null);

  // AI mode fields
  const [prompt, setPrompt] = useState("Teach Newton's three laws of motion with real-world examples and simple analogies");
  const [audience, setAudience] = useState("Year 10 students");
  const [length, setLength] = useState("60 minutes");
  const [referenceText, setReferenceText] = useState("");
  const [referenceFilename, setReferenceFilename] = useState("");
  const [extracting, setExtracting] = useState(false);

  // Manual mode fields
  const [manualTitle, setManualTitle] = useState("");
  const [manualBody, setManualBody] = useState("");

  // Classroom curriculum context
  const [classroom, setClassroom] = useState(null);
  useEffect(() => {
    apiGet(`/classrooms/${params.id}`)
      .then(setClassroom)
      .catch(() => {});
  }, [params.id]);

  function buildPayload() {
    const fullPrompt = [prompt, audience && `Audience: ${audience}`, length && `Length: ${length}`]
      .filter(Boolean)
      .join("\n");

    return {
      classroom_id: Number(params.id),
      title: prompt ? prompt.slice(0, 60) : "Untitled lesson",
      prompt: fullPrompt,
      outline: [],
      body: null,
      content_format: contentFormat,
      reference_text: referenceText || null,
    };
  }

  async function handleGenerate(event) {
    event.preventDefault();
    setStatus({ message: "", kind: "" });
    setActiveTask("generate");
    setGenerationStartedAt(Date.now());
    setSubmitting(true);
    try {
      const lesson = await apiPost("/lessons?generate=true", buildPayload());
      setPreview(lesson);
      setStatus({ message: "AI lesson generated!", kind: "success" });
    } catch (err) {
      setStatus({ message: err.message || "Failed to generate lesson", kind: "error" });
    } finally {
      setSubmitting(false);
      setActiveTask(null);
    }
  }

  async function handleSaveDraft() {
    setStatus({ message: "", kind: "" });
    setActiveTask("draft");
    setSubmitting(true);
    try {
      const lesson = await apiPost("/lessons?generate=false", buildPayload());
      setPreview(lesson);
      setStatus({ message: "Draft saved!", kind: "success" });
    } catch (err) {
      setStatus({ message: err.message || "Failed to save draft", kind: "error" });
    } finally {
      setSubmitting(false);
      setActiveTask(null);
    }
  }

  async function handleManualSave() {
    if (!manualTitle.trim()) {
      setStatus({ message: "Title is required", kind: "error" });
      return;
    }
    setStatus({ message: "", kind: "" });
    setSubmitting(true);
    try {
      const lesson = await apiPost("/lessons?generate=false", {
        classroom_id: Number(params.id),
        title: manualTitle.trim(),
        prompt: null,
        outline: [],
        body: manualBody || null,
        content_format: contentFormat,
      });
      setPreview(lesson);
      setStatus({ message: "Lesson saved!", kind: "success" });
    } catch (err) {
      setStatus({ message: err.message || "Failed to save lesson", kind: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/lessons/extract-text`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to extract text");
      const data = await res.json();
      setReferenceText(data.extracted_text || "");
      setReferenceFilename(data.filename || file.name);
    } catch (err) {
      setStatus({ message: err.message || "Failed to extract document text", kind: "error" });
    } finally {
      setExtracting(false);
    }
  }

  return (
    <section className={pageSection}>
      <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
            Lesson Studio
          </p>
          <h1 className="mt-4 font-display text-[clamp(3rem,5vw,4.8rem)] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            Create a lesson for {classroom?.name || `class ${params.id}`}
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">
            Generate with AI from a teaching brief, or write your own lesson content directly.
          </p>
        </div>

        <div className={`${card} p-6`}>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
            Delivery mode
          </p>
          <p className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            {FORMAT_LABELS[contentFormat]}
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
            Quiz generation follows on the lesson detail page once the draft is created and reviewed.
          </p>
        </div>
      </header>

      {/* Mode Toggle */}
      <div className="flex gap-2 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-1 w-fit">
        <button
          onClick={() => setMode("ai")}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
            mode === "ai"
              ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
          }`}
          aria-label="AI Generate mode"
        >
          <SparkIcon className="mr-2 inline-block h-4 w-4" />
          AI Generate
        </button>
        <button
          onClick={() => setMode("manual")}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
            mode === "manual"
              ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-heading)]"
          }`}
          aria-label="Write Manually mode"
        >
          <BookIcon className="mr-2 inline-block h-4 w-4" />
          Write Manually
        </button>
      </div>

      {submitting && activeTask === "generate" && generationStartedAt && (
        <GenerationDeck
          eyebrow="Lesson Pipeline"
          title="Composing a lesson package from your brief"
          description="The generator is shaping the teaching arc, selecting examples, and formatting the output so the classroom doesn't feel like it came from a blank template."
          launchedAt={generationStartedAt}
          context={[
            { label: "Class", value: params.id },
            { label: "Audience", value: audience || "General audience" },
            { label: "Format", value: FORMAT_LABELS[contentFormat] || contentFormat },
          ]}
          stages={[
            { label: "Brief Intake", detail: "Parsing the learning goal, audience, and pacing constraints from your prompt." },
            { label: "Structure Pass", detail: "Locking the lesson spine, outline order, and section rhythm." },
            { label: "Teaching Voice", detail: "Adding examples, analogies, and explanations that match the chosen level." },
            { label: "Delivery Package", detail: "Compiling the final outline and body content into a classroom-ready lesson." },
          ]}
          footer="The preview will update the moment the lesson payload clears the pipeline."
        />
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          {/* AI Generate Mode */}
          {mode === "ai" && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.45rem] border border-[var(--color-primary)]/18 bg-[var(--color-primary-soft)] px-5 py-5 shadow-[var(--shadow-soft)]">
                  <SparkIcon className="h-5 w-5 text-[var(--color-primary)]" />
                  <p className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                    Generate Lesson
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                    Create a structured lesson with sections, explanations, examples, and reusable teaching flow.
                  </p>
                </div>

                <div className="rounded-[1.45rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-5 py-5">
                  <FileIcon className="h-5 w-5 text-[var(--text-faint)]" />
                  <p className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                    Generate Quiz
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                    Available from the lesson view after the draft is saved, so quiz prompts inherit the lesson context.
                  </p>
                </div>
              </div>

              <div className={`${card} p-7`}>
                <form className="space-y-5" onSubmit={handleGenerate}>
                  {classroom && (classroom.subject || classroom.year_group || classroom.learning_objectives) && (
                    <div className="rounded-[1.1rem] border border-[var(--color-primary)]/18 bg-[var(--color-primary-soft)] px-4 py-4">
                      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                        Curriculum context — active for this classroom
                      </p>
                      <dl className="mt-3 space-y-1 text-sm text-[var(--text-secondary)]">
                        {classroom.subject && (
                          <div><dt className="inline font-medium text-[var(--text-heading)]">Subject: </dt><dd className="inline">{classroom.subject}</dd></div>
                        )}
                        {classroom.year_group && (
                          <div><dt className="inline font-medium text-[var(--text-heading)]">Level: </dt><dd className="inline">{classroom.year_group}</dd></div>
                        )}
                        {classroom.learning_objectives && (
                          <div>
                            <dt className="font-medium text-[var(--text-heading)]">Learning objectives:</dt>
                            <dd className="mt-1 whitespace-pre-line">{classroom.learning_objectives}</dd>
                          </div>
                        )}
                      </dl>
                      <Link
                        href={`/teacher/classrooms/${params.id}/edit`}
                        className="mt-3 inline-block text-xs font-semibold text-[var(--color-primary)] hover:underline"
                      >
                        Edit curriculum profile →
                      </Link>
                    </div>
                  )}

                  <label className="block space-y-2">
                    <span className="text-base font-medium text-[var(--text-heading)]">Topic brief</span>
                    <textarea
                      rows={6}
                      className={inputClass}
                      disabled={submitting}
                      placeholder="e.g. Teach Newton's laws with simple examples and a short 5-question quiz."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                  </label>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-base font-medium text-[var(--text-heading)]">Audience</span>
                      <input
                        type="text"
                        className={inputClass}
                        disabled={submitting}
                        placeholder="Year 10"
                        value={audience}
                        onChange={(e) => setAudience(e.target.value)}
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-base font-medium text-[var(--text-heading)]">Length</span>
                      <input
                        type="text"
                        className={inputClass}
                        disabled={submitting}
                        placeholder="60 minutes"
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                      />
                    </label>
                  </div>

                  {/* Reference Document Upload */}
                  <div className="space-y-2">
                    <span className="text-base font-medium text-[var(--text-heading)]">Reference Document (optional)</span>
                    <p className="text-xs text-[var(--text-muted)]">
                      Upload a PDF, DOCX, or TXT file. Its content will be fed to the AI as reference material.
                    </p>
                    <div className="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                        onChange={handleFileUpload}
                        disabled={submitting || extracting}
                        className="text-sm text-[var(--text-muted)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--color-primary-soft)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--color-primary)] hover:file:opacity-80"
                        aria-label="Upload reference document"
                      />
                      {extracting && <span className="text-xs text-[var(--text-faint)]">Extracting text...</span>}
                    </div>
                    {referenceFilename && (
                      <div className="flex items-center gap-2 rounded-lg border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 px-3 py-2">
                        <span className="text-xs font-semibold text-[var(--color-success)]">{referenceFilename}</span>
                        <span className="text-xs text-[var(--text-faint)]">
                          ({referenceText.length.toLocaleString()} characters extracted)
                        </span>
                        <button
                          type="button"
                          onClick={() => { setReferenceText(""); setReferenceFilename(""); }}
                          className="ml-auto text-xs text-[var(--color-danger)] hover:underline"
                          aria-label="Remove reference document"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Content Format */}
                  <div className="space-y-2">
                    <span className="text-base font-medium text-[var(--text-heading)]">Content format</span>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                      {FORMAT_OPTIONS.map((format) => (
                        <button
                          key={format.value}
                          type="button"
                          disabled={submitting}
                          onClick={() => setContentFormat(format.value)}
                          className={`rounded-[1rem] border px-4 py-4 text-left transition ${
                            contentFormat === format.value
                              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                              : "border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]/18"
                          }`}
                        >
                          <span className="block text-sm font-semibold">{format.label}</span>
                          <span className="mt-1 block text-xs opacity-75">{format.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button type="submit" className={btnPrimary} disabled={submitting}>
                      <SparkIcon className="h-4 w-4" />
                      {submitting && activeTask === "generate" ? "Generating lesson..." : "Generate Lesson"}
                    </button>
                    <button type="button" className={btnSecondary} disabled={submitting} onClick={handleSaveDraft}>
                      <BookIcon className="h-4 w-4" />
                      {submitting && activeTask === "draft" ? "Saving draft..." : "Save Draft"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* Manual Authoring Mode */}
          {mode === "manual" && (
            <div className={`${card} p-7`}>
              <div className="space-y-5">
                <div className="rounded-[1.45rem] border border-[var(--color-accent)]/18 bg-[var(--color-accent-soft)] px-5 py-5">
                  <BookIcon className="h-5 w-5 text-[var(--color-accent)]" />
                  <p className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                    Write Your Own Lesson
                  </p>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-secondary)]">
                    Full control over lesson content. Write in Markdown — sections, examples, and explanations as you see fit.
                  </p>
                </div>

                <label className="block space-y-2">
                  <span className="text-base font-medium text-[var(--text-heading)]">Lesson Title</span>
                  <input
                    type="text"
                    value={manualTitle}
                    onChange={(e) => setManualTitle(e.target.value)}
                    className={inputClass}
                    placeholder="e.g. Introduction to Newton's Laws"
                    disabled={submitting}
                    required
                    aria-label="Lesson title"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-base font-medium text-[var(--text-heading)]">Lesson Content (Markdown)</span>
                  <textarea
                    rows={20}
                    value={manualBody}
                    onChange={(e) => setManualBody(e.target.value)}
                    className={inputClass}
                    placeholder={"# Section 1: First Law\n\nAn object at rest stays at rest...\n\n# Section 2: Second Law\n\nF = ma..."}
                    disabled={submitting}
                    aria-label="Lesson body content"
                  />
                </label>

                <div className="space-y-2">
                  <span className="text-base font-medium text-[var(--text-heading)]">Content format</span>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {FORMAT_OPTIONS.map((format) => (
                      <button
                        key={format.value}
                        type="button"
                        disabled={submitting}
                        onClick={() => setContentFormat(format.value)}
                        className={`rounded-[1rem] border px-4 py-4 text-left transition ${
                          contentFormat === format.value
                            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]"
                            : "border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--color-primary)]/18"
                        }`}
                      >
                        <span className="block text-sm font-semibold">{format.label}</span>
                        <span className="mt-1 block text-xs opacity-75">{format.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleManualSave}
                    className={btnPrimary}
                    disabled={submitting || !manualTitle.trim()}
                    aria-label="Save lesson"
                  >
                    <BookIcon className="h-4 w-4" />
                    {submitting ? "Saving..." : "Save Lesson"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className={`${card} p-6`}>
            <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
              Preview
            </h2>

            {status.message && (
              <div className={`mt-4 ${status.kind === "success" ? alertSuccess : alertError}`}>
                {status.message}
              </div>
            )}

            {preview ? (
              <div className="mt-5 space-y-4">
                <div className="rounded-[1.1rem] border border-[var(--border-card)] bg-[var(--bg-list)] p-4">
                  <p className="font-display text-[1.7rem] font-semibold tracking-[-0.04em] text-[var(--text-heading)]">
                    {preview.title}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[var(--text-faint)]">
                    Classroom {preview.classroom_id}
                  </p>
                </div>

                {preview.outline?.length > 0 && (
                  <div className="rounded-[1.1rem] border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
                      Outline
                    </p>
                    <ol className="mt-3 space-y-2 text-sm leading-7 text-[var(--text-secondary)]">
                      {preview.outline.map((item, idx) => (
                        <li key={idx} className="flex gap-3">
                          <span className="font-display text-[1.1rem] text-[var(--color-primary)]">{idx + 1}</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {preview.body && (
                  <div className="rounded-[1.1rem] border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
                      Content sample
                    </p>
                    <div className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-7 text-[var(--text-secondary)]">
                      {preview.body}
                    </div>
                  </div>
                )}

                <Link href={`/teacher/classrooms/${params.id}/lessons/${preview.id}`} className={`w-full ${btnPrimary}`}>
                  View Full Lesson
                  <ArrowRightIcon className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className={`mt-5 ${emptyState}`}>
                {mode === "ai"
                  ? "The lesson outline and preview will appear here after generation."
                  : "Save your lesson to see a preview here."}
              </div>
            )}
          </div>

          <div className={`${card} p-6`}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
              {mode === "ai" ? "Prompt tips" : "Writing tips"}
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
              {mode === "ai" ? (
                <>
                  <li>Mention the learning goal and reading level.</li>
                  <li>Call out any quiz style or classroom constraints.</li>
                  <li>Upload a reference document to give AI more context.</li>
                  <li>Keep the prompt tight if you plan to iterate quickly.</li>
                </>
              ) : (
                <>
                  <li>Use Markdown headings (# Section) to structure your lesson.</li>
                  <li>Include examples and analogies for key concepts.</li>
                  <li>You can edit the body further on the lesson detail page.</li>
                  <li>Generate quizzes after saving from the lesson view.</li>
                </>
              )}
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
