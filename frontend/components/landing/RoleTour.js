"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { ArrowRightIcon, ChevronLeftIcon } from "@/components/layout/icons";
import { roles } from "@/components/landing/content";
import { btnPrimary, btnSecondary } from "@/lib/styles";

/* The viewer's shape is fixed, so the camera can be worked out from fractions
   of its size without measuring anything in the browser. */
const VIEW_ASPECT = 4 / 3;
const MAX_ZOOM = 3.2;
const FOCUS_FILL = 0.92;

function fitImage({ width, height }) {
  const aspect = width / height;
  const box = aspect >= VIEW_ASPECT ? { w: 1, h: VIEW_ASPECT / aspect } : { w: aspect / VIEW_ASPECT, h: 1 };
  return { ...box, left: (1 - box.w) / 2, top: (1 - box.h) / 2 };
}

function panAxis(start, size, zoom, focusCentre) {
  const scaled = size * zoom;
  if (scaled <= 1) return (1 - scaled) / 2 - start;
  const offset = 0.5 - start - zoom * focusCentre * size;
  return Math.min(-start, Math.max(1 - start - scaled, offset));
}

function cameraFor(box, focus) {
  if (!focus) return { zoom: 1, transform: "translate(0, 0) scale(1)" };
  const zoom = Math.max(1, Math.min(MAX_ZOOM, FOCUS_FILL / (focus.w * box.w), FOCUS_FILL / (focus.h * box.h)));
  const x = panAxis(box.left, box.w, zoom, focus.x + focus.w / 2);
  const y = panAxis(box.top, box.h, zoom, focus.y + focus.h / 2);
  return { zoom, transform: `translate(${(x / box.w) * 100}%, ${(y / box.h) * 100}%) scale(${zoom})` };
}

function moveWithArrows(event, count, current, select) {
  const forward = event.key === "ArrowRight" || event.key === "ArrowDown";
  const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
  if (!forward && !backward) return;
  event.preventDefault();
  const next = (current + (forward ? 1 : -1) + count) % count;
  select(next);
  const tabs = event.currentTarget.querySelectorAll('[role="tab"]');
  tabs[next]?.focus();
}

function Shot({ step, isActive, focus, activeNote, onSelectNote, priority }) {
  const box = fitImage(step.image);
  const camera = cameraFor(box, isActive ? focus : null);

  return (
    <div
      className="tour-shot"
      data-active={isActive}
      aria-hidden={!isActive}
      style={{
        left: `${box.left * 100}%`,
        top: `${box.top * 100}%`,
        width: `${box.w * 100}%`,
        height: `${box.h * 100}%`,
        transform: camera.transform,
        "--zoom": camera.zoom,
      }}
    >
      <Image
        {...step.image}
        alt={step.alt}
        priority={priority}
        sizes="(min-width: 1280px) 70vw, 200vw"
        className="tour-image"
      />

      {focus && isActive ? (
        <span
          aria-hidden="true"
          className="tour-spotlight"
          style={{
            left: `${focus.x * 100}%`,
            top: `${focus.y * 100}%`,
            width: `${focus.w * 100}%`,
            height: `${focus.h * 100}%`,
          }}
        />
      ) : null}

      {isActive && !focus
        ? step.notes.map((note, index) => (
            <button
              key={note.title}
              type="button"
              className="tour-pin"
              aria-label={`Zoom in on: ${note.title}`}
              title={note.title}
              onClick={() => onSelectNote(index)}
              style={{
                left: `${(note.focus.x + note.focus.w / 2) * 100}%`,
                top: `${(note.focus.y + note.focus.h / 2) * 100}%`,
                animationDelay: `${index * 70}ms`,
              }}
            >
              {index + 1}
            </button>
          ))
        : null}
      {activeNote === null ? null : <span className="sr-only">Zoomed in on {step.notes[activeNote].title}</span>}
    </div>
  );
}

export default function RoleTour() {
  const [view, setView] = useState({ role: "teacher", step: 0, note: null });
  const stageRef = useRef(null);

  const role = roles[view.role];
  const step = role.steps[view.step];
  const focus = view.note === null ? null : step.notes[view.note].focus;
  const roleKeys = Object.keys(roles);

  const chooseRole = (roleKey) => setView({ role: roleKey, step: 0, note: null });
  const chooseStep = (stepIndex) => setView({ ...view, step: stepIndex, note: null });

  useEffect(() => {
    /* Next.js updates the URL with pushState for same-page links, which doesn't
       fire hashchange, so the navbar's links are picked up from their clicks. */
    function roleFromHash(hash) {
      if (hash.endsWith("#teachers")) chooseRole("teacher");
      if (hash.endsWith("#students")) chooseRole("student");
    }
    function onClick(event) {
      const link = event.target.closest?.("a[href]");
      if (link) roleFromHash(link.getAttribute("href"));
    }
    function onHistory() {
      roleFromHash(window.location.hash);
    }

    const frame = requestAnimationFrame(onHistory);
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onHistory);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", onHistory);
    };
  }, []);

  function selectNote(index) {
    setView({ ...view, note: view.note === index ? null : index });

    const stage = stageRef.current;
    if (!stage) return;
    const bounds = stage.getBoundingClientRect();
    const headerSpace = window.matchMedia("(min-width: 1024px)").matches ? 100 : 12;
    if (bounds.top < headerSpace || bounds.bottom > window.innerHeight) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      stage.scrollIntoView({ block: "center", behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function goToNext() {
    if (view.step < role.steps.length - 1) chooseStep(view.step + 1);
    else chooseRole(view.role === "teacher" ? "student" : "teacher");
  }

  const nextLabel =
    view.step < role.steps.length - 1 ? `Next: ${role.steps[view.step + 1].label}` : role.otherSide;

  return (
    <section
      className="landing-tour landing-reveal"
      data-side={view.role}
      data-role={view.role === "teacher" ? "teacher" : undefined}
      aria-labelledby="tour-heading"
    >
      <span id="teachers" className="landing-anchor" />
      <span id="students" className="landing-anchor" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <h2 id="tour-heading" className="landing-section-title">
            Two sides of the same classroom
          </h2>
          <p key={view.role} className="landing-body mt-3 max-w-2xl animate-fade-in">
            {role.intro}
          </p>
        </div>
        <div
          role="tablist"
          aria-label="Choose whose view to see"
          className="tour-roles"
          onKeyDown={(event) =>
            moveWithArrows(event, roleKeys.length, roleKeys.indexOf(view.role), (index) => chooseRole(roleKeys[index]))
          }
        >
          {roleKeys.map((roleKey) => (
            <button
              key={roleKey}
              type="button"
              role="tab"
              id={`tour-role-${roleKey}`}
              aria-selected={view.role === roleKey}
              tabIndex={view.role === roleKey ? 0 : -1}
              onClick={() => chooseRole(roleKey)}
              className="tour-role"
            >
              {roles[roleKey].tab}
            </button>
          ))}
        </div>
      </div>

      <div
        role="tablist"
        aria-label={`${role.tab} walkthrough steps`}
        className="tour-rail"
        onKeyDown={(event) => moveWithArrows(event, role.steps.length, view.step, chooseStep)}
      >
        {role.steps.map((railStep, index) => (
          <button
            key={railStep.title}
            type="button"
            role="tab"
            aria-selected={view.step === index}
            aria-controls="tour-panel"
            tabIndex={view.step === index ? 0 : -1}
            data-done={index < view.step}
            onClick={() => chooseStep(index)}
            className="tour-rail-step"
          >
            <span aria-hidden="true" className="tour-rail-number">
              {index + 1}
            </span>
            {railStep.label}
          </button>
        ))}
      </div>

      <div className="tour-layout">
        <figure className="tour-viewer">
          <div className="tour-stage" ref={stageRef} style={{ aspectRatio: VIEW_ASPECT }}>
            {role.steps.map((shot, index) => (
              <Shot
                key={shot.image.src}
                step={shot}
                isActive={index === view.step}
                focus={index === view.step ? focus : null}
                activeNote={index === view.step ? view.note : null}
                onSelectNote={selectNote}
                priority={index === 0}
              />
            ))}
            {focus ? (
              <button
                type="button"
                onClick={() => setView({ ...view, note: null })}
                className="tour-zoom-out animate-fade-in"
              >
                Show the whole screen
              </button>
            ) : null}
          </div>
          <figcaption className="landing-caption mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <span>From the app, using a sample biology class and made-up students.</span>
            <a
              href={step.image.src}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open full-size screenshot: ${step.title}`}
              className="font-semibold underline decoration-1 underline-offset-4 hover:text-[var(--text-heading)]"
            >
              Open full size
            </a>
          </figcaption>
        </figure>

        <div id="tour-panel" role="tabpanel" aria-label={step.title} className="tour-card">
          <div key={step.title} className="animate-fade-in">
            <h3 className="font-display text-[clamp(1.75rem,2.6vw,2.2rem)] font-semibold leading-[1.12] text-[var(--text-heading)]">
              {step.title}
            </h3>
            <p className="mt-3 leading-7 text-[var(--text-primary)]">{step.lead}</p>

            <ol className="mt-5 space-y-1">
              {step.notes.map((note, index) => (
                <li key={note.title}>
                  <button
                    type="button"
                    aria-pressed={view.note === index}
                    onClick={() => selectNote(index)}
                    className="tour-note"
                  >
                    <span aria-hidden="true" className="tour-note-number">
                      {index + 1}
                    </span>
                    <span>
                      <span className="block font-semibold text-[var(--text-heading)]">{note.title}</span>
                      <span className="mt-0.5 block text-[0.95rem] leading-6 text-[var(--text-primary)]">
                        {note.text}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>

            {step.extras ? (
              <div className="mt-5 border-t border-[var(--border-card)] pt-4">
                <h4 className="font-display text-[1.25rem] font-semibold text-[var(--text-heading)]">
                  {step.extras.heading}
                </h4>
                <dl className="mt-2 space-y-2 text-[0.95rem] leading-6">
                  {step.extras.items.map((item) => (
                    <div key={item.term}>
                      <dt className="inline font-semibold text-[var(--text-heading)]">{item.term}: </dt>
                      <dd className="inline text-[var(--text-primary)]">{item.text}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => chooseStep(view.step - 1)}
            disabled={view.step === 0}
            aria-label="Previous step"
            className={btnSecondary}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>
          <button type="button" onClick={goToNext} className={btnSecondary}>
            {nextLabel}
            <ArrowRightIcon className="h-4 w-4" />
          </button>
        </div>
        <Link href={role.signup.href} className={btnPrimary}>
          {role.signup.label}
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
