import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="max-w-md space-y-6 py-12">
      <div className="flex items-center justify-between text-sm text-blue-700">
        <Link className="hover:underline" href="/">← Home</Link>
        <Link className="hover:underline" href="/login">Have an account?</Link>
      </div>
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-slate-500">Auth</p>
        <h1 className="text-3xl font-semibold text-slate-900">Create account</h1>
        <p className="text-slate-600">Join EduNexus as a teacher or student.</p>
      </header>
      <form className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Name</span>
          <input
            type="text"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            placeholder="Your name"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Email</span>
          <input
            type="email"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            placeholder="you@example.com"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            className="w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-500 focus:outline-none"
            placeholder="••••••••"
          />
        </label>
        <button type="submit" className="w-full rounded bg-[var(--color-accent)] px-4 py-2 text-white shadow-sm hover:bg-emerald-600">
          Create account
        </button>
      </form>
    </div>
  );
}
