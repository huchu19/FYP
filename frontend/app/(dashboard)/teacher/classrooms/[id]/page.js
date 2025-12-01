import Link from "next/link";

export default function ClassroomPage({ params }) {
  return (
    <section className="space-y-4 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-teal-700">
        <Link className="hover:underline" href="/teacher">← Teacher dashboard</Link>
        <Link className="hover:underline" href={`/teacher/classrooms/${params.id}/lessons/new`}>New lesson</Link>
        <Link className="hover:underline" href="/">Home</Link>
      </div>
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-slate-500">Classroom</p>
        <h1 className="text-3xl font-semibold text-slate-900">Classroom {params.id}</h1>
        <p className="text-slate-600">Roster, lessons, and announcements placeholder.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Lessons</h2>
          <p className="text-slate-700">List of lessons and creation actions.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Students</h2>
          <p className="text-slate-700">Enrollment and performance snapshot.</p>
        </div>
      </div>
    </section>
  );
}
