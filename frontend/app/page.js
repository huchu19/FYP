import Link from "next/link";

import { btnPrimary, btnSecondary, card } from "@/lib/styles";
import {
  ArrowRightIcon,
  BookIcon,
  BrainIcon,
  ChartIcon,
  FileIcon,
  SparkIcon,
  UsersIcon,
} from "@/components/layout/icons";

const stats = [
  "12,000+ Students",
  "800+ Teachers",
  "50,000+ Lessons Generated",
  "95% Completion Rate",
];

const features = [
  {
    title: "AI Lesson Generation",
    description: "Create polished lessons and quiz drafts in minutes with a teacher-facing studio built for review, not blind auto-publish.",
    icon: SparkIcon,
  },
  {
    title: "Knowledge Graphs",
    description: "Map concept relationships and surface what students understand, what they miss, and what should come next.",
    icon: BrainIcon,
  },
  {
    title: "Adaptive Quizzes",
    description: "Run scaffolded assessments with hints, reflections, confidence capture, and concept-level feedback loops.",
    icon: FileIcon,
  },
  {
    title: "Open Learner Model",
    description: "Give students a transparent progress environment where mastery, reflection, and evidence are visible.",
    icon: ChartIcon,
  },
  {
    title: "Classroom Management",
    description: "Set up classrooms, invite learners, review activity, and keep the teacher workspace clear and controllable.",
    icon: UsersIcon,
  },
  {
    title: "Curriculum Studio",
    description: "Iterate on generated material, refine sequences, and keep every lesson aligned with the intended syllabus.",
    icon: BookIcon,
  },
];

const workflow = [
  {
    step: "01",
    title: "Create & Generate",
    description: "Teachers set the brief, shape the lesson, and turn AI output into classroom-ready material.",
    icon: SparkIcon,
  },
  {
    step: "02",
    title: "Learn & Practice",
    description: "Students move through lessons, quizzes, and hints in a focused environment tuned to progression.",
    icon: BookIcon,
  },
  {
    step: "03",
    title: "Track & Grow",
    description: "Progress data, mastery evidence, and knowledge maps feed back into the next cycle of teaching.",
    icon: ChartIcon,
  },
];

export default function Home() {
  return (
    <div className="space-y-16 pb-12 lg:space-y-24">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-elevated)] px-6 py-10 shadow-[var(--shadow-elevated)] sm:px-8 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-4xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
              <SparkIcon className="h-4 w-4 text-[var(--color-primary)]" />
              AI-Powered Adaptive Learning
            </span>

            <h1 className="mt-8 font-display text-[clamp(3.4rem,9vw,7.2rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-[var(--text-heading)]">
              Where Teaching Meets
              <span className="block text-[var(--color-primary)]">Intelligent Learning</span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-9 text-[var(--text-muted)] sm:text-[1.35rem]">
              EduNexus gives teachers a cleaner curriculum studio for AI-assisted lesson building, while students get a
              calmer learner cockpit for mastery, progress, and reflection.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link href="/register" className={btnPrimary}>
                Start Teaching Smarter
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/register?role=student" className={btnSecondary}>
                Join as a Student
              </Link>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className={`${card} p-6`}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]">
              Teaching Studio
            </p>
            <p className="mt-4 font-display text-[2.1rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
              Review, edit, and direct every AI output.
            </p>
            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">
              The system should feel controlled and publishable, not like auto-generated slides thrown onto a dashboard.
            </p>
          </div>

          <div className={`${card} p-6`}>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]">
              Learner Cockpit
            </p>
            <div className="mt-4 space-y-4">
              {[
                "Open learner model with mastery visibility",
                "Knowledge graph views with concept focus",
                "Hints, evidence trails, and progress feedback",
              ].map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="font-display text-3xl font-semibold tracking-[-0.05em] text-[var(--color-accent)]">
                    0{index + 1}
                  </span>
                  <p className="pt-1 text-sm leading-6 text-[var(--text-secondary)]">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-[1.6rem] border border-[var(--border-card)] bg-[var(--bg-shell)] px-6 py-6 shadow-[var(--shadow-soft)]">
        <div className="grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((item) => (
            <div key={item} className="text-sm font-medium text-[var(--text-secondary)]">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="space-y-10">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.26em] text-[var(--color-primary)]">
            Platform Features
          </p>
          <h2 className="mt-4 font-display text-[clamp(2.8rem,5vw,4.7rem)] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            Everything You Need to Teach & Learn
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--text-muted)]">
            A complete adaptive learning environment, from lesson creation to progress tracking and knowledge mastery.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className={`${card} p-8`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-[0.95rem] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-6 font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)]">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="how-it-works" className="rounded-[2rem] border border-[var(--border-card)] bg-[var(--bg-elevated)] px-6 py-10 shadow-[var(--shadow-card)] sm:px-8 lg:px-10 lg:py-14">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.26em] text-[var(--text-faint)]">How It Works</p>
          <h2 className="mt-4 font-display text-[clamp(2.7rem,5vw,4.5rem)] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            From Lesson Creation to Mastery
          </h2>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {workflow.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="text-center">
                <span className="font-display text-6xl font-semibold tracking-[-0.08em] text-[var(--border-card)]">
                  {item.step}
                </span>
                <div className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-[1rem] border border-[var(--border-card)] bg-[var(--bg-card)] text-[var(--color-primary)] shadow-[var(--shadow-soft)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                  {item.title}
                </h3>
                <p className="mt-3 text-base leading-8 text-[var(--text-muted)]">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div id="teachers" className="rounded-[1.8rem] border border-[var(--color-primary)]/16 bg-[rgba(226,242,244,0.62)] px-7 py-8 shadow-[var(--shadow-soft)]">
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.26em] text-[var(--text-faint)]">For Teachers</p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,4.4vw,4rem)] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            Your Curriculum Studio
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--text-muted)]">
            A command workspace where you generate lessons, edit AI drafts, manage classrooms, and keep the teaching
            flow coherent.
          </p>
          <ul className="mt-8 space-y-4 text-base text-[var(--text-primary)]">
            <li>AI-powered lesson and quiz generation</li>
            <li>Editorial control over sequence and wording</li>
            <li>Classroom analytics and progress visibility</li>
            <li>Syllabus-aware planning and iteration</li>
          </ul>
          <Link href="/register?role=teacher" className={`mt-8 ${btnSecondary}`}>
            Start as a Teacher
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>

        <div id="students" className="rounded-[1.8rem] border border-[var(--color-accent)]/18 bg-[rgba(251,245,231,0.88)] px-7 py-8 shadow-[var(--shadow-soft)]">
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.26em] text-[var(--text-faint)]">For Students</p>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,4.4vw,4rem)] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            Your Learner Cockpit
          </h2>
          <p className="mt-4 text-lg leading-8 text-[var(--text-muted)]">
            A focused environment for lessons, adaptive quizzes, hints, and knowledge maps that make progress visible.
          </p>
          <ul className="mt-8 space-y-4 text-base text-[var(--text-primary)]">
            <li>Adaptive quizzes with scaffolded hints</li>
            <li>Knowledge map views of concept growth</li>
            <li>Open learner model progress tracking</li>
            <li>Reflection, calibration, and mastery feedback</li>
          </ul>
          <Link href="/register?role=student" className={`mt-8 ${btnSecondary}`}>
            Start as a Student
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="rounded-[2rem] bg-[var(--color-primary)] px-6 py-14 text-center shadow-[var(--shadow-primary)] sm:px-8 lg:px-10">
        <h2 className="font-display text-[clamp(2.6rem,5vw,4.8rem)] font-semibold tracking-[-0.05em] text-[var(--button-text)]">
          Ready to Transform Your Classroom?
        </h2>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-[color:rgba(248,243,234,0.78)]">
          Join teachers and students already using EduNexus to make learning sharper, more personal, and more visible.
        </p>
        <div className="mt-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-[0.95rem] bg-[var(--color-accent)] px-6 py-3 text-base font-semibold text-[var(--text-heading)] shadow-[var(--shadow-accent)] transition hover:-translate-y-0.5"
          >
            Get Started Free
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-[var(--border-card)] px-2 pt-8 text-sm text-[var(--text-muted)] md:flex-row">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[0.8rem] bg-[var(--color-primary)] text-[var(--button-text)]">
            <BookIcon className="h-4 w-4" />
          </div>
          <span className="font-display text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            EduNexus
          </span>
        </div>
        <p>© 2026 EduNexus. Intelligent learning for everyone.</p>
      </footer>
    </div>
  );
}
