"use client";

import { useState } from "react";

export default function PublishGate() {
  const [published, setPublished] = useState(false);

  return (
    <div className="board-gate" data-published={published}>
      <button
        type="button"
        role="switch"
        aria-checked={published}
        aria-label="Publish the sample lesson"
        onClick={() => setPublished(!published)}
        className="board-switch"
      >
        <span aria-hidden="true" className="board-switch-track">
          <span className="board-switch-thumb" />
        </span>
        <span className="font-semibold">{published ? "Published" : "Draft: select to publish"}</span>
      </button>

      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <div className="board-window">
          <p className="board-window-label">Teacher sees</p>
          <p className="mt-2 font-semibold">The forgetting curve</p>
          <p className="mt-1 text-[var(--board-muted)]">{published ? "Published" : "Draft"}</p>
        </div>
        <div className="board-window" aria-live="polite">
          <p className="board-window-label">Student sees</p>
          {published ? (
            <>
              <p key="lesson" className="mt-2 animate-fade-in font-semibold">
                The forgetting curve
              </p>
              <p className="mt-1 animate-fade-in text-[var(--board-muted)]">Ready to read</p>
            </>
          ) : (
            <p key="empty" className="mt-2 text-[var(--board-muted)]">
              Nothing yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
