import { getDb } from "@/lib/db/client";
import { adminUsers, employees } from "@/lib/db/schema";
import { asc, desc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth/admin";
import { AdminStatusControl } from "@/components/admin/AdminStatusControl";
import { EmployeeStatusControl } from "@/components/admin/EmployeeStatusControl";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const currentAdmin = await requireAdmin();
  const db = getDb();
  
  const [users, staffMembers] = await Promise.all([
    db.select().from(adminUsers).orderBy(desc(adminUsers.createdAt)),
    db.select().from(employees).orderBy(asc(employees.createdAt)),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your shop settings and administrator preferences.
        </p>
      </div>

      {/* General Settings */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Generelle Indstillinger</h2>
          <p className="mt-1 text-sm text-gray-500">Grundlæggende information om din salon.</p>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Salonens Navn</label>
              <input
                type="text"
                defaultValue="FRISØR KBH"
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kontakt Email</label>
              <input
                type="email"
                defaultValue="frisorkbh@hotmail.com"
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-500 shadow-sm focus:border-emerald-500 focus:ring-emerald-500 sm:text-sm border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Valuta</label>
              <select disabled className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-500 shadow-sm sm:text-sm border">
                <option>DKK - Danske Kroner</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Booking Varsel</label>
              <select disabled className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 py-2 px-3 text-sm text-gray-500 shadow-sm sm:text-sm border">
                <option>Minimum 2 timer før</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button disabled className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white opacity-50 cursor-not-allowed">
              Gem Ændringer
            </button>
          </div>
        </div>
      </div>

      {/* Booking employees */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Bookingmedarbejdere</h2>
          <p className="mt-1 text-sm text-gray-500">
            Styr hvem kunder kan vælge, når de bestiller en tid.
          </p>
        </div>

        {staffMembers.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">Ingen bookingmedarbejdere fundet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-white text-xs uppercase text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">Navn</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Booking</th>
                  <th scope="col" className="px-6 py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {staffMembers.map((employee) => (
                  <tr key={employee.id} className="transition-colors hover:bg-gray-50/50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-medium text-gray-900">{employee.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      {employee.active ? "Synlig for kunder" : "Skjult for kunder"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <EmployeeStatusControl
                        employee={{
                          id: employee.id,
                          name: employee.name,
                          active: employee.active,
                        }}
                        canManage={currentAdmin.role === "admin"}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Administrator access */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50/50 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Dashboard-adgang</h2>
            <p className="mt-1 text-sm text-gray-500">
              Separate login-konti til administration. Dette er ikke bookingmedarbejdere.
            </p>
          </div>
          <button className="rounded-md bg-white border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50">
            Tilføj Admin
          </button>
        </div>
        
        {users.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm text-gray-500">Ingen administratorer fundet i databasen.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-white text-xs uppercase text-gray-400">
                <tr>
                  <th scope="col" className="px-6 py-3 font-semibold">Navn</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Email</th>
                  <th scope="col" className="px-6 py-3 font-semibold">Rolle</th>
                  <th scope="col" className="px-6 py-3 font-semibold text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="font-medium text-gray-900">{user.fullName}</div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      {user.email}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 capitalize">
                      {user.role}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <AdminStatusControl
                        user={{
                          id: user.id,
                          fullName: user.fullName,
                          isActive: user.isActive,
                        }}
                        canManage={currentAdmin.role === "admin"}
                        isCurrent={currentAdmin.id === user.id}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
