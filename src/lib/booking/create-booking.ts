import { randomUUID } from "crypto";
import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { bookings, customers } from "@/lib/db/schema";
import { assertSlotAvailable } from "./availability";
import { getTreatmentById, getEmployeeById } from "./catalog";
import { BookingError } from "./errors";
import type { CreateBookingInput } from "./validation";
import { isValidPhone, isValidEmail } from "./validation";
import { getBookingPriceLabel } from "@/data/opening-offer";

export type BookingResult = {
  id: string;
  treatmentId: string;
  treatmentName: string;
  priceLabel: string | null;
  employeeId: string;
  employeeName: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  date: string;
  time: string;
  durationMinutes: number;
  status: string;
  notes: string;
  createdAt: string;
};

/** Create a booking inside a PostgreSQL transaction with advisory locking. */
export async function createBooking(
  input: CreateBookingInput
): Promise<BookingResult> {
  const normalizedPhone = input.customerPhone.replace(/\s+/g, "");
  if (!isValidPhone(normalizedPhone)) {
    throw new BookingError("Telefonnummeret er ugyldigt.", 400);
  }
  const normalizedEmail = input.customerEmail.trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    throw new BookingError("E-mailadressen er ugyldig.", 400);
  }

  const treatment = await getTreatmentById(input.treatmentId);
  const employee = await getEmployeeById(input.employeeId);
  const bookingPriceLabel = getBookingPriceLabel(treatment);

  const db = getDb();

  return await db.transaction(async (tx) => {
    // Advisory lock to prevent race conditions on the same employee+date
    const bookingLockKey = `booking:${input.employeeId}:${input.date}`;
    await tx.execute(
      sql`SELECT pg_advisory_xact_lock(hashtext(${bookingLockKey}))`
    );

    // Verify the slot is still available
    await assertSlotAvailable(
      {
        date: input.date,
        time: input.time,
        employeeId: input.employeeId,
        durationMinutes: treatment.durationMinutes,
      },
      tx
    );

    // Find or create customer
    let customerId: string;
    const [existingCustomer] = await tx
      .select()
      .from(customers)
      .where(eq(customers.email, normalizedEmail))
      .limit(1);

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      customerId = randomUUID();
      await tx.insert(customers).values({
        id: customerId,
        name: input.customerName.trim(),
        email: normalizedEmail,
        phone: normalizedPhone,
        notes: "",
        marketingConsent: false,
      });
    }

    // Create the booking
    const bookingId = `bk_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const createdAt = new Date().toISOString();

    await tx.insert(bookings).values({
      id: bookingId,
      treatmentId: treatment.id,
      treatmentName: treatment.name,
      priceLabel: bookingPriceLabel,
      employeeId: employee.id,
      employeeName: employee.name,
      customerId,
      date: input.date,
      time: input.time,
      durationMinutes: treatment.durationMinutes,
      status: "confirmed",
      notes: input.notes?.trim() ?? "",
      bookingSource: "online",
      createdAt,
    });

    return {
      id: bookingId,
      treatmentId: treatment.id,
      treatmentName: treatment.name,
      priceLabel: bookingPriceLabel,
      employeeId: employee.id,
      employeeName: employee.name,
      customerId,
      customerName: input.customerName.trim(),
      customerPhone: normalizedPhone,
      customerEmail: normalizedEmail,
      date: input.date,
      time: input.time,
      durationMinutes: treatment.durationMinutes,
      status: "confirmed",
      notes: input.notes?.trim() ?? "",
      createdAt,
    };
  });
}
