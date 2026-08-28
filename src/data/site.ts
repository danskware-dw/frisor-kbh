import { SiteConfig, NavigationItem, OpeningHoursItem, BenefitItem } from "@/types/site";

// ---------------------------------------------------------------------------
// Site Configuration
// ---------------------------------------------------------------------------
export const siteConfig: SiteConfig = {
  businessName: "FRISØR KBH",
  tagline: "Online booking, drop-in og skarp herreklip på Frederiksberg",
  description:
    "FRISØR KBH er en lokal herrefrisør på Vesterbrogade med fokus på herreklip, skin fade og skægtrimning i en rolig og professionel salon.",
  // REC-13: reads from environment so staging/production use the correct domain
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.frisorkbh.dk",
  contact: {
    phone: "+45 42 20 24 29",
    email: "frisorkbh@hotmail.com",
    address: "Vesterbrogade 171",
    postalCode: "1800",
    city: "Frederiksberg",
    bookingUrl: "/booking",
    directionsUrl:
      "https://www.google.com/maps/search/?api=1&query=Vesterbrogade%20171%2C%201800%20Frederiksberg",
  },
  // REC-02: set to "" or undefined to hide social icons until real URLs are ready
  social: {
    instagram: "",
    facebook: "",
  },
  seo: {
    defaultTitle: "FRISØR KBH | Herrefrisør på Frederiksberg",
    defaultDescription:
      "Book tid hos FRISØR KBH på Vesterbrogade 171. Herreklip, skin fade og skægtrimning med online booking, drop-in og tydelige priser.",
  },
};

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------
export const navigation: NavigationItem[] = [
  { label: "Forside", href: "/#hero" },
  { label: "Om os", href: "/#about" },
  { label: "Priser", href: "/#services" },
  { label: "Galleri", href: "/#gallery" },
  { label: "Kontakt", href: "/#contact" },
];

// ---------------------------------------------------------------------------
// Benefits
// ---------------------------------------------------------------------------
export const benefits: BenefitItem[] = [
  {
    title: "Professionel betjening",
    description: "Du bliver mødt i en rolig salon med fokus på detaljerne.",
    iconName: "Scissors",
  },
  {
    title: "Moderne & klassiske styles",
    description: "Vi mestrer alt fra klassisk klip til moderne skin fades.",
    iconName: "User",
  },
  {
    title: "Afslappet atmosfære",
    description: "Nyd en god kop kaffe og en uformel stemning i salonen.",
    iconName: "Coffee",
  },
  {
    title: "Booking og drop-in",
    description: "Book online på få minutter, ring til os, eller kom forbi når der er plads.",
    iconName: "Calendar",
  },
];

// ---------------------------------------------------------------------------
// Opening Hours  (REC-01 + REC-15: structured openTime/closeTime for JSON-LD)
// ---------------------------------------------------------------------------
export const openingHours: OpeningHoursItem[] = [
  { day: "Mandag",  openTime: "10:00", closeTime: "18:00", hours: "10:00 – 18:00", schemaDay: "Monday" },
  { day: "Tirsdag", openTime: "10:00", closeTime: "18:00", hours: "10:00 – 18:00", schemaDay: "Tuesday" },
  { day: "Onsdag",  openTime: "10:00", closeTime: "18:00", hours: "10:00 – 18:00", schemaDay: "Wednesday" },
  { day: "Torsdag", openTime: "10:00", closeTime: "18:00", hours: "10:00 – 18:00", schemaDay: "Thursday" },
  { day: "Fredag",  openTime: "10:00", closeTime: "18:00", hours: "10:00 – 18:00", schemaDay: "Friday" },
  { day: "Lørdag",  openTime: "09:00", closeTime: "16:00", hours: "09:00 – 16:00", schemaDay: "Saturday" },
  { day: "Søndag",  hours: "Lukket", isClosed: true, schemaDay: "Sunday" },
];

// ---------------------------------------------------------------------------
// Price formatter utility
// ---------------------------------------------------------------------------
export function formatPrice(price: number | null, priceDisplay?: string): string {
  if (priceDisplay) return priceDisplay;
  if (price === null) return "Kontakt os";
  return `${price} kr.`;
}
