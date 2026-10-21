import { and, asc, eq, gte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { bookings, customers, salonClosures } from "@/lib/db/schema";
import { getBusinessHoursForDate, getDateKeyInTimeZone } from "./business-hours";
import { BookingError } from "./errors";

export type SalonClosure = { date: string; message: string };
export type AdminSalonClosure = SalonClosure & {
  affectedBookings: { id: string; time: string; customerName: string | null; employeeName: string }[];
};

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((date) => {
  const parsed = new Date(`${date}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}, "Ugyldig dato.");

export function validateSalonClosureInput(input: { date: unknown; message?: unknown }): SalonClosure {
  const parsed = z.object({
    date: dateSchema,
    message: z.string().trim().max(300, "Beskeden må højst være 300 tegn.").default(""),
  }).safeParse(input);
  if (!parsed.success) throw new BookingError("Vælg en gyldig dato og en besked på højst 300 tegn.");
  if (parsed.data.date < getDateKeyInTimeZone()) {
    throw new BookingError("Du kan ikke oprette en lukkedag i fortiden.");
  }
  return parsed.data;
}

export async function listSalonClosures(fromDate = getDateKeyInTimeZone()): Promise<SalonClosure[]> {
  return getDb().select().from(salonClosures)
    .where(gte(salonClosures.date, fromDate)).orderBy(asc(salonClosures.date));
}

export async function assertSalonOpen(date: string, db: Pick<ReturnType<typeof getDb>, "select"> = getDb()) {
  const [closure] = await db.select({ date: salonClosures.date })
    .from(salonClosures).where(eq(salonClosures.date, date)).limit(1);
  if (closure || !getBusinessHoursForDate(date)) {
    throw new BookingError("Salonen er lukket den valgte dag. Vælg en anden dato.", 400, "CLOSED_DATE");
  }
}

export async function saveSalonClosure(input: { date: unknown; message?: unknown }) {
  const closure = validateSalonClosureInput(input);
  await getDb().transaction(async (tx) => {
    // The same date lock is taken by booking creation, so closing cannot race a new booking.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`salon:${closure.date}`}))`);
    await tx.insert(salonClosures).values(closure)
      .onConflictDoUpdate({ target: salonClosures.date, set: { message: closure.message } });
  });
  return closure;
}

export async function deleteSalonClosure(date: unknown) {
  const parsed = dateSchema.safeParse(date);
  if (!parsed.success) throw new BookingError("Ugyldig dato.");
  await getDb().transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`salon:${parsed.data}`}))`);
    await tx.delete(salonClosures).where(eq(salonClosures.date, parsed.data));
  });
}

export async function listAdminSalonClosures(): Promise<AdminSalonClosure[]> {
  const closures = await listSalonClosures();
  if (!closures.length) return [];
  const affected = await getDb().select({
    id: bookings.id, date: bookings.date, time: bookings.time,
    customerName: customers.name, employeeName: bookings.employeeName,
  }).from(bookings).leftJoin(customers, eq(bookings.customerId, customers.id))
    .where(and(inArray(bookings.date, closures.map((closure) => closure.date)),
      inArray(bookings.status, ["pending", "confirmed"])))
    .orderBy(asc(bookings.date), asc(bookings.time));
  return closures.map((closure) => ({
    ...closure, affectedBookings: affected.filter((booking) => booking.date === closure.date),
  }));
}
