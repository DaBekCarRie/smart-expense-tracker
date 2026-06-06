import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function InventoryLoading() {
  return (
    <div className="space-y-8 min-h-screen pb-12 p-4 md:p-8 max-w-5xl mx-auto animate-fadeIn">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-[#faf8f5] rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-4">
            <Skeleton className="h-3.5 w-24 mb-3" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Skeleton className="w-full h-11" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-[#fffdf7] rounded-doodle border-[3px] border-black shadow-[6px_7px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="text-left text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">Product Name</th>
                <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">Current Stock</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">Min Stock</th>
                <th className="text-right text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">Last Price</th>
                <th className="text-right text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">Avg Price</th>
                <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">Batches</th>
                <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">Adjust</th>
                <th className="text-center text-[11px] font-bold uppercase tracking-widest px-4 py-3 whitespace-nowrap">Delete</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 4 }).map((_, r) => (
                <tr key={r} className="border-b-2 border-black/10 last:border-b-0 bg-[#fffdf7]">
                  <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-4 text-center"><Skeleton className="h-4 w-12 mx-auto" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  <td className="px-4 py-4 text-center"><Skeleton className="h-4 w-10 mx-auto" /></td>
                  <td className="px-4 py-4 text-center"><Skeleton className="h-4 w-16 mx-auto" /></td>
                  <td className="px-4 py-4 text-center"><Skeleton className="h-4 w-8 mx-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
