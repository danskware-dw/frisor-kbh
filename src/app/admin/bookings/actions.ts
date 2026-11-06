"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { cancelBooking } from "@/lib/booking/cancel-booking";
import { BookingError } from "@/lib/booking/errors";

export type CancelBookingState = { success: boolean; message: string };

export async function cancelBookingAction(
  _previousState: CancelBookingState,
  formData: FormData
): Promise<CancelBookingState> {
  const admin = await requireAdmin();
  if (admin.role !== "admin") {
    return { success: false, message: "Kun administratorer kan aflyse bookinger." };
  }
  if (formData.get("confirm") !== "yes") {
    return { success: false, message: "Bekræft, at du vil aflyse bookingen." };
  }

  const bookingId = formData.get("bookingId");
  let alreadyCancelled: boolean;
  try {
    ({ alreadyCancelled } = await cancelBooking(bookingId));
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    return {
      success: false,
      message: error instanceof BookingError ? error.message : "Bookingen kunne ikke aflyses. Prøv igen.",
    };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${encodeURIComponent(bookingId as string)}`);
  revalidatePath("/booking");
  return {
    success: true,
    message: alreadyCancelled ? "Bookingen er allerede aflyst." : "Bookingen er aflyst. Tiden er nu ledig igen.",
  };
}
