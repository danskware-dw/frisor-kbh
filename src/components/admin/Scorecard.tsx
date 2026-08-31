import { ReactNode } from "react";

export function Scorecard({ 
  title, 
  value, 
  trend, 
  icon 
}: { 
  title: string; 
  value: string; 
  trend?: { value: string; positive: boolean };
  icon: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className="rounded-md bg-emerald-50 p-2 text-emerald-600">
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        {trend && (
          <span className={`text-sm font-medium ${trend.positive ? "text-emerald-600" : "text-red-600"}`}>
            {trend.positive ? "+" : "-"}{trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
