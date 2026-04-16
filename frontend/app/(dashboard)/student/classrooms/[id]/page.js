"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { apiGet } from "@/lib/api";
import {
  card, breadcrumb, breadcrumbLink, pageSection, pageHeader,
  headerTagViolet, pageTitle, pageSubtitle, listItem, badgeCyan, badgeSuccess,
  loadingText,
} from "@/lib/styles";

export default function StudentClassroomPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const [classroom, setClassroom] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet(`/classrooms/${params.id}`),
      apiGet(`/classrooms/${params.id}/lessons`),
      apiGet(`/classrooms/${params.id}/quizzes`),
    ])
      .then(([classroomData, lessonsData, quizzesData]) => {
        if (!cancelled) { setClassroom(classroomData); setLessons(lessonsData); setQuizzes(quizzesData); }
      })
      .catch((err) => { if (!cancelled) setError(err.message || "Failed to load classroom"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [params.id]);

  return (
    <section className={pageSection}>
      <div className={breadcrumb}>
        <Link className={breadcrumbLink} href="/student">&larr; Student dashboard</Link>
        <Link className={breadcrumbLink} href={`/student/classrooms/${params.id}/knowledge-graph`}>Knowledge Graph</Link>
        <Link className={breadcrumbLink} href="/">Home</Link>
      </div>

      <header className={pageHeader}>
        <p className={headerTagViolet}>Classroom</p>
        <h1 className={pageTitle}>
          {loading ? <span className="animate-pulse">Loading...</span> : classroom?.name || `Classroom ${params.id}`}
        </h1>
        <p className={pageSubtitle}>
          {classroom?.description || "Lessons, quizzes, and progress for this classroom."}
        </p>
      </header>

      {loading && <p className={loadingText}>Loading...</p>}
      {!loading && error && <p className="text-[var(--color-danger)]">{error}</p>}

      {!loading && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className={card}>
            <h2 className="text-lg font-semibold text-[var(--text-heading)]">Lessons</h2>
            <div className="mt-3 space-y-2 text-sm">
              {lessons.length === 0 ? (
                <p className="text-[var(--text-faint)]">No lessons yet.</p>
              ) : (
                <ul className="space-y-2">
                  {lessons.filter((l) => l.status === "published").map((lesson) => (
                    <li key={lesson.id}>
                      <Link href={`/student/classrooms/${params.id}/lessons/${lesson.id}`} className={listItem}>
                        <span className="text-[var(--text-primary)]">{lesson.title}</span>
                        <span className={badgeCyan}>View</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className={card}>
            <h2 className="text-lg font-semibold text-[var(--text-heading)]">Quizzes</h2>
            <div className="mt-3 space-y-2 text-sm">
              {quizzes.length === 0 ? (
                <p className="text-[var(--text-faint)]">No quizzes yet.</p>
              ) : (
                <ul className="space-y-2">
                  {quizzes.filter((q) => q.is_published).map((quiz) => (
                    <li key={quiz.id}>
                      <Link href={`/student/classrooms/${params.id}/quizzes/${quiz.id}`} className={listItem}>
                        <span className="text-[var(--text-primary)]">{quiz.title}</span>
                        <span className={badgeSuccess}>
                          {quiz.questions?.length || 0} questions
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
