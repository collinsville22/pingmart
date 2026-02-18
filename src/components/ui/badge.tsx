type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "accent";

const variants: Record<BadgeVariant, string> = {
  success: "bg-success/10 text-success border-success/15",
  warning: "bg-warning/10 text-warning border-warning/15",
  danger: "bg-danger/10 text-danger border-danger/15",
  neutral: "bg-bg-elevated text-text-secondary border-border-subtle",
  accent: "bg-accent/8 text-accent border-accent/15",
};

export function Badge({
  variant = "neutral",
  children,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
}) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium tracking-wide uppercase
        rounded-full border ${variants[variant]}
      `}
    >
      {children}
    </span>
  );
}
