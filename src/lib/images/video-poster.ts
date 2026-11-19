const POSTER_MAX_DIMENSION = 960;

/**
 * Each gallery video gets a small still image stored next to it
 * (`uploads/<id>.mp4` → `uploads/<id>.poster.webp`). The gallery grid shows this
 * still instead of a <video>, so visitors download no video bytes until they press play.
 */
export function getVideoPosterPath(videoPathOrUrl: string) {
  return videoPathOrUrl.split(/[?#]/, 1)[0].replace(/\.[^./]+$/, ".poster.webp");
}

/** Capture one frame of a local video file in the browser and encode it as WebP. */
export async function createVideoPoster(file: File): Promise<File | null> {
  if (typeof document === "undefined") return null;
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.src = objectUrl;

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("timeout")), 15000);
      video.addEventListener("loadeddata", () => {
        video.currentTime = Math.min(0.5, (video.duration || 1) / 2);
      }, { once: true });
      video.addEventListener("seeked", () => { window.clearTimeout(timeout); resolve(); }, { once: true });
      video.addEventListener("error", () => { window.clearTimeout(timeout); reject(new Error("decode")); }, { once: true });
    });

    const scale = Math.min(1, POSTER_MAX_DIMENSION / Math.max(video.videoWidth, video.videoHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.78));
    if (!blob || blob.type !== "image/webp") return null;
    return new File([blob], "poster.webp", { type: "image/webp" });
  } catch {
    // A poster is a nice-to-have; the upload continues without one.
    return null;
  } finally {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}
