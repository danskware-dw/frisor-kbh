import { ReactNode } from "react";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminSessionRefresh } from "@/components/admin/AdminSessionRefresh";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  return (
    <>
      <AdminSessionRefresh />
      <AdminShell adminName={admin.fullName}>{children}</AdminShell>
    </>
  );
}
