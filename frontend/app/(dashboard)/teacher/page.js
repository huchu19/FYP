import Link from "next/link";

export default function TeacherDashboardPage() {
  return (
    <section className="space-y-4 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-teal-700">
        <Link className="hover:underline" href="/">← Home</Link>
        <Link className="hover:underline" href="/teacher/classrooms/new">Create classroom</Link>
        <Link className="hover:underline" href="/teacher/classrooms/123">Sample classroom</Link>
        <Link className="hover:underline" href="/student">Go to student view</Link>
      </div>
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-slate-500">Dashboard</p>
        <h1 className="text-3xl font-semibold text-slate-900">Teacher Home</h1>
        <p className="text-slate-600">Overview of your classrooms, lessons, and insights.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Classrooms</h2>
          <p className="text-slate-600">Manage class codes and rosters.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">AI Lessons</h2>
          <p className="text-slate-600">Generate and publish new lesson plans.</p>
        </div>
      </div>
    </section>
  );
}
