"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { apiGet, apiPost } from "@/lib/api";
import ConceptGraph from "@/components/knowledge-graph/ConceptGraph";
import PracticeTargetsPanel from "@/components/knowledge-graph/PracticeTargetsPanel";
import FormativeRunner from "@/components/formative/FormativeRunner";
import { card, btnPrimary, btnSecondary, pageSection, statLabel } from "@/lib/styles";
import {
  ArrowRightIcon,
  BrainIcon,
} from "@/components/layout/icons";

export default function StudentKnowledgeGraphPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const classroomId = params.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const [graph, setGraph] = useState(null);
  const [blindSpots, setBlindSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Highlighted node IDs arriving from post-quiz diff panel
  const [changedIds, setChangedIds] = useState(() => {
    const raw = searchParams?.get("changed");
    if (!raw) return new Set();
    return new Set(raw.split(",").map(Number).filter(Boolean));
  });

  // Clear highlights after 4 seconds
  useEffect(() => {
    if (!changedIds.size) return;
    const t = setTimeout(() => setChangedIds(new Set()), 4000);
    return () => clearTimeout(t);
  }, [changedIds.size]);

  // Practice targets state
  const [showPractice, setShowPractice] = useState(false);
  const [practiceTargets, setPracticeTargets] = useState(null);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Prerequisite diagnostic state
  const [diagConceptId, setDiagConceptId] = useState("");
  const [diagAssessment, setDiagAssessment] = useState(null);
  const [diagLoading, setDiagLoading] = useState(false);
  const [diagMessage, setDiagMessage] = useState("");

  async function startDiagnostic() {
    if (!diagConceptId) return;
    setDiagLoading(true);
    setDiagMessage("");
    try {
      const res = await apiPost("/formative-assessments/prerequisite-diagnostic", {
        concept_id: Number(diagConceptId),
      });
      if (res.assessment_id) {
        setDiagAssessment(res);
      } else {
        setDiagMessage(res.message || "This concept has no prerequisites to check.");
      }
    } catch (err) {
      setDiagMessage(err.message);
    } finally {
      setDiagLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiGet(`/knowledge-graph/graph?classroom_id=${classroomId}`),
      apiGet(`/knowledge-graph/blind-spots?classroom_id=${classroomId}`).catch(() => []),
    ])
      .then(([graphData, spotsData]) => {
        if (!cancelled) {
          setGraph(graphData);
          setBlindSpots(spotsData || []);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load knowledge graph");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [classroomId]);

  const nodes = graph?.nodes || [];
  const masteredCount = nodes.filter((node) => (node.mastery || 0) >= 0.7).length;
  const overall = nodes.length
    ? Math.round((nodes.reduce((sum, node) => sum + (node.mastery || 0), 0) / nodes.length) * 100)
    : 0;

  // Metacognitive awareness: average metacognitive_score across concepts with data
  const metaNodes = nodes.filter((n) => n.metacognitive_score != null);
  const avgMeta = metaNodes.length
    ? Math.round((metaNodes.reduce((s, n) => s + n.metacognitive_score, 0) / metaNodes.length) * 100)
    : null;

  // ZPD concepts: where aided_mastery significantly exceeds unaided_mastery
  const zpdConcepts = nodes
    .filter((n) => n.zpd_delta != null && n.zpd_delta > 0.05)
    .sort((a, b) => b.zpd_delta - a.zpd_delta);

  // Overconfident concepts: high metacognitive divergence (low mastery but high confidence patterns)
  const overconfidentConcepts = nodes.filter(
    (n) => n.metacognitive_score != null && n.metacognitive_score < 0.4 && n.attempts > 0
  );

  async function handlePracticeClick() {
    setShowPractice(true);
    setLoadingTargets(true);
    try {
      const data = await apiGet(
        `/knowledge-graph/practice-targets?classroom_id=${classroomId}`
      );
      setPracticeTargets(data);
    } catch (err) {
      setError(err.message || "Failed to load practice targets");
    } finally {
      setLoadingTargets(false);
    }
  }

  async function handleGenerateQuiz() {
    setGenerating(true);
    try {
      const data = await apiPost(
        `/knowledge-graph/practice-quiz?classroom_id=${classroomId}`
      );
      if (data.quiz_id) {
        router.push(`/student/classrooms/${classroomId}/quizzes/${data.quiz_id}`);
      }
    } catch (err) {
      setError(err.message || "Failed to generate practice quiz");
      setGenerating(false);
    }
  }

  return (
    <section className={pageSection}>
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <BrainIcon className="h-5 w-5 text-[var(--color-accent)]" />
          <h1 className="font-display text-[clamp(3rem,5vw,4.8rem)] font-semibold tracking-[-0.06em] text-[var(--text-heading)]">
            Knowledge Map
          </h1>
        </div>
        <p className="mt-2 text-xl text-[var(--text-muted)]">
          Your personal understanding map. See how concepts connect and where to focus next.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <div className={`${card} p-6 text-center`}>
          <p className={statLabel}>Concepts</p>
          <p className="mt-4 font-display text-[3rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
            {loading ? "..." : nodes.length}
          </p>
        </div>
        <div className={`${card} p-6 text-center`}>
          <p className={statLabel}>Mastered</p>
          <p className="mt-4 font-display text-[3rem] font-semibold tracking-[-0.05em] text-[var(--color-success)]">
            {loading ? "..." : masteredCount}
          </p>
        </div>
        <div className={`${card} p-6 text-center`}>
          <p className={statLabel}>Overall</p>
          <p className="mt-4 font-display text-[3rem] font-semibold tracking-[-0.05em] text-[var(--color-accent)]">
            {loading ? "..." : `${overall}%`}
          </p>
        </div>
        <div className={`${card} p-6 text-center`}>
          <p className={statLabel}>Calibration</p>
          <p className={`mt-4 font-display text-[3rem] font-semibold tracking-[-0.05em] ${
            avgMeta == null ? "text-[var(--text-faint)]" : avgMeta >= 75 ? "text-[var(--color-success)]" : avgMeta >= 50 ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"
          }`}>
            {loading ? "..." : avgMeta != null ? `${avgMeta}%` : "—"}
          </p>
          <p className="mt-1 text-xs text-[var(--text-faint)]">
            {!loading && avgMeta != null
              ? avgMeta >= 75 ? "Well calibrated" : avgMeta >= 50 ? "Improving" : "Needs attention"
              : "Toggle calibration view"}
          </p>
        </div>
      </div>

      {loading && <p className="text-sm text-[var(--text-faint)]">Loading knowledge map...</p>}
      {!loading && error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}

      {!loading && !error && (
        <>
          {nodes.length === 0 ? (
            <div className={`${card} p-8`}>
              <p className="font-display text-[2.2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                No concepts mapped yet
              </p>
              <p className="mt-3 text-sm leading-7 text-[var(--text-muted)]">
                Your teacher needs to publish a lesson and generate concepts from it first. Once that&apos;s done, your map will appear here and update automatically as you take quizzes.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[1.6rem] border border-[var(--color-accent)]/18 bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-card)]">
                <ConceptGraph
                  nodes={graph.nodes}
                  links={graph.links}
                  hasMasteryData={graph.nodes.some((node) => node.mastery > 0)}
                  classroomId={classroomId}
                  changedIds={changedIds}
                  onVerify={() => handleGenerateQuiz()}
                />
              </div>

              {/* Prerequisite readiness check */}
              <div className="rounded-[1.6rem] border border-[var(--color-primary)]/18 bg-[var(--color-primary-soft)] p-5">
                <h3 className="text-sm font-semibold text-[var(--color-primary)]">Readiness Check</h3>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                  Before starting a concept, check whether you&apos;re ready for it by testing its prerequisites.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label htmlFor="diag-concept" className="sr-only">Concept</label>
                  <select
                    id="diag-concept"
                    value={diagConceptId}
                    onChange={(e) => setDiagConceptId(e.target.value)}
                    className="rounded-lg border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-heading)]"
                  >
                    <option value="">Select a concept…</option>
                    {nodes.map((node) => (
                      <option key={node.id} value={node.id}>{node.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={startDiagnostic}
                    disabled={!diagConceptId || diagLoading}
                    className={`${btnSecondary} disabled:opacity-60`}
                    aria-label="Check readiness for the selected concept"
                  >
                    {diagLoading ? "Preparing..." : "Check Readiness"}
                  </button>
                </div>
                {diagMessage && <p className="mt-2 text-xs text-[var(--text-muted)]">{diagMessage}</p>}
              </div>

              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <div className={`${card} p-6`}>
                  <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                    Recommended Focus
                  </h2>
                  {blindSpots.length > 0 ? (
                    <div className="mt-5 space-y-3">
                      {blindSpots.map((spot) => (
                        <div key={spot.concept_id} className="rounded-[1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-4">
                          <p className="text-base font-semibold text-[var(--text-heading)]">{spot.concept_name}</p>
                          <p className="mt-1 text-sm text-[var(--text-muted)]">
                            {Math.round(spot.mastery * 100)}% mastery
                          </p>
                          {spot.blocks.length > 0 && (
                            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-[var(--text-faint)]">
                              Blocks: {spot.blocks.join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-sm leading-7 text-[var(--text-muted)]">
                      No urgent blind spots detected. Keep reinforcing amber concepts to push them into mastery.
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {!showPractice ? (
                    <button
                      onClick={handlePracticeClick}
                      className={`${btnPrimary} w-full justify-center`}
                      aria-label="Practice weak concepts"
                    >
                      Practice Weak Concepts
                    </button>
                  ) : (
                    <PracticeTargetsPanel
                      targets={practiceTargets}
                      loading={loadingTargets}
                      onGenerate={handleGenerateQuiz}
                      generating={generating}
                      onClose={() => {
                        setShowPractice(false);
                        setPracticeTargets(null);
                      }}
                    />
                  )}

                  {zpdConcepts.length > 0 && (
                    <div className={`${card} p-6`}>
                      <h2 className="font-display text-[1.6rem] font-semibold tracking-[-0.04em] text-[var(--text-heading)]">
                        Growth Edge
                      </h2>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        You score higher with hints than without — practice unassisted to close the gap.
                      </p>
                      <div className="mt-4 space-y-3">
                        {zpdConcepts.slice(0, 5).map((node) => (
                          <div key={node.id} className="rounded-[1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3">
                            <p className="text-base font-semibold text-[var(--text-heading)]">{node.name}</p>
                            <div className="mt-1 flex items-center gap-3 text-xs">
                              <span className="text-[var(--text-muted)]">{Math.round((node.unaided_mastery || 0) * 100)}% unaided</span>
                              <span className="text-[var(--color-primary)]">→</span>
                              <span className="font-semibold text-[var(--color-success)]">{Math.round((node.aided_mastery || 0) * 100)}% with hints</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {overconfidentConcepts.length > 0 && (
                  <div className={`${card} border-amber-500/20 p-6`}>
                    <h2 className="font-display text-[1.6rem] font-semibold tracking-[-0.04em] text-amber-500">
                      Calibration Alert
                    </h2>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      Confidence and performance diverge on these concepts.
                    </p>
                    <div className="mt-4 space-y-2">
                      {overconfidentConcepts.map((node) => (
                        <div key={node.id} className="flex items-center justify-between rounded-lg bg-amber-500/5 px-3 py-2 text-sm">
                          <span className="text-[var(--text-heading)]">{node.name}</span>
                          <span className="text-xs text-amber-500">{Math.round(node.metacognitive_score * 100)}% calibration</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href={`/student/classrooms/${classroomId}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-faint)] transition hover:text-[var(--color-primary)]"
                aria-label="Back to classroom"
              >
                <ArrowRightIcon className="h-4 w-4 rotate-180" />
                Back to classroom
              </Link>
            </div>
          )}
        </>
      )}

      {diagAssessment && (
        <FormativeRunner assessment={diagAssessment} onClose={() => setDiagAssessment(null)} />
      )}
    </section>
  );
}
