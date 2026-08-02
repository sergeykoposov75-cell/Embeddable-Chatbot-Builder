import { ListSkeleton } from "@/components/ui/skeleton";

export default function DocumentsLoading() {
  return (
    <div className="p-6">
      <div className="h-8 w-56 animate-pulse rounded bg-gray-200 mb-6" />
      <ListSkeleton count={4} />
    </div>
  );
}
