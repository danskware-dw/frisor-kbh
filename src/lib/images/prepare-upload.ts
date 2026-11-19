const MAX_IMAGE_DIMENSION = 1600;
const TARGET_IMAGE_BYTES = 450 * 1024;

/** Resize and encode admin uploads before they are sent to Supabase Storage. */
export async function prepareImageUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (typeof createImageBitmap !== "function") return file;

  const bitmap = await createImageBitmap(file);
  try {
    if (
      Math.max(bitmap.width, bitmap.height) <= MAX_IMAGE_DIMENSION &&
      file.size <= TARGET_IMAGE_BYTES
    ) {
      return file;
    }

    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Billedet kunne ikke behandles i browseren.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let blob: Blob | null = null;
    for (const quality of [0.82, 0.74, 0.66, 0.58]) {
      blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", quality));
      if (!blob) break;
      if (blob.type !== "image/webp") {
        blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
        break;
      }
      if (blob.size <= TARGET_IMAGE_BYTES) break;
    }
    if (!blob) throw new Error("Billedet kunne ikke komprimeres.");

    const extension = blob.type === "image/webp" ? "webp" : "jpg";
    return new File([blob], file.name.replace(/\.[^.]+$/, `.${extension}`), {
      type: blob.type,
      lastModified: file.lastModified,
    });
  } finally {
    bitmap.close();
  }
}
