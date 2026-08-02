import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200",
        className
      )}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="h-5 w-5 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4 mt-2" />
      <div className="mt-4 pt-3 border-t">
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-2 w-1/4 mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}
