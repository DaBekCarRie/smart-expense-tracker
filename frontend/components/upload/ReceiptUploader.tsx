"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { compressReceiptImage, getCompressionStats } from "@/lib/utils/imageCompression";
import { useOCR } from "@/lib/hooks/useOCR";
import { OCRResultPreview } from "./OCRResultPreview";
import type { ExpenseCreate, UploadState } from "@/types";
import { cn } from "@/lib/utils/cn";

interface Props {
  /** Called when the user clicks "Apply to form" in the OCR preview. */
  onApply?: (data: Partial<ExpenseCreate>) => void;
  className?: string;
}

interface CompressionInfo {
  originalKB: number;
  compressedKB: number;
  savingPercent: number;
}

/**
 * ReceiptUploader
 *
 * - Accepts image files via drag-and-drop or file picker
 * - Compresses to WebP client-side (browser-image-compression) before upload
 * - Shows progress states: idle → compressing → uploading → done / error
 * - Displays extracted OCR fields (merchant, amount, date) via OCRResultPreview
 * - Lets the user confirm / edit before creating a transaction
 */
export function ReceiptUploader({ onApply, className }: Props) {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const ocrMutation = useOCR();

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        return;
      }

      // Generate local preview URL
      setPreview(URL.createObjectURL(file));
      setFileName(file.name);
      setCompressionInfo(null);
      ocrMutation.reset();

      try {
        // Step 1 — compress to WebP
        setUploadState("compressing");
        const compressed = await compressReceiptImage(file);
        const stats = getCompressionStats(file, compressed);
        setCompressionInfo(stats);

        // Step 2 — upload to OCR endpoint
        setUploadState("uploading");
        await ocrMutation.mutateAsync(compressed);

        setUploadState("done");
      } catch {
        setUploadState("error");
      }
    },
    [ocrMutation]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        void processFile(file);
      }
    },
    [processFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    disabled: uploadState === "compressing" || uploadState === "uploading",
  });

  function handleReset() {
    setUploadState("idle");
    setPreview(null);
    setFileName(null);
    setCompressionInfo(null);
    if (preview) URL.revokeObjectURL(preview);
    ocrMutation.reset();
  }

  const isBusy = uploadState === "compressing" || uploadState === "uploading";

  return (
    <div className={cn("space-y-4", className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          "relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100",
          isBusy && "pointer-events-none opacity-60",
          uploadState === "done" && "border-green-400 bg-green-50"
        )}
      >
        <input {...getInputProps()} />

        {/* Thumbnail when a file has been selected */}
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Receipt preview"
            className="max-h-32 rounded-lg object-contain shadow-sm"
          />
        )}

        {/* State-specific icon + label */}
        {uploadState === "idle" && (
          <>
            <Upload className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                {isDragActive ? "Drop the image here" : "Drag & drop a receipt"}
              </p>
              <p className="mt-0.5 text-xs text-gray-400">
                or click to select — JPEG, PNG, HEIC, WebP
              </p>
            </div>
          </>
        )}

        {uploadState === "compressing" && (
          <StatusRow icon={<Loader2 className="h-5 w-5 animate-spin text-blue-500" />}>
            Compressing to WebP…
          </StatusRow>
        )}

        {uploadState === "uploading" && (
          <StatusRow icon={<Loader2 className="h-5 w-5 animate-spin text-blue-500" />}>
            Uploading &amp; extracting with OCR…
          </StatusRow>
        )}

        {uploadState === "done" && (
          <StatusRow icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}>
            <span className="text-green-700">Extraction complete</span>
            {fileName && (
              <span className="ml-1.5 text-xs text-gray-400 font-normal truncate max-w-[180px]">
                {fileName}
              </span>
            )}
          </StatusRow>
        )}

        {uploadState === "error" && (
          <StatusRow icon={<AlertCircle className="h-5 w-5 text-red-500" />}>
            <span className="text-red-700">Upload failed</span>
            <span className="ml-1.5 text-xs text-gray-400 font-normal">
              — tap to try again
            </span>
          </StatusRow>
        )}

        {/* Compression stats (shown when done or after compressing) */}
        {compressionInfo && uploadState !== "idle" && (
          <p className="text-xs text-gray-500">
            <ImageIcon className="inline h-3 w-3 mr-1 align-text-bottom" />
            {Math.round(compressionInfo.originalKB)} KB →{" "}
            {Math.round(compressionInfo.compressedKB)} KB &nbsp;
            <span className="text-green-600 font-semibold">
              −{compressionInfo.savingPercent}%
            </span>
          </p>
        )}
      </div>

      {/* OCR result preview — shown after successful extraction */}
      {uploadState === "done" && ocrMutation.data && (
        <OCRResultPreview
          result={ocrMutation.data}
          onApply={(data) => {
            onApply?.(data);
            handleReset();
          }}
        />
      )}

      {/* Error detail */}
      {uploadState === "error" && ocrMutation.error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{ocrMutation.error.message ?? "OCR extraction failed. Please try again."}</span>
        </div>
      )}

      {/* Reset link (shown after done or error) */}
      {(uploadState === "done" || uploadState === "error") && (
        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-gray-500 hover:text-gray-700 underline underline-offset-2"
        >
          Upload a different receipt
        </button>
      )}
    </div>
  );
}

// ── Internal helper ──────────────────────────────────────────────────────────

function StatusRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
      {icon}
      <span className="flex items-center gap-1">{children}</span>
    </div>
  );
}
