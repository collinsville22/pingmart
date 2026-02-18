export function Skeleton({
  className = "",
  width,
  height,
}: {
  className?: string;
  width?: string;
  height?: string;
}) {
  return (
    <div
      className={`rounded-lg bg-bg-elevated animate-shimmer ${className}`}
      style={{ width, height }}
    />
  );
}

export function DomainCardSkeleton() {
  return (
    <div className="flex items-center justify-between p-5 rounded-2xl bg-bg-surface border border-border-subtle">
      <div className="flex flex-col gap-2.5">
        <Skeleton width="180px" height="20px" />
        <Skeleton width="60px" height="14px" />
      </div>
      <Skeleton width="90px" height="36px" className="rounded-full" />
    </div>
  );
}
