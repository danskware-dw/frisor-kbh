"use client";

import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/data/site";
import { cn } from "@/lib/utils";

const PROMO_VISIBILITY_EVENT = "promo-card-visibility";

export function FloatingBookingButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPromoVisible, setIsPromoVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(!entry.isIntersecting),
      { threshold: 0.12 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handlePromoVisibility = (event: Event) => {
      const { visible } = (event as CustomEvent<{ visible: boolean }>).detail;
      setIsPromoVisible(visible);
    };

    window.addEventListener(PROMO_VISIBILITY_EVENT, handlePromoVisibility);
    return () =>
      window.removeEventListener(PROMO_VISIBILITY_EVENT, handlePromoVisibility);
  }, []);

  const shouldShow = isVisible && !isPromoVisible;

  return (
    <div
      id="floating-booking-button"
      className={cn(
        "fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 md:hidden",
        "transition-[opacity,transform] duration-300",
        shouldShow
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-4 opacity-0"
      )}
    >
      <Button
        href={siteConfig.contact.bookingUrl}
        variant="primary"
        className="h-12 gap-2 rounded-full px-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
        aria-label="Book tid online"
        tabIndex={shouldShow ? undefined : -1}
      >
        <Calendar className="h-4 w-4" aria-hidden="true" />
        <span className="text-xs font-bold uppercase">Book tid</span>
      </Button>
    </div>
  );
}
