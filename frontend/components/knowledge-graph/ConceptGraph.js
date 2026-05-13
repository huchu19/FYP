"use client";

import { useEffect, useLayoutEffect, useRef, useState, useMemo, useCallback } from "react";
import { apiPost } from "@/lib/api";

// ─── colour helpers ────────────────────────────────────────────────────────────

function masteryHex(mastery) {
  if (mastery >= 0.7) return "#10b981";
  if (mastery >= 0.4) return "#f59e0b";
  return "#ef4444";
}

function masteryFill(mastery) {
  if (mastery >= 0.7) return "rgba(16,185,129,0.10)";
  if (mastery >= 0.4) return "rgba(245,158,11,0.10)";
  return "rgba(239,68,68,0.10)";
}

function masteryCardCls(mastery) {
  if (mastery >= 0.7) return "border-emerald-500/40 bg-emerald-500/8";
  if (mastery >= 0.4) return "border-amber-500/40 bg-amber-500/8";
  return "border-red-500/40 bg-red-500/8";
}


function calibrationDotColor(confidence, mastery) {
  if (confidence == null) return "#6b7280";
  const gap = confidence - mastery;
  if (gap > 0.2)  return "#f97316";
  if (gap < -0.2) return "#06b6d4";
  return "#10b981";
}

function confidenceEstimate(node) {
  const pts = (node.evidence || []).filter(
    (e) => e.confidence != null && e.source !== "self_claim"
  );
  if (!pts.length) return null;
  return pts.reduce((s, e) => s + e.confidence / 5, 0) / pts.length;
}

// ─── sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ evidence = [] }) {
  const pts = evidence
    .filter((e) => e.mastery_after != null && e.source !== "self_claim")
    .sort((a, b) => (a.timestamp || "").localeCompare(b.timestamp || ""));

  if (pts.length < 2)
    return <p className="text-[0.65rem] text-[var(--text-faint)]">Not enough data yet</p>;

  const W = 140, H = 36, P = 2;
  const vals = pts.map((p) => p.mastery_after);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 0.01;

  const points = vals.map((v, i) => {
    const x = P + ((W - 2 * P) / (vals.length - 1)) * i;
    const y = H - P - ((v - min) / range) * (H - 2 * P);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const trend = vals[vals.length - 1] - vals[0];
  const c = trend > 0.03 ? "#10b981" : trend < -0.03 ? "#ef4444" : "#f59e0b";
  const last = points[points.length - 1].split(",");

  return (
    <div>
      <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-widest text-[var(--text-faint)]">Progress trend</p>
      <svg width={W} height={H} className="overflow-visible">
        <defs>
          <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={c} stopOpacity="0.18" />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`${P},${H} ${points.join(" ")} ${(W - P).toFixed(1)},${H}`}
          fill="url(#spark-fill)"
        />
        <polyline points={points.join(" ")} fill="none" stroke={c} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={parseFloat(last[0])} cy={parseFloat(last[1])} r={3} fill={c} />
      </svg>
      <p className="mt-0.5 text-[0.58rem] text-[var(--text-faint)]">last {pts.length} attempts</p>
    </div>
  );
}

// ─── verify button ─────────────────────────────────────────────────────────────

function VerifyButton({ onVerify }) {
  const [clicked, setClicked] = useState(false);
  return (
    <button
      onClick={() => { setClicked(true); onVerify(); }}
      disabled={clicked}
      className="mt-2 rounded-lg bg-amber-500/15 px-3 py-1.5 text-xs font-semibold text-amber-400 transition hover:bg-amber-500/25 disabled:opacity-50"
      aria-label="Start verification quiz"
    >
      {clicked ? "Starting…" : "Start check"}
    </button>
  );
}

// ─── self-assess widget ────────────────────────────────────────────────────────

function SelfAssessWidget({ conceptId, classroomId, onVerify }) {
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [verificationNeeded, setVerificationNeeded] = useState(false);

  async function handleSave() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await apiPost(
        `/knowledge-graph/concepts/${conceptId}/self-assess`,
        { confidence: selected, classroom_id: Number(classroomId) }
      );
      setSaved(true);
      if (res.verification_needed) setVerificationNeeded(true);
    } catch { /* silent */ } finally { setSaving(false); }
  }

  if (saved && !verificationNeeded)
    return <p className="text-[0.72rem] text-[var(--color-success)]">✓ Self-assessment saved</p>;

  if (saved && verificationNeeded)
    return (
      <div className="rounded-lg border border-amber-500/20 bg-amber-500/8 p-3">
        <p className="text-xs text-amber-400">Your map shows you&apos;re still developing this. Want a quick check?</p>
        <VerifyButton onVerify={() => onVerify?.(conceptId)} />
      </div>
    );

  const labels = ["", "Guessing", "Unsure", "Fairly sure", "Confident", "Very confident"];

  return (
    <div>
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">How confident are you?</p>
      <div className="mt-2 flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setSelected(n)}
            aria-label={labels[n]}
            className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-all duration-150 ${
              selected === n
                ? "scale-110 bg-[var(--color-primary)] text-white shadow-md"
                : "bg-[var(--bg-elevated)] text-[var(--text-faint)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-muted)] hover:scale-105"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
      {selected && <p className="mt-1 text-[0.6rem] text-[var(--text-faint)]">{labels[selected]}</p>}
      <button
        onClick={handleSave}
        disabled={!selected || saving}
        className="mt-3 rounded-lg bg-[var(--color-primary-soft)] px-4 py-2 text-xs font-semibold text-[var(--color-primary)] transition hover:opacity-80 disabled:opacity-40"
        aria-label="Save self-assessment"
      >
        {saving ? "Saving…" : "Save assessment"}
      </button>
    </div>
  );
}

// ─── stat pill ─────────────────────────────────────────────────────────────────

function StatPill({ label, value, color }) {
  return (
    <div className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-elevated)] px-3 py-2.5">
      <p className="text-[0.54rem] font-semibold uppercase tracking-[0.18em] text-[var(--text-faint)]">{label}</p>
      <p className="mt-0.5 text-[1.1rem] font-bold leading-none" style={color ? { color } : { color: "var(--text-heading)" }}>
        {value}
      </p>
    </div>
  );
}

// ─── detail sheet (fixed overlay, no layout disruption) ───────────────────────

function DetailSheet({ node, hasMasteryData, classroomId, onVerify, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const mastery = node.mastery || 0;

  return (
    <>
      {/* Scrim */}
      <div
        className="cg-backdrop-enter fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Details: ${node.name}`}
        className="cg-sheet-enter fixed right-0 top-0 z-50 flex h-full w-80 max-w-[92vw] flex-col border-l border-[var(--border-card)] bg-[var(--bg-card)] shadow-[0_0_80px_rgba(0,0,0,0.55)]"
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--border-card)] bg-[var(--bg-card)]/95 px-5 py-4 backdrop-blur">
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug text-[var(--text-heading)]">{node.name}</h3>
            {node.lesson_title && (
              <p className="mt-0.5 text-[0.58rem] uppercase tracking-[0.18em] text-[var(--text-faint)]">
                {node.lesson_title}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 shrink-0 rounded-lg p-1.5 text-[var(--text-faint)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--text-heading)]"
            aria-label="Close panel"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          {node.description && (
            <p className="text-sm leading-relaxed text-[var(--text-secondary)]">{node.description}</p>
          )}

          {hasMasteryData && (
            <>
              {/* Stats row */}
              <div className="flex flex-wrap gap-2">
                <StatPill label="Mastery" value={`${Math.round(mastery * 100)}%`} color={masteryHex(mastery)} />
                {node.metacognitive_score != null && (
                  <StatPill label="Calibration" value={`${Math.round(node.metacognitive_score * 100)}%`} />
                )}
                {node.zpd_delta != null && node.zpd_delta > 0.05 && (
                  <StatPill label="Hint gap" value={`+${Math.round(node.zpd_delta * 100)}%`} color="var(--color-primary)" />
                )}
              </div>

              {/* Mastery bar */}
              <div>
                <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-elevated)]">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${Math.max(Math.round(mastery * 100), 2)}%`, backgroundColor: masteryHex(mastery) }}
                  />
                </div>
              </div>

              <Sparkline evidence={node.evidence || []} />

              {node.evidence?.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer select-none text-[0.6rem] font-semibold uppercase tracking-widest text-[var(--text-faint)] hover:text-[var(--color-primary)]">
                    Evidence trail ({node.evidence.length} points)
                  </summary>
                  <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto">
                    {[...node.evidence].reverse().filter(e => e.source !== "self_claim").map((e, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs">
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${e.is_correct ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="text-[var(--text-secondary)]">{e.is_correct ? "Correct" : "Incorrect"}</span>
                        {e.confidence != null && <span className="text-[var(--text-faint)]">conf {e.confidence}/5</span>}
                        {e.hints_used > 0 && <span className="text-amber-500">{e.hints_used}h</span>}
                        <span className="ml-auto text-[var(--text-faint)]">→ {Math.round((e.mastery_after || 0) * 100)}%</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </>
          )}

          {classroomId && (
            <div className="border-t border-[var(--border-card)] pt-4">
              <SelfAssessWidget conceptId={node.id} classroomId={classroomId} onVerify={onVerify} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── concept card (mastery tier / lesson columns) ─────────────────────────────

function ConceptCard({ node, hasMasteryData, isSelected, isChanged, nodeRef, onClick }) {
  const mastery = node.mastery || 0;

  return (
    <button
      ref={nodeRef}
      onClick={onClick}
      aria-pressed={isSelected}
      aria-label={`Concept: ${node.name}${hasMasteryData ? `, mastery ${Math.round(mastery * 100)}%` : ""}`}
      className={[
        "group relative w-full rounded-xl border px-3.5 py-3 text-left transition-all duration-200",
        hasMasteryData ? masteryCardCls(mastery) : "border-[var(--border-card)] bg-[var(--bg-card)]",
        isSelected
          ? "ring-2 ring-[var(--color-primary)]/50 shadow-lg shadow-black/20"
          : "hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/25",
        isChanged ? "animate-pulse-once" : "",
      ].join(" ")}
    >
      {isChanged && (
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[var(--color-primary)]" aria-label="Recently updated" />
      )}

      <p className="text-[0.8rem] font-semibold leading-snug text-[var(--text-heading)]">{node.name}</p>

      {node.lesson_title && (
        <p className="mt-0.5 max-h-0 overflow-hidden text-[0.58rem] text-[var(--text-faint)] transition-all duration-200 group-hover:max-h-6">
          {node.lesson_title}
        </p>
      )}

      {hasMasteryData && (
        <div className="mt-2.5">
          <div className="h-1 overflow-hidden rounded-full bg-[var(--bg-sunken)]">
            <div
              className="h-1 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(Math.round(mastery * 100), 4)}%`, backgroundColor: masteryHex(mastery) }}
            />
          </div>
          <p className="mt-1 text-[0.58rem] font-semibold" style={{ color: masteryHex(mastery) }}>
            {Math.round(mastery * 100)}%
          </p>
        </div>
      )}

      {/* Hover inspect hint */}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[0.58rem] text-[var(--text-faint)] opacity-0 transition-opacity duration-150 group-hover:opacity-70">
        inspect →
      </span>
    </button>
  );
}

// ─── DAG layout ────────────────────────────────────────────────────────────────

const NODE_W   = 162;
const NODE_H   = 66;
const H_GAP    = 56;
const V_GAP    = 20;
const LAYER_STEP = NODE_W + H_GAP;
const NODE_STEP  = NODE_H + V_GAP;
const CPAD     = 22;

function computeDagLayout(nodes, links) {
  if (!nodes.length) return { layout: {}, canvasW: 0, canvasH: 0, validLinks: [] };

  const nodeIds = new Set(nodes.map((n) => n.id));
  const inDeg   = Object.fromEntries(nodes.map((n) => [n.id, 0]));
  const outAdj  = Object.fromEntries(nodes.map((n) => [n.id, []]));

  const validLinks = links.filter(
    (l) => nodeIds.has(l.source) && nodeIds.has(l.target) && l.source !== l.target
  );

  validLinks.forEach((l) => {
    outAdj[l.source].push(l.target);
    inDeg[l.target]++;
  });

  const layer  = Object.fromEntries(nodes.map((n) => [n.id, 0]));
  const tmpDeg = { ...inDeg };
  const queue  = nodes.filter((n) => tmpDeg[n.id] === 0).map((n) => n.id);

  while (queue.length) {
    const id = queue.shift();
    (outAdj[id] || []).forEach((tid) => {
      layer[tid] = Math.max(layer[tid], layer[id] + 1);
      tmpDeg[tid]--;
      if (tmpDeg[tid] === 0) queue.push(tid);
    });
  }

  const byLayer = {};
  nodes.forEach((n) => {
    const l = layer[n.id] ?? 0;
    if (!byLayer[l]) byLayer[l] = [];
    byLayer[l].push(n);
  });

  const numLayers  = Math.max(...Object.keys(byLayer).map(Number)) + 1;
  const maxInLayer = Math.max(...Object.values(byLayer).map((a) => a.length));
  const totalH     = maxInLayer * NODE_STEP - V_GAP + CPAD * 2;
  const layout     = {};

  Object.entries(byLayer).forEach(([l, layerNodes]) => {
    const lNum   = Number(l);
    const layerH = layerNodes.length * NODE_STEP - V_GAP;
    const startY = CPAD + (totalH - CPAD * 2 - layerH) / 2;
    layerNodes.forEach((node, i) => {
      layout[node.id] = {
        x: CPAD + lNum * LAYER_STEP,
        y: startY + i * NODE_STEP,
        w: NODE_W,
        h: NODE_H,
        layer: lNum,
      };
    });
  });

  const canvasW = CPAD + numLayers * LAYER_STEP - H_GAP + CPAD;
  const canvasH = Math.max(totalH, 200);
  return { layout, canvasW, canvasH, validLinks };
}

function edgePath(src, tgt) {
  const x1 = src.x + src.w, y1 = src.y + src.h / 2;
  const x2 = tgt.x,         y2 = tgt.y + tgt.h / 2;

  if (x2 >= x1 + 10) {
    const dx = (x2 - x1) * 0.5;
    return `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}`;
  }
  const bend = Math.max(src.y + src.h, tgt.y + tgt.h) + 32;
  return `M${x1},${y1} Q${x1 + 22},${bend} ${(x1 + x2) / 2},${bend} Q${x2 - 22},${bend} ${x2},${y2}`;
}

// ─── DAG view ─────────────────────────────────────────────────────────────────

function DagView({ nodes, links, hasMasteryData, searchTerm, changedIds, selectedNode, onSelectNode }) {
  const { layout, canvasW, canvasH, validLinks } = useMemo(
    () => computeDagLayout(nodes, links),
    [nodes, links]
  );

  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipState, setTooltipState] = useState(null); // { nodeId, x, y }
  const containerRef = useRef(null);

  // Nodes + edges connected to hovered node
  const hoverGraph = useMemo(() => {
    if (!hoveredNode) return null;
    const nodeIds  = new Set([hoveredNode]);
    const edgeIdxs = new Set();
    validLinks.forEach((l, i) => {
      if (l.source === hoveredNode || l.target === hoveredNode) {
        edgeIdxs.add(i);
        nodeIds.add(l.source);
        nodeIds.add(l.target);
      }
    });
    return { nodeIds, edgeIdxs };
  }, [hoveredNode, validLinks]);

  const matchIds = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      nodes
        .filter((n) =>
          n.name.toLowerCase().includes(q) ||
          (n.description || "").toLowerCase().includes(q) ||
          (n.lesson_title  || "").toLowerCase().includes(q)
        )
        .map((n) => n.id)
    );
  }, [nodes, searchTerm]);

  function nodeOpacity(id) {
    if (matchIds  && !matchIds.has(id))             return 0.1;
    if (hoverGraph && !hoverGraph.nodeIds.has(id))  return 0.2;
    return 1;
  }

  function edgeStyle(i, link) {
    const searchDim = matchIds && (!matchIds.has(link.source) || !matchIds.has(link.target));
    if (searchDim) return { stroke: "rgba(99,179,237,0.08)", strokeWidth: 1.6 };
    if (hoverGraph) {
      return hoverGraph.edgeIdxs.has(i)
        ? { stroke: "rgba(99,179,237,0.9)", strokeWidth: 2.6 }
        : { stroke: "rgba(99,179,237,0.07)", strokeWidth: 1.6 };
    }
    return { stroke: "rgba(99,179,237,0.48)", strokeWidth: 1.8 };
  }

  function splitLabel(name) {
    if (name.length <= 22) return [name, ""];
    const mid = name.lastIndexOf(" ", 22);
    if (mid < 5) return [name.slice(0, 20) + "…", ""];
    const l2 = name.slice(mid + 1);
    return [name.slice(0, mid), l2.length > 20 ? l2.slice(0, 18) + "…" : l2];
  }

  const hoveredData = tooltipState ? nodes.find((n) => n.id === tooltipState.nodeId) : null;

  return (
    <div>
      {matchIds && (
        <p className="mb-2 text-xs text-[var(--text-faint)]">
          {matchIds.size} of {nodes.length} concept{nodes.length !== 1 ? "s" : ""} match
        </p>
      )}

      <div ref={containerRef} className="relative overflow-x-auto rounded-2xl border border-[var(--border-card)] bg-[var(--bg-elevated)]">
        <svg
          width={canvasW}
          height={canvasH}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          aria-label="Knowledge dependency graph"
        >
          <defs>
            {/* Arrow markers */}
            <marker id="cg-arr"      markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <path d="M0,0.5 L0,6.5 L8.5,3.5 z" fill="rgba(99,179,237,0.85)" />
            </marker>
            <marker id="cg-arr-hi"   markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <path d="M0,0.5 L0,6.5 L8.5,3.5 z" fill="rgba(99,179,237,1)" />
            </marker>
            <marker id="cg-arr-dim"  markerWidth="9" markerHeight="7" refX="8" refY="3.5" orient="auto">
              <path d="M0,0.5 L0,6.5 L8.5,3.5 z" fill="rgba(99,179,237,0.12)" />
            </marker>
            {/* Glow filters */}
            <filter id="cg-glow-em" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="cg-glow-am" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="cg-glow-re" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="cg-glow-sl" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>

          {/* Edges */}
          {validLinks.map((link, i) => {
            const src = layout[link.source], tgt = layout[link.target];
            if (!src || !tgt) return null;
            const es = edgeStyle(i, link);
            const isHi = hoverGraph?.edgeIdxs.has(i);
            return (
              <path
                key={i}
                d={edgePath(src, tgt)}
                fill="none"
                stroke={es.stroke}
                strokeWidth={es.strokeWidth}
                markerEnd={isHi ? "url(#cg-arr-hi)" : (es.strokeWidth < 1.7 ? "url(#cg-arr-dim)" : "url(#cg-arr)")}
                style={{ transition: "stroke 0.14s, stroke-width 0.14s" }}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const pos = layout[node.id];
            if (!pos) return null;
            const mastery    = node.mastery || 0;
            const isSelected = selectedNode === node.id;
            const isHovered  = hoveredNode  === node.id;
            const isChanged  = changedIds.has(node.id);
            const dim        = nodeOpacity(node.id) < 1;
            const active     = isSelected || isHovered;

            const stroke = hasMasteryData
              ? (active ? "rgba(255,255,255,0.85)" : masteryHex(mastery))
              : (active ? "rgba(255,255,255,0.85)" : "rgba(148,163,184,0.38)");
            const fill = hasMasteryData ? masteryFill(mastery) : "rgba(15,23,42,0.72)";

            const glowId = hasMasteryData
              ? (mastery >= 0.7 ? "cg-glow-em" : mastery >= 0.4 ? "cg-glow-am" : "cg-glow-re")
              : "cg-glow-sl";

            const cx = pos.x + pos.w / 2;
            const cy = pos.y + pos.h / 2;
            const [line1, line2] = splitLabel(node.name);

            return (
              <g
                key={node.id}
                style={{
                  opacity: dim ? nodeOpacity(node.id) : 1,
                  cursor: "pointer",
                  transform: active
                    ? `translate(${cx}px,${cy}px) scale(1.045) translate(${-cx}px,${-cy}px)`
                    : "none",
                  transition: "opacity 0.14s, transform 0.13s cubic-bezier(0.34,1.56,0.64,1)",
                }}
                onClick={() => onSelectNode(isSelected ? null : node.id)}
                onMouseEnter={(e) => {
                  setHoveredNode(node.id);
                  const r = containerRef.current?.getBoundingClientRect();
                  if (r) setTooltipState({ nodeId: node.id, x: e.clientX - r.left, y: e.clientY - r.top });
                }}
                onMouseMove={(e) => {
                  const r = containerRef.current?.getBoundingClientRect();
                  if (r) setTooltipState((p) => p ? { ...p, x: e.clientX - r.left, y: e.clientY - r.top } : p);
                }}
                onMouseLeave={() => { setHoveredNode(null); setTooltipState(null); }}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${node.name}${hasMasteryData ? `, ${Math.round(mastery * 100)}% mastery` : ""}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectNode(isSelected ? null : node.id);
                  }
                }}
              >
                {/* Outer glow ring */}
                {active && (
                  <rect
                    x={pos.x - 5} y={pos.y - 5}
                    width={pos.w + 10} height={pos.h + 10}
                    rx={16} ry={16}
                    fill={`${masteryHex(mastery)}22`}
                    stroke={masteryHex(mastery)}
                    strokeWidth={1.5}
                    filter={`url(#${glowId})`}
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {/* Card body */}
                <rect
                  x={pos.x} y={pos.y}
                  width={pos.w} height={pos.h}
                  rx={12} ry={12}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={active ? 2 : 1.4}
                />

                {/* Subtle top shine */}
                <rect
                  x={pos.x + 1} y={pos.y + 1}
                  width={pos.w - 2} height={pos.h / 2 - 1}
                  rx={11} ry={11}
                  fill="rgba(255,255,255,0.03)"
                  style={{ pointerEvents: "none" }}
                />

                {/* Changed indicator */}
                {isChanged && (
                  <circle cx={pos.x + pos.w - 8} cy={pos.y + 8} r={4} fill="#06b6d4" />
                )}

                {/* Name */}
                <text
                  x={pos.x + 11} y={pos.y + (line2 ? 19 : 27)}
                  fontSize={11} fontWeight="600"
                  fill="rgba(248,250,252,0.93)"
                  fontFamily="ui-sans-serif,system-ui,sans-serif"
                >
                  {line1}
                </text>
                {line2 && (
                  <text
                    x={pos.x + 11} y={pos.y + 33}
                    fontSize={11} fontWeight="600"
                    fill="rgba(248,250,252,0.93)"
                    fontFamily="ui-sans-serif,system-ui,sans-serif"
                  >
                    {line2}
                  </text>
                )}

                {/* Mastery bar */}
                {hasMasteryData && (
                  <>
                    <rect
                      x={pos.x + 11} y={pos.y + pos.h - 14}
                      width={pos.w - 44} height={3.5}
                      rx={2} fill="rgba(30,41,59,0.7)"
                    />
                    <rect
                      x={pos.x + 11} y={pos.y + pos.h - 14}
                      width={Math.max((pos.w - 44) * mastery, 2)} height={3.5}
                      rx={2} fill={masteryHex(mastery)}
                    />
                    <text
                      x={pos.x + pos.w - 10} y={pos.y + pos.h - 8}
                      fontSize={8.5} fontWeight="700"
                      fill={masteryHex(mastery)} textAnchor="end"
                      fontFamily="ui-monospace,monospace"
                    >
                      {Math.round(mastery * 100)}%
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover tooltip */}
        {tooltipState && hoveredData && !selectedNode && (
          <div
            className="pointer-events-none absolute z-20 max-w-[180px] rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)]/95 px-3 py-2.5 text-xs shadow-2xl backdrop-blur"
            style={{
              left: Math.min(tooltipState.x + 16, canvasW - 196),
              top: Math.max(tooltipState.y - 12, 4),
            }}
          >
            <p className="font-semibold text-[var(--text-heading)]">{hoveredData.name}</p>
            {hoveredData.lesson_title && (
              <p className="mt-0.5 text-[0.58rem] text-[var(--text-faint)]">{hoveredData.lesson_title}</p>
            )}
            {hasMasteryData && (
              <p className="mt-1.5 text-[0.62rem] font-semibold" style={{ color: masteryHex(hoveredData.mastery || 0) }}>
                {Math.round((hoveredData.mastery || 0) * 100)}% mastery
              </p>
            )}
            <p className="mt-1 text-[0.58rem] text-[var(--text-faint)]">Click to inspect</p>
          </div>
        )}
      </div>

      <p className="mt-2 text-[0.62rem] text-[var(--text-faint)]">
        Arrows show prerequisites — earlier on the left. Hover to trace connections · click to inspect.
      </p>
    </div>
  );
}

// ─── mastery tier layout ───────────────────────────────────────────────────────

function MasteryTierLayout({ nodes, hasMasteryData, changedIds, selectedNode, onSelectNode, searchTerm = "" }) {
  const nodeRefs = useRef({});
  const q = searchTerm.trim().toLowerCase();

  const visible = q
    ? nodes.filter((n) =>
        n.name.toLowerCase().includes(q) ||
        (n.description  || "").toLowerCase().includes(q)
      )
    : nodes;

  const tiers = hasMasteryData
    ? [
        { key: "mastered",   label: "Mastered",   desc: "≥ 70%",   tcls: "text-emerald-400", bcls: "border-emerald-500/25", nodes: visible.filter((n) => (n.mastery || 0) >= 0.7) },
        { key: "developing", label: "Developing", desc: "40 – 70%", tcls: "text-amber-400",   bcls: "border-amber-500/25",   nodes: visible.filter((n) => (n.mastery || 0) >= 0.4 && (n.mastery || 0) < 0.7) },
        { key: "needs-work", label: "Needs Work", desc: "< 40%",   tcls: "text-red-400",     bcls: "border-red-500/25",     nodes: visible.filter((n) => (n.mastery || 0) < 0.4) },
      ]
    : [{ key: "all", label: "Concepts", desc: `${visible.length}`, tcls: "text-[var(--color-accent)]", bcls: "border-[var(--color-accent)]/20", nodes: visible }];

  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-elevated)] p-5">
      {q && (
        <p className="mb-3 text-xs text-[var(--text-faint)]">
          Showing {visible.length} of {nodes.length} concepts
        </p>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${tiers.length}, minmax(10rem, 1fr))` }}>
        {tiers.map((tier) => (
          <div key={tier.key} className="flex flex-col gap-2 overflow-x-auto">
            {/* Tier header */}
            <div className={`mb-1 border-b pb-2 ${tier.bcls}`}>
              <p className={`text-[0.6rem] font-bold uppercase tracking-[0.22em] ${tier.tcls}`}>{tier.label}</p>
              <p className="text-[0.56rem] text-[var(--text-faint)]">
                {tier.desc} · {tier.nodes.length} concept{tier.nodes.length !== 1 ? "s" : ""}
              </p>
            </div>

            {tier.nodes.length === 0 && (
              <div className="rounded-xl border border-dashed border-[var(--border-card)] py-5 text-center">
                <p className="text-[0.6rem] text-[var(--text-faint)]">{q ? "No matches" : "None yet"}</p>
              </div>
            )}

            {tier.nodes.map((node) => (
              <ConceptCard
                key={node.id}
                node={node}
                hasMasteryData={hasMasteryData}
                isSelected={selectedNode === node.id}
                isChanged={changedIds.has(node.id)}
                nodeRef={(el) => { nodeRefs.current[node.id] = el; }}
                onClick={() => onSelectNode(selectedNode === node.id ? null : node.id)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── lesson column layout ──────────────────────────────────────────────────────

function LessonColumnLayout({ nodes, links, changedIds, selectedNode, onSelectNode, searchTerm = "" }) {
  const containerRef = useRef(null);
  const nodeRefs     = useRef({});

  const q = searchTerm.trim().toLowerCase();
  const visibleIds = q
    ? new Set(nodes.filter((n) =>
        n.name.toLowerCase().includes(q) ||
        (n.description  || "").toLowerCase().includes(q) ||
        (n.lesson_title || "").toLowerCase().includes(q)
      ).map((n) => n.id))
    : null;

  const lessonOrder = [];
  const byLesson    = {};
  nodes.forEach((n) => {
    if (visibleIds && !visibleIds.has(n.id)) return;
    const key   = n.lesson_id ?? "__none__";
    const title = n.lesson_title ?? (n.lesson_id ? `Lesson ${n.lesson_id}` : "Unassigned");
    if (!byLesson[key]) { lessonOrder.push({ key, title }); byLesson[key] = []; }
    byLesson[key].push(n);
  });
  const columns = lessonOrder.map(({ key, title }) => ({ key, title, nodes: byLesson[key] }));

  const visibleLinks = visibleIds
    ? links.filter((l) => visibleIds.has(l.source) && visibleIds.has(l.target))
    : links;

  const [arrowPaths, setArrowPaths] = useState([]);
  const recalc = useCallback(() => {
    const container = containerRef.current;
    if (!container || !visibleLinks.length) { setArrowPaths([]); return; }
    const cr = container.getBoundingClientRect();
    const paths = visibleLinks.map((link) => {
      const s = nodeRefs.current[link.source]?.getBoundingClientRect();
      const t = nodeRefs.current[link.target]?.getBoundingClientRect();
      if (!s || !t) return null;
      const sCx = s.left + s.width / 2 - cr.left;
      const tCx = t.left + t.width / 2 - cr.left;
      if (Math.abs(tCx - sCx) < 80) return null; // skip same-column
      const x1 = s.right - cr.left, y1 = s.top + s.height / 2 - cr.top;
      const x2 = t.left  - cr.left, y2 = t.top + t.height / 2 - cr.top;
      const dx = Math.abs(x2 - x1) * 0.45;
      return `M${x1},${y1} C${x1+dx},${y1} ${x2-dx},${y2} ${x2},${y2}`;
    }).filter(Boolean);
    setArrowPaths(paths);
  }, [visibleLinks]);

  useLayoutEffect(() => { recalc(); }, [recalc]);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(recalc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [recalc]);
  useEffect(() => {
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, [recalc]);

  return (
    <div ref={containerRef} className="relative rounded-2xl border border-[var(--border-card)] bg-[var(--bg-elevated)] p-5">
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        <defs>
          <marker id="lsn-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
            <path d="M0,0 L0,7 L7,3.5 z" fill="rgba(99,179,237,0.7)" />
          </marker>
        </defs>
        {arrowPaths.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="rgba(99,179,237,0.5)" strokeWidth="1.8" markerEnd="url(#lsn-arrow)" />
        ))}
      </svg>

      {q && visibleIds && (
        <p className="mb-3 text-xs text-[var(--text-faint)]">
          Showing {visibleIds.size} of {nodes.length} concepts
        </p>
      )}

      {columns.length === 0 ? (
        <p className="py-6 text-center text-sm text-[var(--text-faint)]">No concepts match</p>
      ) : (
        <div className="flex gap-6 overflow-x-auto pb-1">
          {columns.map((col, ci) => (
            <div
              key={col.key}
              className={`flex min-w-[11rem] flex-1 flex-col gap-2 ${ci > 0 ? "border-l border-[var(--border-card)] pl-5" : ""}`}
            >
              <div className="mb-1 border-b border-[var(--border-card)] pb-2">
                <p className="text-[0.6rem] font-bold uppercase tracking-[0.22em] text-[var(--color-accent)]">{col.title}</p>
                <p className="text-[0.56rem] text-[var(--text-faint)]">{col.nodes.length} concept{col.nodes.length !== 1 ? "s" : ""}</p>
              </div>
              {col.nodes.map((node) => (
                <ConceptCard
                  key={node.id}
                  node={node}
                  hasMasteryData={false}
                  isSelected={selectedNode === node.id}
                  isChanged={changedIds.has(node.id)}
                  nodeRef={(el) => { nodeRefs.current[node.id] = el; }}
                  onClick={() => onSelectNode(selectedNode === node.id ? null : node.id)}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── calibration scatter ───────────────────────────────────────────────────────

function CalibrationScatterPlot({ nodes, hasMasteryData, onSelectNode, selectedNode }) {
  const W = 400, H = 320;
  const PAD = { top: 16, right: 16, bottom: 48, left: 52 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top  - PAD.bottom;

  const plotNodes = nodes.map((n) => ({ ...n, conf: confidenceEstimate(n), mastery: n.mastery || 0 }));
  const withConf  = plotNodes.filter((n) => n.conf != null);
  const noConf    = plotNodes.filter((n) => n.conf == null);

  if (!hasMasteryData || withConf.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-[var(--border-card)]">
        <p className="max-w-xs text-center text-sm text-[var(--text-faint)]">
          Calibration data appears after you rate your confidence on quiz questions
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-lg" style={{ minWidth: 280 }} aria-label="Calibration scatter plot">
          <g transform={`translate(${PAD.left},${PAD.top})`}>
            {[0, 0.25, 0.5, 0.75, 1].map((v) => (
              <g key={v}>
                <line x1={0} y1={plotH*(1-v)} x2={plotW} y2={plotH*(1-v)} stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
                <line x1={plotW*v} y1={0} x2={plotW*v} y2={plotH} stroke="rgba(148,163,184,0.1)" strokeWidth="1" />
              </g>
            ))}
            <line x1={0} y1={plotH} x2={plotW} y2={0} stroke="rgba(148,163,184,0.3)" strokeWidth="1.5" strokeDasharray="4 3" />
            <text x={plotW-4} y={4}        fontSize="9" fill="rgba(148,163,184,0.5)" textAnchor="end">ideal</text>
            <text x={4}       y={14}       fontSize="8" fill="rgba(6,182,212,0.6)">underconfident</text>
            <text x={plotW-4} y={plotH-6}  fontSize="8" fill="rgba(249,115,22,0.6)" textAnchor="end">overconfident</text>

            {withConf.map((node) => {
              const cx = node.conf * plotW;
              const cy = plotH * (1 - node.mastery);
              const color = calibrationDotColor(node.conf, node.mastery);
              const isSel = selectedNode === node.id;
              return (
                <g key={node.id}>
                  <circle
                    cx={cx} cy={cy} r={isSel ? 10 : 6}
                    fill={color} fillOpacity={isSel ? 0.95 : 0.7}
                    stroke={isSel ? "white" : "transparent"} strokeWidth={isSel ? 1.5 : 0}
                    className="cursor-pointer transition-all duration-150 hover:r-9"
                    onClick={() => onSelectNode(isSel ? null : node.id)}
                    aria-label={`${node.name}: confidence ${Math.round(node.conf*100)}%, mastery ${Math.round(node.mastery*100)}%`}
                  />
                  {isSel && (
                    <text x={cx+12} y={cy+4} fontSize="9" fill="white" fontWeight="600">
                      {node.name.length > 18 ? node.name.slice(0, 16) + "…" : node.name}
                    </text>
                  )}
                </g>
              );
            })}

            <line x1={0}     y1={0}     x2={0}     y2={plotH} stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
            <line x1={0}     y1={plotH} x2={plotW} y2={plotH} stroke="rgba(148,163,184,0.3)" strokeWidth="1" />
            {[0, 25, 50, 75, 100].map((v) => (
              <g key={v}>
                <text x={plotW*v/100} y={plotH+14} fontSize="9" fill="rgba(148,163,184,0.6)" textAnchor="middle">{v}%</text>
                <text x={-8} y={plotH*(1-v/100)+3}  fontSize="9" fill="rgba(148,163,184,0.6)" textAnchor="end">{v}%</text>
              </g>
            ))}
          </g>
          <text x={PAD.left+plotW/2} y={H-4}              fontSize="10" fill="rgba(148,163,184,0.5)" textAnchor="middle">Confidence estimate →</text>
          <text x={12} y={PAD.top+plotH/2} fontSize="10"  fill="rgba(148,163,184,0.5)" textAnchor="middle" transform={`rotate(-90,12,${PAD.top+plotH/2})`}>Actual mastery →</text>
        </svg>
      </div>
      <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--text-faint)]">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-orange-500 opacity-75" />Overconfident</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-cyan-500 opacity-75" />Underconfident</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500 opacity-75" />Well calibrated</span>
      </div>
      {noConf.length > 0 && (
        <p className="text-[0.6rem] text-[var(--text-faint)]">
          {noConf.length} concept{noConf.length > 1 ? "s" : ""} not plotted — no confidence ratings yet
        </p>
      )}
    </div>
  );
}

// ─── main export ───────────────────────────────────────────────────────────────

export default function ConceptGraph({
  nodes = [],
  links = [],
  hasMasteryData = false,
  classroomId,
  changedIds = new Set(),
  onVerify,
}) {
  const isTeacherView = !classroomId;
  const [mode, setMode]             = useState("graph");
  const [selectedNode, setSelectedNode] = useState(null);
  const [search, setSearch]         = useState("");

  const selectedData = selectedNode ? nodes.find((n) => n.id === selectedNode) : null;

  if (!nodes.length) return null;

  const modes = isTeacherView
    ? [{ id: "graph",  label: "Graph" }, { id: "lessons", label: "By Lesson" }]
    : [{ id: "graph",  label: "Graph" }, { id: "mastery", label: "By Mastery" }, { id: "calibration", label: "Calibration" }];

  return (
    <div className="space-y-4">
      {/* ── Controls ── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative min-w-[150px] flex-1 max-w-[280px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-faint)]"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Search concepts…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedNode(null); }}
            className="w-full rounded-xl border border-[var(--border-card)] bg-[var(--bg-sunken)] py-2 pl-9 pr-4 text-sm text-[var(--text-heading)] placeholder-[var(--text-faint)] transition focus:border-[var(--color-primary)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]/25 focus:bg-[var(--bg-card)]"
            aria-label="Search concepts"
          />
        </div>

        {/* Mode toggle */}
        <div className="flex items-center gap-0.5 rounded-xl border border-[var(--border-card)] bg-[var(--bg-sunken)] p-1">
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setSelectedNode(null); }}
              aria-pressed={mode === m.id}
              className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                mode === m.id
                  ? "bg-[var(--bg-card)] text-[var(--text-heading)] shadow-sm"
                  : "text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--bg-elevated)]/50"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Legend (graph mode with mastery) ── */}
      {mode === "graph" && hasMasteryData && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[0.62rem] text-[var(--text-faint)]">
          {[
            { label: "Mastered ≥70%",     color: "#10b981" },
            { label: "Developing 40–70%", color: "#f59e0b" },
            { label: "Needs work <40%",   color: "#ef4444" },
          ].map(({ label, color }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-5 rounded-full" style={{ backgroundColor: color, opacity: 0.7 }} />
              {label}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <svg width="22" height="10" viewBox="0 0 22 10" aria-hidden="true">
              <line x1="0" y1="5" x2="16" y2="5" stroke="rgba(99,179,237,0.65)" strokeWidth="1.5" />
              <path d="M12,1.5 L16,5 L12,8.5 z" fill="rgba(99,179,237,0.65)" />
            </svg>
            prerequisite
          </span>
        </div>
      )}

      {/* ── Views ── */}
      {mode === "graph" && (
        <DagView
          nodes={nodes} links={links}
          hasMasteryData={hasMasteryData}
          searchTerm={search}
          changedIds={changedIds}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
        />
      )}

      {mode === "mastery" && (
        <MasteryTierLayout
          nodes={nodes}
          hasMasteryData={hasMasteryData}
          changedIds={changedIds}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
          searchTerm={search}
        />
      )}

      {mode === "calibration" && (
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-elevated)] p-5">
          <CalibrationScatterPlot
            nodes={nodes}
            hasMasteryData={hasMasteryData}
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
          />
        </div>
      )}

      {mode === "lessons" && (
        <LessonColumnLayout
          nodes={nodes} links={links}
          changedIds={changedIds}
          selectedNode={selectedNode}
          onSelectNode={setSelectedNode}
          searchTerm={search}
        />
      )}

      {/* ── Detail sheet (global overlay, never disrupts layout) ── */}
      {selectedData && (
        <DetailSheet
          node={selectedData}
          hasMasteryData={hasMasteryData}
          classroomId={classroomId}
          onVerify={onVerify}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
