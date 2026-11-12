import { Container } from "@/components/ui/Container";
import { siteConfig } from "@/data/site";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: `Privatlivspolitik | ${siteConfig.businessName}`,
  description: `Læs om, hvordan ${siteConfig.businessName} behandler dine personoplysninger i overensstemmelse med GDPR.`,
  alternates: {
    canonical: "/privatlivspolitik",
  },
};

export default function PrivatlivspolitikPage() {
  const updatedDate = "12. november 2026";

  return (
    <main
      id="main-content"
      className="min-h-screen bg-[var(--color-background)] pt-28 pb-24"
    >
      <Container>
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[var(--color-text-muted)] hover:text-[var(--color-brand-light)] text-sm uppercase tracking-wider font-medium transition-colors mb-10 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1 duration-200" />
            Tilbage til forsiden
          </Link>

          {/* Header */}
          <h1 className="font-heading text-4xl text-white mb-3 uppercase tracking-wide">
            Privatlivspolitik
          </h1>
          <p className="text-[var(--color-text-muted)] text-sm mb-12">
            Sidst opdateret: {updatedDate}
          </p>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-[var(--color-brand)]/40 to-transparent mb-12" />

          {/* Content */}
          <div className="space-y-10 text-[var(--color-text-muted)] leading-relaxed">
            <section>
              <h2 className="text-white font-heading text-2xl uppercase tracking-wide mb-4">
                1. Dataansvarlig
              </h2>
              <p>
                Den dataansvarlige for behandlingen af dine personoplysninger er:
              </p>
              <address className="not-italic mt-4 p-5 rounded-xl border border-white/[0.08] bg-white/[0.02] text-[var(--color-text)] space-y-1">
                <strong className="block">{siteConfig.businessName}</strong>
                <span className="block">{siteConfig.contact.address}</span>
                <span className="block">
                  {siteConfig.contact.postalCode} {siteConfig.contact.city}
                </span>
                <span className="block">
                  Telefon:{" "}
                  <a
                    href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                    className="hover:text-[var(--color-brand-light)] transition-colors"
                  >
                    {siteConfig.contact.phone}
                  </a>
                </span>
                <span className="block">
                  E-mail:{" "}
                  <a
                    href={`mailto:${siteConfig.contact.email}`}
                    className="hover:text-[var(--color-brand-light)] transition-colors"
                  >
                    {siteConfig.contact.email}
                  </a>
                </span>
              </address>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase tracking-wide mb-4">Cookies</h2>
              <p>Google Ads-cookies anvendes kun, hvis du har givet samtykke til marketing. Du kan til enhver tid ændre eller trække dit samtykke tilbage via Cookieindstillinger nederst på siden.</p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase tracking-wide mb-4">
                2. Hvilke oplysninger indsamler vi?
              </h2>
              <p>
                Når du foretager en booking hos os, indsamler vi følgende
                personoplysninger:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
                <li>Navn</li>
                <li>Telefonnummer</li>
                <li>E-mailadresse</li>
                <li>Valgt behandling, medarbejder, dato og tidspunkt</li>
                <li>
                  Eventuelle noter eller særlige ønsker du angiver i
                  bookingformularen
                </li>
              </ul>
              <p className="mt-4">
                Vi indsamler ikke CPR-numre, betalingsoplysninger eller andre
                følsomme kategorier af personoplysninger.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase tracking-wide mb-4">
                3. Formål med behandlingen
              </h2>
              <p>
                Dine personoplysninger behandles med følgende formål:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
                <li>Bekræftelse og administration af din booking</li>
                <li>Afsendelse af bookingbekræftelse og påmindelser via e-mail</li>
                <li>Kontakt i forbindelse med ændringer eller aflysninger</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase tracking-wide mb-4">
                4. Retsgrundlag
              </h2>
              <p>
                Behandlingen af dine personoplysninger sker på grundlag af
                artikel 6, stk. 1, litra b i GDPR (opfyldelse af en aftale),
                idet oplysningerne er nødvendige for at kunne gennemføre og
                administrere din bookingaftale.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase tracking-wide mb-4">
                5. Opbevaringsperiode
              </h2>
              <p>
                Vi opbevarer dine personoplysninger i op til 12 måneder efter
                dit besøg. Herefter slettes oplysningerne, medmindre vi er
                forpligtet til at opbevare dem længere af regnskabsmæssige eller
                lovgivningsmæssige årsager.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase tracking-wide mb-4">
                6. Videregivelse til tredjeparter
              </h2>
              <p>
                Vi videregiver ikke dine personoplysninger til tredjepart, med
                undtagelse af:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
                <li>
                  <strong className="text-white">Resend</strong> — e-mailudbyder
                  der anvendes til at sende bookingbekræftelser
                </li>
                <li>
                  <strong className="text-white">Supabase</strong> — database-
                  og autentifikationsplatform der opbevarer bookingdata
                </li>
              </ul>
              <p className="mt-4">
                Alle databehandlere er underlagt databehandleraftaler og behandler
                kun oplysninger efter vores instruks.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase tracking-wide mb-4">
                7. Dine rettigheder
              </h2>
              <p>Du har følgende rettigheder i henhold til GDPR:</p>
              <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
                <li>Ret til indsigt i dine personoplysninger</li>
                <li>Ret til berigtigelse af urigtige oplysninger</li>
                <li>Ret til sletning (&quot;retten til at blive glemt&quot;)</li>
                <li>Ret til begrænsning af behandling</li>
                <li>Ret til dataportabilitet</li>
                <li>Ret til indsigelse mod behandling</li>
              </ul>
              <p className="mt-4">
                Ønsker du at udøve dine rettigheder, bedes du kontakte os via
                e-mail på{" "}
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="text-[var(--color-brand-light)] hover:text-white transition-colors"
                >
                  {siteConfig.contact.email}
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase tracking-wide mb-4">
                8. Klage til Datatilsynet
              </h2>
              <p>
                Du har ret til at indgive en klage til Datatilsynet, hvis du
                mener, at vi behandler dine oplysninger i strid med GDPR.
              </p>
              <p className="mt-4">
                Datatilsynet kan kontaktes på{" "}
                <a
                  href="https://www.datatilsynet.dk"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-brand-light)] hover:text-white transition-colors"
                >
                  www.datatilsynet.dk
                </a>{" "}
                eller på telefon 33 19 32 00.
              </p>
            </section>

            <section>
              <h2 className="text-white font-heading text-2xl uppercase tracking-wide mb-4">
                9. Ændringer til denne politik
              </h2>
              <p>
                Vi forbeholder os retten til at opdatere denne
                privatlivspolitik. Den seneste version vil altid være
                tilgængelig på denne side med angivelse af opdateringsdatoen
                øverst.
              </p>
            </section>
          </div>
        </div>
      </Container>
    </main>
  );
}
