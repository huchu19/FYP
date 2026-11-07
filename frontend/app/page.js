import Link from "next/link";

import { notes } from "@/components/landing/content";
import MasteryDemo from "@/components/landing/MasteryDemo";
import PublishGate from "@/components/landing/PublishGate";
import RoleTour from "@/components/landing/RoleTour";
import { ArrowRightIcon, BookIcon, ClockIcon, SparkIcon, UsersIcon } from "@/components/layout/icons";
import { btnPrimary, btnSecondary } from "@/lib/styles";

const noteIcons = { users: UsersIcon, clock: ClockIcon, spark: SparkIcon, book: BookIcon };

const sampleBars = [
  { name: "How Memory Works", value: 71, status: "mastered" },
  { name: "Retrieval Practice", value: 54, status: "developing" },
  { name: "Illusion of Knowing", value: 38, status: "needsWork" },
];

const doors = [
  {
    href: "/register?role=teacher",
    side: "teacher",
    label: "Sign up as a teacher",
    text: "Create a classroom and draft your first lesson.",
  },
  {
    href: "/register?role=student",
    side: "student",
    label: "Sign up as a student",
    text: "Join a classroom with your teacher's code.",
  },
];

function Station({ number, title, children, visual, linked = false, className = "" }) {
  return (
    <li className={`board-station ${className}`}>
      {linked ? <span aria-hidden="true" className="board-link" /> : null}
      <span aria-hidden="true" className="board-number">
        {number}
      </span>
      <h3 className="mt-1 font-display text-[1.75rem] font-semibold leading-[1.15] text-[var(--board-ink)]">
        {title}
      </h3>
      <p className="mt-3 leading-7 text-[var(--board-soft)]">{children}</p>
      <div className="mt-5">{visual}</div>
    </li>
  );
}

export default function Home() {
  return (
    <div className="landing space-y-20 pb-10 pt-2 lg:space-y-28 lg:pt-6">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <h1 className="landing-rise font-display text-[clamp(2.9rem,7vw,5rem)] xl:text-[clamp(3.1rem,4.3vw,4.7rem)] font-semibold leading-[1.02] tracking-[-0.055em] text-[var(--text-heading)]">
            Teachers build lessons with AI.
            <span className="mt-2 block text-[var(--color-primary)]">Students see what they actually understand.</span>
          </h1>
          <p className="landing-rise mt-7 max-w-2xl text-[1.2rem] leading-8 text-[var(--text-primary)]" style={{ "--i": 1 }}>
            A teacher describes a topic and EduNexus drafts the lesson and quiz. The teacher checks them and publishes
            them. As students work through them, their answers update a map of which concepts they&apos;ve grasped and
            which are holding them back.
          </p>
          <div className="landing-rise mt-7 flex flex-wrap items-center gap-3" style={{ "--i": 2 }}>
            <Link href="/register" className={btnPrimary}>
              Create an account
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link href="#how-it-works" className={btnSecondary}>
              See how it works
            </Link>
          </div>
        </div>

        <div className="landing-rise min-w-0" style={{ "--i": 2 }}>
          <MasteryDemo />
        </div>
      </section>

      <section id="how-it-works" className="landing-board landing-anchor-target" aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-display text-[clamp(2.4rem,4.6vw,3.8rem)] font-semibold leading-[1.05] text-[var(--board-ink)]">
          How it works
        </h2>

        <ol className="mt-8 grid gap-10 lg:grid-cols-3 lg:gap-12">
          <Station
            number="1"
            title="A teacher sets up a classroom"
            linked
            visual={
              <dl className="board-window grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="text-[var(--board-muted)]">Subject</dt>
                <dd className="font-semibold">How people learn</dd>
                <dt className="text-[var(--board-muted)]">Level</dt>
                <dd className="font-semibold">Beginner</dd>
                <dt className="text-[var(--board-muted)]">Join code</dt>
                <dd className="font-mono font-semibold tracking-[0.12em] text-[var(--color-accent)]">LEARN1</dd>
              </dl>
            }
          >
            They save the subject, level and learning objectives, then give students the classroom&apos;s join code.
          </Station>

          <Station
            number="2"
            title="AI drafts, the teacher decides"
            className="lg:mt-14"
            linked
            visual={<PublishGate />}
          >
            The AI writes a lesson and quiz from a short brief. Students see nothing until the teacher publishes it.
          </Station>

          <Station
            number="3"
            title="Students learn and get a clear picture"
            className="lg:mt-28"
            visual={
              <ul className="board-window space-y-2 text-sm">
                {sampleBars.map((bar) => (
                  <li key={bar.name} data-status={bar.status}>
                    <span className="flex justify-between gap-3">
                      <span>{bar.name}</span>
                      <span className="font-mono font-semibold">{bar.value}%</span>
                    </span>
                    <span className="board-bar" aria-hidden="true">
                      <span style={{ width: `${bar.value}%` }} />
                    </span>
                  </li>
                ))}
              </ul>
            }
          >
            Quiz answers update their mastery of each concept. Students and their teacher can both see the results.
          </Station>
        </ol>
      </section>

      <RoleTour />

      <section id="try-it" className="landing-reveal landing-anchor-target" aria-labelledby="try-heading">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,8fr)] lg:gap-14">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <h2 id="try-heading" className="landing-section-title">
              Before you try it
            </h2>
            <div aria-hidden="true" className="landing-accounts">
              <span className="landing-account" data-side="teacher">
                Teacher account
              </span>
              <span className="landing-join">
                <span>LEARN1</span>
              </span>
              <span className="landing-account" data-side="student">
                Student account
              </span>
            </div>
          </div>
          <ul className="grid gap-x-10 gap-y-9 sm:grid-cols-2">
            {notes.map((note, index) => {
              const Icon = noteIcons[note.icon];
              return (
                <li key={note.title} className={index % 2 === 1 ? "sm:mt-10" : ""}>
                  <span aria-hidden="true" className="landing-note-icon">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-3 font-display text-[1.5rem] font-semibold leading-[1.2] text-[var(--text-heading)]">
                    {note.title}
                  </h3>
                  <p className="landing-body mt-2">{note.text}</p>
                </li>
              );
            })}
          </ul>
        </div>

        <nav aria-label="Sign up" className="landing-doors">
          {doors.map((door) => (
            <Link key={door.side} href={door.href} className="landing-door" data-side={door.side}>
              <span className="font-display text-[clamp(1.9rem,3.4vw,3rem)] font-semibold leading-[1.05] text-[var(--text-heading)]">
                {door.label}
              </span>
              <span className="mt-3 block max-w-sm leading-7 text-[var(--text-primary)]">{door.text}</span>
              <span aria-hidden="true" className="landing-door-arrow">
                <ArrowRightIcon className="h-5 w-5" />
              </span>
            </Link>
          ))}
        </nav>
      </section>

      <footer className="flex flex-col items-start justify-between gap-4 border-t border-[var(--border-card)] px-2 pt-8 text-sm text-[var(--text-secondary)] md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[0.8rem] bg-[var(--color-primary)] text-[var(--button-text)]">
            <BookIcon className="h-4 w-4" />
          </div>
          <span className="font-display text-[1.8rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            EduNexus
          </span>
        </div>
        <p>Final year project by Hussain Naqvi, Queen Mary University of London.</p>
      </footer>
    </div>
  );
}
