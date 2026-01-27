import Link from "next/link";

const features = [
  {
    title: "Create classrooms",
    desc: "Spin up a class, share a code, and invite students in seconds.",
    href: "/teacher/classrooms/new",
  },
  {
    title: "AI lesson builder",
    desc: "Turn prompts into structured lessons and quizzes instantly.",
    href: "/teacher/classrooms/123/lessons/new",
  },
  {
    title: "Student view",
    desc: "See progress, XP, and assignments from the learner side.",
    href: "/student",
  },
];

export default function Home() {
  return (
    <section className="space-y-10 py-10">
      <div className="overflow-hidden rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-900 via-emerald-800 to-teal-700 px-6 py-10 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 lg:max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-teal-200">Adaptive learning</p>
            <h1 className="text-4xl font-semibold leading-tight">Design lessons. Generate quizzes. Engage students.</h1>
            <p className="text-base text-teal-100">
              EduNexus blends AI lesson creation, adaptive quizzes, and gamification so teachers spend less time
              on admin and more time with learners.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-900 shadow-sm transition hover:-translate-y-0.5"
              >
                Get started
              </Link>
              <Link
                href="/teacher"
                className="rounded-full border border-white/70 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Teacher dashboard
              </Link>
            </div>
          </div>
          <div className="grid w-full max-w-md grid-cols-2 gap-3 rounded-xl bg-white/10 p-4 text-sm backdrop-blur">
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-teal-100">Prompts generated</p>
              <p className="text-2xl font-semibold">128</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-teal-100">Avg XP earned</p>
              <p className="text-2xl font-semibold">+320</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-teal-100">Quizzes created</p>
              <p className="text-2xl font-semibold">54</p>
            </div>
            <div className="rounded-lg bg-white/5 p-3">
              <p className="text-teal-100">Active classrooms</p>
              <p className="text-2xl font-semibold">12</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-teal-50/80 to-emerald-50/60 opacity-0 transition group-hover:opacity-100" />
            <div className="relative space-y-2">
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{feature.title}</h2>
              <p className="text-sm text-slate-600">{feature.desc}</p>
              <span className="inline-flex items-center text-sm font-semibold text-[var(--color-primary)]">
                Explore →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
