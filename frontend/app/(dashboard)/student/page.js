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
  progressBar,
  progressTrack,
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

const DEMO_CLASSROOMS = [
  { id: "demo-1", name: "AP Biology", code: "BIO-7K2" },
  { id: "demo-2", name: "Intro to Machine Learning", code: "ML-301" },
  { id: "demo-3", name: "World History", code: "HIST-A4X" },
];

const DEMO_GAMIFICATION = {
  xp: 2750,
  streak: 12,
  badges: ["Quick Learner", "Quiz Ace", "7-Day Streak", "Top 10%"],
};

const DEMO_RECENT = [
  { label: "Photosynthesis Quiz", score: "92%", subject: "AP Biology", time: "2 h ago" },
  { label: "Neural Networks Lesson", score: "Complete", subject: "Intro to ML", time: "5 h ago" },
  { label: "French Revolution Quiz", score: "88%", subject: "World History", time: "Yesterday" },
];

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
          setClassrooms(classroomsData?.length ? classroomsData : DEMO_CLASSROOMS);
          setGamification(gamData ?? DEMO_GAMIFICATION);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setClassrooms(DEMO_CLASSROOMS);
          setGamification(DEMO_GAMIFICATION);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleJoin(event) {
    event.preventDefault();
    setJoinStatus({ message: "", kind: "" });
    setJoining(true);
    try {
      const classroom = await apiPost("/classrooms/join", { code: joinCode });
      setClassrooms((prev) => [...prev, classroom]);
      setJoinCode("");
      setJoinStatus({ message: `Joined ${classroom.name}!`, kind: "success" });
    } catch (err) {
      setJoinStatus({ message: err.message || "Failed to join", kind: "error" });
    } finally {
      setJoining(false);
    }
  }

  const displayName = user?.name || "Alex";
  const xp = gamification?.xp ?? DEMO_GAMIFICATION.xp;
  const streak = gamification?.streak ?? DEMO_GAMIFICATION.streak;
  const avgScore = classrooms.length ? 85 : 0;

  return (
    <section className={pageSection}>
      <header className="mb-8">
        <h1 className="font-display text-[clamp(3rem,5vw,4.8rem)] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
          Welcome back, {displayName}
        </h1>
        <p className="mt-2 text-xl text-[var(--text-muted)]">
          Keep up the momentum. You&apos;re making strong progress this week.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={`${card} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={statLabel}>Courses Active</p>
              <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
                {loading ? "..." : classrooms.length}
              </p>
            </div>
            <BookIcon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        </div>

        <div className={`${card} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={statLabel}>Quizzes Completed</p>
              <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
                24
              </p>
              <p className="mt-2 text-sm text-[var(--color-success)]">+6 this week</p>
            </div>
            <FileIcon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        </div>

        <div className={`${card} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={statLabel}>Avg. Score</p>
              <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
                {loading ? "..." : `${avgScore}%`}
              </p>
              <p className="mt-2 text-sm text-[var(--color-success)]">+4%</p>
            </div>
            <ChartIcon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        </div>

        <div className={`${card} p-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className={statLabel}>Streak</p>
              <p className="mt-4 font-display text-[3.1rem] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
                {loading ? "..." : `${streak} days`}
              </p>
            </div>
            <SparkIcon className="h-5 w-5 text-[var(--text-faint)]" />
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-[3rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
              My Classes
            </h2>
            <span className="text-sm text-[var(--text-muted)]">Current study spaces</span>
          </div>

          <div className="space-y-4">
            {classrooms.map((classroom, index) => {
              const progress = [72, 58, 85][index] || 68;
              const teacher = ["Dr. Smith", "Ms. Johnson", "Mr. Lee"][index] || "Teacher";
              const nextLesson = ["Krebs Cycle", "The Cold War", "Bonding"][index] || "Next lesson";

              return (
                <Link
                  key={classroom.id}
                  href={`/student/classrooms/${classroom.id}`}
                  className={`${card} block p-6 transition hover:-translate-y-1 hover:border-[var(--color-accent)]/26 hover:shadow-[var(--shadow-accent)]`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                        {classroom.name}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--text-muted)]">{teacher}</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--color-accent)]">{progress}%</span>
                  </div>
                  <div className="mt-5">
                    <div className={progressTrack}>
                      <div className={progressBar} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                    <ArrowRightIcon className="h-4 w-4 rotate-180" />
                    Next: {nextLesson}
                  </div>
                </Link>
              );
            })}
          </div>
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
              href={classrooms[0] ? `/student/classrooms/${classrooms[0].id}/knowledge-graph` : "/student/progress"}
              className="mt-5 inline-flex items-center gap-2 rounded-[0.9rem] border border-[var(--color-accent)]/24 bg-[var(--bg-card)] px-4 py-2.5 text-sm font-medium text-[var(--text-heading)] transition hover:-translate-y-0.5"
            >
              Open Map
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>

          <div className={`${card} p-6`}>
            <h3 className="font-display text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
              Recent Activity
            </h3>
            <div className="mt-5 space-y-3">
              {DEMO_RECENT.map((item) => (
                <div key={item.label} className="rounded-[1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-[var(--text-heading)]">{item.label}</p>
                      <p className="mt-1 text-sm text-[var(--text-muted)]">{item.subject}</p>
                    </div>
                    <span className={`text-sm font-semibold ${item.score === "Complete" ? "text-[var(--color-primary)]" : "text-[var(--color-success)]"}`}>
                      {item.score}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-[var(--text-faint)]">
                    <ClockIcon className="h-3.5 w-3.5" />
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={`${card} p-6`}>
            <p className={statLabel}>XP</p>
            <p className="mt-3 font-display text-[2.8rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
              {xp.toLocaleString()}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(gamification?.badges || DEMO_GAMIFICATION.badges).map((badge) => (
                <span
                  key={badge}
                  className="rounded-[0.75rem] border border-[var(--color-accent)]/18 bg-[var(--color-accent-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>
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
