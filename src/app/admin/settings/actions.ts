"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/admin";
import { getDb } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";

const statusInputSchema = z.object({
  userId: z.string().uuid(),
  nextStatus: z.enum(["active", "inactive"]),
});

export type AdminStatusActionState = {
  success: boolean;
  message: string;
  userId?: string;
  isActive?: boolean;
};

export async function setAdminStatus(
  _previousState: AdminStatusActionState,
  formData: FormData
): Promise<AdminStatusActionState> {
  const currentAdmin = await requireAdmin();

  if (currentAdmin.role !== "admin") {
    return {
      success: false,
      message: "Kun administratorer kan ændre adgangsstatus.",
    };
  }

  const parsed = statusInputSchema.safeParse({
    userId: formData.get("userId"),
    nextStatus: formData.get("nextStatus"),
  });

  if (!parsed.success) {
    return { success: false, message: "Statusændringen er ugyldig." };
  }

  if (parsed.data.userId === currentAdmin.id) {
    return {
      success: false,
      message: "Du kan ikke deaktivere din egen administratorkonto.",
      userId: parsed.data.userId,
    };
  }

  try {
    const db = getDb();
    const [targetAdmin] = await db
      .select({
        id: adminUsers.id,
        fullName: adminUsers.fullName,
        isActive: adminUsers.isActive,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, parsed.data.userId))
      .limit(1);

    if (!targetAdmin) {
      return { success: false, message: "Administratoren blev ikke fundet." };
    }

    const isActive = parsed.data.nextStatus === "active";

    if (targetAdmin.isActive !== isActive) {
      await db
        .update(adminUsers)
        .set({ isActive, updatedAt: new Date().toISOString() })
        .where(eq(adminUsers.id, targetAdmin.id));
    }

    revalidatePath("/admin/settings");

    return {
      success: true,
      message: `${targetAdmin.fullName} er nu ${isActive ? "aktiv" : "inaktiv"}.`,
      userId: targetAdmin.id,
      isActive,
    };
  } catch (error) {
    console.error("Failed to change admin status:", error);
    return {
      success: false,
      message: "Status kunne ikke ændres. Prøv igen.",
      userId: parsed.data.userId,
    };
  }
}
