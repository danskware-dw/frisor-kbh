import { CalendarOff } from "lucide-react";
import type { SalonClosure } from "@/lib/booking/salon-closures";
import { formatDateLabel } from "@/lib/booking-utils";

export function ClosureNotices({ closures, today }: { closures: SalonClosure[]; today: string }) {
  if (!closures.length) return null;
  return (
    <aside aria-label="Salonens lukkedage" className="mb-6 w-full max-w-2xl space-y-2 text-left">
      {closures.map((closure) => (
        <div key={closure.date} className="flex items-start gap-3 rounded-xl border border-[var(--color-brand-light)]/40 bg-[var(--color-background)]/95 px-4 py-3 shadow-lg sm:px-5">
          <CalendarOff className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-brand-light)]" aria-hidden="true" />
          <div className="min-w-0 text-sm leading-6 text-[var(--color-text)]">
            <p className="font-semibold text-white">{closure.date === today ? "Vi holder lukket i dag." : `Vi holder lukket ${formatDateLabel(closure.date)} ${closure.date.slice(0, 4)}.`}</p>
            {closure.message ? <p className="break-words text-[var(--color-text-muted)]">{closure.message}</p> : null}
            <p className="text-[var(--color-text-muted)]">Du kan stadig bestille tid på vores øvrige åbningsdage.</p>
          </div>
        </div>
      ))}
    </aside>
  );
}
