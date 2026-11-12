import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Benefits } from "@/components/sections/Benefits";
import { OpeningHours } from "@/components/sections/OpeningHours";
import { Gallery } from "@/components/sections/Gallery";
import { Contact } from "@/components/sections/Contact";
import { BookingCTA } from "@/components/sections/BookingCTA";
import { FloatingBookingButton } from "@/components/ui/FloatingBookingButton";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { galleryImages, treatments } from "@/lib/db/schema";
import { listSalonClosures } from "@/lib/booking/salon-closures";
import { getDateKeyInTimeZone } from "@/lib/booking/business-hours";

export const dynamic = "force-dynamic";

export default async function Home() {
  let managedGalleryImages: (typeof galleryImages.$inferSelect)[] = [];
  let managedTreatments: (typeof treatments.$inferSelect)[] = [];
  let closures: Awaited<ReturnType<typeof listSalonClosures>> = [];
  let errorMessage: string | undefined;

  try {
    const db = getDb();
    [managedGalleryImages, managedTreatments, closures] = await Promise.all([
      db
        .select()
        .from(galleryImages)
        .where(eq(galleryImages.active, true))
        .orderBy(asc(galleryImages.sortOrder), asc(galleryImages.createdAt)),
      db
        .select()
        .from(treatments)
        .where(eq(treatments.active, true))
        .orderBy(asc(treatments.sortOrder)),
      listSalonClosures(),
    ]);
  } catch (error) {
    console.error("[Home] Kunne ikke hente data fra databasen:", error);
    errorMessage = "Vi kan desværre ikke indlæse vores behandlinger lige nu på grund af en midlertidig teknisk fejl. Ring venligst direkte til os på 42 20 24 29 for at bestille tid.";
  }

  const galleryItems = managedGalleryImages.map((image) => ({
    id: image.id,
    src: image.url,
    alt: image.altText || "Billede fra FRISØR KBH",
    mediaType: image.mediaType === "video" ? "video" as const : "image" as const,
    caption: image.caption || undefined,
  }));
  const serviceItems = managedTreatments.map((treatment) => ({
    id: treatment.id,
    name: treatment.name,
    price: Number.parseFloat(treatment.price.replace(/[^0-9,.-]/g, "").replace(",", ".")) || 0,
    priceDisplay: treatment.price,
    description: treatment.description || undefined,
    duration: `${treatment.durationMinutes} min`,
    durationMinutes: treatment.durationMinutes,
    featured: treatment.featured,
    image: treatment.image || undefined,
    imageAlt: treatment.imageAlt || treatment.name,
  }));

  return (
    <>
      <Header />
      {/* REC-04: id="main-content" enables skip-to-content link target */}
      <main id="main-content" className="flex min-h-screen flex-col">
        <Hero closures={closures} today={getDateKeyInTimeZone()} />
        <Services services={serviceItems} errorMessage={errorMessage} />
        <Benefits />
        <OpeningHours />
        <Gallery items={galleryItems} />
        <About />
        <Contact />
        <BookingCTA />
      </main>
      <Footer />

      <FloatingBookingButton />
    </>
  );
}
