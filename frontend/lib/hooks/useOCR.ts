"use client";

import { useMutation } from "@tanstack/react-query";
import { extractOCR } from "@/lib/api/ocr";
import type { OCRResult } from "@/types";

/**
 * Mutation hook for OCR extraction.
 * Pass a File (optionally pre-compressed) to mutate().
 * Tracks isPending / isError / data automatically via React Query.
 */
export function useOCR() {
  return useMutation<OCRResult, Error, File>({
    mutationFn: (file: File) => extractOCR(file),
  });
}
