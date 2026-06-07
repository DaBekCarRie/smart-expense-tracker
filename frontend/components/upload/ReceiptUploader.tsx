"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { compressReceiptImage, getCompressionStats } from "@/lib/utils/imageCompression";
import { useOCR } from "@/lib/hooks/useOCR";
import { OCRResultPreview } from "./OCRResultPreview";
import type { OCRResult, UploadState } from "@/types";
import { cn } from "@/lib/utils/cn";
import { useTranslation } from "@/lib/i18n/LanguageContext";
import { OCROverlay } from "@/components/ui/LoadingStates";

interface Props {
  /** Called when the user clicks "Apply to form" in the OCR preview. */
  onApply?: (result: OCRResult) => void;
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
  const { t } = useTranslation();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null);
  const [originalSizeStr, setOriginalSizeStr] = useState<string>("2.3 MB");
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
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${(file.size / 1024).toFixed(0)} KB`;
      setOriginalSizeStr(sizeStr);
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
    setOriginalSizeStr("2.3 MB");
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
          "relative flex flex-col items-center justify-center gap-3 rounded-doodle border-[3px] border-dashed border-black p-8 text-center transition-all cursor-pointer",
          isDragActive
            ? "border-black bg-pastel-blue"
            : "border-black bg-[#fffdf0] hover:bg-[#fff9d0]",
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
              <p className="text-sm sm:text-lg font-bold text-black tracking-wide">
                {isDragActive ? t.uploadDragActive : t.uploadDragDrop}
              </p>
              <p className="mt-0.5 text-[10px] sm:text-xs text-gray-600 font-bold">
                {t.uploadIdleHint}
              </p>
            </div>
          </>
        )}

        {uploadState === "compressing" && (
          <StatusRow icon={<Loader2 className="h-6 w-6 animate-spin text-black" strokeWidth={2.5} />}>
            {t.uploadCompressingState}
          </StatusRow>
        )}

        {uploadState === "uploading" && (
          <StatusRow icon={<Loader2 className="h-6 w-6 animate-spin text-black" strokeWidth={2.5} />}>
            {t.uploadUploadingState}
          </StatusRow>
        )}

        {uploadState === "done" && (
          <div className="flex flex-col items-center gap-1 text-center w-full">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-black" strokeWidth={2.5} />
              <span className="text-black font-bold text-lg">{t.uploadDoneState}</span>
            </div>
            {fileName && (
              <span className="text-xs text-gray-700 font-bold truncate max-w-full px-4">
                {fileName}
              </span>
            )}
          </div>
        )}

        {uploadState === "error" && (
          <StatusRow icon={<AlertCircle className="h-6 w-6 text-black" strokeWidth={2.5} />}>
            <span className="text-black font-bold text-lg">{t.uploadFailedState}</span>
            <span className="ml-1.5 text-xs text-gray-700 font-bold">
              {t.uploadFailedHint}
            </span>
          </StatusRow>
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
          <span className="font-bold">{ocrMutation.error.message ?? t.uploadOcrFailed}</span>
        </div>
      )}

      {/* Reset link (shown after done or error) */}
      {(uploadState === "done" || uploadState === "error") && (
        <button
          type="button"
          onClick={handleReset}
          className="text-sm font-bold text-gray-600 hover:text-black underline underline-offset-4 decoration-2"
        >
          {t.uploadDifferentReceipt}
        </button>
      )}

      {(uploadState === "compressing" || uploadState === "uploading") && (
        <OCROverlay uploadState={uploadState} />
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
