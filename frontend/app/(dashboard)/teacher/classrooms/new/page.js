"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiPost } from "@/lib/api";

const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 transition focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/30";

export default function NewClassroomPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const classroom = await apiPost("/classrooms", { name, code, description: description || null });
      router.push(`/teacher/classrooms/${classroom.id}`);
    } catch (err) {
      setError(err.message || "Failed to create classroom");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6 py-10">
      <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400">
        <Link className="transition hover:text-cyan-400" href="/teacher">&larr; Teacher dashboard</Link>
        <Link className="transition hover:text-cyan-400" href="/">Home</Link>
      </div>

      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Classrooms</p>
        <h1 className="text-3xl font-bold text-white">Create Classroom</h1>
        <p className="text-slate-400">Set up a new classroom for your students.</p>
      </header>

      <div className="max-w-2xl rounded-xl border border-slate-700/50 bg-slate-900/80 p-6 backdrop-blur-md">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-400">Classroom name</span>
            <input type="text" className={inputClass} placeholder="Physics 101" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-400">Code</span>
            <input type="text" className={`${inputClass} font-mono uppercase`} placeholder="PHYS-101" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-400">Description</span>
            <textarea rows={4} className={inputClass} placeholder="Intro to mechanics and waves" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:shadow-cyan-500/40 disabled:opacity-60 disabled:shadow-none"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create classroom"}
          </button>
        </form>
      </div>
    </section>
  );
}
