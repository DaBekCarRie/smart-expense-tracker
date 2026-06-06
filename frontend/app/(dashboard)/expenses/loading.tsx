import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExpensesLoading() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-40 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-11 w-36 rounded-doodle" />
      </div>

      {/* Filters Skeleton */}
      <div className="bg-paper rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-3.5 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* List Skeleton */}
      <div className="bg-paper rounded-doodle border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-base">
            <thead>
              <tr className="border-b-2 border-black bg-pastel-blue">
                <th className="px-4 py-3 text-left font-bold text-black uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left font-bold text-black uppercase tracking-wider">Merchant</th>
                <th className="px-4 py-3 text-right font-bold text-black uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left font-bold text-black uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-right font-bold text-black uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {Array.from({ length: 5 }).map((_, r) => (
                <tr key={r} className="bg-white">
                  <td className="px-4 py-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-16 ml-auto" /></td>
                  <td className="px-4 py-4"><Skeleton className="h-6 w-24" /></td>
                  <td className="px-4 py-4 text-right"><Skeleton className="h-4 w-12 ml-auto" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
