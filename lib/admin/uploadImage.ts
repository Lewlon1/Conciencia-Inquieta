import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const BUCKET = "article-images";

/**
 * Validate a candidate image file before upload.
 * Returns a Spanish error message, or null when the file is acceptable.
 */
export function validateImageFile(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "El archivo debe ser una imagen.";
  }
  if (file.size > MAX_BYTES) {
    return "La imagen supera el límite de 10 MB.";
  }
  return null;
}

/**
 * Compress + downscale (when needed) and upload an image to Supabase Storage.
 * Runs in the browser (client component context).
 * Throws on upload error so the caller can surface it.
 */
export async function uploadArticleImage(
  file: File,
  opts?: { maxWidth?: number; quality?: number }
): Promise<{ url: string; path: string }> {
  const maxWidth = opts?.maxWidth ?? 1600;
  const quality = opts?.quality ?? 0.82;

  const supabase = createClient();

  // Animated GIFs must not be canvas-flattened (would lose animation) — upload as-is.
  const isGif = file.type === "image/gif";

  let blob: Blob = file;
  let extension = extensionFromName(file.name) ?? extensionFromMime(file.type) ?? "png";
  let contentType = file.type || "application/octet-stream";

  if (!isGif) {
    const compressed = await compressToWebp(file, maxWidth, quality);
    if (compressed) {
      blob = compressed;
      extension = "webp";
      contentType = "image/webp";
    }
    // On null (toBlob failed / decode failed) we fall back to the original file above.
  }

  const path = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    cacheControl: "3600",
    contentType,
    upsert: false,
  });

  if (error) {
    throw error;
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);

  return { url: data.publicUrl, path };
}

// ---------------------------------------------------------------------------
// Internal helpers (browser-only)
// ---------------------------------------------------------------------------

type DecodedImage = ImageBitmap | HTMLImageElement;

async function compressToWebp(
  file: File,
  maxWidth: number,
  quality: number
): Promise<Blob | null> {
  const image = await decodeImage(file);
  if (!image) {
    return null;
  }

  try {
    const srcWidth = imageWidth(image);
    const srcHeight = imageHeight(image);
    if (srcWidth <= 0 || srcHeight <= 0) {
      return null;
    }

    // Never upscale.
    const scale = srcWidth > maxWidth ? maxWidth / srcWidth : 1;
    const targetWidth = Math.max(1, Math.round(srcWidth * scale));
    const targetHeight = Math.max(1, Math.round(srcHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }
    ctx.drawImage(image, 0, 0, targetWidth, targetHeight);

    return await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/webp", quality);
    });
  } finally {
    if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) {
      image.close();
    }
  }
}

async function decodeImage(file: File): Promise<DecodedImage | null> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file);
    } catch {
      // Fall through to the <img> loader below.
    }
  }
  return decodeWithImageElement(file);
}

function decodeWithImageElement(file: File): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(null);
    };
    img.src = objectUrl;
  });
}

function imageWidth(image: DecodedImage): number {
  return "naturalWidth" in image ? image.naturalWidth : image.width;
}

function imageHeight(image: DecodedImage): number {
  return "naturalHeight" in image ? image.naturalHeight : image.height;
}

function extensionFromName(name: string): string | null {
  const match = /\.([a-z0-9]+)$/i.exec(name);
  return match ? match[1].toLowerCase() : null;
}

function extensionFromMime(mime: string): string | null {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/svg+xml": "svg",
  };
  return map[mime] ?? null;
}
