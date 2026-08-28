"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function PromoCard() {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setMounted(true);
    const dismissed = sessionStorage.getItem("promoCardClosed_v2") === "true";
    if (dismissed) {
      setIsDismissed(true);
    } else {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    sessionStorage.setItem("promoCardClosed_v2", "true");
    setTimeout(() => setIsDismissed(true), 400); // Match animation duration
  };

  if (!mounted || isDismissed) return null;

  return (
    <div
      className={cn(
        "fixed z-[100] p-4 flex flex-col",
        "bg-[var(--color-surface)] border border-[var(--color-brand)]/50 rounded-2xl shadow-[var(--shadow-xl)] shadow-black/50",
        "bottom-[12px] left-[12px] right-[12px] w-[calc(100%-24px)]",
        "md:bottom-6 md:right-6 md:left-auto md:w-[380px]",
        "transition-all duration-[400ms] ease-out",
        isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-8 opacity-0 pointer-events-none motion-reduce:translate-x-0"
      )}
      role="dialog"
      aria-label="Åbningstilbud"
    >
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-light)] rounded-md p-1"
        aria-label="Luk"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-start gap-4 mb-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 border border-[var(--color-brand)]/30 mt-1">
          <Image
            src="/images/promo-image.png"
            alt="Frisør ejer med saks"
            fill
            className="object-cover"
            sizes="56px"
          />
        </div>
        <div className="pr-6">
          <div className="text-[10px] font-bold text-[var(--color-brand-light)] tracking-widest uppercase mb-1">
            ÅBNINGSTILBUD
          </div>
          <h3 className="text-[1.15rem] font-heading text-white leading-tight mb-1">
            Ny kunde?
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">
            Herreklip kun 150 kr.
          </p>
        </div>
      </div>

      <Button
        href="/booking?service=herreklip"
        variant="primary"
        size="md"
        className="w-full text-sm h-10 shadow-md"
      >
        BOOK TIL 150 KR.
      </Button>
      <div className="text-[10px] text-[var(--color-text-muted)] text-center mt-2 font-medium">
        Kun for nye kunder.
      </div>
    </div>
  );
}
