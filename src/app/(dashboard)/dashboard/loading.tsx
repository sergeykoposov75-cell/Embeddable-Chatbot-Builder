import { CardSkeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-9 w-32 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
