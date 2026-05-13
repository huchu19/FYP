"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/components/auth/AuthProvider";
import { apiGet, apiPost } from "@/lib/api";
import {
  alertError,
  alertSuccess,
  btnPrimary,
  card,
  inputClass,
  pageSection,
  statLabel,
} from "@/lib/styles";
import {
  ArrowRightIcon,
  BookIcon,
  BrainIcon,
  ChartIcon,
  ClockIcon,
  FileIcon,
  SparkIcon,
  UsersIcon,
} from "@/components/layout/icons";

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [gamification, setGamification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState("");
  const [joinStatus, setJoinStatus] = useState({ message: "", kind: "" });
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      apiGet("/classrooms").catch(() => []),
      apiGet("/gamification/me").catch(() => null),
    ])
      .then(([classroomsData, gamData]) => {
        if (!cancelled) {
          setClassrooms(classroomsData || []);
          setGamification(gamData);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  async function handleJoin(event) {
    event.preventDefault();
    setJoinStatus({ message: "", kind: "" });
    setJoining(true);
    try {
      const classroom = await apiPost("/classrooms/join", { code: joinCode.toUpperCase().trim() });
      setClassrooms((prev) => [...prev, classroom]);
      setJoinCode("");
      setJoinStatus({ message: `Joined ${classroom.name}!`, kind: "success" });
    } catch (err) {
      setJoinStatus({ message: err.message || "Failed to join", kind: "error" });
    } finally {
      setJoining(false);
    }
  }

  const lastClassroomId = typeof window !== "undefined"
    ? localStorage.getItem("edunexus_student_last_classroom")
    : null;
  const activeClassroom =
    (lastClassroomId && classrooms.find((c) => String(c.id) === lastClassroomId)) ||
    classrooms[0] ||
    null;

  const xp = gamification?.xp ?? 0;
  const streak = gamification?.streak_days ?? gamification?.streak ?? 0;
  const badges = gamification?.badges || [];

  return (
    <section className={pageSection}>
      <header className="mb-8">
        <h1 className="font-display text-[clamp(3rem,5vw,4.8rem)] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
          Welcome back, {user?.name || "there"}
        </h1>
        <p className="mt-2 text-xl text-[var(--text-muted)]">
          Keep up the momentum.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className={`${card} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={statLabel}>Courses Active</p>
              <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
                {loading ? "..." : classrooms.length}
              </p>
              <p className="mt-2 text-sm text-[var(--text-faint)]">
                {classrooms.length > 0 ? "Your enrolled classes" : "Join a class below"}
              </p>
            </div>
            <BookIcon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        </div>

        <Link
          href="/student/progress"
          className={`${card} block p-6 transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]/26 hover:shadow-[var(--shadow-accent)]`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={statLabel}>XP Earned</p>
              <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
                {loading ? "..." : xp.toLocaleString()}
              </p>
              <p className="mt-2 text-sm text-[var(--text-faint)]">View full progress →</p>
            </div>
            <ChartIcon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        </Link>

        <Link
          href="/student/progress"
          className={`${card} block p-6 transition hover:-translate-y-0.5 hover:border-[var(--color-accent)]/26 hover:shadow-[var(--shadow-accent)]`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={statLabel}>Streak</p>
              <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
                {loading ? "..." : `${streak} days`}
              </p>
              <p className="mt-2 text-sm text-[var(--text-faint)]">View full progress →</p>
            </div>
            <SparkIcon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-[3rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
              My Classes
            </h2>
            <span className="text-sm text-[var(--text-muted)]">Current study spaces</span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-[1.45rem] bg-[var(--color-primary-soft)]" />
              ))}
            </div>
          ) : classrooms.length === 0 ? (
            <div className={`${card} p-8 text-center`}>
              <p className="text-[var(--text-muted)]">You haven&apos;t joined any classrooms yet.</p>
              <p className="mt-2 text-sm text-[var(--text-faint)]">Use the join form below to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {classrooms.map((classroom) => (
                <Link
                  key={classroom.id}
                  href={`/student/classrooms/${classroom.id}`}
                  className={`${card} group block p-6 transition hover:-translate-y-1 hover:border-[var(--color-accent)]/26 hover:shadow-[var(--shadow-accent)]`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)] transition group-hover:text-[var(--color-accent)]">
                        {classroom.name}
                      </h3>
                      {(classroom.subject || classroom.year_group) && (
                        <p className="mt-1 text-sm text-[var(--color-primary)]">
                          {[classroom.subject, classroom.year_group].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      {classroom.description && (
                        <p className="mt-2 text-sm text-[var(--text-muted)] line-clamp-1">{classroom.description}</p>
                      )}
                    </div>
                    <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-[var(--text-faint)] transition group-hover:text-[var(--color-accent)]" />
                  </div>
                  <p className="mt-4 font-mono text-xs font-semibold text-[var(--text-faint)]">{classroom.code}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-[1.55rem] border border-[var(--color-accent)]/18 bg-[var(--color-accent-soft)] px-6 py-6 shadow-[var(--shadow-soft)]">
            <BrainIcon className="h-6 w-6 text-[var(--color-accent)]" />
            <h3 className="mt-5 font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
              Knowledge Map
            </h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              Explore your learning graph and see how concepts connect.
            </p>
            <Link
              href={activeClassroom ? `/student/classrooms/${activeClassroom.id}/knowledge-graph` : "/student/progress"}
              className="mt-5 inline-flex items-center gap-2 rounded-[0.9rem] border border-[var(--color-accent)]/24 bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--text-heading)] transition hover:-translate-y-0.5"
            >
              Open Map
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className={`${card} p-6`}>
            <div className="flex items-center gap-3">
              <FileIcon className="h-5 w-5 text-[var(--color-primary)]" />
              <h3 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                Progress
              </h3>
            </div>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              View your quiz history, topic mastery, and metacognitive insights.
            </p>
            <Link
              href="/student/progress"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              Open learner model
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          {!loading && (
            <div className={`${card} p-6`}>
              <p className={statLabel}>XP</p>
              <p className="mt-3 font-display text-[2.8rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                {xp.toLocaleString()}
              </p>
              {badges.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-[0.75rem] border border-[var(--color-accent)]/18 bg-[var(--color-accent-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[var(--text-faint)]">Complete quizzes to earn badges.</p>
              )}
            </div>
          )}
        </aside>
      </div>

      <div className={`${card} p-7`}>
        <div className="flex items-center gap-3">
          <UsersIcon className="h-5 w-5 text-[var(--color-primary)]" />
          <div>
            <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
              Join a Classroom
            </h2>
            <p className="text-sm text-[var(--text-muted)]">Enter the classroom code from your teacher.</p>
          </div>
        </div>

        <form className="mt-5 flex flex-col gap-3 md:flex-row" onSubmit={handleJoin}>
          <input
            type="text"
            className={`${inputClass} font-mono uppercase tracking-[0.12em]`}
            placeholder="e.g. PHYS-ABC"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            required
            aria-label="Classroom join code"
          />
          <button type="submit" className={`md:w-auto ${btnPrimary}`} disabled={joining}>
            {joining ? "Joining..." : "Join Classroom"}
          </button>
        </form>

        {joinStatus.message && (
          <p className={`mt-3 ${joinStatus.kind === "success" ? alertSuccess : alertError}`}>
            {joinStatus.message}
          </p>
        )}
      </div>
    </section>
  );
}
