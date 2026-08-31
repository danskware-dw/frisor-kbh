import { CalendarDays, DollarSign, Users, TrendingUp } from "lucide-react";
import { asc, eq } from "drizzle-orm";
import { Scorecard } from "@/components/admin/Scorecard";
import { BookingTrendsChart } from "@/components/admin/BookingTrendsChart";
import { ServicePopularityChart } from "@/components/admin/ServicePopularityChart";
import { UpcomingAppointmentsTable } from "@/components/admin/UpcomingAppointmentsTable";
import { AdminBookingCalendar } from "@/components/admin/AdminBookingCalendar";
import { getDateKeyInTimeZone } from "@/lib/booking/business-hours";
import { getDb } from "@/lib/db/client";
import { bookings, customers } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const db = getDb();
  const calendarRows = await db
    .select({
      id: bookings.id,
      date: bookings.date,
      time: bookings.time,
      durationMinutes: bookings.durationMinutes,
      treatmentName: bookings.treatmentName,
      employeeName: bookings.employeeName,
      status: bookings.status,
      priceLabel: bookings.priceLabel,
      customerName: customers.name,
    })
    .from(bookings)
    .leftJoin(customers, eq(bookings.customerId, customers.id))
    .orderBy(asc(bookings.date), asc(bookings.time));

  const calendarAppointments = calendarRows.map((row) => ({
    ...row,
    customerName: row.customerName ?? "Ukendt kunde",
  }));

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of today&apos;s business and upcoming appointments.
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <Scorecard
          title="Total Bookings (Today)"
          value="18"
          trend={{ value: "12%", positive: true }}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <Scorecard
          title="Revenue (Est. Today)"
          value="6,450 kr"
          trend={{ value: "8%", positive: true }}
          icon={<DollarSign className="h-5 w-5" />}
        />
        <Scorecard
          title="New Clients"
          value="4"
          trend={{ value: "2", positive: true }}
          icon={<Users className="h-5 w-5" />}
        />
        <Scorecard
          title="Utilization Rate"
          value="85%"
          trend={{ value: "5%", positive: false }}
          icon={<TrendingUp className="h-5 w-5" />}
        />
      </div>

      <AdminBookingCalendar
        appointments={calendarAppointments}
        today={getDateKeyInTimeZone()}
      />

      {/* Charts Row */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <BookingTrendsChart />
        </div>
        <div>
          <ServicePopularityChart />
        </div>
      </div>

      {/* Table Row */}
      <div>
        <UpcomingAppointmentsTable />
      </div>
    </div>
  );
}
