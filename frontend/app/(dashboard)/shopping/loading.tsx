import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ShoppingLoading() {
  return (
    <div className="space-y-8 min-h-screen pb-12 p-4 md:p-8 max-w-5xl mx-auto animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-40 rounded-doodle" />
      </div>

      <div className="flex flex-col gap-8">
        {/* Left Card: Form Skeleton */}
        <div className="w-full bg-paper rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
          <Skeleton className="h-5 w-36 mb-6" />
          <div className="space-y-4">
            <div>
              <Skeleton className="h-3.5 w-16 mb-2" />
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Skeleton className="h-3.5 w-16 mb-2" />
                <Skeleton className="h-9 w-full" />
              </div>
              <div>
                <Skeleton className="h-3.5 w-16 mb-2" />
                <Skeleton className="h-9 w-full" />
              </div>
            </div>
            <Skeleton className="h-10 w-full mt-4" />
          </div>
        </div>

        {/* Right Card: List Skeleton */}
        <div className="w-full bg-paper rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-6 pb-2 border-b border-black border-dashed">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-28 rounded-full" />
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-doodle border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] bg-[#faf8f5]">
                <div className="flex items-center gap-3 w-3/4">
                  <Skeleton className="h-6 w-6 rounded shrink-0" />
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
                <Skeleton className="h-8 w-8 rounded-doodle shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
