import { Skeleton } from "@/components/ui/skeleton";

export const TableSkeleton = ({ rows = 6, cols = 5 }) => (
  <div className="divide-y divide-[#E2E8F0]">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-5 py-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-4 flex-1 rounded-md bg-[#F1F5F9]" />
        ))}
      </div>
    ))}
  </div>
);

export const CardsSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-[12px] border border-[#E2E8F0] p-5">
        <Skeleton className="h-4 w-24 rounded bg-[#F1F5F9]" />
        <Skeleton className="h-8 w-20 mt-4 rounded bg-[#F1F5F9]" />
        <Skeleton className="h-3 w-16 mt-3 rounded bg-[#F1F5F9]" />
      </div>
    ))}
  </div>
);
