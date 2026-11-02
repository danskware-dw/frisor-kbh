"use client";

import { useEffect, useRef, useState } from "react";
import {
  CONSENT_CHANGE_EVENT,
  CONSENT_STORAGE_KEY,
  OPEN_CONSENT_SETTINGS_EVENT,
  getConsent,
  readConsent,
  saveConsent,
  type Consent,
} from "@/lib/consent";

const buttonClass = "min-h-11 cursor-pointer rounded-lg border border-white/30 bg-white/10 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-light)]";
const categories = [
  { key: "necessary", label: "Nødvendige", description: "Sikrer, at hjemmesiden fungerer, og gemmer dit cookievalg. Altid aktive." },
  { key: "statistics", label: "Statistik", description: "Giver os indsigt i, hvordan hjemmesiden bliver brugt." },
  { key: "marketing", label: "Marketing", description: "Bruges til at tilpasse annoncer og måle deres effekt." },
] as const;

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draft, setDraft] = useState<Consent>({ statistics: false, marketing: false });
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  function openSettings() {
    previousFocus.current = document.activeElement as HTMLElement | null;
    setDraft(getConsent());
    setShowSettings(true);
  }

  function closeSettings() {
    setShowSettings(false);
    previousFocus.current?.focus();
  }

  useEffect(() => {
    const sync = () => setShowBanner(readConsent() === null);
    const onStorage = (event: StorageEvent) => {
      if (event.key === CONSENT_STORAGE_KEY || event.key === null) {
        window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: getConsent() }));
      }
    };
    // Synchronize browser-only persistence after hydration.
    sync();
    window.addEventListener(OPEN_CONSENT_SETTINGS_EVENT, openSettings);
    window.addEventListener(CONSENT_CHANGE_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(OPEN_CONSENT_SETTINGS_EVENT, openSettings);
      window.removeEventListener(CONSENT_CHANGE_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (showSettings) headingRef.current?.focus();
  }, [showSettings]);

  function choose(choice: Consent) {
    saveConsent(choice);
    setShowBanner(false);
    if (showSettings) closeSettings();
  }

  if (!showBanner && !showSettings) return null;

  return (
    <section
      role={showSettings ? "dialog" : "region"}
      aria-labelledby="cookie-consent-title"
      aria-describedby="cookie-consent-description"
      onKeyDown={(event) => {
        if (showSettings && event.key === "Escape") {
          event.preventDefault();
          closeSettings();
        }
      }}
      className="fixed inset-x-3 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-50 max-h-[calc(100dvh-12rem-env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain rounded-2xl border border-white/20 bg-[var(--color-surface)] p-4 text-white shadow-2xl md:inset-x-auto md:bottom-5 md:left-5 md:w-[32rem] md:max-w-[calc(100vw-2.5rem)] md:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <h2 id="cookie-consent-title" ref={headingRef} tabIndex={-1} className="text-lg font-semibold focus:outline-none">
          {showSettings ? "Cookieindstillinger" : "Dit valg af cookies"}
        </h2>
        {showSettings && <button type="button" onClick={closeSettings} className={`${buttonClass} shrink-0`} aria-label="Luk cookieindstillinger">Luk</button>}
      </div>
      <p id="cookie-consent-description" className="mt-2 text-sm leading-relaxed text-gray-300">
        Vi bruger nødvendige cookies for at få hjemmesiden til at fungere. Du vælger selv, om du vil tillade statistik og marketing. Dit valg gemmes i 6 måneder og kan ændres via Cookieindstillinger nederst på siden.
      </p>
      {showSettings && (
        <div className="mt-4 divide-y divide-white/15">
          {categories.map(({ key, label, description }) => {
            const necessary = key === "necessary";
            const checked = necessary || draft[key];
            return (
              <div key={key} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p id={`cookie-${key}-label`} className="text-sm font-semibold">{label}</p>
                  <p id={`cookie-${key}-description`} className="mt-1 text-sm leading-relaxed text-gray-300">{description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  aria-labelledby={`cookie-${key}-label`}
                  aria-describedby={`cookie-${key}-description`}
                  disabled={necessary}
                  onClick={() => { if (!necessary) setDraft(current => ({ ...current, [key]: !current[key] })); }}
                  className="flex min-h-11 min-w-14 shrink-0 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand-light)] disabled:cursor-not-allowed"
                >
                  <span aria-hidden="true" className={`flex h-7 w-12 items-center rounded-full border p-0.5 ${checked ? "border-[var(--color-brand-light)] bg-[var(--color-brand)]" : "border-gray-400 bg-gray-700"}`}>
                    <span className={`h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-5" : "translate-x-0"}`} />
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button type="button" className={buttonClass} onClick={() => choose({ statistics: true, marketing: true })}>Accepter alle</button>
        <button type="button" className={buttonClass} onClick={() => choose({ statistics: false, marketing: false })}>Afvis alle</button>
        {showSettings ? (
          <button type="button" className={`${buttonClass} col-span-2`} onClick={() => choose(draft)}>Gem indstillinger</button>
        ) : (
          <button type="button" className={`${buttonClass} col-span-2`} onClick={openSettings}>Indstillinger</button>
        )}
      </div>
    </section>
  );
}
