import React from "react";
import { siteConfig } from "@/data/site";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { ChevronDown } from "lucide-react";
import Image from "next/image";
import { ClosureNotices } from "@/components/booking/ClosureNotices";
import type { SalonClosure } from "@/lib/booking/salon-closures";

export function Hero({ closures = [], today = "" }: { closures?: SalonClosure[]; today?: string }) {
  return (
    <section id="hero" className="relative flex min-h-[100svh] items-center justify-center overflow-hidden pb-10 pt-28">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 bg-[var(--color-surface)]" aria-hidden="true">
        <Image
          src="/images/hero.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-black/70 to-black/40" />
      </div>

      {/* Animated gradient blobs for cinematic depth */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
        <div
          className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07] animate-blob"
          style={{
            background: "radial-gradient(circle, var(--color-brand-light) 0%, transparent 70%)",
            animation: "float 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-1/4 -left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.05] animate-blob"
          style={{
            background: "radial-gradient(circle, var(--color-brand) 0%, transparent 70%)",
            animation: "float-reverse 25s ease-in-out infinite",
          }}
        />
      </div>

      <Container className="relative z-10 w-full flex flex-col items-center text-center">
        <ClosureNotices closures={closures} today={today} />
        <span className="text-[var(--color-brand-light)] font-semibold tracking-[0.2em] uppercase text-sm md:text-base mb-6 block animate-in fade-in slide-in-from-bottom-4 duration-700">
          Lokal herrefrisør på Frederiksberg
        </span>
        
        <h1
          className="text-balance font-heading text-white mb-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-150 fill-mode-both leading-[0.95]"
          style={{
            fontSize: "clamp(3rem, 8vw, 6rem)",
            letterSpacing: "-0.02em",
          }}
        >
          {siteConfig.businessName}
        </h1>
        
        <p className="text-pretty text-lg md:text-xl text-[var(--color-text-muted)] max-w-2xl mb-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 fill-mode-both leading-relaxed">
          {siteConfig.description}
        </p>

        <p className="text-[var(--color-brand-light)] italic text-lg mb-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400 fill-mode-both">
          {siteConfig.tagline}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500 fill-mode-both w-full sm:w-auto">
          <Button
            href={siteConfig.contact.bookingUrl}
            size="lg"
            className="w-full sm:w-auto shadow-[0_0_30px_var(--color-brand-glow)] hover:shadow-[0_0_50px_rgba(85,160,157,0.3)]"
          >
            Book din klipning
          </Button>
          <Button href="#services" variant="outline" size="lg" className="w-full sm:w-auto">
            Se priser
          </Button>
        </div>

        <div className="mt-12 text-sm text-[var(--color-text-muted)] flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 animate-in fade-in duration-1000 delay-700 fill-mode-both md:mt-16">
          <span>{siteConfig.contact.address}, {siteConfig.contact.postalCode} {siteConfig.contact.city}</span>
          <span className="hidden md:inline text-[var(--color-brand)] text-lg">•</span>
          <a
            href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
            className="min-h-6 hover:text-[var(--color-brand-light)]"
          >
            {siteConfig.contact.phone}
          </a>
        </div>
      </Container>

      {/* Refined scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 hidden md:block">
        <a
          href="#about"
          aria-label="Scroll ned"
          className="group flex flex-col items-center text-[var(--color-text-muted)] hover:text-[var(--color-brand-light)] transition-colors"
        >
          <span className="text-[10px] uppercase tracking-[0.2em] mb-2 opacity-50 group-hover:opacity-100 transition-opacity">Scroll</span>
          <ChevronDown
            className="w-6 h-6 opacity-40 group-hover:opacity-100 transition-[opacity,transform] duration-500"
            style={{ animation: "gentlePulse 2.5s ease-in-out infinite" }}
            aria-hidden="true"
          />
        </a>
      </div>

      {/* Bottom gradient fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--color-background)] to-transparent z-[2] pointer-events-none" />
    </section>
  );
}
