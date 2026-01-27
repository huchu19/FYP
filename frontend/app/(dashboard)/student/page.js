import Link from "next/link";

export default function StudentDashboardPage() {
  return (
    <section className="space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-teal-700">
        <Link className="hover:underline" href="/">← Home</Link>
        <Link className="hover:underline" href="/student/classrooms/123">Sample classroom</Link>
        <Link className="hover:underline" href="/teacher">Teacher view</Link>
      </div>

      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Welcome back, learner</h1>
        <p className="text-slate-600">Track your streak, XP, and what’s due next.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">XP</p>
          <p className="text-3xl font-semibold text-slate-900">1,240</p>
          <p className="text-sm text-emerald-600">+60 today</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Streak</p>
          <p className="text-3xl font-semibold text-slate-900">5 days</p>
          <p className="text-sm text-slate-600">Keep it going for a badge</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Next quiz</p>
          <p className="text-xl font-semibold text-slate-900">Kinematics basics</p>
          <p className="text-sm text-slate-600">Due tomorrow · 8 questions</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Upcoming</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Newton&apos;s Laws lesson</span>
              <span className="text-xs text-slate-500">Today</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Quiz: Kinematics basics</span>
              <span className="text-xs text-slate-500">Tomorrow</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span>Review session</span>
              <span className="text-xs text-slate-500">Fri</span>
            </li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Badges</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Starter", "Streak 3", "Quiz Ace"].map((badge) => (
              <span key={badge} className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium text-teal-800">
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
