// src/lib/compress-image.ts
// Comprime imágenes en el navegador antes de subirlas a Firebase Storage.
// Objetivo: que cada foto pese ~100-300 KB en vez de varios MB, para que la
// carta cargue rápido y no se consuma ancho de banda de Storage.

import type { UploadMetadata } from "firebase/storage";

export type ImagePreset = "photo" | "logo" | "banner";

const PRESETS: Record<ImagePreset, { maxSide: number; quality: number }> = {
  photo: { maxSide: 1200, quality: 0.8 }, // fotos de platos
  banner: { maxSide: 1600, quality: 0.8 }, // carrusel / portada
  logo: { maxSide: 512, quality: 0.9 }, // logos (conservan transparencia)
};

// Las rutas de subida llevan Date.now(), así que el archivo nunca cambia:
// se puede cachear 1 año en el navegador y en la CDN.
const CACHE_CONTROL = "public, max-age=31536000, immutable";

// Formatos que no conviene tocar (animados o vectoriales).
const SKIP_TYPES = new Set(["image/gif", "image/svg+xml"]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/webp": "webp",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

async function loadImage(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      // algunos navegadores no aceptan opciones: se usa el fallback
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Redimensiona y recomprime una imagen. Devuelve el archivo listo para subir,
 * su extensión y la metadata (contentType + cacheControl) para Storage.
 * Si algo falla, o el resultado pesa más que el original, sube el original.
 */
export async function prepareImageForUpload(
  file: File,
  preset: ImagePreset = "photo"
): Promise<{ file: File; ext: string; metadata: UploadMetadata }> {
  const original = {
    file,
    ext: EXT_BY_TYPE[file.type] || file.name.split(".").pop() || "jpg",
    metadata: { contentType: file.type || undefined, cacheControl: CACHE_CONTROL },
  };

  if (typeof document === "undefined" || SKIP_TYPES.has(file.type)) {
    return original;
  }

  try {
    const { maxSide, quality } = PRESETS[preset];
    const source = await loadImage(file);
    const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return original;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(source, 0, 0, width, height);
    if ("close" in source && typeof source.close === "function") source.close();

    // WebP primero; si el navegador no lo genera, JPEG para fotos y PNG para logos.
    let blob = await canvasToBlob(canvas, "image/webp", quality);
    if (!blob || blob.type !== "image/webp") {
      blob =
        preset === "logo"
          ? await canvasToBlob(canvas, "image/png", 1)
          : await canvasToBlob(canvas, "image/jpeg", quality);
    }
    if (!blob || blob.size >= file.size) return original;

    const ext = EXT_BY_TYPE[blob.type] || "jpg";
    const baseName = file.name.replace(/\.[^.]+$/, "") || "imagen";
    return {
      file: new File([blob], `${baseName}.${ext}`, { type: blob.type }),
      ext,
      metadata: { contentType: blob.type, cacheControl: CACHE_CONTROL },
    };
  } catch (error) {
    console.warn("No se pudo comprimir la imagen, se sube la original:", error);
    return original;
  }
}
