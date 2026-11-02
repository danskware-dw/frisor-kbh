import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { CONSENT_STORAGE_KEY, getConsent, readConsent, saveConsent } from "../src/lib/consent";

let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: Object.assign(new EventTarget(), {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    }),
  });
});
afterEach(() => { Reflect.deleteProperty(globalThis, "window"); });

test("unknown, corrupt and expired choices deny optional categories", () => {
  assert.deepEqual(getConsent(), { statistics: false, marketing: false });
  assert.equal(readConsent(), null);
  for (const value of ["broken", "null", JSON.stringify({ statistics: "yes", marketing: true, expiresAt: Date.now() + 10000 }), JSON.stringify({ statistics: true, marketing: true, expiresAt: Date.now() - 1 })]) {
    values.set(CONSENT_STORAGE_KEY, value);
    assert.equal(readConsent(), null);
    assert.deepEqual(getConsent(), { statistics: false, marketing: false });
  }
});

test("a choice lasts six calendar months and expires at the boundary", () => {
  const now = Date.UTC(2026, 7, 31, 12);
  saveConsent({ statistics: true, marketing: false }, now);
  const stored = JSON.parse(values.get(CONSENT_STORAGE_KEY)!);
  assert.equal(stored.expiresAt, Date.UTC(2027, 1, 28, 12));
  assert.deepEqual(readConsent(stored.expiresAt - 1), stored);
  assert.equal(readConsent(stored.expiresAt), null);
});

test("saving and withdrawing consent updates the helper and fires consentchange", () => {
  const changes: unknown[] = [];
  window.addEventListener("consentchange", event => changes.push((event as CustomEvent).detail));
  saveConsent({ statistics: true, marketing: true });
  assert.deepEqual(getConsent(), { statistics: true, marketing: true });
  saveConsent({ statistics: false, marketing: false });
  assert.deepEqual(getConsent(), { statistics: false, marketing: false });
  assert.deepEqual(changes, [{ statistics: true, marketing: true }, { statistics: false, marketing: false }]);
  assert.notEqual(readConsent(), null, "rejecting is a saved choice too");
});

test("server-side access safely defaults to no consent", () => {
  Reflect.deleteProperty(globalThis, "window");
  assert.deepEqual(getConsent(), { statistics: false, marketing: false });
});

test("blocked storage still allows a choice for this page session", () => {
  Object.defineProperty(window, "localStorage", { get() { throw new Error("blocked"); } });
  assert.doesNotThrow(() => saveConsent({ statistics: true, marketing: false }));
  assert.deepEqual(getConsent(), { statistics: true, marketing: false });
});
