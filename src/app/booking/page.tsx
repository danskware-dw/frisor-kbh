import { Suspense } from "react";
import BookingWizard from "@/components/booking/BookingWizard";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { listSalonClosures } from "@/lib/booking/salon-closures";
import { getDateKeyInTimeZone } from "@/lib/booking/business-hours";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bestil tid hos FRISØR KBH | Herrefrisør i København",
  description:
    "Bestil din næste frisørtid online hos FRISØR KBH på Vesterbrogade 171. Vi tilbyder herreklip, fades og skægtrimning.",
};

export default async function BookingPage() {
  const closures = await listSalonClosures();
  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--color-background)] px-4 pb-16 pt-[calc(7rem+env(safe-area-inset-top))] sm:px-6 md:px-8 md:pb-20 md:pt-[calc(8rem+env(safe-area-inset-top))]"
    >
      <div className="mx-auto max-w-[1180px]">
        {/* Breadcrumb back link */}
        <Link
          href="/"
          className="group mb-7 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium uppercase tracking-wider text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand-light)]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1" aria-hidden="true" />
          Tilbage til forsiden
        </Link>
        <Suspense fallback={<div className="rounded-[28px] border border-gray-200 bg-white p-8 text-center text-gray-700 shadow-lg" aria-live="polite">Henter booking…</div>}>
          <BookingWizard initialClosures={closures} today={getDateKeyInTimeZone()} />
        </Suspense>
      </div>
    </main>
  );
}
