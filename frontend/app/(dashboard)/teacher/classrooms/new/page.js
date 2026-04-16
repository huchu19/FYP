"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiPost } from "@/lib/api";
import {
  alertError,
  btnPrimary,
  card,
  inputClass,
  pageSection,
} from "@/lib/styles";
import { ArrowRightIcon, BookIcon, PlusIcon } from "@/components/layout/icons";

export default function NewClassroomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const classroom = await apiPost("/classrooms", { name, code, description: description || null });
      router.push(`/teacher/classrooms/${classroom.id}`);
    } catch (err) {
      setError(err.message || "Failed to create classroom");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={pageSection}>
      <header className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
            Classroom Setup
          </p>
          <h1 className="mt-4 font-display text-[clamp(3rem,5vw,4.8rem)] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            Create Classroom
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--text-muted)]">
            Set up a new space for your students, assign a clean join code, and prepare the room for lesson generation.
          </p>
        </div>

        <div className={`${card} p-6`}>
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
            Next step
          </p>
          <p className="mt-4 font-display text-[2.1rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            Generate your first lesson once the room is live.
          </p>
          <Link href="/teacher" className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
            Back to dashboard
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className={`${card} p-7`}>
          <form className="space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-base font-medium text-[var(--text-heading)]">Classroom name</span>
              <input type="text" className={inputClass} placeholder="AP Biology — Period 3" value={name} onChange={(e) => setName(e.target.value)} required />
            </label>

            <label className="block space-y-2">
              <span className="text-base font-medium text-[var(--text-heading)]">Join code</span>
              <input
                type="text"
                className={`${inputClass} font-mono uppercase tracking-[0.12em]`}
                placeholder="BIO-203"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-base font-medium text-[var(--text-heading)]">Description</span>
              <textarea
                rows={5}
                className={inputClass}
                placeholder="Outline the subject, year group, and any teaching context that should travel with the classroom."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            {error && <p className={alertError}>{error}</p>}

            <button type="submit" className={btnPrimary} disabled={submitting}>
              <PlusIcon className="h-4 w-4" />
              {submitting ? "Creating..." : "Create Classroom"}
            </button>
          </form>
        </div>

        <aside className="space-y-4">
          <div className={`${card} p-6`}>
            <div className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
              <BookIcon className="h-5 w-5" />
            </div>
            <p className="mt-5 font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
              Build the teaching container first.
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              Lessons, quizzes, knowledge graphs, and student progress all hang off the classroom record you create here.
            </p>
          </div>

          <div className={`${card} p-6`}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
              Recommended
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
              <li>Use a short memorable join code.</li>
              <li>Add subject and year group context in the description.</li>
              <li>Open the room immediately after creation to start the AI lesson flow.</li>
            </ul>
          </div>
        </aside>
      </div>
    </section>
  );
}
