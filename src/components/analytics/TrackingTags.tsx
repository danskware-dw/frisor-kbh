"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { CONSENT_CHANGE_EVENT } from "@/lib/consent";
import { createTracking } from "@/lib/tracking";

// Public values are inlined by Next.js at build time. No tags are enabled by default.
const tracking = createTracking({
  googleTagId: process.env.NEXT_PUBLIC_GOOGLE_TAG_ID,
  googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID,
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID,
});

export function TrackingTags() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    window.addEventListener(CONSENT_CHANGE_EVENT, tracking.sync);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, tracking.sync);
  }, []);

  useEffect(() => {
    tracking.sync();
  }, [pathname, searchParams]);

  return null;
}
