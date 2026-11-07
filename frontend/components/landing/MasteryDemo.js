"use client";

import { useEffect, useRef, useState } from "react";

import { ArrowRightIcon } from "@/components/layout/icons";
import { btnPrimary, btnSecondary } from "@/lib/styles";
import { mapConcepts, mapEdges, mapViewBox } from "@/components/landing/content";

/* These mirror the backend, so the demo behaves like the real app:
   MASTERY_WEIGHT  -> knowledge_graph.py update_mastery (alpha)
   HINT_PENALTY    -> quiz_attempt_service.py HINT_PENALTY_STEP
   BLOCKER_LINE    -> knowledge_graph.py get_blind_spots */
const MASTERY_WEIGHT = 0.3;
const HINT_PENALTY = 0.25;
const BLOCKER_LINE = 0.5;

const STATUS_LABELS = {
  mastered: "Mastered",
  developing: "Developing",
  needsWork: "Needs work",
};

const initialMastery = Object.fromEntries(mapConcepts.map((concept) => [concept.id, concept.mastery]));
const conceptById = Object.fromEntries(mapConcepts.map((concept) => [concept.id, concept]));
const emptyAttempt = { choice: null, hints: 0, confidence: null };

const percent = (value) => Math.round(value * 100);

function statusOf(mastery) {
  if (mastery >= 0.7) return "mastered";
  if (mastery >= 0.4) return "developing";
  return "needsWork";
}

function dependentsOf(id) {
  return mapEdges.filter((edge) => edge.from === id).map((edge) => conceptById[edge.to].name);
}

function prerequisitesOf(id) {
  return mapEdges.filter((edge) => edge.to === id).map((edge) => conceptById[edge.from].name);
}

function findBlockers(mastery) {
  return mapConcepts
    .filter((concept) => dependentsOf(concept.id).length > 0 && mastery[concept.id] < BLOCKER_LINE)
    .sort((a, b) => mastery[a.id] - mastery[b.id]);
}

function lowestConcept(mastery) {
  return [...mapConcepts].sort((a, b) => mastery[a.id] - mastery[b.id])[0];
}

function useCountUp(target) {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = shownRef.current;
    const startedAt = performance.now();
    const duration = reduceMotion ? 0 : 800;
    let frame;

    function tick(now) {
      const progress = duration === 0 ? 1 : Math.min((now - startedAt) / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      shownRef.current = start + (target - start) * eased;
      setShown(shownRef.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return shown;
}

function MapNode({ concept, mastery, isSelected, isBlocker, delta, onSelect }) {
  const shown = useCountUp(mastery);
  const status = statusOf(mastery);
  const dependents = dependentsOf(concept.id);

  return (
    <button
      type="button"
      onClick={() => onSelect(concept.id)}
      aria-pressed={isSelected}
      aria-label={`${concept.name}: ${percent(mastery)}% mastery, ${STATUS_LABELS[status]}${
        isBlocker ? `, holding back ${dependents.join(" and ")}` : ""
      }`}
      data-status={status}
      data-blocker={isBlocker}
      data-selected={isSelected}
      className="map-node"
      style={{
        "--dx": `${(concept.desktop[0] / mapViewBox.desktop.width) * 100}%`,
        "--dy": `${(concept.desktop[1] / mapViewBox.desktop.height) * 100}%`,
        "--mx": `${(concept.mobile[0] / mapViewBox.mobile.width) * 100}%`,
        "--my": `${(concept.mobile[1] / mapViewBox.mobile.height) * 100}%`,
      }}
    >
      <span className="block text-[0.82rem] font-semibold leading-tight text-[var(--text-heading)] md:text-[0.88rem]">
        {concept.name}
      </span>
      <span className="mt-2 flex items-center gap-2">
        <span className="map-node-track">
          <span className="map-node-fill" style={{ width: `${shown * 100}%` }} />
        </span>
        <span className="font-mono text-[0.72rem] font-semibold tabular-nums text-[var(--text-heading)] md:text-[0.78rem]">
          {percent(shown)}%
        </span>
      </span>
      {delta ? (
        <span key={delta.key} aria-hidden="true" className="map-node-delta">
          {delta.amount > 0 ? "+" : ""}
          {delta.amount}
        </span>
      ) : null}
    </button>
  );
}

function ConceptMap({ mastery, selectedId, blockers, lastResult, onSelect }) {
  const blockerIds = new Set(blockers.map((concept) => concept.id));

  function edgePaths(layout) {
    return mapEdges.map((edge, index) => {
      const blocking = blockerIds.has(edge.from);
      return (
        <path
          key={`${edge.from}-${edge.to}`}
          d={edge[layout]}
          pathLength="1"
          fill="none"
          className={blocking ? "map-edge map-edge-blocking" : "map-edge"}
          style={{ animationDelay: `${300 + index * 120}ms` }}
          markerEnd={`url(#${layout}-${blocking ? "arrow-blocking" : "arrow"})`}
        />
      );
    });
  }

  function markers(layout) {
    const size = layout === "desktop" ? 8 : 5;
    return (
      <defs>
        <marker id={`${layout}-arrow`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth={size} markerHeight={size} orient="auto">
          <path d="M1 1 9 5 1 9Z" className="map-arrow" />
        </marker>
        <marker id={`${layout}-arrow-blocking`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth={size} markerHeight={size} orient="auto">
          <path d="M1 1 9 5 1 9Z" className="map-arrow map-arrow-blocking" />
        </marker>
      </defs>
    );
  }

  return (
    <div className="map-stage">
      <svg
        aria-hidden="true"
        className="absolute inset-0 hidden h-full w-full md:block"
        viewBox={`0 0 ${mapViewBox.desktop.width} ${mapViewBox.desktop.height}`}
      >
        {markers("desktop")}
        {edgePaths("desktop")}
      </svg>
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full md:hidden"
        viewBox={`0 0 ${mapViewBox.mobile.width} ${mapViewBox.mobile.height}`}
      >
        {markers("mobile")}
        {edgePaths("mobile")}
      </svg>

      {mapConcepts.map((concept) => (
        <MapNode
          key={concept.id}
          concept={concept}
          mastery={mastery[concept.id]}
          isSelected={selectedId === concept.id}
          isBlocker={blockerIds.has(concept.id)}
          delta={
            lastResult?.id === concept.id
              ? { key: lastResult.key, amount: percent(lastResult.after) - percent(lastResult.before) }
              : null
          }
          onSelect={onSelect}
        />
      ))}

      <dl className="map-legend" aria-label="Map key">
        {Object.entries({ mastered: "70% and over", developing: "40% to 69%", needsWork: "Under 40%" }).map(
          ([status, range]) => (
            <div key={status} className="flex items-center gap-2" data-status={status}>
              <dt className="flex items-center gap-2 font-semibold text-[var(--text-heading)]">
                <span aria-hidden="true" className="map-swatch" />
                {STATUS_LABELS[status]}
              </dt>
              <dd className="text-[var(--text-secondary)]">{range}</dd>
            </div>
          ),
        )}
      </dl>
    </div>
  );
}

function Overview({ concept, mastery, blockers, onStart }) {
  const dependents = dependentsOf(concept.id);
  const prerequisites = prerequisitesOf(concept.id);
  const isTopBlocker = blockers[0]?.id === concept.id;
  const isBlocker = blockers.some((blocker) => blocker.id === concept.id);
  const value = mastery[concept.id];

  let summary;
  if (isBlocker) {
    summary = `It's under ${percent(BLOCKER_LINE)}%, and ${dependents.join(" and ")} depends on it, so it's holding you back.`;
  } else if (blockers.length === 0) {
    summary = "No prerequisite is under 50% right now, so nothing on the map is being held back.";
  } else if (prerequisites.length > 0) {
    summary = `This concept builds on ${prerequisites.join(" and ")}.`;
  } else {
    summary = "Everything else on this map builds on this concept.";
  }

  return (
    <div key={concept.id} className="animate-fade-in">
      <p className="text-sm font-semibold text-[var(--text-secondary)]">
        {isTopBlocker ? "Recommended focus" : "Selected concept"}
      </p>
      <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4">
        <h2 className="font-display text-[1.9rem] font-semibold leading-tight text-[var(--text-heading)]">
          {concept.name}
        </h2>
        <p className="font-mono text-lg font-semibold tabular-nums text-[var(--text-heading)]">{percent(value)}%</p>
      </div>
      <p className="mt-2 max-w-xl leading-7 text-[var(--text-primary)]">{summary}</p>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3">
        <button type="button" onClick={onStart} className={btnPrimary}>
          Answer a question
          <ArrowRightIcon className="h-4 w-4" />
        </button>
        <p className="text-sm text-[var(--text-secondary)]">Or select any concept on the map.</p>
      </div>
    </div>
  );
}

function QuestionForm({ concept, attempt, onChange, onSubmit, onCancel }) {
  const { question } = concept;
  const credit = 1 - HINT_PENALTY * attempt.hints;

  return (
    <form
      className="animate-fade-in"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <fieldset>
        <legend className="text-[1.05rem] font-semibold leading-7 text-[var(--text-heading)]">
          {question.prompt}
        </legend>
        <div className="mt-3 grid gap-2">
          {question.options.map((option, index) => (
            <label key={option} className="map-option" data-checked={attempt.choice === index}>
              <input
                type="radio"
                name="map-answer"
                className="sr-only"
                checked={attempt.choice === index}
                onChange={() => onChange({ choice: index })}
              />
              <span aria-hidden="true" className="map-option-dot" />
              {option}
            </label>
          ))}
        </div>
      </fieldset>

      {attempt.hints > 0 ? (
        <ol className="mt-3 space-y-1 border-l-2 border-[var(--color-accent)] pl-3 text-sm leading-6 text-[var(--text-primary)]">
          {question.hints.slice(0, attempt.hints).map((hint) => (
            <li key={hint} className="animate-fade-in">
              {hint}
            </li>
          ))}
        </ol>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="font-semibold text-[var(--text-heading)]">Worth {percent(credit)}%</span>
            <button
              type="button"
              disabled={attempt.hints >= question.hints.length}
              onClick={() => onChange({ hints: attempt.hints + 1 })}
              className="font-semibold text-[var(--color-primary)] underline decoration-1 underline-offset-4 disabled:text-[var(--text-secondary)] disabled:no-underline"
            >
              {attempt.hints >= question.hints.length ? "No hints left" : `Reveal hint ${attempt.hints + 1}`}
            </button>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-1" aria-hidden="true">
            {[0, 1, 2, 3].map((segment) => (
              <span key={segment} className="map-credit" data-spent={segment >= 4 - attempt.hints} />
            ))}
          </div>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-[var(--text-heading)]">How sure are you? (optional)</legend>
          <div className="mt-1 flex gap-1.5">
            {[1, 2, 3, 4, 5].map((level) => (
              <label key={level} className="map-confidence" data-checked={attempt.confidence === level}>
                <input
                  type="radio"
                  name="map-confidence"
                  className="sr-only"
                  checked={attempt.confidence === level}
                  onChange={() => onChange({ confidence: level })}
                />
                {level}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="submit" disabled={attempt.choice === null} className={btnPrimary}>
          Submit answer
        </button>
        <button type="button" onClick={onCancel} className={btnSecondary}>
          Back to the map
        </button>
      </div>
    </form>
  );
}

function blockerMessage(result, blockersAfter) {
  const dependents = dependentsOf(result.id);
  if (dependents.length === 0) return null;

  const blockedAfter = blockersAfter.some((concept) => concept.id === result.id);
  const blocked = dependents.join(" and ");
  if (result.wasBlocker && !blockedAfter) return `It's now over 50%, so it's no longer holding back ${blocked}.`;
  if (result.wasBlocker) return `It's still under 50%, so it's still holding back ${blocked}.`;
  if (blockedAfter) return `It's now under 50%, so it's holding back ${blocked}.`;
  return null;
}

function calibrationMessage(result) {
  if (result.confidence === null) return null;
  const rated = `You rated your confidence ${result.confidence} out of 5`;
  if (result.confidence >= 4 && !result.correct) {
    return `${rated}, but the answer was wrong. The app tracks gaps like this as your self-assessment accuracy.`;
  }
  if (result.confidence <= 2 && result.correct) {
    return `${rated}, but you got it right. The app tracks gaps like this as your self-assessment accuracy.`;
  }
  return null;
}

function ResultPanel({ result, blockers, onContinue, onReset }) {
  const concept = conceptById[result.id];
  let verdict;
  if (!result.correct) verdict = "Not quite, so this earned no credit.";
  else if (result.hints === 0) verdict = "Correct, with no hints, so this earned full credit.";
  else verdict = `Correct, with ${result.hints} ${result.hints === 1 ? "hint" : "hints"}, so this earned ${percent(result.credit)}% credit.`;

  const blockerNote = blockerMessage(result, blockers);
  const calibrationNote = calibrationMessage(result);

  return (
    <div className="animate-fade-in" role="status">
      <h2 className="font-display text-[1.9rem] font-semibold leading-tight text-[var(--text-heading)]">
        {concept.name}: {percent(result.before)}% to {percent(result.after)}%
      </h2>
      <p className="mt-2 font-semibold text-[var(--text-heading)]">{verdict}</p>
      <div className="mt-2 max-w-2xl space-y-2 leading-7 text-[var(--text-primary)]">
        <p>{concept.question.explanation}</p>
        {blockerNote ? <p className="font-semibold text-[var(--text-heading)]">{blockerNote}</p> : null}
        {calibrationNote ? <p>{calibrationNote}</p> : null}
        <p className="text-sm text-[var(--text-secondary)]">
          Each answer makes up {percent(MASTERY_WEIGHT)}% of the new mastery score, so recent answers count the most.
          In the app, your teacher can see your map too.
        </p>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onContinue} className={btnPrimary}>
          Try another question
          <ArrowRightIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={onReset} className={btnSecondary}>
          Reset the map
        </button>
      </div>
    </div>
  );
}

export default function MasteryDemo() {
  const [mastery, setMastery] = useState(initialMastery);
  const [selectedId, setSelectedId] = useState(null);
  const [phase, setPhase] = useState("overview");
  const [attempt, setAttempt] = useState(emptyAttempt);
  const [result, setResult] = useState(null);
  const [resultCount, setResultCount] = useState(0);
  const figureRef = useRef(null);
  const trayRef = useRef(null);
  const phaseChangedByButton = useRef(false);

  /* The button that was just pressed disappears, so move focus to the panel
     that replaced it and keep the map and the panel on screen together. */
  useEffect(() => {
    if (!phaseChangedByButton.current) return;
    phaseChangedByButton.current = false;
    trayRef.current?.focus({ preventScroll: true });

    const trayBottom = trayRef.current?.getBoundingClientRect().bottom ?? 0;
    if (trayBottom > window.innerHeight) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      figureRef.current?.scrollIntoView({ block: "start", behavior: reduceMotion ? "auto" : "smooth" });
    }
  }, [phase]);

  function goToPhase(nextPhase) {
    phaseChangedByButton.current = true;
    setPhase(nextPhase);
  }

  const blockers = findBlockers(mastery);
  const concept = selectedId ? conceptById[selectedId] : blockers[0] ?? lowestConcept(mastery);

  function selectConcept(id) {
    setSelectedId(id);
    setAttempt(emptyAttempt);
    setPhase("overview");
  }

  function submitAnswer() {
    const correct = attempt.choice === concept.question.answer;
    const credit = correct ? Math.max(HINT_PENALTY, 1 - HINT_PENALTY * attempt.hints) : 0;
    const before = mastery[concept.id];
    const after = Number((MASTERY_WEIGHT * credit + (1 - MASTERY_WEIGHT) * before).toFixed(3));

    setMastery({ ...mastery, [concept.id]: after });
    setSelectedId(concept.id);
    setResult({
      id: concept.id,
      key: resultCount,
      before,
      after,
      correct,
      credit,
      hints: attempt.hints,
      confidence: attempt.confidence,
      wasBlocker: blockers.some((blocker) => blocker.id === concept.id),
    });
    setResultCount(resultCount + 1);
    goToPhase("result");
  }

  function continueAfterResult() {
    setSelectedId(null);
    setAttempt(emptyAttempt);
    setResult(null);
    goToPhase("overview");
  }

  function reset() {
    setMastery(initialMastery);
    continueAfterResult();
  }

  return (
    <figure ref={figureRef} className="landing-map" aria-label="Interactive knowledge map demo">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
        <p className="font-display text-[1.5rem] font-semibold text-[var(--text-heading)]">
          Try it: learn how learning works
        </p>
        <p className="text-sm text-[var(--text-secondary)]">No account needed</p>
      </div>

      <ConceptMap
        mastery={mastery}
        selectedId={concept.id}
        blockers={blockers}
        lastResult={result}
        onSelect={selectConcept}
      />

      <div ref={trayRef} tabIndex={-1} className="landing-tray">
        {phase === "overview" ? (
          <Overview concept={concept} mastery={mastery} blockers={blockers} onStart={() => goToPhase("question")} />
        ) : null}
        {phase === "question" ? (
          <QuestionForm
            key={concept.id}
            concept={concept}
            attempt={attempt}
            onChange={(change) => setAttempt({ ...attempt, ...change })}
            onSubmit={submitAnswer}
            onCancel={() => goToPhase("overview")}
          />
        ) : null}
        {phase === "result" && result ? (
          <ResultPanel
            key={result.key}
            result={result}
            blockers={blockers}
            onContinue={continueAfterResult}
            onReset={reset}
          />
        ) : null}
      </div>

      <figcaption className="landing-caption mt-3 px-1">
        The starting scores are made up. This runs in your browser using the app&apos;s scoring rules, and nothing is
        saved. In the app, the concepts come from your teacher&apos;s lessons.
      </figcaption>
    </figure>
  );
}
