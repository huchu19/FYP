export default function Button({ children, variant = "primary" }) {
  const base = "inline-flex items-center justify-center rounded px-4 py-2 text-sm font-medium";
  const styles = variant === "secondary"
    ? "bg-zinc-100 text-slate-800 hover:bg-zinc-200"
    : "bg-[var(--color-primary)] text-white hover:bg-teal-700";

  return <button className={`${base} ${styles}`} type="button">{children}</button>;
}
