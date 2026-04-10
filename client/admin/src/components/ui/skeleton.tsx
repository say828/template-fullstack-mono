import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("rounded-md bg-muted/70 skeleton-shimmer", className)} aria-hidden="true" />;
}
