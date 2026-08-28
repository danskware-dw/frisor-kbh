"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const PROMO_STORAGE_KEY = "promoCardClosed_v2";
const PROMO_VISIBILITY_EVENT = "promo-card-visibility";

export function PromoCard() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let dismissed = false;

    try {
      dismissed = sessionStorage.getItem(PROMO_STORAGE_KEY) === "true";
    } catch {
      // The promotion can still work when browser storage is unavailable.
    }

    if (dismissed) {
      const timer = window.setTimeout(() => setIsDismissed(true), 0);
      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => setIsVisible(true), 2000);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const visible = isVisible && !isDismissed;
    window.dispatchEvent(
      new CustomEvent(PROMO_VISIBILITY_EVENT, { detail: { visible } })
    );

    return () => {
      if (visible) {
        window.dispatchEvent(
          new CustomEvent(PROMO_VISIBILITY_EVENT, {
            detail: { visible: false },
          })
        );
      }
    };
  }, [isDismissed, isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(PROMO_STORAGE_KEY, "true");
    } catch {
      // Dismiss for this page view even when browser storage is unavailable.
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    window.setTimeout(() => setIsDismissed(true), reduceMotion ? 0 : 400);
  };

  if (isDismissed) return null;

  return (
    <aside
      className={cn(
        "fixed z-[100] flex flex-col p-3 md:p-4",
        "rounded-2xl border border-[var(--color-brand)]/50 bg-[var(--color-surface)] shadow-[var(--shadow-xl)] shadow-black/50",
        "bottom-[max(12px,env(safe-area-inset-bottom))] left-3 right-3",
        "md:bottom-6 md:left-auto md:right-6 md:w-[380px]",
        "transition-[opacity,transform] duration-[400ms] ease-out motion-reduce:transition-none",
        isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-8 opacity-0 pointer-events-none motion-reduce:translate-x-0"
      )}
      aria-labelledby="promo-card-title"
      aria-describedby="promo-card-offer promo-card-condition"
      aria-hidden={!isVisible}
    >
      <button
        type="button"
        onClick={handleClose}
        className="absolute right-1.5 top-1.5 inline-flex h-11 w-11 items-center justify-center rounded-lg text-[var(--color-text-muted)] transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-light)]"
        aria-label="Luk åbningstilbud"
        tabIndex={isVisible ? undefined : -1}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <div className="mb-3 flex items-start gap-4 md:mb-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border border-[var(--color-brand)]/30 mt-1">
          <Image
            src="/images/pensionist-saks-customer-owner.png"
            alt=""
            fill
            className="origin-[88%_20%] scale-[2.6] object-cover"
            sizes="56px"
          />
        </div>
        <div className="pr-8">
          <div className="text-[10px] font-bold text-[var(--color-brand-light)] tracking-widest uppercase mb-1">
            ÅBNINGSTILBUD
          </div>
          <h2
            id="promo-card-title"
            className="mb-1 font-heading text-[1.15rem] leading-tight text-white"
          >
            Ny kunde?
          </h2>
          <p
            id="promo-card-offer"
            className="text-sm text-[var(--color-text-muted)]"
          >
            Herreklip kun 150 kr.
          </p>
        </div>
      </div>

      <Button
        href="/booking?service=herreklip"
        variant="primary"
        size="md"
        className="w-full text-sm h-10 shadow-md"
        tabIndex={isVisible ? undefined : -1}
      >
        BOOK TIL 150 KR.
      </Button>
      <p
        id="promo-card-condition"
        className="mt-1.5 text-center text-[10px] font-medium text-[var(--color-text-muted)] md:mt-2"
      >
        Kun for nye kunder.
      </p>
    </aside>
  );
}
