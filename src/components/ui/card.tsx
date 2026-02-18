export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`
        rounded-2xl bg-bg-surface border border-border-subtle overflow-hidden
        ${hover ? "transition-all duration-300 hover:border-accent/20 hover:purple-glow cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
