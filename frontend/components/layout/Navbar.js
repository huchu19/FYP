import Link from "next/link";

export default function Navbar() {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-xs uppercase tracking-wide text-teal-700">EduNexus</p>
        <h1 className="text-lg font-semibold text-[var(--color-text)]">Adaptive Learning Platform</h1>
      </div>
      <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-teal-800">
        <Link className="rounded px-3 py-2 hover:bg-teal-50" href="/">Home</Link>
        <Link className="rounded px-3 py-2 hover:bg-teal-50" href="/login">Login</Link>
        <Link className="rounded px-3 py-2 hover:bg-teal-50" href="/register">Register</Link>
        <Link className="rounded px-3 py-2 hover:bg-teal-50" href="/teacher">Teacher</Link>
        <Link className="rounded px-3 py-2 hover:bg-teal-50" href="/teacher/classrooms/new">New Classroom</Link>
        <Link className="rounded px-3 py-2 hover:bg-teal-50" href="/student">Student</Link>
      </nav>
    </header>
  );
}
