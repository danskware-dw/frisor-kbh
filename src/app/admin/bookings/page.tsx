import { getDb } from "@/lib/db/client";
import { bookings, customers } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { formatDateLabel } from "@/lib/booking-utils";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/admin";

export const dynamic = "force-dynamic";

export default async function BookingsPage() {
  await requireAdmin();
  const db = getDb();
  
  const allBookings = await db
    .select({
      booking: bookings,
      customer: customers,
    })
    .from(bookings)
    .leftJoin(customers, eq(bookings.customerId, customers.id))
    .orderBy(desc(bookings.date), desc(bookings.time));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Bookings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Se detaljer og aflys en booking. Aflyste bookinger bliver gemt her.
        </p>
      </div>
      
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {allBookings.length === 0 ? (
          <div className="p-12 text-center">
            <h2 className="text-lg font-medium text-gray-900">Ingen Bookinger Endnu</h2>
            <p className="mt-2 text-sm text-gray-500">Når kunder booker tid, vil de dukke op her.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Dato & Tid</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Kunde</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Behandling</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Medarbejder</th>
                  <th scope="col" className="px-6 py-4 font-semibold text-right">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold"><span className="sr-only">Handling</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {allBookings.map(({ booking, customer }) => {
                  const statusColors: Record<string, string> = {
                    confirmed: "bg-emerald-100 text-emerald-800 border-emerald-200",
                    pending: "bg-amber-100 text-amber-800 border-amber-200",
                    cancelled: "bg-red-100 text-red-800 border-red-200",
                    completed: "bg-gray-100 text-gray-800 border-gray-200",
                  };
                  
                  const statusColor = statusColors[booking.status] || statusColors.pending;
                  
                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-medium text-gray-900">{formatDateLabel(booking.date)}</div>
                        <div className="text-gray-500">{booking.time} ({booking.durationMinutes} min)</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="font-medium text-gray-900">{customer?.name || "Ukendt Kunde"}</div>
                        <div className="text-gray-500">{customer?.phone || ""}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-gray-900">{booking.treatmentName}</div>
                        <div className="text-gray-500">{booking.priceLabel}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-gray-900">{booking.employeeName}</div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-right">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${statusColor}`}>
                          {{ confirmed: "Bekræftet", pending: "Afventer", cancelled: "Aflyst", completed: "Afsluttet" }[booking.status]}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link href={`/admin/bookings/${encodeURIComponent(booking.id)}`} aria-label={`Se booking for ${customer?.name || "ukendt kunde"}, ${booking.date} kl. ${booking.time}`} className="inline-flex min-h-11 items-center rounded-lg border border-gray-300 px-3 py-2 font-semibold text-emerald-700 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600">
                          Se booking
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
