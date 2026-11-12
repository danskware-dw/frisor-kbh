"use client";

import Script from "next/script";
import { useEffect } from "react";
import { CONSENT_CHANGE_EVENT, CONSENT_STORAGE_KEY, getConsent, type Consent } from "@/lib/consent";

declare global { interface Window { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void } }
const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

export function updateGoogleConsent(consent: Consent) {
  window.gtag?.("consent", "update", {
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
    analytics_storage: consent.statistics ? "granted" : "denied",
  });
}

export function GoogleAds() {
  useEffect(() => {
    const saved = getConsent();
    updateGoogleConsent(saved);
    const onConsent = (event: Event) => updateGoogleConsent((event as CustomEvent<Consent>).detail);
    const onStorage = (event: StorageEvent) => {
      if (event.key === CONSENT_STORAGE_KEY || event.key === null) updateGoogleConsent(getConsent());
    };
    window.addEventListener(CONSENT_CHANGE_EVENT, onConsent);
    window.addEventListener("storage", onStorage);
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest("a[href]");
      const href = link?.getAttribute("href") || "";
      if (href.startsWith("tel:")) window.gtag?.("event", "phone_click");
      else if (/maps|google\.[^/]+\/maps|directions/i.test(href)) window.gtag?.("event", "directions_click");
    };
    document.addEventListener("click", onClick);
    return () => { window.removeEventListener(CONSENT_CHANGE_EVENT, onConsent); window.removeEventListener("storage", onStorage); document.removeEventListener("click", onClick); };
  }, []);
  if (!adsId || !/^AW-\d+$/.test(adsId)) return null;
  return <>
    <Script id="google-ads-consent-defaults" strategy="beforeInteractive">{`window.dataLayer=window.dataLayer||[];window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};window.gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:500});window.gtag('set','ads_data_redaction',true);window.gtag('set','url_passthrough',true);window.gtag('js',new Date());window.gtag('config','${adsId}');`}</Script>
    <Script src={`https://www.googletagmanager.com/gtag/js?id=${adsId}`} strategy="afterInteractive" />
  </>;
}

export function trackConversion(id: string, price: string | number) {
  const label = process.env.NEXT_PUBLIC_GOOGLE_ADS_BOOKING_LABEL;
  if (!adsId || !label || !id || typeof window === "undefined" || !getConsent().marketing) return;
  const key = "frisor-kbh-google-ads-bookings";
  let fired: string[] = [];
  try { fired = JSON.parse(sessionStorage.getItem(key) || "[]"); } catch {}
  if (fired.includes(id)) return;
  fired.push(id);
  try { sessionStorage.setItem(key, JSON.stringify(fired)); } catch {}
  const value = Number(String(price).replace(/[^\d,.-]/g, "").replace(",", "."));
  if (!Number.isFinite(value)) return;
  window.gtag?.("event", "conversion", { send_to: `${adsId}/${label}`, value, currency: "DKK", transaction_id: id });
}
