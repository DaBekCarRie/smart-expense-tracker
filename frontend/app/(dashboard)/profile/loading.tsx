import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex-1 p-6 md:p-10 bg-[#f2ede0] overflow-y-auto min-h-screen animate-fadeIn">
      <div className="max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-9 w-40 mb-8" />

        <div className="bg-[#faf8f5] rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 space-y-6">
          {/* Name Field Skeleton */}
          <div>
            <Skeleton className="h-4 w-28 mb-2" />
            <Skeleton className="h-10 w-full rounded-doodle-input" />
          </div>

          <hr className="border-t-2 border-dashed border-black my-8" />

          {/* Change Password Header & Toggle Button Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-32 rounded-doodle" />
          </div>

          {/* Save Button Skeleton */}
          <Skeleton className="h-11 w-full rounded-doodle mt-4" />
        </div>
      </div>
    </div>
  );
}
