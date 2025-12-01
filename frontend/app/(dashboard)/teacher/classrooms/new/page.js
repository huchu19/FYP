import Link from "next/link";

export default function NewClassroomPage() {
  return (
    <section className="space-y-4 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-teal-700">
        <Link className="hover:underline" href="/teacher">← Teacher dashboard</Link>
        <Link className="hover:underline" href="/teacher/classrooms/123">View sample classroom</Link>
        <Link className="hover:underline" href="/">Home</Link>
      </div>
      <header className="space-y-1">
        <p className="text-sm uppercase tracking-wide text-slate-500">Classrooms</p>
        <h1 className="text-3xl font-semibold text-slate-900">Create Classroom</h1>
        <p className="text-slate-600">Set up a new classroom for your students.</p>
      </header>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-slate-700">Form placeholder for classroom name, code, and settings.</p>
      </div>
    </section>
  );
}
