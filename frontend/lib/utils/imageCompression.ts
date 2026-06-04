import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS: Parameters<typeof imageCompression>[1] = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  fileType: "image/webp",
  useWebWorker: true,
};

/**
 * Compress a receipt image and convert it to WebP format.
 * Returns the compressed WebP File ready for upload.
 */
export async function compressReceiptImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);

  // Ensure the returned object is a proper File with a .webp extension
  const originalName = file.name.replace(/\.[^.]+$/, "");
  return new File([compressed], `${originalName}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

export interface CompressionStats {
  originalKB: number;
  compressedKB: number;
  savingPercent: number;
}

/**
 * Calculate compression statistics between the original and compressed files.
 */
export function getCompressionStats(
  original: File,
  compressed: File
): CompressionStats {
  const originalKB = original.size / 1024;
  const compressedKB = compressed.size / 1024;
  const savingPercent =
    originalKB > 0
      ? Math.round(((originalKB - compressedKB) / originalKB) * 100)
      : 0;

  return { originalKB, compressedKB, savingPercent };
}
