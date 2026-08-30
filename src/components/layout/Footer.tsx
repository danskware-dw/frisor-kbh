import React from "react";
import { siteConfig, navigation } from "@/data/site";
import { Container } from "@/components/ui/Container";
import { Logo } from "@/components/ui/Logo";
import { MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-black pt-16 pb-8">
      {/* Gradient top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-brand)]/50 to-transparent" />

      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <Logo width={132} height={138} />
            <p className="text-[var(--color-text-muted)] text-sm leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="flex space-x-4">
              {siteConfig.social.instagram && siteConfig.social.instagram.startsWith('http') && (
                <a
                  href={siteConfig.social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-11 w-11 items-center justify-center rounded-lg glass-card text-[var(--color-text-muted)] transition-[color,box-shadow,transform] duration-300 hover:scale-110 hover:text-[var(--color-brand-light)] hover:shadow-[0_0_16px_var(--color-brand-glow)]"
                  aria-label="Instagram"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </a>
              )}
              {siteConfig.social.facebook && siteConfig.social.facebook.startsWith('http') && (
                <a
                  href={siteConfig.social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex h-11 w-11 items-center justify-center rounded-lg glass-card text-[var(--color-text-muted)] transition-[color,box-shadow,transform] duration-300 hover:scale-110 hover:text-[var(--color-brand-light)] hover:shadow-[0_0_16px_var(--color-brand-glow)]"
                  aria-label="Facebook"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-white font-heading text-lg mb-6 uppercase tracking-wider">
              Links
            </h3>
            <ul className="space-y-3">
              {navigation.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-brand-light)] transition-colors text-sm hover:translate-x-1 inline-block"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-heading text-lg mb-6 uppercase tracking-wider">
              Kontakt
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start text-[var(--color-text-muted)] text-sm">
                <MapPin className="w-5 h-5 text-[var(--color-brand-light)] mr-3 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {siteConfig.contact.address}
                  <br />
                  {siteConfig.contact.postalCode} {siteConfig.contact.city}
                </span>
              </li>
              <li className="flex items-center text-[var(--color-text-muted)] text-sm">
                <Phone className="w-5 h-5 text-[var(--color-brand-light)] mr-3 flex-shrink-0" aria-hidden="true" />
                <a href={`tel:${siteConfig.contact.phone.replace(/\s/g, '')}`} className="hover:text-[var(--color-brand-light)] transition-colors">
                  {siteConfig.contact.phone}
                </a>
              </li>
              <li className="flex items-center text-[var(--color-text-muted)] text-sm">
                <Mail className="w-5 h-5 text-[var(--color-brand-light)] mr-3 flex-shrink-0" aria-hidden="true" />
                <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-[var(--color-brand-light)] transition-colors">
                  {siteConfig.contact.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Book */}
          <div>
            <h3 className="text-white font-heading text-lg mb-6 uppercase tracking-wider">
              Bestil tid
            </h3>
            <p className="text-[var(--color-text-muted)] text-sm mb-6 leading-relaxed">
              Book din næste klipning online, ring til os, eller kom forbi salonen.
            </p>
            <a
              href={siteConfig.contact.bookingUrl}
              className="inline-flex w-full cursor-pointer items-center justify-center rounded-lg border border-[var(--color-brand)] bg-gradient-to-r from-[var(--color-brand-dark)] to-[var(--color-brand)] px-6 py-3 text-sm font-medium uppercase tracking-wider text-white transition-[transform,box-shadow,filter] duration-200 hover:scale-[1.02] hover:brightness-110 hover:shadow-[0_0_24px_var(--color-brand-glow)] active:scale-[0.97] sm:w-auto"
            >
              Book tid
            </a>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/[0.06] pt-8 md:flex-row">
          <div className="text-center text-xs text-[var(--color-text-muted)] md:text-left">
            <p>
              &copy; {currentYear} {siteConfig.businessName}. Alle rettigheder forbeholdes.
            </p>
            <p className="mt-1">
              Hjemmeside udviklet af{" "}
              <a
                href="https://danskware.dk/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--color-brand-light)] transition-colors hover:text-white"
              >
                DanskWare
              </a>
              .
            </p>
          </div>
          <div className="text-[var(--color-text-muted)] text-xs hover:text-white transition-colors">
            <a href="/privatlivspolitik">Privatlivspolitik</a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
