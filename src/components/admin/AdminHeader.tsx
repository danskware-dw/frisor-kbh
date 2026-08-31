"use client";

import { Bell, Menu, Search, UserCircle } from "lucide-react";

export function AdminHeader({
  adminName,
  onMenuClick,
}: {
  adminName: string;
  onMenuClick: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-gray-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 md:hidden"
        aria-label="Åbn menu"
      >
        <Menu className="h-6 w-6" aria-hidden="true" />
      </button>

      <span className="min-w-0 flex-1 truncate text-base font-bold tracking-tight text-gray-900 sm:hidden">
        FRISØR KBH
      </span>

      <div className="hidden min-w-0 flex-1 items-center sm:flex">
        {/* Search or Date Filter Placeholder */}
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
            placeholder="Search bookings..."
          />
        </div>
      </div>
      
      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-4">
        <button className="relative inline-flex h-11 w-11 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700" aria-label="Notifikationer">
          <Bell className="h-5 w-5" />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
        </button>
        <div className="flex items-center gap-2">
          <UserCircle className="h-8 w-8 text-gray-400" />
          <span className="hidden max-w-40 truncate text-sm font-medium text-gray-700 lg:inline">{adminName}</span>
        </div>
      </div>
    </header>
  );
}
