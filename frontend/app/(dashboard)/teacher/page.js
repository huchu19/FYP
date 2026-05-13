"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import { apiGet } from "@/lib/api";
import {
  btnPrimary,
  btnSecondary,
  card,
  pageSection,
  statLabel,
} from "@/lib/styles";
import {
  ArrowRightIcon,
  BookIcon,
  ChartIcon,
  ClockIcon,
  PlusIcon,
  SparkIcon,
  UsersIcon,
} from "@/components/layout/icons";

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGet("/classrooms")
      .then((data) => {
        if (!cancelled) setClassrooms(data || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load classrooms");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const firstName = user?.name?.split(" ")[0] || "Teacher";
  const lastId = typeof window !== "undefined"
    ? localStorage.getItem("edunexus_teacher_last_classroom")
    : null;
  const firstClassroom =
    (lastId && classrooms.find((c) => String(c.id) === lastId)) ||
    classrooms[0] ||
    null;

  function copyJoinCode() {
    const code = firstClassroom?.code;
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  return (
    <section className={pageSection}>
      <header className="mb-8">
        <h1 className="font-display text-[clamp(3rem,5vw,4.8rem)] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
          Good morning, {firstName}
        </h1>
        <p className="mt-2 text-xl text-[var(--text-muted)]">
          Here&apos;s what&apos;s happening across your classrooms today.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* Active Classrooms → links to first classroom or create */}
        <Link
          href={firstClassroom ? `/teacher/classrooms/${firstClassroom.id}` : "/teacher/classrooms/new"}
          className={`${card} block p-6 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/24 hover:shadow-[var(--shadow-primary)]`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={statLabel}>Active Classrooms</p>
              <p className="mt-4 font-display text-[3.2rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
                {loading ? "..." : classrooms.length}
              </p>
              <p className="mt-2 text-sm text-[var(--color-success)]">
                {classrooms.length > 0 ? "Open workspace →" : "Create your first class →"}
              </p>
            </div>
            <UsersIcon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        </Link>

        {/* Lead Join Code → click to copy */}
        <button
          type="button"
          onClick={copyJoinCode}
          disabled={!firstClassroom || loading}
          className={`${card} w-full p-6 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/24 hover:shadow-[var(--shadow-primary)] disabled:cursor-default disabled:hover:translate-y-0`}
          title={firstClassroom ? "Click to copy join code" : "No classrooms yet"}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={statLabel}>Lead Join Code</p>
              <p className="mt-4 font-display text-[3rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                {loading ? "..." : firstClassroom?.code || "—"}
              </p>
              <p className={`mt-2 text-sm ${codeCopied ? "text-[var(--color-success)]" : "text-[var(--text-muted)]"}`}>
                {codeCopied ? "Copied to clipboard!" : "Click to copy code"}
              </p>
            </div>
            <BookIcon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        </button>

        {/* Lesson Studio → links to AI studio */}
        <Link
          href={firstClassroom ? `/teacher/classrooms/${firstClassroom.id}/lessons/new` : "/teacher/classrooms/new"}
          className={`${card} block p-6 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/24 hover:shadow-[var(--shadow-primary)]`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={statLabel}>Lesson Studio</p>
              <p className="mt-4 font-display text-[2.45rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                {firstClassroom ? "Live" : "Standby"}
              </p>
              <p className="mt-2 text-sm text-[var(--color-success)]">
                {firstClassroom ? "Generate a lesson →" : "Create a classroom first →"}
              </p>
            </div>
            <SparkIcon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        </Link>

        {/* Student View → opens student preview */}
        <Link
          href="/student"
          className={`${card} block p-6 transition hover:-translate-y-0.5 hover:border-[var(--color-primary)]/24 hover:shadow-[var(--shadow-primary)]`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={statLabel}>Student View</p>
              <p className="mt-4 font-display text-[2.8rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                Open
              </p>
              <p className="mt-2 text-sm text-[var(--color-success)]">Preview student experience →</p>
            </div>
            <ChartIcon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={firstClassroom ? `/teacher/classrooms/${firstClassroom.id}/lessons/new` : "/teacher/classrooms/new"}
          className={btnPrimary}
        >
          <SparkIcon className="h-4 w-4" />
          Generate Lesson with AI
        </Link>
        <Link href="/teacher/classrooms/new" className={btnSecondary}>
          <PlusIcon className="h-4 w-4" />
          Create Classroom
        </Link>
        <Link href="/student" className={btnSecondary}>
          <ChartIcon className="h-4 w-4" />
          Open Student View
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-[3rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            Recent Classrooms
          </h2>
          {firstClassroom && (
            <Link href={`/teacher/classrooms/${firstClassroom.id}`} className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-heading)] transition hover:text-[var(--color-primary)]">
              Open latest
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          )}
        </div>

        {error && (
          <div className={`${card} p-6 text-sm text-[var(--color-danger)]`}>
            {error}
          </div>
        )}

        {!error && classrooms.length === 0 && !loading && (
          <div className={`${card} p-8`}>
            <p className="font-display text-[2.4rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
              No classrooms yet
            </p>
            <p className="mt-3 max-w-2xl text-base leading-8 text-[var(--text-muted)]">
              Create your first classroom to unlock the AI lesson workflow, invite students, and start building out the teaching sequence.
            </p>
            <Link href="/teacher/classrooms/new" className={`mt-6 ${btnPrimary}`}>
              <PlusIcon className="h-4 w-4" />
              Create Classroom
            </Link>
          </div>
        )}

        {classrooms.length > 0 && (
          <div className="grid gap-4 xl:grid-cols-3">
            {classrooms.map((classroom) => (
              <Link
                key={classroom.id}
                href={`/teacher/classrooms/${classroom.id}`}
                className={`${card} group p-6 transition hover:-translate-y-1 hover:border-[var(--color-primary)]/24 hover:shadow-[var(--shadow-primary)]`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)] transition group-hover:text-[var(--color-primary)]">
                      {classroom.name}
                    </h3>
                    <p className="mt-2 text-sm font-medium uppercase tracking-[0.18em] text-[var(--text-faint)]">
                      {classroom.code}
                    </p>
                  </div>
                  <ArrowRightIcon className="h-4 w-4 text-[var(--text-faint)] transition group-hover:text-[var(--color-primary)]" />
                </div>

                <div className="mt-6 grid gap-3 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center gap-2">
                    <UsersIcon className="h-4 w-4" />
                    Classroom ready for enrolment
                  </div>
                  <div className="flex items-center gap-2">
                    <SparkIcon className="h-4 w-4" />
                    AI lesson generation available
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    Open the workspace to manage lessons and students
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
