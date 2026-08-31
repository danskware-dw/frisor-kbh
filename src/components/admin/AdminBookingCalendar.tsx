"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  UserRound,
} from "lucide-react";

export type CalendarAppointment = {
  id: string;
  date: string;
  time: string;
  durationMinutes: number;
  treatmentName: string;
  customerName: string;
  employeeName: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  priceLabel: string | null;
};

type AdminBookingCalendarProps = {
  appointments: CalendarAppointment[];
  today: string;
};

const DAY_MS = 86_400_000;
const CALENDAR_START_MINUTES = 9 * 60;
const CALENDAR_END_MINUTES = 18 * 60;
const CALENDAR_HEIGHT = 648;

const statusStyles: Record<CalendarAppointment["status"], string> = {
  confirmed: "border-emerald-300 bg-emerald-50 text-emerald-950",
  pending: "border-amber-300 bg-amber-50 text-amber-950",
  cancelled: "border-red-300 bg-red-50 text-red-900 opacity-70",
  completed: "border-slate-300 bg-slate-100 text-slate-800",
};

const statusLabels: Record<CalendarAppointment["status"], string> = {
  confirmed: "Bekræftet",
  pending: "Afventer",
  cancelled: "Aflyst",
  completed: "Afsluttet",
};

function parseDateKey(dateKey: string) {
  return new Date(`${dateKey}T12:00:00`);
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * DAY_MS);
}

function startOfWeek(date: Date) {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));
  return result;
}

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("da-DK", { weekday: "short" })
    .format(date)
    .replace(".", "");
}

function formatLongDay(date: Date) {
  return new Intl.DateTimeFormat("da-DK", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatWeekRange(days: Date[]) {
  const first = days[0];
  const last = days[6];
  const sameMonth = first.getMonth() === last.getMonth();
  const firstLabel = new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    ...(sameMonth ? {} : { month: "short" as const }),
  }).format(first);
  const lastLabel = new Intl.DateTimeFormat("da-DK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(last);
  return `${firstLabel} – ${lastLabel}`;
}

function AppointmentDetails({ appointment }: { appointment: CalendarAppointment }) {
  return (
    <>
      <div className="truncate font-semibold">{appointment.time} · {appointment.customerName}</div>
      <div className="truncate text-[11px] opacity-80">{appointment.treatmentName}</div>
    </>
  );
}

export function AdminBookingCalendar({ appointments, today }: AdminBookingCalendarProps) {
  const todayDate = useMemo(() => parseDateKey(today), [today]);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(todayDate));
  const [selectedDate, setSelectedDate] = useState(today);

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, index) => addDays(weekStart, index)),
    [weekStart]
  );

  const weekAppointments = useMemo(() => {
    const first = toDateKey(days[0]);
    const last = toDateKey(days[6]);
    return appointments.filter((item) => item.date >= first && item.date <= last);
  }, [appointments, days]);

  const selectedAppointments = useMemo(
    () => weekAppointments
      .filter((item) => item.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [selectedDate, weekAppointments]
  );

  function moveWeek(amount: number) {
    const nextWeek = addDays(weekStart, amount * 7);
    setWeekStart(nextWeek);
    setSelectedDate(toDateKey(nextWeek));
  }

  function goToToday() {
    setWeekStart(startOfWeek(todayDate));
    setSelectedDate(today);
  }

  const selectedDateObject = parseDateKey(selectedDate);
  const hours = Array.from({ length: 10 }, (_, index) => index + 9);

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm" aria-labelledby="booking-calendar-title">
      <div className="flex flex-col gap-4 border-b border-gray-200 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-emerald-700" aria-hidden="true" />
            <h2 id="booking-calendar-title" className="text-lg font-semibold normal-case tracking-normal text-gray-950">
              Bookingkalender
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {formatWeekRange(days)} · {weekAppointments.length} {weekAppointments.length === 1 ? "booking" : "bookinger"}
          </p>
        </div>

        <div className="grid grid-cols-[auto_auto_auto_1fr] items-center gap-2 sm:flex sm:flex-wrap" aria-label="Kalendernavigation">
          <button
            type="button"
            onClick={() => moveWeek(-1)}
            aria-label="Forrige uge"
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={goToToday}
            className="h-11 cursor-pointer rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-800 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            I dag
          </button>
          <button
            type="button"
            onClick={() => moveWeek(1)}
            aria-label="Næste uge"
            className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-emerald-600"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
          <Link
            href="/admin/bookings"
            className="ml-auto inline-flex h-11 items-center justify-center rounded-lg bg-emerald-700 px-3 text-center text-sm font-semibold text-white hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 sm:px-4"
          >
            Vis alle bookinger
          </Link>
        </div>
      </div>

      {/* Compact agenda for phones and tablets */}
      <div className="p-3 sm:p-4 lg:hidden">
        <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Vælg dag">
          {days.map((day) => {
            const dateKey = toDateKey(day);
            const isSelected = selectedDate === dateKey;
            const isToday = today === dateKey;
            const dayCount = weekAppointments.filter((item) => item.date === dateKey).length;
            return (
              <button
                key={dateKey}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedDate(dateKey)}
                className={`min-h-16 min-w-0 cursor-pointer rounded-lg px-0.5 py-2 text-center transition-colors focus-visible:ring-2 focus-visible:ring-emerald-600 sm:px-1 ${
                  isSelected
                    ? "bg-emerald-700 text-white"
                    : isToday
                      ? "bg-emerald-50 text-emerald-900"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span className="block text-[11px] font-semibold uppercase">{formatDay(day)}</span>
                <span className="mt-0.5 block text-base font-bold tabular-nums">{day.getDate()}</span>
                <span className={`mx-auto mt-1 block h-1.5 w-1.5 rounded-full ${dayCount > 0 ? (isSelected ? "bg-white" : "bg-emerald-600") : "bg-transparent"}`} />
              </button>
            );
          })}
        </div>

        <h3 className="mt-5 text-base font-semibold normal-case tracking-normal text-gray-900">
          {formatLongDay(selectedDateObject)}
        </h3>
        <div className="mt-3 space-y-2">
          {selectedAppointments.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
              Ingen bookinger denne dag.
            </div>
          ) : (
            selectedAppointments.map((appointment) => (
              <Link
                key={appointment.id}
                href="/admin/bookings"
                className={`block rounded-lg border-l-4 p-4 transition-shadow hover:shadow-md ${statusStyles[appointment.status]}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{appointment.customerName}</p>
                    <p className="mt-0.5 text-sm">{appointment.treatmentName}</p>
                  </div>
                  <span className="rounded-full bg-white/70 px-2 py-1 text-xs font-semibold">
                    {statusLabels[appointment.status]}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-80">
                  <span className="inline-flex items-center gap-1.5"><Clock3 className="h-4 w-4" aria-hidden="true" />{appointment.time} · {appointment.durationMinutes} min</span>
                  <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4" aria-hidden="true" />{appointment.employeeName}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Studio-style weekly time grid for desktop */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))] border-b border-gray-200 bg-gray-50">
          <div className="border-r border-gray-200" />
          {days.map((day) => {
            const dateKey = toDateKey(day);
            const isToday = today === dateKey;
            const count = weekAppointments.filter((item) => item.date === dateKey).length;
            return (
              <div key={dateKey} className={`border-r border-gray-200 px-2 py-3 text-center last:border-r-0 ${isToday ? "bg-emerald-50" : ""}`}>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{formatDay(day)}</div>
                <div className={`mx-auto mt-1 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold tabular-nums ${isToday ? "bg-emerald-700 text-white" : "text-gray-900"}`}>
                  {day.getDate()}
                </div>
                <div className="mt-1 text-[11px] text-gray-500">{count || "Ingen"} {count === 1 ? "tid" : count > 1 ? "tider" : ""}</div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[72px_repeat(7,minmax(0,1fr))]">
          <div className="relative border-r border-gray-200 bg-gray-50" style={{ height: CALENDAR_HEIGHT }} aria-hidden="true">
            {hours.map((hour, index) => (
              <span
                key={hour}
                className="absolute right-3 -translate-y-1/2 text-xs font-medium tabular-nums text-gray-500"
                style={{ top: `${(index / 9) * 100}%` }}
              >
                {String(hour).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          {days.map((day) => {
            const dateKey = toDateKey(day);
            const dayAppointments = weekAppointments.filter((item) => item.date === dateKey);
            const isSunday = day.getDay() === 0;
            const isSaturday = day.getDay() === 6;
            return (
              <div
                key={dateKey}
                className={`relative border-r border-gray-200 last:border-r-0 ${isSunday ? "bg-gray-100" : "bg-white"}`}
                style={{ height: CALENDAR_HEIGHT }}
                aria-label={`${formatLongDay(day)}, ${dayAppointments.length} bookinger`}
              >
                {hours.slice(0, -1).map((hour, index) => (
                  <div
                    key={hour}
                    className="pointer-events-none absolute inset-x-0 border-t border-gray-100"
                    style={{ top: `${(index / 9) * 100}%` }}
                  />
                ))}
                {!isSunday && (
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 bg-gray-50/90"
                    style={{ height: `${((isSaturday ? 0 : 60) / 540) * 100}%` }}
                    aria-hidden="true"
                  />
                )}
                {isSaturday && (
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gray-50/90" style={{ height: `${(120 / 540) * 100}%` }} aria-hidden="true" />
                )}
                {isSunday && (
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Lukket
                  </div>
                )}
                {dayAppointments.map((appointment) => {
                  const start = timeToMinutes(appointment.time);
                  const top = ((start - CALENDAR_START_MINUTES) / (CALENDAR_END_MINUTES - CALENDAR_START_MINUTES)) * 100;
                  const height = Math.max((appointment.durationMinutes / (CALENDAR_END_MINUTES - CALENDAR_START_MINUTES)) * 100, 4.3);
                  return (
                    <Link
                      key={appointment.id}
                      href="/admin/bookings"
                      title={`${appointment.time} · ${appointment.customerName} · ${appointment.treatmentName} · ${statusLabels[appointment.status]}`}
                      className={`absolute inset-x-1 z-10 overflow-hidden rounded-md border-l-4 px-2 py-1 text-xs shadow-sm transition-shadow hover:z-20 hover:shadow-md focus-visible:z-20 focus-visible:ring-2 focus-visible:ring-emerald-600 ${statusStyles[appointment.status]}`}
                      style={{ top: `${Math.max(0, top)}%`, height: `${height}%`, minHeight: 28 }}
                    >
                      <AppointmentDetails appointment={appointment} />
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600 sm:px-6">
        {(Object.keys(statusLabels) as CalendarAppointment["status"][]).map((status) => (
          <span key={status} className="inline-flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-sm border ${statusStyles[status]}`} aria-hidden="true" />
            {statusLabels[status]}
          </span>
        ))}
      </div>
    </section>
  );
}
