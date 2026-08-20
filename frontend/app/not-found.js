import Link from "next/link";

import { btnPrimary, btnSecondary, pageSubtitle } from "@/lib/styles";
import { ArrowRightIcon, BookIcon, BrainIcon } from "@/components/layout/icons";

const suggestions = [
  {
    href: "/student",
    title: "Student dashboard",
    description: "Your classrooms, lessons, and progress.",
    icon: BookIcon,
  },
  {
    href: "/teacher",
    title: "Teacher dashboard",
    description: "Manage classrooms and generate lessons.",
    icon: BrainIcon,
  },
];

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-16">
      <div className="w-full max-w-2xl text-center">
        <p className="[font-family:var(--font-display)] text-[7rem] font-semibold leading-none tracking-[-0.06em] [background-image:var(--title-gradient)] bg-clip-text text-transparent sm:text-[9rem]">
          404
        </p>

        <div
          aria-hidden="true"
          className="mx-auto mt-2 h-px w-48 [background-image:var(--line-gradient)]"
        />

        <h1 className="[font-family:var(--font-display)] mt-8 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-heading)] sm:text-4xl">
          This page went missing
        </h1>

        <p className={`${pageSubtitle} mx-auto mt-4`}>
          The link may be out of date, or the classroom, lesson, or quiz you are
          looking for may have been removed.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/" className={btnPrimary} aria-label="Return to the home page">
            Back to home
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className={btnSecondary}
            aria-label="Go to the sign in page"
          >
            Sign in
          </Link>
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          {suggestions.map(({ href, title, description, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-label={title}
              className="group flex items-center gap-4 rounded-[1.1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/35 hover:shadow-[var(--shadow-primary)]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] border border-[var(--color-primary)]/16 bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[var(--text-heading)]">
                  {title}
                </span>
                <span className="mt-0.5 block text-[0.8rem] leading-5 text-[var(--text-muted)]">
                  {description}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
