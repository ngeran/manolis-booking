interface LoadingSkeletonProps {
  rows?: number;
  className?: string;
}

export function LoadingSkeleton({ rows = 3, className = "" }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 bg-black border border-obsidian animate-pulse"
        />
      ))}
    </div>
  );
}

export function LoadingCard({ className = "" }: { className?: string }) {
  return (
    <div className={`h-48 bg-black border border-obsidian animate-pulse ${className}`} />
  );
}
