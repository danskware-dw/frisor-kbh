import assert from "node:assert/strict";
import { beforeEach, afterEach, test } from "node:test";
import { saveConsent } from "../src/lib/consent";
import { createTracking } from "../src/lib/tracking";

let scripts: { src: string; async: boolean }[];
let queuedAtLoad: unknown[][];
const ids = { googleTagId: "G-TEST123", googleAdsId: "AW-123456", metaPixelId: "123456789" };
const googleCalls = () => (window.dataLayer ?? []).map(entry => Array.from(entry as IArguments));
const views = () => googleCalls().filter(call => call[0] === "event");

beforeEach(() => {
  scripts = [];
  queuedAtLoad = [];
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, "window", { configurable: true, value: Object.assign(new EventTarget(), {
    localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value) },
    location: { origin: "https://www.frisorkbh.dk", pathname: "/", search: "" },
  }) });
  Object.defineProperty(globalThis, "document", { configurable: true, value: {
    title: "FRISØR KBH", createElement: () => ({ src: "", async: false }),
    head: { appendChild: (script: { src: string; async: boolean }) => { scripts.push(script); queuedAtLoad = googleCalls(); } },
  } });
});
afterEach(() => {
  Reflect.deleteProperty(globalThis, "window");
  Reflect.deleteProperty(globalThis, "document");
});

test("Google defaults precede script loading; no Meta or page views before consent", () => {
  createTracking(ids).sync();
  assert.deepEqual(queuedAtLoad[0], ["consent", "default", {
    ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", analytics_storage: "denied", wait_for_update: 500,
  }]);
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /gtag\/js\?id=G-TEST123/);
  assert.equal(window.fbq, undefined);
  assert.equal(views().length, 0);
  assert.deepEqual(googleCalls().filter(c => c[0] === "config"), [
    ["config", ids.googleTagId, { send_page_view: false }],
    ["config", ids.googleAdsId, { send_page_view: false }],
  ]);
});

test("saved Statistics consent maps independently and tracks initial and SPA views once", () => {
  saveConsent({ statistics: true, marketing: false });
  const tracking = createTracking(ids);
  tracking.sync();
  tracking.sync();
  assert.deepEqual(googleCalls().find(c => c[1] === "update")?.[2], {
    analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied",
  });
  assert.equal(views().length, 1);
  assert.equal((views()[0][2] as { send_to: string }).send_to, ids.googleTagId);
  window.location.pathname = "/booking";
  window.location.search = "?service=herreklip";
  tracking.sync();
  assert.equal(views().length, 2);
  assert.equal((views()[1][2] as { page_location: string }).page_location, "https://www.frisorkbh.dk/booking?service=herreklip");
  assert.equal(window.fbq, undefined);
});

test("Marketing loads Meta once, grants consent and sends only marketing destinations", () => {
  saveConsent({ statistics: false, marketing: true });
  const tracking = createTracking(ids);
  tracking.sync();
  tracking.sync();
  assert.equal(scripts.filter(s => s.src.includes("fbevents.js")).length, 1);
  assert.deepEqual(googleCalls().find(c => c[1] === "update")?.[2], {
    analytics_storage: "denied", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted",
  });
  assert.equal(views().length, 1);
  assert.equal((views()[0][2] as { send_to: string }).send_to, ids.googleAdsId);
  assert.equal(window.fbq!.queue.filter(c => c[0] === "init").length, 1);
  assert.equal(window.fbq!.queue.filter(c => c[1] === "PageView").length, 1);
  assert.ok(window.fbq!.queue.some(c => c[0] === "consent" && c[1] === "grant"));
});

test("withdrawal revokes Meta, removes pending views and stops subsequent route events", () => {
  const tracking = createTracking(ids);
  saveConsent({ statistics: true, marketing: true });
  tracking.sync();
  saveConsent({ statistics: false, marketing: false });
  tracking.sync();
  assert.ok(window.fbq!.queue.some(c => c[0] === "consent" && c[1] === "revoke"));
  assert.equal(window.fbq!.queue.filter(c => c[1] === "PageView").length, 0);
  const count = views().length;
  window.location.pathname = "/booking";
  tracking.sync();
  assert.equal(views().length, count);
  assert.equal(window.fbq!.queue.filter(c => c[1] === "PageView").length, 0);
  saveConsent({ statistics: false, marketing: true });
  tracking.sync();
  assert.equal(scripts.length, 2);
  assert.equal(window.fbq!.queue.filter(c => c[1] === "PageView").length, 1);
});

test("loaded Meta receives revoke and no further PageView after withdrawal", () => {
  const tracking = createTracking(ids);
  saveConsent({ statistics: true, marketing: true });
  tracking.sync();
  const calls: unknown[][] = [];
  window.fbq!.callMethod = (...args) => calls.push(args);
  saveConsent({ statistics: true, marketing: false });
  tracking.sync();
  window.location.pathname = "/booking";
  tracking.sync();
  assert.deepEqual(calls, [["consent", "revoke"]]);
});

test("empty IDs skip only their tags; Ads works without GA4", () => {
  saveConsent({ statistics: true, marketing: true });
  createTracking({ googleTagId: "", googleAdsId: "", metaPixelId: "" }).sync();
  assert.equal(scripts.length, 0);
  assert.equal(window.gtag, undefined);
  createTracking({ googleTagId: "", googleAdsId: ids.googleAdsId, metaPixelId: "" }).sync();
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /id=AW-123456/);
  assert.equal(window.fbq, undefined);
});

test("Meta works independently when both Google IDs are empty", () => {
  saveConsent({ statistics: false, marketing: true });
  createTracking({ googleTagId: "", googleAdsId: "", metaPixelId: ids.metaPixelId }).sync();
  assert.equal(window.gtag, undefined);
  assert.equal(scripts.length, 1);
  assert.match(scripts[0].src, /fbevents.js/);
});
