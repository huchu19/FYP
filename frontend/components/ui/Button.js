import { btnPrimary, btnSecondary } from "@/lib/styles";

export default function Button({ children, variant = "primary", className = "", ...props }) {
  const styles = variant === "secondary" ? btnSecondary : btnPrimary;
  return (
    <button className={[styles, className].filter(Boolean).join(" ")} type="button" {...props}>
      {children}
    </button>
  );
}
