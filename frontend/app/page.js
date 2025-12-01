import Link from "next/link";

const links = [
  { href: "/login", title: "Login", desc: "Access your account." },
  { href: "/register", title: "Register", desc: "Create a new account." },
  { href: "/teacher", title: "Teacher Dashboard", desc: "Classrooms, lessons, analytics." },
  { href: "/teacher/classrooms/new", title: "New Classroom", desc: "Set up a class and share the code." },
  { href: "/teacher/classrooms/123", title: "Sample Classroom", desc: "View a classroom page (uses id param)." },
  { href: "/teacher/classrooms/123/lessons/new", title: "New Lesson", desc: "Create an AI-powered lesson for class 123." },
  { href: "/student", title: "Student Dashboard", desc: "Progress, XP, and assignments." },
  { href: "/student/classrooms/123", title: "Student Classroom", desc: "Lessons and quizzes for class 123." },
];

export default function Home() {
  return (
    <section className="space-y-6 py-10">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Welcome</p>
        <h1 className="text-3xl font-semibold text-slate-900">EduNexus Frontend</h1>
        <p className="text-slate-600">Use the quick links below to navigate between pages.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200"
          >
            <h2 className="text-lg font-semibold text-[var(--color-text)] group-hover:text-teal-700">{link.title}</h2>
            <p className="text-sm text-slate-600">{link.desc}</p>
            <span className="mt-3 inline-flex items-center text-sm font-medium text-[var(--color-primary)] group-hover:text-teal-700">
              Go to page →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
