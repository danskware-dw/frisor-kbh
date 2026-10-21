"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import { CalendarOff, ChevronRight, LoaderCircle } from "lucide-react";
import { updateSalonClosure } from "@/app/admin/closures/actions";
import type { AdminSalonClosure } from "@/lib/booking/salon-closures";
import { formatDateLabel } from "@/lib/booking-utils";

type Props = { closures: AdminSalonClosure[]; today: string; canManage: boolean };

export function SalonClosures({ closures, today, canManage }: Props) {
  const [date, setDate] = useState(today);
  const [message, setMessage] = useState("");
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const dateInput = useRef<HTMLInputElement>(null);
  const messageInput = useRef<HTMLInputElement>(null);
  const [state, formAction, pending] = useActionState(updateSalonClosure, { success: false, message: "" });
  const disabled = pending || !canManage;
  const closedToday = closures.some((closure) => closure.date === today);

  return (
    <section aria-labelledby="closures-heading" className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="rounded-lg bg-teal-50 p-2.5 text-teal-800"><CalendarOff className="h-5 w-5" aria-hidden="true" /></span>
          <div>
            <h2 id="closures-heading" className="text-lg font-semibold text-gray-900">Lukkedage</h2>
            <p className="mt-0.5 text-sm text-gray-500">Luk salonen i dag eller planlæg en lukkedag.</p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${closedToday ? "bg-amber-50 text-amber-900" : "bg-gray-100 text-gray-700"}`}>
          {closedToday ? "Lukket i dag" : "Ingen ekstra lukning i dag"}
        </span>
      </div>

      <div className="space-y-5 p-5 sm:p-6">
        <p className="max-w-3xl text-sm leading-6 text-gray-600">Lukkedage gælder alle medarbejdere og behandlinger. Kunderne får besked på forsiden og kan stadig bestille tid på andre åbningsdage.</p>
        {!canManage ? <p className="text-sm text-gray-600">Kun administratorer kan ændre lukkedage.</p> : null}
        <form action={formAction} className="grid items-end gap-4 md:grid-cols-[180px_1fr_auto]">
          <input type="hidden" name="intent" value="close" />
          <label className="grid gap-1.5 text-sm font-medium text-gray-700" htmlFor="closure-date">Dato
            <input ref={dateInput} id="closure-date" name="date" required type="date" min={today} value={date} readOnly={editingDate !== null} disabled={disabled} onChange={(event) => setDate(event.target.value)} className="h-11 min-w-0 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 read-only:bg-gray-50 focus:outline-2 focus:outline-offset-2 focus:outline-teal-700 disabled:opacity-60" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-gray-700" htmlFor="closure-message">Besked til kunder <span className="sr-only">(valgfri, højst 300 tegn)</span>
            <input ref={messageInput} id="closure-message" name="message" maxLength={300} value={message} disabled={disabled} onChange={(event) => setMessage(event.target.value)} placeholder="Valgfrit, fx Vi holder ferie." className="h-11 min-w-0 w-full rounded-lg border border-gray-300 px-3 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-2 focus:outline-offset-2 focus:outline-teal-700 disabled:opacity-60" />
          </label>
          <button type="submit" disabled={disabled} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-800 px-5 text-sm font-semibold text-white transition-colors hover:bg-teal-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60">
            {pending ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}{pending ? "Gemmer…" : "Gem lukkedag"}
          </button>
        </form>
        <button type="button" disabled={disabled} onClick={() => { setEditingDate(null); setDate(today); setMessage(""); dateInput.current?.focus(); }} className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-teal-800 underline underline-offset-4 disabled:opacity-60">{editingDate ? "Opret en ny lukkedag" : "Vælg i dag"}<ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
        {state.message ? <p role={state.success ? "status" : "alert"} className={`rounded-lg p-3 text-sm leading-6 ${state.success ? "bg-teal-50 text-teal-900" : "bg-red-50 text-red-800"}`}>{state.message}</p> : null}

        {closures.length === 0 ? <p className="text-sm text-gray-500">Ingen planlagte lukkedage.</p> : (
          <ul className="grid gap-3">
            {closures.map((closure) => (
              <li key={closure.date} className="rounded-lg border border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{closure.date === today ? "Lukket i dag" : `Lukket ${formatDateLabel(closure.date)} ${closure.date.slice(0, 4)}`}</h3>
                    {closure.message ? <p className="mt-1 break-words text-sm text-gray-600">{closure.message}</p> : null}
                  </div>
                  <div className="flex items-center gap-4">
                    <button type="button" disabled={disabled} onClick={() => { setEditingDate(closure.date); setDate(closure.date); setMessage(closure.message); messageInput.current?.focus(); }} className="min-h-11 text-sm font-semibold text-teal-800 underline underline-offset-4 disabled:opacity-60">Rediger besked</button>
                    <form action={formAction} onSubmit={(event) => {
                      if (!window.confirm(`Fjern lukkedagen ${formatDateLabel(closure.date)}? Datoen følger derefter de normale åbningstider.`)) event.preventDefault();
                    }}>
                      <input type="hidden" name="intent" value="reopen" />
                      <input type="hidden" name="date" value={closure.date} />
                      <button type="submit" disabled={disabled} className="min-h-11 text-sm font-semibold text-gray-700 underline underline-offset-4 disabled:opacity-60">Fjern lukkedag</button>
                    </form>
                  </div>
                </div>
                {closure.affectedBookings.length ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
                    <p className="font-semibold">{closure.affectedBookings.length} eksisterende {closure.affectedBookings.length === 1 ? "booking kræver" : "bookinger kræver"} din opmærksomhed.</p>
                    <p>Kontakt kunderne for at flytte eller aflyse deres tid. Bookingerne er ikke aflyst automatisk.</p>
                    <ul className="mt-2 space-y-1">{closure.affectedBookings.map((booking) => <li key={booking.id}>{booking.time} · {booking.customerName ?? "Ukendt kunde"} · {booking.employeeName}</li>)}</ul>
                    <Link href="/admin/bookings" className="mt-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">Se bookinger<ChevronRight className="ml-1 h-4 w-4" aria-hidden="true" /></Link>
                  </div>
                ) : <p className="mt-2 text-xs text-gray-500">Ingen eksisterende bookinger på denne dato.</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
