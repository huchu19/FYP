import Link from "next/link";

const features = [
  {
    title: "Create classrooms",
    desc: "Spin up a class, share a code, and invite students in seconds.",
    href: "/teacher/classrooms/new",
    icon: "//",
  },
  {
    title: "AI lesson builder",
    desc: "Turn prompts into structured lessons and quizzes instantly.",
    href: "/teacher",
    icon: "<>",
  },
  {
    title: "Student view",
    desc: "See progress, XP, and assignments from the learner side.",
    href: "/student",
    icon: ">>",
  },
];

const stats = [
  { label: "Prompts generated", value: "128" },
  { label: "Avg XP earned", value: "+320" },
  { label: "Quizzes created", value: "54" },
  { label: "Active classrooms", value: "12" },
];

export default function Home() {
  return (
    <section className="space-y-12 py-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-700/50 bg-slate-900/80 px-6 py-12 backdrop-blur-md">
        {/* Subtle gradient glow behind the card */}
        <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-cyan-500/[0.07] blur-[100px]" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-violet-500/[0.07] blur-[100px]" />

        <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4 lg:max-w-2xl">
            <p className="inline-block rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Adaptive learning
            </p>
            <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
              Design lessons.<br />
              <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">Generate quizzes.</span><br />
              Engage students.
            </h1>
            <p className="max-w-lg text-base text-slate-400">
              EduNexus blends AI lesson creation, adaptive quizzes, and gamification so teachers spend less time
              on admin and more time with learners.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/register"
                className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/25 transition hover:shadow-cyan-500/40 hover:-translate-y-0.5"
              >
                Get started
              </Link>
              <Link
                href="/teacher"
                className="rounded-full border border-slate-600 px-6 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-cyan-500/40 hover:text-white hover:shadow-lg hover:shadow-cyan-500/10"
              >
                Teacher dashboard
              </Link>
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid w-full max-w-sm grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-slate-700/50 bg-slate-800/60 p-4 text-center">
                <p className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-3xl font-bold text-transparent">{stat.value}</p>
                <p className="mt-1 text-xs text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {features.map((feature) => (
          <Link
            key={feature.title}
            href={feature.href}
            className="group relative overflow-hidden rounded-xl border border-slate-700/50 bg-slate-900/80 p-6 transition-all hover:-translate-y-1 hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10"
          >
            <div className="pointer-events-none absolute -right-6 -top-6 text-6xl font-black text-white/[0.03] transition-transform group-hover:scale-110">
              {feature.icon}
            </div>
            <div className="relative space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/20 bg-cyan-500/10 font-mono text-sm font-bold text-cyan-400">
                {feature.icon}
              </div>
              <h2 className="text-lg font-semibold text-white">{feature.title}</h2>
              <p className="text-sm text-slate-400">{feature.desc}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-400 transition-all group-hover:gap-2">
                Explore <span className="text-xs">&rarr;</span>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
