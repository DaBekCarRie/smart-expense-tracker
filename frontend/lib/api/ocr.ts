import apiClient from "./client";
import type { OCRResult } from "@/types";

/**
 * Upload a receipt image via multipart/form-data and return the OCR extraction result.
 */
export async function extractOCR(file: File): Promise<OCRResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<OCRResult>(
    "/api/v1/ocr/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}
