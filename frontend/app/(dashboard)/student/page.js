import Link from "next/link";

export default function StudentDashboardPage() {
  return (
    <section className="space-y-4 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-teal-700">
        <Link className="hover:underline" href="/">← Home</Link>
        <Link className="hover:underline" href="/student/classrooms/123">Sample classroom</Link>
        <Link className="hover:underline" href="/teacher">Teacher view</Link>
      </div>
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Student Home</h1>
        <p className="text-slate-600">Track progress, XP, and upcoming activities.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Assignments</h2>
          <p className="text-slate-700">Recent lessons and quizzes.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Gamification</h2>
          <p className="text-slate-700">XP, badges, and leaderboard status.</p>
        </div>
      </div>
    </section>
  );
}
