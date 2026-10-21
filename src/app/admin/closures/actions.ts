"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/admin";
import { BookingError } from "@/lib/booking/errors";
import { deleteSalonClosure, saveSalonClosure } from "@/lib/booking/salon-closures";

export type ClosureActionState = { success: boolean; message: string };

export async function updateSalonClosure(
  _previousState: ClosureActionState,
  formData: FormData
): Promise<ClosureActionState> {
  const admin = await requireAdmin();
  if (admin.role !== "admin") {
    return { success: false, message: "Kun administratorer kan ændre lukkedage." };
  }

  const intent = formData.get("intent");
  try {
    if (intent === "reopen") {
      await deleteSalonClosure(formData.get("date"));
    } else if (intent === "close") {
      await saveSalonClosure({ date: formData.get("date"), message: formData.get("message") });
    } else {
      return { success: false, message: "Handlingen er ugyldig." };
    }
  } catch (error) {
    console.error("Failed to update salon closure:", error);
    return {
      success: false,
      message: error instanceof BookingError ? error.message : "Lukkedagen kunne ikke ændres. Prøv igen.",
    };
  }

  revalidatePath("/");
  revalidatePath("/booking");
  revalidatePath("/admin");
  return {
    success: true,
    message: intent === "reopen"
      ? "Lukkedagen er fjernet. Datoen følger nu de normale åbningstider."
      : "Lukkedagen er gemt. Nye bookinger er blokeret på datoen, og beskeden vises på hjemmesiden.",
  };
}
