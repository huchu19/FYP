"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { apiGet } from "@/lib/api";

export default function TeacherDashboardPage() {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    apiGet("/classrooms")
      .then((data) => {
        if (!cancelled) setClassrooms(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load classrooms");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-6 py-10">
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
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active classrooms</p>
          <p className="text-3xl font-semibold text-slate-900">3</p>
          <p className="text-sm text-slate-600">2 new students this week</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">AI lessons</p>
          <p className="text-3xl font-semibold text-slate-900">8</p>
          <p className="text-sm text-slate-600">Last: Kinematics basics</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Avg quiz score</p>
          <p className="text-3xl font-semibold text-slate-900">78%</p>
          <p className="text-sm text-emerald-600">+5% vs last week</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">Classrooms</h2>
            <Link className="text-sm font-semibold text-[var(--color-primary)] hover:underline" href="/teacher/classrooms/new">
              New
            </Link>
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-700">
            {loading && <p className="text-slate-500">Loading classrooms…</p>}
            {error && <p className="text-red-600">{error}</p>}
            {!loading && !error && classrooms.length === 0 && (
              <p className="text-slate-500">No classrooms yet. Create one to get started.</p>
            )}
            {!loading && !error && classrooms.length > 0 && (
              <ul className="space-y-2">
                {classrooms.map((c) => (
                  <li key={c.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
                    <span>{c.name}</span>
                    <span className="text-xs text-slate-500">Code: {c.code}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">AI Lessons</h2>
          <p className="text-sm text-slate-700">Generate and publish new lesson plans.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/teacher/classrooms/123/lessons/new"
              className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700"
            >
              New lesson
            </Link>
            <Link
              href="/teacher/classrooms/123"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
            >
              Manage lessons
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
