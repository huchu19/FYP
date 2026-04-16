/**
 * Shared Tailwind class constants for EduNexus.
 * Centralises the editorial studio visual language across the app.
 */

export const card =
  "relative overflow-hidden rounded-[1.5rem] border border-[var(--border-card)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-card)] backdrop-blur-xl transition duration-300 before:pointer-events-none before:absolute before:inset-x-5 before:top-0 before:h-px before:[background-image:var(--line-gradient)]";

export const cardHoverCyan =
  `${card} cursor-pointer hover:-translate-y-1 hover:border-[var(--color-primary)]/35 hover:shadow-[var(--shadow-primary)]`;

export const cardHoverViolet =
  `${card} cursor-pointer hover:-translate-y-1 hover:border-[var(--color-accent)]/35 hover:shadow-[var(--shadow-accent)]`;

export const cardElevated =
  "relative overflow-hidden rounded-[1.75rem] border border-[var(--border-card)] bg-[var(--bg-elevated)] shadow-[var(--shadow-elevated)] backdrop-blur-xl transition duration-300 before:pointer-events-none before:absolute before:inset-x-6 before:top-0 before:h-px before:[background-image:var(--line-gradient)]";

export const inputClass =
  "w-full rounded-[0.95rem] border border-[var(--border-input)] bg-[var(--bg-input)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] shadow-[inset_0_1px_0_rgba(255,255,255,0.26)] transition focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/12";

export const btnPrimary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[0.95rem] border border-[var(--button-border)] [background:var(--button-fill)] px-5 py-3 text-sm font-semibold tracking-[-0.01em] text-[var(--button-text)] shadow-[var(--button-shadow)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[var(--button-shadow-hover)] disabled:translate-y-0 disabled:opacity-60 disabled:shadow-none";

export const btnSecondary =
  "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[0.95rem] border border-[var(--button-secondary-border)] bg-[var(--button-secondary-fill)] px-5 py-3 text-sm font-semibold tracking-[-0.01em] text-[var(--button-secondary-text)] transition duration-300 hover:-translate-y-0.5 hover:border-[var(--border-strong)] hover:text-[var(--text-heading)] hover:shadow-[var(--shadow-soft)] disabled:translate-y-0 disabled:opacity-60";

export const btnDanger =
  "inline-flex cursor-pointer items-center justify-center rounded-[0.95rem] border border-red-500/18 bg-red-500/8 px-4 py-2.5 text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[var(--color-danger)] transition hover:-translate-y-0.5 hover:bg-red-500/12";

export const btnGhost =
  "inline-flex cursor-pointer items-center justify-center rounded-[0.9rem] px-3 py-2 text-[0.78rem] font-medium text-[var(--text-muted)] transition hover:bg-[var(--bg-hover)] hover:text-[var(--color-primary)]";

export const navLink =
  "inline-flex cursor-pointer items-center rounded-[0.85rem] border border-transparent px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition duration-300 hover:border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-heading)]";

export const breadcrumb =
  "flex flex-wrap items-center gap-3 text-[0.72rem] font-medium uppercase tracking-[0.2em] text-[var(--text-faint)]";

export const breadcrumbLink =
  "transition hover:text-[var(--color-primary)]";

export const pageSection = "space-y-8 pb-12 pt-2 lg:space-y-10";

export const pageHeader =
  "relative overflow-hidden rounded-[1.75rem] border border-[var(--border-card)] bg-[var(--bg-elevated)] px-6 py-7 shadow-[var(--shadow-card)] before:pointer-events-none before:absolute before:inset-y-0 before:right-0 before:w-40 before:[background-image:var(--header-burst)] sm:px-8 sm:py-9";

export const headerTag =
  "inline-flex items-center rounded-[0.75rem] border border-[var(--color-primary)]/16 bg-[var(--color-primary-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-primary)]";

export const headerTagViolet =
  "inline-flex items-center rounded-[0.75rem] border border-[var(--color-accent)]/18 bg-[var(--color-accent-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-[var(--color-accent)]";

export const pageTitle =
  "[font-family:var(--font-display)] text-4xl font-semibold tracking-[-0.05em] text-[var(--text-heading)] sm:text-5xl xl:text-[3.65rem]";

export const pageSubtitle =
  "max-w-3xl text-sm leading-7 text-[var(--text-muted)] sm:text-base";

export const listItem =
  "flex cursor-pointer items-center justify-between rounded-[1.1rem] border border-transparent bg-[var(--bg-list)] px-4 py-3 transition duration-300 hover:-translate-y-0.5 hover:border-[var(--border-card)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-heading)]";

export const badgeCyan =
  "rounded-[0.75rem] border border-[var(--color-primary)]/18 bg-[var(--color-primary-soft)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-primary)]";

export const badgeViolet =
  "rounded-[0.75rem] border border-[var(--color-accent)]/18 bg-[var(--color-accent-soft)] px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]";

export const badgeSuccess =
  "rounded-[0.75rem] border border-emerald-500/18 bg-emerald-500/10 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[var(--color-success)]";

export const statLabel =
  "text-[0.76rem] font-semibold uppercase tracking-[0.24em] text-[var(--text-faint)]";

export const statValue =
  "mt-2 [font-family:var(--font-display)] text-3xl font-semibold tracking-[-0.05em] text-[var(--text-heading)]";

export const alertError =
  "rounded-[1rem] border border-red-500/18 bg-red-500/10 px-4 py-3 text-sm text-[var(--color-danger)]";

export const alertSuccess =
  "rounded-[1rem] border border-emerald-500/18 bg-emerald-500/10 px-4 py-3 text-sm text-[var(--color-success)]";

export const tableHead =
  "border-b border-[var(--border-card)] text-[0.68rem] font-semibold uppercase tracking-[0.26em] text-[var(--text-faint)]";

export const tableRow =
  "border-b border-[var(--border-card)]/30";

export const loadingText =
  "animate-pulse text-[var(--text-faint)]";

export const emptyState =
  "rounded-[1.5rem] border border-dashed border-[var(--border-card)] bg-[var(--bg-sunken)] p-8 text-center text-sm text-[var(--text-faint)]";

export const proseWrapper =
  "prose prose-themed max-w-none prose-headings:font-semibold prose-h2:mt-10 prose-h2:border-b prose-h2:border-[var(--border-card)] prose-h2:pb-3 prose-p:leading-relaxed prose-ul:leading-relaxed prose-ol:leading-relaxed";

export const progressTrack =
  "h-2.5 w-full overflow-hidden rounded-full bg-[var(--bg-sunken)] shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]";

export const progressBar =
  "h-2.5 rounded-full bg-[var(--color-accent)] transition-all";

export const gradientText =
  "[background-image:var(--title-gradient)] bg-clip-text text-transparent";
