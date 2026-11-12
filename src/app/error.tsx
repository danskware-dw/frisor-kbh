"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Phone, RefreshCw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App ErrorBoundary]:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)] px-4 py-16 text-center text-white">
      <div className="mx-auto max-w-lg rounded-2xl border border-white/10 bg-[var(--color-surface)] p-8 shadow-2xl">
        <h1 className="mb-4 font-heading text-2xl font-bold uppercase tracking-wider text-white">
          Der opstod en fejl
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-[var(--color-text-muted)]">
          Vi oplever desværre midlertidige tekniske problemer. Du er meget velkommen til at kontakte os direkte på telefon{" "}
          <a
            href="tel:42202429"
            className="font-bold text-[var(--color-brand-light)] underline hover:text-white"
          >
            42 20 24 29
          </a>{" "}
          for tidsbestilling eller spørgsmål.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-colors hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4" />
            Prøv igen
          </button>
          <a
            href="tel:42202429"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--color-brand)] bg-[var(--color-brand)] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white transition-opacity hover:opacity-90"
          >
            <Phone className="h-4 w-4" />
            Ring 42 20 24 29
          </a>
          <Link
            href="/"
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-transparent px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] transition-colors hover:text-white"
          >
            <Home className="h-4 w-4" />
            Forside
          </Link>
        </div>
      </div>
    </div>
  );
}
