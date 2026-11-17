"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Save, Trash2 } from "lucide-react";
import {
  deleteGalleryImage,
  reorderGalleryImages,
  setGalleryImageVisibility,
  updateGalleryImage,
} from "@/app/admin/gallery/actions";

export type ManagedGalleryImage = {
  id: string;
  url: string;
  mediaType: string;
  altText: string;
  caption: string;
  active: boolean;
  sortOrder: number;
};

function GalleryCard({
  image,
  index,
  total,
  onMove,
}: {
  image: ManagedGalleryImage;
  index: number;
  total: number;
  onMove: (id: string, direction: -1 | 1) => Promise<void>;
}) {
  const router = useRouter();
  const [altText, setAltText] = useState(image.altText);
  const [caption, setCaption] = useState(image.caption);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<string | null>(null);

  const run = (action: () => Promise<{ success: boolean; error?: string; warning?: string }>) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await action();
      setFeedback(result.success ? result.warning || "Gemt." : result.error || "Handlingen mislykkedes.");
      if (result.success) router.refresh();
    });
  };

  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="relative aspect-[4/3] bg-gray-100">
        {image.mediaType === "video" ? (
          <video
            src={image.url}
            aria-label={image.altText || "Gallerivideo"}
            className="h-full w-full object-cover"
            controls
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <Image
            src={image.url}
            alt={image.altText || "Galleribillede"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        )}
        <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${image.active ? "bg-emerald-700" : "bg-gray-700"}`}>
          {image.active ? "Synlig" : "Skjult"}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
          {index + 1} / {total}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <label htmlFor={`alt-${image.id}`} className="text-xs font-semibold text-gray-700">Beskrivende tekst</label>
          <input
            id={`alt-${image.id}`}
            value={altText}
            onChange={(event) => setAltText(event.target.value)}
            maxLength={180}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            placeholder="Beskriv hvad mediet viser"
          />
        </div>
        <div>
          <label htmlFor={`caption-${image.id}`} className="text-xs font-semibold text-gray-700">Tekst</label>
          <input
            id={`caption-${image.id}`}
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            maxLength={120}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
            placeholder="Valgfri tekst i galleriet"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => run(() => updateGalleryImage(image.id, { altText, caption }))}
            disabled={isPending}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" /> Gem
          </button>
          <button
            type="button"
            onClick={() => run(() => setGalleryImageVisibility(image.id, !image.active))}
            disabled={isPending}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {image.active ? <EyeOff className="h-3.5 w-3.5" aria-hidden="true" /> : <Eye className="h-3.5 w-3.5" aria-hidden="true" />}
            {image.active ? "Skjul" : "Vis"}
          </button>
          <button
            type="button"
            onClick={() => onMove(image.id, -1)}
            disabled={isPending || index === 0}
            aria-label="Flyt mediet mod venstre"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-30"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onMove(image.id, 1)}
            disabled={isPending || index === total - 1}
            aria-label="Flyt mediet mod højre"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-30"
          >
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(`Slet “${caption || altText || "dette medie"}” permanent fra galleriet?`)) {
                run(() => deleteGalleryImage(image.id));
              }
            }}
            disabled={isPending}
            className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Slet
          </button>
        </div>
        {feedback ? <p className="text-xs text-gray-600" role="status">{feedback}</p> : null}
      </div>
    </article>
  );
}

export function GalleryManager({ images }: { images: ManagedGalleryImage[] }) {
  const router = useRouter();
  const [orderedImages, setOrderedImages] = useState(images);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const moveImage = async (id: string, direction: -1 | 1) => {
    const currentIndex = orderedImages.findIndex((image) => image.id === id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedImages.length) return;

    const previous = orderedImages;
    const next = [...orderedImages];
    [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
    setOrderedImages(next);
    setReorderError(null);

    const result = await reorderGalleryImages(next.map((image) => image.id));
    if (!result.success) {
      setOrderedImages(previous);
      setReorderError(result.error || "Rækkefølgen kunne ikke gemmes.");
      return;
    }
    router.refresh();
  };

  if (orderedImages.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <p className="text-sm text-gray-500">Du har ikke uploadet billeder eller videoer endnu.</p>
      </div>
    );
  }

  return (
    <div>
      {reorderError ? <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">{reorderError}</p> : null}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {orderedImages.map((image, index) => (
          <GalleryCard
            key={image.id}
            image={image}
            index={index}
            total={orderedImages.length}
            onMove={moveImage}
          />
        ))}
      </div>
    </div>
  );
}
