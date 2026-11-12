import { getConsent } from "./consent";

type TagCommand = (...args: unknown[]) => void;
type MetaPixel = TagCommand & {
  callMethod?: TagCommand;
  queue: unknown[][];
  push: TagCommand;
  loaded: boolean;
  version: string;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: TagCommand;
    fbq?: MetaPixel;
    _fbq?: MetaPixel;
  }
}

type TrackingIds = {
  googleTagId?: string;
  googleAdsId?: string;
  metaPixelId?: string;
};

function loadScript(src: string) {
  const script = document.createElement("script");
  script.async = true;
  script.src = src;
  document.head.appendChild(script);
}

/** One controller per browser document; reuse across route changes and effect replays. */
export function createTracking(ids: TrackingIds) {
  const googleTagId = ids.googleTagId?.trim();
  const googleAdsId = ids.googleAdsId?.trim();
  const metaPixelId = ids.metaPixelId?.trim();
  const googleLoaderId = googleTagId || googleAdsId;
  let googleInitialized = false;
  let metaInitialized = false;
  let marketingGranted = false;
  const googlePages = new Map<string, string>();
  let metaPage: string | null = null;

  function sync() {
    if (typeof window === "undefined") return;
    const consent = getConsent();
    const pageLocation = `${window.location.origin}${window.location.pathname}${window.location.search}`;

    if (googleLoaderId) {
      if (!googleInitialized) {
        window.dataLayer = window.dataLayer || [];
        window.gtag = window.gtag || function () {
          // gtag's queue uses Arguments objects, as in Google's bootstrap snippet.
          // eslint-disable-next-line prefer-rest-params -- Google requires an Arguments object in dataLayer.
          window.dataLayer!.push(arguments);
        };
        window.gtag("consent", "default", {
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
          analytics_storage: "denied",
          wait_for_update: 500,
        });
        window.gtag("js", new Date());
      }
      window.gtag!("consent", "update", {
        analytics_storage: consent.statistics ? "granted" : "denied",
        ad_storage: consent.marketing ? "granted" : "denied",
        ad_user_data: consent.marketing ? "granted" : "denied",
        ad_personalization: consent.marketing ? "granted" : "denied",
      });
      if (!googleInitialized) {
        for (const id of [googleTagId, googleAdsId]) {
          if (id) window.gtag!("config", id, { send_page_view: false });
        }
        loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleLoaderId)}`);
        googleInitialized = true;
      }
      for (const [id, allowed] of [[googleTagId, consent.statistics], [googleAdsId, consent.marketing]] as const) {
        if (!id) continue;
        if (!allowed) {
          googlePages.delete(id);
        } else if (googlePages.get(id) !== pageLocation) {
          window.gtag!("event", "page_view", {
            send_to: id,
            page_location: pageLocation,
            page_title: document.title,
          });
          googlePages.set(id, pageLocation);
        }
      }
    }

    if (metaPixelId) {
      if (consent.marketing) {
        if (!metaInitialized) {
          if (!window.fbq) {
            const fbq = function (...args: unknown[]) {
              if (fbq.callMethod) fbq.callMethod(...args);
              else fbq.queue.push(args);
            } as MetaPixel;
            fbq.queue = [];
            fbq.push = fbq;
            fbq.loaded = true;
            fbq.version = "2.0";
            window.fbq = fbq;
            window._fbq = window._fbq || fbq;
          }
          window.fbq("consent", "revoke");
          window.fbq("set", "autoConfig", false, metaPixelId);
          window.fbq("init", metaPixelId);
          window.fbq("consent", "grant");
          loadScript("https://connect.facebook.net/en_US/fbevents.js");
          metaInitialized = true;
        } else if (!marketingGranted) {
          window.fbq!("consent", "grant");
        }
        if (metaPage !== pageLocation) {
          window.fbq!("track", "PageView");
          metaPage = pageLocation;
        }
      } else {
        if (metaInitialized && marketingGranted) {
          // Consent may be withdrawn while the SDK is still downloading.
          if (!window.fbq!.callMethod) {
            window.fbq!.queue = window.fbq!.queue.filter(command => command[0] !== "track");
          }
          window.fbq!("consent", "revoke");
        }
        metaPage = null;
      }
      marketingGranted = consent.marketing;
    }
  }

  return { sync };
}
