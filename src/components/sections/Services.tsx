import React from "react";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ServiceCard } from "@/components/ui/ServiceCard";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import type { ServiceItem } from "@/types/site";

export function Services({
  services,
  errorMessage,
}: {
  services: ServiceItem[];
  errorMessage?: string;
}) {
  return (
    <section id="services" className="relative overflow-hidden bg-[var(--color-background)] py-20 md:py-28">
      {/* Subtle ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-[var(--color-brand)]/[0.03] rounded-full blur-[150px] pointer-events-none" />

      <Container className="relative z-10">
        <ScrollReveal>
          <SectionHeading 
              subtitle="Vores priser" 
            title="Priser & behandlinger"
            centered 
          />
        </ScrollReveal>
        
        <ScrollReveal stagger className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mt-16">
          {errorMessage ? (
            <div className="col-span-full rounded-2xl border border-red-500/20 bg-red-500/10 p-6 md:p-8 text-center" role="alert">
              <p className="text-base md:text-lg font-medium text-red-200 mb-2">
                {errorMessage}
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Kontakt os gerne direkte på telefon{" "}
                <a
                  href="tel:42202429"
                  className="font-bold text-white underline hover:text-[var(--color-brand-light)]"
                >
                  42 20 24 29
                </a>{" "}
                for at bestille din tid.
              </p>
            </div>
          ) : services.length === 0 ? (
            <p className="col-span-full rounded-xl border border-white/[0.08] bg-[var(--color-surface)] px-6 py-12 text-center text-sm text-[var(--color-text-muted)]">
              Behandlingerne bliver opdateret. Kontakt os gerne for pris og booking på{" "}
              <a href="tel:42202429" className="font-semibold text-white underline hover:text-[var(--color-brand-light)]">
                42 20 24 29
              </a>
              .
            </p>
          ) : null}
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </ScrollReveal>
        
        <ScrollReveal delay={400}>
          <div className="mt-16 text-center max-w-2xl mx-auto">
            <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
              De viste priser gælder de beskrevne behandlinger. Har du særlige ønsker,
              er du altid velkommen til at kontakte os inden din booking.
            </p>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
