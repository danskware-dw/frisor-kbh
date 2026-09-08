export const openingOffer = {
  badge: "Åbningstilbud",
  headline: "Klar til en frisk klipning?",
  treatmentId: "herreklip",
  treatmentName: "Herreklip",
  priceLabel: "150 kr.",
  ctaLabel: "Vælg tilbud",
} as const;

export function getOpeningOffer(treatmentId: string) {
  return treatmentId === openingOffer.treatmentId ? openingOffer : null;
}

export function getBookingPriceLabel(treatment: { id: string; price: string }) {
  return getOpeningOffer(treatment.id)?.priceLabel ?? treatment.price;
}
