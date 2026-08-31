"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Haircut', value: 45 },
  { name: 'Beard Trim', value: 25 },
  { name: 'Combo', value: 20 },
  { name: 'Kids', value: 10 },
];

const COLORS = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

export function ServicePopularityChart() {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col sm:p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-6">Service Popularity</h3>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 300, height: 300 }}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="value"
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
