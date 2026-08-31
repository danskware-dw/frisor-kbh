const appointments = [
  { id: 1, time: '09:00 AM', client: 'Lukas Nielsen', service: 'Haircut', status: 'Confirmed' },
  { id: 2, time: '10:30 AM', client: 'Emil Jensen', service: 'Combo', status: 'Pending' },
  { id: 3, time: '11:15 AM', client: 'Victor Hansen', service: 'Beard Trim', status: 'Confirmed' },
  { id: 4, time: '01:00 PM', client: 'Magnus Pedersen', service: 'Haircut', status: 'Confirmed' },
];

export function UpcomingAppointmentsTable() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 px-4 py-4 sm:px-6 sm:py-5">
        <h3 className="text-base font-semibold leading-6 text-gray-900">Today&apos;s Appointments</h3>
      </div>
      <div className="divide-y divide-gray-200 sm:hidden">
        {appointments.map((appt) => (
          <div key={appt.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{appt.client}</p>
                <p className="mt-1 text-sm text-gray-500">{appt.service} · {appt.time}</p>
              </div>
              <span className={`shrink-0 rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                appt.status === 'Confirmed'
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
              }`}>
                {appt.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="hidden overflow-x-auto sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-gray-900">Time</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Client</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Service</th>
              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {appointments.map((appt) => (
              <tr key={appt.id}>
                <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-900">{appt.time}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{appt.client}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{appt.service}</td>
                <td className="whitespace-nowrap px-3 py-4 text-sm">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    appt.status === 'Confirmed' 
                      ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                      : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                  }`}>
                    {appt.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
