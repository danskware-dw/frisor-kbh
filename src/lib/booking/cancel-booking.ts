import { and, eq, inArray } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import { BookingError } from "./errors";

/** Called only after the server action has authorized the administrator. */
export async function cancelBooking(bookingId: unknown) {
  if (typeof bookingId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(bookingId)) {
    throw new BookingError("Bookingen er ugyldig.", 400, "INVALID_BOOKING_ID");
  }

  const db = getDb();
  // A conditional update also protects against stale pages and repeated requests.
  const [updated] = await db.update(bookings)
    .set({ status: "cancelled" })
    .where(and(eq(bookings.id, bookingId), inArray(bookings.status, ["confirmed", "pending"])))
    .returning({ id: bookings.id });

  if (updated) return { alreadyCancelled: false };

  const [booking] = await db.select({ status: bookings.status })
    .from(bookings).where(eq(bookings.id, bookingId)).limit(1);
  if (!booking) {
    throw new BookingError("Bookingen blev ikke fundet.", 404, "BOOKING_NOT_FOUND");
  }
  if (booking.status === "cancelled") return { alreadyCancelled: true };
  throw new BookingError("En afsluttet booking kan ikke aflyses.", 409, "BOOKING_NOT_CANCELLABLE");
}
