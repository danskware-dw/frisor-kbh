"use server";

import { and, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginState = { error?: string } | undefined;

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Skriv en gyldig e-mail og adgangskode." };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error && error.code !== "invalid_credentials") {
    // Network failure, quota restriction or Supabase outage — not a wrong password.
    console.error("Supabase sign-in failed:", error.status, error.code, error.message);
    return { error: "Login er midlertidigt utilgængeligt. Prøv igen om lidt." };
  }
  if (error || !data.user) return { error: "E-mail eller adgangskode er forkert." };

  const [admin] = await getDb()
    .select({ id: adminUsers.id })
    .from(adminUsers)
    .where(
      and(
        eq(adminUsers.authUserId, data.user.id),
        eq(adminUsers.isActive, true)
      )
    )
    .limit(1);

  if (!admin) {
    await supabase.auth.signOut();
    return { error: "Denne konto har ikke administratoradgang." };
  }

  redirect("/admin");
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
