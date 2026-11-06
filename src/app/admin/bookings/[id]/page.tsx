import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { bookings, customers } from "@/lib/db/schema";
import { CancelBookingForm } from "@/components/admin/CancelBookingForm";

export const dynamic = "force-dynamic";

const statusLabels = {
  confirmed: "Bekræftet", pending: "Afventer", cancelled: "Aflyst", completed: "Afsluttet",
};
const statusColors = {
  confirmed: "bg-emerald-100 text-emerald-800", pending: "bg-amber-100 text-amber-800",
  cancelled: "bg-red-100 text-red-800", completed: "bg-gray-100 text-gray-800",
};

export default async function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const [row] = await getDb().select({ booking: bookings, customer: customers })
    .from(bookings).leftJoin(customers, eq(bookings.customerId, customers.id))
    .where(eq(bookings.id, id)).limit(1);
  if (!row) notFound();

  const { booking, customer } = row;
  const customerName = customer?.name ?? "Ukendt kunde";
  const dateLabel = new Intl.DateTimeFormat("da-DK", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Copenhagen",
  }).format(new Date(`${booking.date}T12:00:00Z`));
  const appointmentLabel = `${dateLabel} kl. ${booking.time}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <nav aria-label="Bookingnavigation" className="flex flex-wrap gap-4 text-sm font-semibold text-emerald-700">
        <Link href="/admin" className="rounded py-2 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-600">← Kalender</Link>
        <Link href="/admin/bookings" className="rounded py-2 hover:underline focus-visible:ring-2 focus-visible:ring-emerald-600">Alle bookinger</Link>
      </nav>
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-200 p-4 sm:p-6">
          <div className="min-w-0">
            <p className="text-sm text-gray-500">Bookingdetaljer</p>
            <h1 className="mt-1 break-words text-2xl font-bold normal-case tracking-normal text-gray-900">{customerName}</h1>
            <p className="mt-2 text-sm text-gray-600">{appointmentLabel}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusColors[booking.status]}`}>{statusLabels[booking.status]}</span>
        </div>
        <dl className="grid gap-6 p-4 text-sm sm:grid-cols-2 sm:p-6">
          <div><dt className="text-gray-500">Behandling</dt><dd className="mt-1 font-medium text-gray-900">{booking.treatmentName}</dd></div>
          <div><dt className="text-gray-500">Medarbejder</dt><dd className="mt-1 font-medium text-gray-900">{booking.employeeName}</dd></div>
          <div><dt className="text-gray-500">Varighed</dt><dd className="mt-1 font-medium text-gray-900">{booking.durationMinutes} minutter</dd></div>
          <div><dt className="text-gray-500">Pris</dt><dd className="mt-1 font-medium text-gray-900">{booking.priceLabel || "Ikke angivet"}</dd></div>
          <div><dt className="text-gray-500">Telefon</dt><dd className="mt-1 break-words font-medium text-gray-900">{customer?.phone || "Ikke angivet"}</dd></div>
          <div><dt className="text-gray-500">E-mail</dt><dd className="mt-1 break-words font-medium text-gray-900">{customer?.email || "Ikke angivet"}</dd></div>
          {booking.notes && <div className="sm:col-span-2"><dt className="text-gray-500">Bemærkninger</dt><dd className="mt-1 whitespace-pre-wrap break-words text-gray-900">{booking.notes}</dd></div>}
          <div className="sm:col-span-2"><dt className="text-gray-500">Bookingnummer</dt><dd className="mt-1 break-all text-gray-700">{booking.id}</dd></div>
        </dl>
        <div className="border-t border-gray-200 p-4 sm:p-6">
          <CancelBookingForm bookingId={booking.id} customerName={customerName} appointmentLabel={appointmentLabel} status={booking.status} canManage={admin.role === "admin"} />
        </div>
      </div>
    </div>
  );
}
