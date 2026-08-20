import { card, pageHeader, pageSection } from "@/lib/styles";

const shimmer = "animate-pulse rounded-full bg-[var(--bg-muted)]";

/**
 * Placeholder shown while a dashboard route loads, mirroring the real
 * layout so the page does not jump when content arrives.
 */
export default function DashboardSkeleton({ cards = 3 }) {
  return (
    <div className={pageSection} aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your dashboard</span>

      <div className={pageHeader}>
        <div className={`${shimmer} h-3 w-28`} />
        <div className={`${shimmer} mt-5 h-9 w-2/3 max-w-md`} />
        <div className={`${shimmer} mt-4 h-3 w-full max-w-xl`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className={card} aria-hidden="true">
            <div className={`${shimmer} h-3 w-20`} />
            <div className={`${shimmer} mt-4 h-6 w-3/4`} />
            <div className={`${shimmer} mt-3 h-3 w-full`} />
            <div className={`${shimmer} mt-2 h-3 w-5/6`} />
          </div>
        ))}
      </div>
    </div>
  );
}
