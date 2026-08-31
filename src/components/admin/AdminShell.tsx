"use client";

import { ReactNode, useEffect, useState } from "react";
import { X } from "lucide-react";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export function AdminShell({
  adminName,
  children,
}: {
  adminName: string;
  children: ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <div className="flex min-h-svh bg-gray-50 text-gray-950 [color-scheme:light]">
      <AdminSidebar className="sticky top-0 hidden h-svh shrink-0 md:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader adminName={adminName} onMenuClick={() => setMenuOpen(true)} />

        <main id="main-content" className="min-w-0 flex-1 bg-gray-50 p-4 sm:p-6">
          {children}
        </main>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-[300] md:hidden" role="dialog" aria-modal="true" aria-label="Admin navigation">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-gray-950/60 backdrop-blur-[2px]"
            onClick={() => setMenuOpen(false)}
            aria-label="Luk menu"
          />
          <div className="relative h-full w-[min(20rem,86vw)] shadow-2xl">
            <AdminSidebar className="h-full w-full" onNavigate={() => setMenuOpen(false)} />
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              aria-label="Luk menu"
            >
              <X className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
