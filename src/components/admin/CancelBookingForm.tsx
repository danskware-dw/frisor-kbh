"use client";

import { useActionState, useState } from "react";
import { cancelBookingAction } from "@/app/admin/bookings/actions";

type Props = {
  bookingId: string;
  customerName: string;
  appointmentLabel: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  canManage: boolean;
};

export function CancelBookingForm({ bookingId, customerName, appointmentLabel, status, canManage }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState(cancelBookingAction, { success: false, message: "" });

  if (state.success || status === "cancelled") {
    return <p role="status" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">{state.message || "Bookingen er aflyst og optager ikke længere tiden i kalenderen."}</p>;
  }
  if (status === "completed") {
    return <p className="text-sm text-gray-600">Bookingen er afsluttet og kan ikke aflyses.</p>;
  }
  if (!canManage) {
    return <p className="text-sm text-gray-600">Kun administratorer kan aflyse bookinger.</p>;
  }

  return (
    <div className="space-y-4">
      {confirming ? (
        <form action={formAction} className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-4" aria-label="Bekræft aflysning" aria-busy={pending}>
          <input type="hidden" name="bookingId" value={bookingId} />
          <p className="font-semibold text-gray-900">Vil du aflyse denne booking?</p>
          <p className="text-sm text-gray-700">{customerName} · {appointmentLabel}</p>
          <p className="text-sm text-gray-700">Tiden bliver ledig igen. Kundens andre bookinger bliver ikke ændret. Kunden får ikke automatisk besked om aflysningen.</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={pending} onClick={() => setConfirming(false)} className="min-h-11 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-emerald-600 disabled:cursor-wait disabled:opacity-60">
              Behold booking
            </button>
            <button type="submit" name="confirm" value="yes" disabled={pending} className="min-h-11 cursor-pointer rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
              {pending ? "Aflyser…" : "Ja, aflys booking"}
            </button>
          </div>
        </form>
      ) : (
        <button type="button" onClick={() => setConfirming(true)} className="min-h-11 cursor-pointer rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2">
          Aflys booking
        </button>
      )}
      {state.message && <p role="alert" className="text-sm text-red-700">{state.message}</p>}
    </div>
  );
}
