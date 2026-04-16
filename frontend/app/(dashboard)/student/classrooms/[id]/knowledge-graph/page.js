"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { apiGet, apiPost } from "@/lib/api";
import ConceptGraph from "@/components/knowledge-graph/ConceptGraph";
import PracticeTargetsPanel from "@/components/knowledge-graph/PracticeTargetsPanel";
import { card, btnPrimary, pageSection, statLabel } from "@/lib/styles";
import {
  ArrowRightIcon,
  BrainIcon,
} from "@/components/layout/icons";

export default function StudentKnowledgeGraphPage({ params: paramsPromise }) {
  const params = use(paramsPromise);
  const classroomId = params.id;
  const router = useRouter();
  const [graph, setGraph] = useState(null);
  const [blindSpots, setBlindSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Practice targets state
  const [showPractice, setShowPractice] = useState(false);
  const [practiceTargets, setPracticeTargets] = useState(null);
  const [loadingTargets, setLoadingTargets] = useState(false);
  const [generating, setGenerating] = useState(false);

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
          <p className={statLabel}>Self-Awareness</p>
          <p className={`mt-4 font-display text-[3rem] font-semibold tracking-[-0.05em] ${
            avgMeta == null ? "text-[var(--text-faint)]" : avgMeta >= 75 ? "text-[var(--color-success)]" : avgMeta >= 50 ? "text-[var(--color-accent)]" : "text-[var(--color-danger)]"
          }`}>
            {loading ? "..." : avgMeta != null ? `${avgMeta}%` : "—"}
          </p>
          {!loading && avgMeta != null && (
            <p className="mt-1 text-xs text-[var(--text-faint)]">
              {avgMeta >= 75 ? "Well calibrated" : avgMeta >= 50 ? "Improving" : "Needs attention"}
            </p>
          )}
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
                Once lessons and quizzes have generated enough concept data, your knowledge map will start filling out here.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-[1.6rem] border border-[var(--color-accent)]/18 bg-[var(--bg-elevated)] p-5 shadow-[var(--shadow-card)]">
                <ConceptGraph
                  nodes={graph.nodes}
                  links={graph.links}
                  hasMasteryData={graph.nodes.some((node) => node.mastery > 0)}
                  width={900}
                  height={540}
                />
              </div>

              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
                <div className={`${card} p-6`}>
                  <h2 className="font-display text-[2.4rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                    Concept Status
                  </h2>
                  <div className="mt-5 grid gap-4 md:grid-cols-2">
                    {nodes.map((node) => {
                      const mastery = Math.round((node.mastery || 0) * 100);
                      const tone = mastery >= 80
                        ? "text-[var(--color-success)]"
                        : mastery >= 60
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-danger)]";
                      const width = `${Math.max(mastery, 8)}%`;
                      return (
                        <div key={node.id} className="rounded-[1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-4">
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-display text-[1.7rem] font-semibold tracking-[-0.04em] text-[var(--text-heading)]">
                              {node.label}
                            </h3>
                            <span className={`text-sm font-semibold ${tone}`}>{mastery}%</span>
                          </div>
                          <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-[var(--bg-sunken)]">
                            <div
                              className={`h-2.5 rounded-full ${mastery >= 80 ? "bg-[var(--color-success)]" : mastery >= 60 ? "bg-[var(--color-accent)]" : "bg-[var(--color-danger)]"}`}
                              style={{ width }}
                            />
                          </div>
                          <p className="mt-3 text-sm text-[var(--text-muted)]">
                            {node.connection_count || 0} connections
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <aside className="space-y-5">
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
                        No urgent blind spots detected right now. Keep reinforcing the yellow-zone concepts to push them into mastery.
                      </p>
                    )}
                  </div>

                  {/* Practice Weak Concepts */}
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

                  {/* ZPD / Zone of Proximal Development */}
                  {zpdConcepts.length > 0 && (
                    <div className={`${card} p-6`}>
                      <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                        Zone of Proximal Development
                      </h2>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        Concepts where you perform better with hints than without — these are your growth edge.
                      </p>
                      <div className="mt-4 space-y-3">
                        {zpdConcepts.slice(0, 5).map((node) => (
                          <div key={node.id} className="rounded-[1rem] border border-[var(--border-card)] bg-[var(--bg-card)] px-4 py-3">
                            <p className="text-base font-semibold text-[var(--text-heading)]">{node.name}</p>
                            <div className="mt-2 flex items-center gap-3 text-xs">
                              <span className="text-[var(--text-muted)]">
                                {Math.round((node.unaided_mastery || 0) * 100)}% unaided
                              </span>
                              <span className="text-[var(--color-primary)]">→</span>
                              <span className="font-semibold text-[var(--color-success)]">
                                {Math.round((node.aided_mastery || 0) * 100)}% with hints
                              </span>
                            </div>
                            <p className="mt-1 text-[0.65rem] text-[var(--text-faint)]">
                              Keep practising without hints to close this gap
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calibration warning */}
                  {overconfidentConcepts.length > 0 && (
                    <div className={`${card} border-amber-500/20 p-6`}>
                      <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em] text-amber-500">
                        Calibration Alert
                      </h2>
                      <p className="mt-2 text-xs text-[var(--text-muted)]">
                        Your confidence and actual performance diverge on these concepts. Review them more carefully.
                      </p>
                      <div className="mt-4 space-y-2">
                        {overconfidentConcepts.map((node) => (
                          <div key={node.id} className="flex items-center justify-between rounded-lg bg-amber-500/5 px-3 py-2 text-sm">
                            <span className="text-[var(--text-heading)]">{node.name}</span>
                            <span className="text-xs text-amber-500">
                              {Math.round(node.metacognitive_score * 100)}% calibration
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <Link href={`/student/classrooms/${classroomId}`} className={`${card} block p-6 transition hover:-translate-y-1 hover:border-[var(--color-accent)]/24`}>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]">
                      Back to class
                    </p>
                    <p className="mt-4 font-display text-[2rem] font-semibold tracking-[-0.05em] text-[var(--text-heading)]">
                      Return to the classroom workspace
                    </p>
                    <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-primary)]">
                      Open class
                      <ArrowRightIcon className="h-4 w-4" />
                    </span>
                  </Link>
                </aside>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
