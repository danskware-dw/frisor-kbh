/* eslint-disable @typescript-eslint/no-explicit-any */
import { and, eq, ne } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { bookings } from "@/lib/db/schema";
import type { PgTransaction } from "drizzle-orm/pg-core";
import { getTreatmentById, getEmployeeById } from "./catalog";
import { BookingError } from "./errors";
import {
  createBookableSlots,
  getBusinessHoursForDate,
  isBookableStartTime,
  isPastBookingDate,
} from "./business-hours";
import { rangesOverlap, timeToMinutes } from "./time";
import { isValidDateKey } from "./validation";
import { assertSalonOpen } from "./salon-closures";

type BookedInterval = {
  start: number;
  end: number;
};

/** Get all booked intervals for an employee on a given date. */
async function getEmployeeBookedIntervals(
  date: string,
  employeeId: string,
  tx?: PgTransaction<any, any, any>
): Promise<BookedInterval[]> {
  const db = tx ?? getDb();
  const rows = await db
    .select({
      time: bookings.time,
      durationMinutes: bookings.durationMinutes,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.date, date),
        eq(bookings.employeeId, employeeId),
        ne(bookings.status, "cancelled")
      )
    );

  return rows.map((row: { time: string; durationMinutes: number }) => {
    const start = timeToMinutes(row.time);
    return { start, end: start + row.durationMinutes };
  });
}

/** Filter out time slots that overlap with existing bookings. */
export function filterAvailableSlots(
  allSlots: string[],
  durationMinutes: number,
  bookedIntervals: BookedInterval[]
): string[] {
  return allSlots.filter((slot) => {
    const start = timeToMinutes(slot);
    const end = start + durationMinutes;
    return !bookedIntervals.some((booked) =>
      rangesOverlap(start, end, booked.start, booked.end)
    );
  });
}

export type AvailabilityQuery = {
  date: string;
  employeeId: string;
  treatmentId: string;
};

/** Get available time slots for a date + employee + treatment. */
export async function getAvailability(query: AvailabilityQuery) {
  if (!isValidDateKey(query.date)) {
    throw new BookingError("Ugyldig dato.", 400, "INVALID_DATE");
  }
  if (isPastBookingDate(query.date)) {
    throw new BookingError("Datoen ligger i fortiden.", 400, "PAST_DATE");
  }
  if (!getBusinessHoursForDate(query.date)) {
    throw new BookingError(
      "Salonen er lukket den valgte dag.",
      400,
      "CLOSED_DATE"
    );
  }

  await assertSalonOpen(query.date);

  const treatment = await getTreatmentById(query.treatmentId);
  await getEmployeeById(query.employeeId);

  const bookedIntervals = await getEmployeeBookedIntervals(
    query.date,
    query.employeeId
  );
  const allSlots = createBookableSlots(
    query.date,
    treatment.durationMinutes
  );
  const slots = filterAvailableSlots(
    allSlots,
    treatment.durationMinutes,
    bookedIntervals
  );

  return {
    date: query.date,
    employeeId: query.employeeId,
    treatmentId: query.treatmentId,
    durationMinutes: treatment.durationMinutes,
    slots,
  };
}

/** Assert that a specific slot is available (used inside the booking transaction). */
export async function assertSlotAvailable(
  params: {
    date: string;
    time: string;
    employeeId: string;
    durationMinutes: number;
  },
  tx?: PgTransaction<any, any, any>
) {
  if (!isValidDateKey(params.date) || isPastBookingDate(params.date)) {
    throw new BookingError(
      "Datoen er ikke tilgængelig for booking.",
      400,
      "INVALID_DATE"
    );
  }
  await assertSalonOpen(params.date, tx);
  if (
    !isBookableStartTime(params.date, params.time, params.durationMinutes)
  ) {
    throw new BookingError(
      "Tidspunktet ligger uden for salonens åbningstid.",
      400,
      "OUT_OF_HOURS"
    );
  }

  const bookedIntervals = await getEmployeeBookedIntervals(
    params.date,
    params.employeeId,
    tx
  );
  const start = timeToMinutes(params.time);
  const end = start + params.durationMinutes;
  const conflict = bookedIntervals.some((booked) =>
    rangesOverlap(start, end, booked.start, booked.end)
  );

  if (conflict) {
    throw new BookingError(
      "Tidspunktet er ikke længere ledigt. Vælg venligst et andet tidspunkt.",
      409,
      "SLOT_UNAVAILABLE"
    );
  }
}
