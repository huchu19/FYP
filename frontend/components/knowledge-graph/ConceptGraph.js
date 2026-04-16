"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/**
 * Interactive force-directed concept graph visualization.
 *
 * Renders concepts as nodes with mastery color-coding and prerequisite edges.
 * Uses a simple force simulation on a <canvas> element.
 */

const COLORS = {
  high: "#10b981",    // emerald-500 (mastery >= 0.7)
  medium: "#f59e0b",  // amber-500 (mastery 0.4-0.7)
  low: "#ef4444",     // red-500 (mastery < 0.4)
  none: "#6366f1",    // indigo-500 (no mastery data)
  edge: "rgba(148, 163, 184, 0.3)",
  edgeArrow: "rgba(148, 163, 184, 0.6)",
  text: "#e2e8f0",
  textDark: "#0f172a",
  hoverBg: "rgba(6, 182, 212, 0.15)",
  selectedBg: "rgba(6, 182, 212, 0.25)",
};

function getMasteryColor(mastery, hasMasteryData) {
  if (!hasMasteryData) return COLORS.none;
  if (mastery >= 0.7) return COLORS.high;
  if (mastery >= 0.4) return COLORS.medium;
  return COLORS.low;
}

function initSimulation(nodes, links, width, height) {
  // Place nodes in a circle initially
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.3;

  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    node.x = cx + radius * Math.cos(angle);
    node.y = cy + radius * Math.sin(angle);
    node.vx = 0;
    node.vy = 0;
  });

  return { nodes, links };
}

function simulate(nodes, links, width, height) {
  const cx = width / 2;
  const cy = height / 2;

  // Repulsion between all nodes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = 800 / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      nodes[i].vx -= fx;
      nodes[i].vy -= fy;
      nodes[j].vx += fx;
      nodes[j].vy += fy;
    }
  }

  // Attraction along edges
  const nodeMap = {};
  nodes.forEach((n) => (nodeMap[n.id] = n));

  links.forEach((link) => {
    const source = nodeMap[link.source];
    const target = nodeMap[link.target];
    if (!source || !target) return;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const force = (dist - 120) * 0.01;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;
    source.vx += fx;
    source.vy += fy;
    target.vx -= fx;
    target.vy -= fy;
  });

  // Center gravity
  nodes.forEach((node) => {
    node.vx += (cx - node.x) * 0.005;
    node.vy += (cy - node.y) * 0.005;
  });

  // Apply velocities with damping
  nodes.forEach((node) => {
    if (node.dragging) return;
    node.vx *= 0.85;
    node.vy *= 0.85;
    node.x += node.vx;
    node.y += node.vy;
    // Keep within bounds
    node.x = Math.max(40, Math.min(width - 40, node.x));
    node.y = Math.max(40, Math.min(height - 40, node.y));
  });
}

export default function ConceptGraph({
  nodes = [],
  links = [],
  hasMasteryData = false,
  onNodeClick,
  width = 800,
  height = 500,
}) {
  const canvasRef = useRef(null);
  const nodesRef = useRef([]);
  const linksRef = useRef([]);
  const animRef = useRef(null);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const dragRef = useRef(null);

  // Initialize nodes and links
  useEffect(() => {
    const simNodes = nodes.map((n) => ({
      ...n,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 20 + Math.min(n.name.length, 12),
    }));
    initSimulation(simNodes, links, width, height);
    nodesRef.current = simNodes;
    linksRef.current = links;
  }, [nodes, links, width, height]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    const currentNodes = nodesRef.current;
    const currentLinks = linksRef.current;
    const nodeMap = {};
    currentNodes.forEach((n) => (nodeMap[n.id] = n));

    // Draw edges
    currentLinks.forEach((link) => {
      const source = nodeMap[link.source];
      const target = nodeMap[link.target];
      if (!source || !target) return;

      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.strokeStyle = COLORS.edge;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(target.y - source.y, target.x - source.x);
      const arrowDist = target.radius + 4;
      const ax = target.x - Math.cos(angle) * arrowDist;
      const ay = target.y - Math.sin(angle) * arrowDist;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(
        ax - 8 * Math.cos(angle - Math.PI / 6),
        ay - 8 * Math.sin(angle - Math.PI / 6)
      );
      ctx.lineTo(
        ax - 8 * Math.cos(angle + Math.PI / 6),
        ay - 8 * Math.sin(angle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fillStyle = COLORS.edgeArrow;
      ctx.fill();
    });

    // Draw nodes
    currentNodes.forEach((node) => {
      const color = getMasteryColor(node.mastery, hasMasteryData);
      const isHovered = hoveredNode === node.id;
      const isSelected = selectedNode === node.id;

      // Glow for hovered/selected
      if (isHovered || isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? COLORS.selectedBg : COLORS.hoverBg;
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = isHovered ? "#06b6d4" : "rgba(255,255,255,0.2)";
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = COLORS.text;
      ctx.font = `${isHovered ? "bold " : ""}11px system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const maxWidth = node.radius * 2 - 6;
      let label = node.name;
      if (ctx.measureText(label).width > maxWidth) {
        while (label.length > 3 && ctx.measureText(label + "…").width > maxWidth) {
          label = label.slice(0, -1);
        }
        label += "…";
      }
      ctx.fillText(label, node.x, node.y);

      // Mastery percentage below node
      if (hasMasteryData) {
        ctx.font = "10px system-ui, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.fillText(
          `${Math.round(node.mastery * 100)}%`,
          node.x,
          node.y + node.radius + 12
        );
      }
    });

    ctx.restore();
  }, [hasMasteryData, hoveredNode, selectedNode]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    let running = true;
    function tick() {
      if (!running) return;
      simulate(nodesRef.current, linksRef.current, width, height);
      draw();
      animRef.current = requestAnimationFrame(tick);
    }
    tick();

    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [width, height, draw]);

  // Mouse interaction
  function getNodeAt(x, y) {
    for (let i = nodesRef.current.length - 1; i >= 0; i--) {
      const n = nodesRef.current[i];
      const dx = x - n.x;
      const dy = y - n.y;
      if (dx * dx + dy * dy <= n.radius * n.radius) return n;
    }
    return null;
  }

  function getMousePos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleMouseMove(e) {
    const pos = getMousePos(e);
    if (dragRef.current) {
      dragRef.current.x = pos.x;
      dragRef.current.y = pos.y;
      return;
    }
    const node = getNodeAt(pos.x, pos.y);
    setHoveredNode(node ? node.id : null);
    canvasRef.current.style.cursor = node ? "pointer" : "default";
  }

  function handleMouseDown(e) {
    const pos = getMousePos(e);
    const node = getNodeAt(pos.x, pos.y);
    if (node) {
      node.dragging = true;
      dragRef.current = node;
    }
  }

  function handleMouseUp() {
    if (dragRef.current) {
      dragRef.current.dragging = false;
      dragRef.current = null;
    }
  }

  function handleClick(e) {
    const pos = getMousePos(e);
    const node = getNodeAt(pos.x, pos.y);
    if (node) {
      setSelectedNode((prev) => (prev === node.id ? null : node.id));
      onNodeClick?.(node);
    } else {
      setSelectedNode(null);
    }
  }

  const selected = selectedNode
    ? nodesRef.current.find((n) => n.id === selectedNode)
    : null;

  return (
    <div className="space-y-3">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-elevated)]"
        style={{ width, height }}
        role="img"
        aria-label="Interactive concept knowledge graph"
      />

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
        {hasMasteryData ? (
          <>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-emerald-500" /> High mastery (&ge;70%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-amber-500" /> Medium (40-70%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full bg-red-500" /> Low (&lt;40%)
            </span>
          </>
        ) : (
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-full bg-indigo-500" /> Concept
          </span>
        )}
        <span className="text-[var(--text-faint)]">Arrows show prerequisite relationships</span>
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--bg-card)] p-5 text-sm shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold text-[var(--text-heading)]">{selected.name}</h3>
          {selected.description && (
            <p className="mt-1 text-[var(--text-secondary)]">{selected.description}</p>
          )}

          {hasMasteryData && (
            <div className="mt-4 space-y-3">
              {/* Mastery + Metacognition row */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--text-faint)]">Mastery</p>
                  <p className="mt-1 text-xl font-bold text-[var(--text-heading)]">{Math.round(selected.mastery * 100)}%</p>
                </div>
                {selected.metacognitive_score != null && (
                  <div className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--text-faint)]">Self-Awareness</p>
                    <p className="mt-1 text-xl font-bold text-[var(--text-heading)]">{Math.round(selected.metacognitive_score * 100)}%</p>
                  </div>
                )}
                {selected.zpd_delta != null && (
                  <div className="rounded-lg bg-[var(--bg-elevated)] px-3 py-2">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[var(--text-faint)]">ZPD Gap</p>
                    <p className="mt-1 text-xl font-bold text-[var(--text-heading)]">
                      {selected.zpd_delta > 0 ? "+" : ""}{Math.round(selected.zpd_delta * 100)}%
                    </p>
                    <p className="text-[0.6rem] text-[var(--text-faint)]">
                      {selected.unaided_mastery != null ? `${Math.round(selected.unaided_mastery * 100)}% unaided` : ""}{" "}
                      {selected.aided_mastery != null ? `→ ${Math.round(selected.aided_mastery * 100)}% with hints` : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Evidence trail */}
              {selected.evidence && selected.evidence.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-[var(--text-faint)] transition hover:text-[var(--color-primary)]">
                    Evidence Trail ({selected.evidence.length} data points)
                  </summary>
                  <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
                    {[...selected.evidence].reverse().map((e, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-md bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs">
                        <span className={`inline-block h-2 w-2 rounded-full ${e.is_correct ? "bg-emerald-500" : "bg-red-500"}`} />
                        <span className="text-[var(--text-secondary)]">
                          {e.is_correct ? "Correct" : "Incorrect"}
                        </span>
                        {e.confidence != null && (
                          <span className="text-[var(--text-faint)]">conf {e.confidence}/5</span>
                        )}
                        {e.hints_used > 0 && (
                          <span className="text-amber-500">{e.hints_used} hint{e.hints_used > 1 ? "s" : ""}</span>
                        )}
                        <span className="ml-auto text-[var(--text-faint)]">
                          → {Math.round((e.mastery_after || 0) * 100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {selected.attempts > 0 && (
                <p className="text-xs text-[var(--text-faint)]">{selected.attempts} attempt{selected.attempts !== 1 ? "s" : ""} recorded</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
