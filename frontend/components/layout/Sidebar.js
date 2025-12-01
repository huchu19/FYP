export default function Sidebar() {
  return (
    <aside className="w-full max-w-xs space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="space-y-1">
        <p className="text-xs uppercase tracking-wide text-slate-500">EduNexus</p>
        <h2 className="text-xl font-semibold text-slate-900">Navigation</h2>
      </div>
      <nav className="space-y-2 text-slate-700">
        <a className="block rounded px-3 py-2 hover:bg-slate-100" href="#">Dashboard</a>
        <a className="block rounded px-3 py-2 hover:bg-slate-100" href="#">Classrooms</a>
        <a className="block rounded px-3 py-2 hover:bg-slate-100" href="#">Lessons</a>
        <a className="block rounded px-3 py-2 hover:bg-slate-100" href="#">Analytics</a>
      </nav>
    </aside>
  );
}
