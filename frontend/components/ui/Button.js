export default function Button({ children, variant = "primary", ...props }) {
  const base = "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-all";
  const styles = variant === "secondary"
    ? "border border-slate-600 text-slate-300 hover:border-cyan-500/40 hover:text-white"
    : "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40";

  return <button className={`${base} ${styles}`} type="button" {...props}>{children}</button>;
}
