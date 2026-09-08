import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/booking/create-booking";
import { BookingError } from "@/lib/booking/errors";
import { createBookingSchema } from "@/lib/booking/validation";
import {
  sendBookingConfirmation,
  sendOwnerBookingNotification,
} from "@/lib/notifications/send-confirmation";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Ugyldige data." },
        { status: 400 }
      );
    }

    const booking = await createBooking(parsed.data);

    console.log(
      `[Booking] Created ${booking.id} for ${booking.customerName} in ${Date.now() - startTime}ms`
    );

    // Send emails synchronously before responding.
    // Wrapped in try/catch so email failures never block the booking response.
    try {
      const notifications = await Promise.allSettled([
        sendBookingConfirmation(booking),
        sendOwnerBookingNotification(booking),
      ]);

      const labels = ["customer confirmation", "owner notification"];
      notifications.forEach((notification, index) => {
        if (notification.status === "rejected") {
          console.error(
            `[Booking] ${labels[index]} failed for ${booking.id}:`,
            notification.reason
          );
        } else {
          console.log(
            `[Booking] ${labels[index]} sent for ${booking.id}`
          );
        }
      });
    } catch (emailError) {
      // Log but don't fail the booking
      console.error(
        `[Booking] Email sending failed for ${booking.id}:`,
        emailError
      );
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    if (error instanceof BookingError) {
      console.warn(
        `[Booking] Rejected: ${error.message} (${error.code}) in ${Date.now() - startTime}ms`
      );
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode }
      );
    }
    console.error("[API /bookings] Error:", error);
    return NextResponse.json(
      { error: "Booking kunne ikke gennemføres." },
      { status: 500 }
    );
  }
}
