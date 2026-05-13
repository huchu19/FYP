"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { apiGet, apiPatch } from "@/lib/api";
import {
  alertError,
  btnPrimary,
  btnSecondary,
  card,
  inputClass,
  pageSection,
} from "@/lib/styles";
import { ArrowRightIcon } from "@/components/layout/icons";

export default function EditClassroomPage() {
  const params = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [subject, setSubject] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [learningObjectives, setLearningObjectives] = useState("");
  const [syllabusNotes, setSyllabusNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet(`/classrooms/${params.id}`)
      .then((c) => {
        setName(c.name ?? "");
        setDescription(c.description ?? "");
        setSubject(c.subject ?? "");
        setYearGroup(c.year_group ?? "");
        setLearningObjectives(c.learning_objectives ?? "");
        setSyllabusNotes(c.syllabus_notes ?? "");
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load classroom.");
        setLoading(false);
      });
  }, [params.id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await apiPatch(`/classrooms/${params.id}`, {
        name: name || undefined,
        description: description || null,
        subject: subject || null,
        year_group: yearGroup || null,
        learning_objectives: learningObjectives || null,
        syllabus_notes: syllabusNotes || null,
      });
      router.push(`/teacher/classrooms/${params.id}`);
    } catch (err) {
      setError(err.message || "Failed to save changes");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className={pageSection}>
      <header className="mb-8">
        <p className="text-[0.74rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
          Classroom Settings
        </p>
        <h1 className="mt-4 font-display text-[clamp(2.4rem,4vw,3.8rem)] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
          Edit Curriculum Profile
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-muted)]">
          Update the classroom name, description, and curriculum constraints. AI lessons generated here will automatically respect the profile you set.
        </p>
      </header>

      {loading ? (
        <div className={`${card} p-7 space-y-5`}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-xl bg-[var(--color-primary-soft)]" />
          ))}
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className={`${card} p-7`}>
            <form className="space-y-5" onSubmit={handleSubmit}>
              <label className="block space-y-2">
                <span className="text-base font-medium text-[var(--text-heading)]">Classroom name</span>
                <input
                  type="text"
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  aria-label="Classroom name"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-base font-medium text-[var(--text-heading)]">Description</span>
                <textarea
                  rows={4}
                  className={inputClass}
                  placeholder="General classroom description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  aria-label="Description"
                />
              </label>

              <div className="border-t border-[var(--border-subtle)] pt-5">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                  Curriculum Profile <span className="font-normal normal-case tracking-normal text-[var(--text-faint)]">— optional</span>
                </p>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Injected into every AI lesson generated in this classroom.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-[var(--text-heading)]">Subject</span>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Physics"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      aria-label="Subject"
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-[var(--text-heading)]">Year group / level</span>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="e.g. Year 10 / GCSE"
                      value={yearGroup}
                      onChange={(e) => setYearGroup(e.target.value)}
                      aria-label="Year group or level"
                    />
                  </label>
                </div>

                <label className="mt-4 block space-y-2">
                  <span className="text-sm font-medium text-[var(--text-heading)]">Learning objectives</span>
                  <textarea
                    rows={5}
                    className={inputClass}
                    placeholder={"e.g. Understand Newton's three laws\nApply F=ma to real-world scenarios"}
                    value={learningObjectives}
                    onChange={(e) => setLearningObjectives(e.target.value)}
                    aria-label="Learning objectives"
                  />
                </label>

                <label className="mt-4 block space-y-2">
                  <span className="text-sm font-medium text-[var(--text-heading)]">Syllabus notes</span>
                  <textarea
                    rows={3}
                    className={inputClass}
                    placeholder="e.g. AQA GCSE Physics spec — do not cover nuclear physics"
                    value={syllabusNotes}
                    onChange={(e) => setSyllabusNotes(e.target.value)}
                    aria-label="Syllabus notes"
                  />
                </label>
              </div>

              {error && <p className={alertError}>{error}</p>}

              <div className="flex gap-3">
                <button type="submit" className={btnPrimary} disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
                <Link
                  href={`/teacher/classrooms/${params.id}`}
                  className={btnSecondary}
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>

          <aside className={`${card} p-6 self-start`}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
              How it works
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
              When a teacher generates an AI lesson in this classroom, the curriculum profile is prepended to the prompt. The AI uses subject, level, and objectives to tailor content depth, vocabulary, and examples accordingly.
            </p>
            <Link
              href={`/teacher/classrooms/${params.id}`}
              className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]"
            >
              Back to classroom
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
