"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/lib/api/auth";
import { SkeletonOverlay } from "@/components/ui/LoadingStates";

export default function Home() {
  const router = useRouter();

  const { data: user, isError, error } = useQuery({
    queryKey: ["user"],
    queryFn: getMe,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    retry: false,
  });

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  useEffect(() => {
    if (isError) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      // If the error status is unauthorized (401) or forbidden (403), or if it's any other error (such as server error or connection failure),
      // we redirect the user to the login page as a safe fallback.
      if (status === 401 || status === 403) {
        router.push("/login");
      } else {
        router.push("/login");
      }
    }
  }, [isError, error, router]);

  return <SkeletonOverlay />;
}
