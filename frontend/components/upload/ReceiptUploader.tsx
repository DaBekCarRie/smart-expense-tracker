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
          "relative flex flex-col items-center justify-center gap-3 rounded-doodle border-doodle border-dashed p-8 text-center transition-all cursor-pointer shadow-doodle",
          isDragActive
            ? "border-black bg-pastel-blue translate-y-[2px] shadow-doodle-sm"
            : "border-black bg-white hover:bg-paper hover:translate-y-[-2px] hover:shadow-[4px_6px_0px_0px_rgba(0,0,0,1)]",
          isBusy && "pointer-events-none opacity-80 bg-paper",
          uploadState === "done" && "border-black bg-pastel-green",
          uploadState === "error" && "border-black bg-pastel-pink"
        )}
      >
        <input {...getInputProps()} />

        {/* Thumbnail when a file has been selected */}
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Receipt preview"
            className="max-h-32 rounded-lg object-contain shadow-doodle-sm border-2 border-black"
          />
        )}

        {/* State-specific icon + label */}
        {uploadState === "idle" && (
          <>
            <Upload className="h-8 w-8 text-black" strokeWidth={2.5} />
            <div>
              <p className="text-lg font-bold text-black tracking-wide">
                {isDragActive ? "Drop it like it's hot!" : "Drag & drop a receipt"}
              </p>
              <p className="mt-0.5 text-xs text-gray-600 font-bold">
                or click to select — JPEG, PNG, HEIC, WebP
              </p>
            </div>
          </>
        )}

        {uploadState === "compressing" && (
          <StatusRow icon={<Loader2 className="h-6 w-6 animate-spin text-black" strokeWidth={2.5} />}>
            Compressing to WebP…
          </StatusRow>
        )}

        {uploadState === "uploading" && (
          <StatusRow icon={<Loader2 className="h-6 w-6 animate-spin text-black" strokeWidth={2.5} />}>
            Uploading &amp; extracting with OCR…
          </StatusRow>
        )}

        {uploadState === "done" && (
          <StatusRow icon={<CheckCircle2 className="h-6 w-6 text-black" strokeWidth={2.5} />}>
            <span className="text-black font-bold text-lg">Extraction complete</span>
            {fileName && (
              <span className="ml-1.5 text-xs text-gray-700 font-bold truncate max-w-[180px]">
                {fileName}
              </span>
            )}
          </StatusRow>
        )}

        {uploadState === "error" && (
          <StatusRow icon={<AlertCircle className="h-6 w-6 text-black" strokeWidth={2.5} />}>
            <span className="text-black font-bold text-lg">Upload failed</span>
            <span className="ml-1.5 text-xs text-gray-700 font-bold">
              — tap to try again
            </span>
          </StatusRow>
        )}

        {/* Compression stats (shown when done or after compressing) */}
        {compressionInfo && uploadState !== "idle" && (
          <p className="text-xs text-gray-700 font-bold">
            <ImageIcon className="inline h-4 w-4 mr-1 align-text-bottom text-black" strokeWidth={2.5} />
            {Math.round(compressionInfo.originalKB)} KB →{" "}
            {Math.round(compressionInfo.compressedKB)} KB &nbsp;
            <span className="text-green-700 font-bold text-sm">
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
        <div className="flex items-start gap-2 rounded-doodle border-doodle bg-red-100 px-4 py-3 text-sm text-black shadow-doodle-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-black" strokeWidth={2.5} />
          <span className="font-bold">{ocrMutation.error.message ?? "OCR extraction failed. Please try again."}</span>
        </div>
      )}

      {/* Reset link (shown after done or error) */}
      {(uploadState === "done" || uploadState === "error") && (
        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-bold text-gray-600 hover:text-black underline underline-offset-4 decoration-2"
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
    <div className="flex items-center gap-2 text-lg font-bold text-black">
      {icon}
      <span className="flex items-center gap-1">{children}</span>
    </div>
  );
}
