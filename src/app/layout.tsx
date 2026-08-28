import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { siteConfig, openingHours } from "@/data/site";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-body",
});

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-heading",
});

// ---------------------------------------------------------------------------
// Metadata  (REC-08: OG image + Twitter card)
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  title: siteConfig.seo.defaultTitle,
  description: siteConfig.seo.defaultDescription,
  authors: [{ name: "DanskWare" }],
  creator: "DanskWare",
  generator: "DanskWare",
  metadataBase: new URL(siteConfig.url || "http://localhost:3000"),
  openGraph: {
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    url: siteConfig.url,
    siteName: siteConfig.businessName,
    locale: "da_DK",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.businessName} – Professionel herrefrisør i København`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.defaultTitle,
    description: siteConfig.seo.defaultDescription,
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0d0d",
  colorScheme: "dark",
};

// ---------------------------------------------------------------------------
// JSON-LD Schema  (REC-09: openingHoursSpecification, hasMap, sameAs)
// ---------------------------------------------------------------------------
function buildJsonLd() {
  const openHours = openingHours
    .filter((h) => !h.isClosed && h.openTime && h.closeTime)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.schemaDay,
      opens: h.openTime,
      closes: h.closeTime,
    }));

  const sameAs = [
    siteConfig.social.instagram,
    siteConfig.social.facebook,
  ].filter((url): url is string => typeof url === "string" && url.startsWith("http"));

  return {
    "@context": "https://schema.org",
    "@type": "BarberShop",
    name: siteConfig.businessName,
    description: siteConfig.seo.defaultDescription,
    creator: {
      "@type": "Organization",
      name: "DanskWare",
    },
    image: `${siteConfig.url}/og-image.png`,
    "@id": siteConfig.url,
    url: siteConfig.url,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.contact.address,
      addressLocality: siteConfig.contact.city,
      postalCode: siteConfig.contact.postalCode,
      addressCountry: "DK",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 55.6689,
      longitude: 12.5406,
    },
    hasMap: siteConfig.contact.directionsUrl,
    openingHoursSpecification: openHours,
    priceRange: "$$",
    ...(sameAs.length > 0 && { sameAs }),
  };
}

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="da"
      className={`${inter.variable} ${playfairDisplay.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }}
        />
      </head>
      <body className="antialiased bg-[var(--color-background)] text-[var(--color-text)]">
        {/* REC-04: Skip-to-content link for keyboard / screen reader accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-[var(--color-brand)] focus:text-white focus:px-5 focus:py-3 focus:rounded-lg focus:font-medium focus:text-sm focus:shadow-lg focus:outline-none"
        >
          Spring til indhold
        </a>
        {children}
      </body>
    </html>
  );
}
