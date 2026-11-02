"use client";

import { OPEN_CONSENT_SETTINGS_EVENT } from "@/lib/consent";

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_CONSENT_SETTINGS_EVENT))}
      className="min-h-11 cursor-pointer underline underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-brand-light)]"
    >
      Cookieindstillinger
    </button>
  );
}
