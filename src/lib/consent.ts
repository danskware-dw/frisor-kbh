export type Consent = { statistics: boolean; marketing: boolean };
type StoredConsent = Consent & { expiresAt: number };

export const CONSENT_STORAGE_KEY = "frisor-kbh-consent";
export const CONSENT_CHANGE_EVENT = "consentchange";
export const OPEN_CONSENT_SETTINGS_EVENT = "openconsentsettings";
const denied: Consent = { statistics: false, marketing: false };
let sessionChoice: StoredConsent | null = null;

/** Returns null until a valid, unexpired choice has been saved. */
export function readConsent(now = Date.now()): StoredConsent | null {
  if (typeof window === "undefined") return null;
  let value: unknown;
  try {
    const raw = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    value = raw ? JSON.parse(raw) : null;
  } catch {
    value = sessionChoice;
  }
  if (!value || typeof value !== "object") return null;
  const saved = value as Partial<StoredConsent>;
  if (
    typeof saved.statistics !== "boolean" ||
    typeof saved.marketing !== "boolean" ||
    typeof saved.expiresAt !== "number" ||
    !Number.isFinite(saved.expiresAt) || saved.expiresAt <= now
  ) return null;
  return { statistics: saved.statistics, marketing: saved.marketing, expiresAt: saved.expiresAt };
}

/** Optional categories are denied before consent, after expiry, and on the server. */
export function getConsent(): Consent {
  const saved = readConsent();
  return saved ? { statistics: saved.statistics, marketing: saved.marketing } : { ...denied };
}

/** Saves six calendar months; consentchange.detail contains the new Consent. */
export function saveConsent(choice: Consent, now = Date.now()): void {
  if (typeof window === "undefined") return;
  const expiry = new Date(now);
  const day = expiry.getUTCDate();
  expiry.setUTCDate(1);
  expiry.setUTCMonth(expiry.getUTCMonth() + 6);
  const lastDay = new Date(Date.UTC(expiry.getUTCFullYear(), expiry.getUTCMonth() + 1, 0)).getUTCDate();
  expiry.setUTCDate(Math.min(day, lastDay));
  const consent = { statistics: choice.statistics, marketing: choice.marketing };
  const saved = { ...consent, expiresAt: expiry.getTime() };
  sessionChoice = saved;
  try {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(saved));
  } catch {
    // Keep the current page usable when the browser blocks persistent storage.
  }
  window.dispatchEvent(new CustomEvent<Consent>(CONSENT_CHANGE_EVENT, { detail: consent }));
}
