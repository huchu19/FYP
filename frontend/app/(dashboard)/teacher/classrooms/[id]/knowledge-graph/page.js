"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";

import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import ConceptGraph from "@/components/knowledge-graph/ConceptGraph";
import {
  card, breadcrumb, breadcrumbLink, pageSection, pageHeader,
  headerTag, pageTitle, pageSubtitle, loadingText,
  inputClass, btnPrimary, btnDanger, btnGhost,
} from "@/lib/styles";

export default function TeacherKnowledgeGraphPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const classroomId = params.id;

  const [graph, setGraph] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [error, setError] = useState("");

  // Manual concept form
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);

  // Inline editing
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Prerequisite management
  const [prereqFrom, setPrereqFrom] = useState("");
  const [prereqTo, setPrereqTo] = useState("");

  function fetchData() {
    setLoading(true);
    Promise.all([
      apiGet(`/knowledge-graph/graph?classroom_id=${classroomId}`),
      apiGet(`/classrooms/${classroomId}/lessons`),
    ])
      .then(([graphData, lessonsData]) => {
        setGraph(graphData);
        setLessons(lessonsData || []);
      })
      .catch((err) => setError(err.message || "Failed to load"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { fetchData(); }, [classroomId]);

  async function handleGenerate(lessonId) {
    setGenerating(true);
    setGenResult(null);
    try {
      const result = await apiPost(
        `/knowledge-graph/generate?lesson_id=${lessonId}`,
        {}
      );
      setGenResult(result);
      fetchData();
    } catch (err) {
      setGenResult({ error: err.message });
    } finally {
      setGenerating(false);
    }
  }

  async function handleAddConcept(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await apiPost("/knowledge-graph/concepts", {
        classroom_id: Number(classroomId),
        name: newName.trim(),
        description: newDesc.trim() || null,
      });
      setNewName("");
      setNewDesc("");
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleSaveEdit(conceptId) {
    try {
      await apiPatch(`/knowledge-graph/concepts/${conceptId}`, {
        name: editName.trim() || undefined,
        description: editDesc.trim() || undefined,
      });
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteConcept(conceptId, conceptName) {
    if (!confirm(`Delete concept "${conceptName}"? This also removes its prerequisite links and student mastery data.`)) return;
    try {
      await apiDelete(`/knowledge-graph/concepts/${conceptId}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleAddPrerequisite() {
    if (!prereqFrom || !prereqTo || prereqFrom === prereqTo) return;
    try {
      await apiPost("/knowledge-graph/prerequisites", {
        concept_id: Number(prereqFrom),
        prerequisite_id: Number(prereqTo),
      });
      setPrereqFrom("");
      setPrereqTo("");
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemovePrerequisite(conceptId, prerequisiteId) {
    try {
      await apiDelete(`/knowledge-graph/prerequisites?concept_id=${conceptId}&prerequisite_id=${prerequisiteId}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  }

  const nodes = graph?.nodes || [];
  const links = graph?.links || [];

  return (
    <section className={pageSection}>
      <div className={breadcrumb}>
        <Link className={breadcrumbLink} href={`/teacher/classrooms/${classroomId}`}>
          &larr; Back to classroom
        </Link>
      </div>

      <header className={pageHeader}>
        <p className={headerTag}>Knowledge Graph</p>
        <h1 className={pageTitle}>Classroom Concept Map</h1>
        <p className={pageSubtitle}>
          Visualise how concepts relate. Generate from lessons or add concepts manually.
        </p>
      </header>

      {loading && <p className={loadingText}>Loading...</p>}
      {!loading && error && <p className="text-[var(--color-danger)]">{error}</p>}

      {!loading && !error && (
        <>
          {/* AI Generation */}
          <div className={card}>
            <h2 className="text-lg font-semibold text-[var(--text-heading)]">
              Generate Concepts from Lesson
            </h2>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              AI will extract key concepts and prerequisite relationships from a lesson&apos;s content.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {lessons.filter((l) => l.body || l.status === "published").length === 0 ? (
                <p className="text-sm text-[var(--text-faint)]">
                  No lessons with content available. Create and generate a lesson first.
                </p>
              ) : (
                lessons
                  .filter((l) => l.body || l.status === "published")
                  .map((lesson) => (
                    <button
                      key={lesson.id}
                      onClick={() => handleGenerate(lesson.id)}
                      disabled={generating}
                      className="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary-soft)] px-3 py-1.5 text-sm text-[var(--color-primary)] transition hover:opacity-80 disabled:opacity-50"
                    >
                      {generating ? "Generating..." : lesson.title}
                    </button>
                  ))
              )}
            </div>
            {genResult && !genResult.error && (
              <p className="mt-3 text-sm text-[var(--color-success)]">
                Created {genResult.concepts_created} concepts and {genResult.edges_created} prerequisite links.
              </p>
            )}
            {genResult?.error && (
              <p className="mt-3 text-sm text-[var(--color-danger)]">{genResult.error}</p>
            )}
          </div>

          {/* Manual Concept Creation */}
          <div className={card}>
            <h2 className="text-lg font-semibold text-[var(--text-heading)]">
              Add Concept Manually
            </h2>
            <form onSubmit={handleAddConcept} className="mt-4 flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[12rem]">
                <label className="mb-1 block text-xs text-[var(--text-muted)]">Concept Name</label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Binary Search"
                  className={inputClass}
                  required
                  aria-label="Concept name"
                />
              </div>
              <div className="flex-1 min-w-[12rem]">
                <label className="mb-1 block text-xs text-[var(--text-muted)]">Description (optional)</label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="One-sentence description"
                  className={inputClass}
                  aria-label="Concept description"
                />
              </div>
              <button type="submit" disabled={adding || !newName.trim()} className={btnPrimary} aria-label="Add concept">
                {adding ? "Adding..." : "Add Concept"}
              </button>
            </form>
          </div>

          {/* Graph Visualisation */}
          {nodes.length > 0 ? (
            <div className="rounded-[1.6rem] border border-[var(--color-accent)]/18 bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-card)]">
              <ConceptGraph
                nodes={nodes}
                links={links}
                hasMasteryData={false}
                width={800}
                height={500}
              />
            </div>
          ) : (
            <div className={card}>
              <p className="text-[var(--text-faint)]">
                No concepts yet. Use AI generation or add concepts manually above.
              </p>
            </div>
          )}

          {/* Concept List with Edit/Delete */}
          {nodes.length > 0 && (
            <div className={card}>
              <h2 className="text-lg font-semibold text-[var(--text-heading)]">
                Manage Concepts
              </h2>
              <div className="mt-4 space-y-2">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3"
                  >
                    {editingId === node.id ? (
                      <>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={`${inputClass} flex-1`}
                          aria-label="Edit concept name"
                        />
                        <input
                          value={editDesc}
                          onChange={(e) => setEditDesc(e.target.value)}
                          className={`${inputClass} flex-1`}
                          placeholder="Description"
                          aria-label="Edit concept description"
                        />
                        <button
                          onClick={() => handleSaveEdit(node.id)}
                          className={btnPrimary}
                          aria-label="Save concept"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className={btnGhost}
                          aria-label="Cancel editing"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[var(--text-heading)] truncate">
                            {node.name}
                          </p>
                          {node.description && (
                            <p className="text-xs text-[var(--text-muted)] truncate">{node.description}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-[var(--text-faint)]">
                          {node.connection_count || 0} links
                        </span>
                        <button
                          onClick={() => {
                            setEditingId(node.id);
                            setEditName(node.name);
                            setEditDesc(node.description || "");
                          }}
                          className={btnGhost}
                          aria-label={`Edit ${node.name}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteConcept(node.id, node.name)}
                          className={btnDanger}
                          aria-label={`Delete ${node.name}`}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prerequisite Management */}
          {nodes.length >= 2 && (
            <div className={card}>
              <h2 className="text-lg font-semibold text-[var(--text-heading)]">
                Manage Prerequisites
              </h2>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Define which concepts must be understood before others.
              </p>

              <div className="mt-4 flex flex-wrap items-end gap-3">
                <div className="min-w-[10rem]">
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">Concept</label>
                  <select
                    value={prereqFrom}
                    onChange={(e) => setPrereqFrom(e.target.value)}
                    className={inputClass}
                    aria-label="Select concept"
                  >
                    <option value="">Select concept...</option>
                    {nodes.map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                <span className="pb-2 text-sm text-[var(--text-faint)]">requires</span>
                <div className="min-w-[10rem]">
                  <label className="mb-1 block text-xs text-[var(--text-muted)]">Prerequisite</label>
                  <select
                    value={prereqTo}
                    onChange={(e) => setPrereqTo(e.target.value)}
                    className={inputClass}
                    aria-label="Select prerequisite"
                  >
                    <option value="">Select prerequisite...</option>
                    {nodes.filter((n) => String(n.id) !== prereqFrom).map((n) => (
                      <option key={n.id} value={n.id}>{n.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAddPrerequisite}
                  disabled={!prereqFrom || !prereqTo || prereqFrom === prereqTo}
                  className={btnPrimary}
                  aria-label="Add prerequisite"
                >
                  Add Link
                </button>
              </div>

              {/* Existing edges */}
              {links.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-faint)]">
                    Existing prerequisites
                  </p>
                  {links.map((link, idx) => {
                    const sourceName = nodes.find((n) => n.id === link.source || n.id === link.source?.id)?.name || `#${link.source}`;
                    const targetName = nodes.find((n) => n.id === link.target || n.id === link.target?.id)?.name || `#${link.target}`;
                    const sourceId = typeof link.source === "object" ? link.source.id : link.source;
                    const targetId = typeof link.target === "object" ? link.target.id : link.target;
                    return (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="text-[var(--text-heading)]">{sourceName}</span>
                        <span className="text-[var(--text-faint)]">→ requires →</span>
                        <span className="text-[var(--text-heading)]">{targetName}</span>
                        <button
                          onClick={() => handleRemovePrerequisite(sourceId, targetId)}
                          className="ml-auto text-xs text-[var(--color-danger)] hover:underline"
                          aria-label={`Remove prerequisite: ${sourceName} requires ${targetName}`}
                        >
                          Remove
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
