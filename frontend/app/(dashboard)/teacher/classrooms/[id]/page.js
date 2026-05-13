"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiDelete, apiGet } from "@/lib/api";
import {
  card, breadcrumb, breadcrumbLink, pageSection, pageHeader, headerTag,
  pageTitle, pageSubtitle, statLabel, listItem, badgeCyan, badgeViolet,
  loadingText, tableHead, tableRow, btnDanger,
} from "@/lib/styles";

export default function ClassroomPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const router = useRouter();
  const [classroom, setClassroom] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [classSummary, setClassSummary] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    localStorage.setItem("edunexus_teacher_last_classroom", params.id);
    let cancelled = false;
    Promise.all([
      apiGet(`/classrooms/${params.id}`),
      apiGet(`/classrooms/${params.id}/lessons`),
      apiGet(`/analytics/teacher/class-summary?classroom_id=${params.id}`).catch(() => null),
      apiGet(`/analytics/teacher/classroom-students?classroom_id=${params.id}`).catch(() => []),
    ])
      .then(([classroomData, lessonsData, summaryData, studentsData]) => {
        if (!cancelled) { setClassroom(classroomData); setLessons(lessonsData); setClassSummary(summaryData); setStudents(studentsData || []); }
      })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load classroom"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  async function handleDeleteClassroom() {
    const label = classroom?.name || `Classroom ${params.id}`;
    const confirmed = window.confirm(
      `Delete ${label}? This will permanently remove the classroom, lessons, quizzes, and student access.`
    );
    if (!confirmed) return;

    setDeleting(true);
    setError("");
    try {
      await apiDelete(`/classrooms/${params.id}`);
      router.replace("/teacher");
    } catch (err) {
      setError(err.message || "Failed to delete classroom");
      setDeleting(false);
    }
  }

  return (
    <section className={pageSection}>
      <div className={breadcrumb}>
        <Link className={breadcrumbLink} href="/teacher">&larr; Teacher dashboard</Link>
        <Link className={breadcrumbLink} href={`/teacher/classrooms/${params.id}/lessons/new`}>New lesson</Link>
        <Link className={breadcrumbLink} href={`/teacher/classrooms/${params.id}/quizzes/new`}>New quiz</Link>
        <Link className={breadcrumbLink} href={`/teacher/classrooms/${params.id}/knowledge-graph`}>Knowledge Graph</Link>
        <Link className={breadcrumbLink} href={`/teacher/classrooms/${params.id}/edit`}>Edit Curriculum</Link>
        <Link className={breadcrumbLink} href="/">Home</Link>
      </div>

      <header className={pageHeader}>
        <p className={headerTag}>Classroom</p>
        <h1 className={pageTitle}>
          {loading ? <span className="animate-pulse">Loading classroom...</span> : classroom?.name || `Classroom ${params.id}`}
        </h1>
        <p className={pageSubtitle}>Roster, lessons, and classroom metadata.</p>
        {!loading && !error && (
          <div className="pt-3">
            <button
              type="button"
              className={btnDanger}
              onClick={handleDeleteClassroom}
              disabled={deleting}
            >
              {deleting ? "Deleting..." : "Delete Classroom"}
            </button>
          </div>
        )}
      </header>

      {loading && <p className={loadingText}>Loading...</p>}
      {!loading && error && <p className="text-[var(--color-danger)]">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={card}>
            <h2 className="text-lg font-semibold text-[var(--text-heading)]">Details</h2>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className={statLabel}>Code</p>
                <p className="mt-1 font-mono text-lg font-bold text-[var(--color-primary)]">{classroom?.code}</p>
              </div>
              <div>
                <p className={statLabel}>Description</p>
                <p className="mt-1 text-[var(--text-secondary)]">{classroom?.description || "No description yet."}</p>
              </div>
            </div>

            {(classroom?.subject || classroom?.year_group || classroom?.learning_objectives || classroom?.syllabus_notes) && (
              <div className="mt-6 rounded-[1rem] border border-[var(--color-primary)]/18 bg-[var(--color-primary-soft)] px-4 py-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
                  Curriculum Profile
                </p>
                <dl className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
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
                  {classroom.syllabus_notes && (
                    <div>
                      <dt className="font-medium text-[var(--text-heading)]">Syllabus notes:</dt>
                      <dd className="mt-1 whitespace-pre-line">{classroom.syllabus_notes}</dd>
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

            {!(classroom?.subject || classroom?.year_group || classroom?.learning_objectives || classroom?.syllabus_notes) && (
              <div className="mt-4">
                <Link
                  href={`/teacher/classrooms/${params.id}/edit`}
                  className="text-xs font-medium text-[var(--color-primary)] hover:underline"
                >
                  + Add curriculum profile
                </Link>
              </div>
            )}
          </div>

          <div className={card}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-heading)]">Lessons</h2>
              <Link href={`/teacher/classrooms/${params.id}/lessons/new`} className="text-sm font-semibold text-[var(--color-primary)] transition hover:opacity-80">+ New</Link>
            </div>
            <div className="mt-3 space-y-2 text-sm">
              {lessons.length === 0 ? (
                <p className="text-[var(--text-faint)]">No lessons yet. Create one to get started.</p>
              ) : (
                <ul className="space-y-2">
                  {lessons.map((lesson) => (
                    <li key={lesson.id}>
                      <Link href={`/teacher/classrooms/${params.id}/lessons/${lesson.id}`} className={listItem}>
                        <span className="text-[var(--text-primary)]">{lesson.title}</span>
                        <span className={badgeCyan}>{lesson.status}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Class analytics */}
      {!loading && !error && classSummary && (
        <div className={card}>
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">Class Analytics</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className={statLabel}>Total Attempts</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-heading)]">{classSummary.total_attempts}</p>
            </div>
            <div>
              <p className={statLabel}>Avg Score</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-heading)]">{classSummary.avg_score_pct}%</p>
            </div>
            <div>
              <p className={statLabel}>Active Students</p>
              <p className="mt-1 text-2xl font-bold text-[var(--text-heading)]">{classSummary.unique_students}</p>
            </div>
          </div>
        </div>
      )}

      {/* Student roster */}
      {!loading && !error && students.length > 0 && (
        <div className={card}>
          <h2 className="text-lg font-semibold text-[var(--text-heading)]">Enrolled Students</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className={tableHead}>
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Attempts</th>
                  <th className="pb-2 pr-4">Avg Score</th>
                  <th className="pb-2 pr-4">XP</th>
                  <th className="pb-2 pr-4">Streak</th>
                  <th className="pb-2">Badges</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.student_id} className={tableRow}>
                    <td className="py-2 pr-4">
                      <Link
                        href={`/teacher/classrooms/${params.id}/students/${s.student_id}`}
                        className="font-medium text-[var(--color-primary)] transition hover:opacity-80"
                      >
                        {s.name || s.email}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-[var(--text-secondary)]">{s.total_attempts}</td>
                    <td className="py-2 pr-4">
                      <span className={s.avg_score_pct >= 80 ? "text-[var(--color-success)]" : s.avg_score_pct >= 50 ? "text-[var(--color-warning)]" : "text-[var(--color-danger)]"}>
                        {s.avg_score_pct}%
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-[var(--text-secondary)]">{s.xp}</td>
                    <td className="py-2 pr-4 text-[var(--text-secondary)]">{s.streak_days}d</td>
                    <td className="py-2">
                      <div className="flex flex-wrap gap-1">
                        {(s.badges || []).map((b) => (
                          <span key={b} className={badgeViolet}>{b}</span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
