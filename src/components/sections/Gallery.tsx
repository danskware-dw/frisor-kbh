"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { ChevronLeft, ChevronRight, Play, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GalleryItem } from "@/types/site";

function getVideoPreviewSource(src: string) {
  return `${src.split("#", 1)[0]}#t=0.1`;
}

export function Gallery({ items }: { items: GalleryItem[] }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  const galleryContentRef = useRef<HTMLDivElement>(null);
  const lastTriggerRef = useRef<HTMLButtonElement>(null);

  const isOpen = lightboxIndex !== null;
  const total = items.length;
  const currentItem = lightboxIndex !== null ? items[lightboxIndex] : null;

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
    requestAnimationFrame(() => lastTriggerRef.current?.focus());
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) return;
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") {
        setLightboxIndex((previous) =>
          previous !== null ? (previous + 1) % total : 0
        );
      }
      if (event.key === "ArrowLeft") {
        setLightboxIndex((previous) =>
          previous !== null ? (previous - 1 + total) % total : total - 1
        );
      }
    },
    [closeLightbox, isOpen, total]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    const galleryContent = galleryContentRef.current;
    if (galleryContent) {
      galleryContent.inert = isOpen;
      if (isOpen) galleryContent.setAttribute("aria-hidden", "true");
      else galleryContent.removeAttribute("aria-hidden");
    }

    if (!isOpen || !dialogRef.current) {
      return () => {
        document.body.style.overflow = "";
      };
    }

    const dialog = dialogRef.current;
    const focusableElements = Array.from(
      dialog.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      )
    );
    focusableElements[0]?.focus();

    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || focusableElements.length === 0) return;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    dialog.addEventListener("keydown", trapFocus);
    return () => {
      dialog.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = "";
      if (galleryContent) {
        galleryContent.inert = false;
        galleryContent.removeAttribute("aria-hidden");
      }
    };
  }, [isOpen]);

  return (
    <section id="gallery" className="bg-[var(--color-background)] py-20 md:py-28">
      <div ref={galleryContentRef}>
        <Container>
          <ScrollReveal>
            <SectionHeading subtitle="Vores arbejde" title="Galleri" centered />
          </ScrollReveal>

          <ScrollReveal
            stagger
            className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 md:gap-6 lg:grid-cols-3"
          >
            {items.length === 0 ? (
              <div className="col-span-full rounded-xl border border-white/[0.08] bg-[var(--color-surface)] px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">
                Nye billeder kommer snart.
              </div>
            ) : null}
            {items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={(event) => {
                  lastTriggerRef.current = event.currentTarget;
                  setLightboxIndex(index);
                }}
                aria-label={`Åbn ${item.mediaType === "video" ? "video" : "billede"}: ${item.alt}`}
                className={cn(
                  "group relative aspect-square cursor-pointer overflow-hidden rounded-xl border border-white/[0.08] bg-[var(--color-surface)]",
                  "transition-[transform,border-color,box-shadow] duration-300 hover:border-white/[0.2] hover:shadow-[var(--shadow-lg)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-light)]"
                )}
              >
                {item.mediaType === "video" ? (
                  <video
                    src={getVideoPreviewSource(item.src)}
                    aria-label={item.alt}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={(event) => {
                      const video = event.currentTarget;
                      if (video.duration > 0 && video.currentTime < 0.1) {
                        video.currentTime = Math.min(0.1, video.duration / 2);
                      }
                    }}
                  />
                ) : !imgErrors[item.id] ? (
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    unoptimized={item.src.startsWith("http")}
                    onError={() =>
                      setImgErrors((previous) => ({ ...previous, [item.id]: true }))
                    }
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-[var(--color-text-muted)] opacity-40">
                    <ZoomIn className="h-8 w-8" aria-hidden="true" />
                    <span className="text-center text-xs">{item.alt}</span>
                  </div>
                )}

                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center rounded-xl transition-[opacity,background-color] duration-300 group-hover:bg-black/50 group-hover:opacity-100 group-focus-visible:bg-black/50 group-focus-visible:opacity-100",
                    item.mediaType === "video"
                      ? "bg-black/15 opacity-100"
                      : "bg-black/50 opacity-0 backdrop-blur-[2px]"
                  )}
                >
                  <span className="flex items-center gap-2 rounded-lg border border-white/30 bg-black/30 px-5 py-2.5 text-sm font-medium uppercase tracking-widest text-white">
                    {item.mediaType === "video" ? (
                      <Play className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <ZoomIn className="h-4 w-4" aria-hidden="true" />
                    )}
                    {item.mediaType === "video" ? "Afspil" : "Vis stort"}
                  </span>
                </div>
              </button>
            ))}
          </ScrollReveal>
        </Container>
      </div>

      {isOpen && currentItem ? (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Galleri: ${currentItem.alt}`}
          className="fixed inset-0 z-[100] flex items-center justify-center overscroll-contain"
          onClick={closeLightbox}
          tabIndex={-1}
        >
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md" aria-hidden="true" />

          <button
            type="button"
            onClick={closeLightbox}
            aria-label="Luk galleri"
            className="glass-card absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-20 flex h-11 w-11 items-center justify-center rounded-full text-white transition-[color,box-shadow] hover:text-[var(--color-brand-light)] hover:shadow-[0_0_20px_var(--color-brand-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-light)]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxIndex((previous) =>
                previous !== null ? (previous - 1 + total) % total : total - 1
              );
            }}
            aria-label="Forrige medie"
            className="glass-card absolute left-2 z-20 flex h-11 w-11 items-center justify-center rounded-full text-white transition-[color,box-shadow] hover:text-[var(--color-brand-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-light)] sm:left-4"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setLightboxIndex((previous) =>
                previous !== null ? (previous + 1) % total : 0
              );
            }}
            aria-label="Næste medie"
            className="glass-card absolute right-2 z-20 flex h-11 w-11 items-center justify-center rounded-full text-white transition-[color,box-shadow] hover:text-[var(--color-brand-light)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-light)] sm:right-4"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>

          <div
            className="relative z-10 mx-12 max-h-[82vh] w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 shadow-2xl sm:mx-16"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative aspect-square md:aspect-video">
              {currentItem.mediaType === "video" ? (
                <video
                  key={currentItem.id}
                  src={currentItem.src}
                  aria-label={currentItem.alt}
                  className="h-full w-full bg-black object-contain"
                  controls
                  autoPlay
                  playsInline
                  preload="metadata"
                />
              ) : !imgErrors[currentItem.id] ? (
                <Image
                  src={currentItem.src}
                  alt={currentItem.alt}
                  fill
                  sizes="(max-width: 1024px) 90vw, 900px"
                  className="object-cover"
                  priority
                  unoptimized={currentItem.src.startsWith("http")}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                  <ZoomIn className="h-12 w-12 opacity-40" aria-hidden="true" />
                  <p className="text-sm">{currentItem.alt}</p>
                </div>
              )}
            </div>

            {currentItem.caption ? (
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/90 to-transparent p-4 sm:p-6">
                <p className="text-base font-medium text-white sm:text-lg">
                  {currentItem.caption}
                </p>
                <span className="text-sm tabular-nums text-white/70">
                  {lightboxIndex + 1} / {total}
                </span>
              </div>
            ) : null}
          </div>

          <div className="absolute bottom-[calc(.5rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex -translate-x-1/2">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setLightboxIndex(index);
                }}
                aria-label={`Gå til medie ${index + 1}`}
                aria-current={index === lightboxIndex ? "true" : undefined}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full"
              >
                <span
                  className={cn(
                    "h-2 rounded-full transition-[width,background-color] duration-200",
                    index === lightboxIndex
                      ? "w-5 bg-[var(--color-brand-light)]"
                      : "w-2 bg-white/50"
                  )}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
