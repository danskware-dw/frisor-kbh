"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import {
  setEmployeeStatus,
  type EmployeeStatusActionState,
} from "@/app/admin/settings/actions";
import { cn } from "@/lib/utils";

const initialState: EmployeeStatusActionState = {
  success: false,
  message: "",
};

type EmployeeStatusControlProps = {
  employee: {
    id: string;
    name: string;
    active: boolean;
  };
  canManage: boolean;
};

export function EmployeeStatusControl({
  employee,
  canManage,
}: EmployeeStatusControlProps) {
  const [state, formAction, pending] = useActionState(
    setEmployeeStatus,
    initialState
  );
  const displayedActive =
    state.success &&
    state.employeeId === employee.id &&
    state.isActive !== undefined
      ? state.isActive
      : employee.active;
  const isDisabled = pending || !canManage;
  const helperId = `employee-status-helper-${employee.id}`;
  const statusId = `employee-status-message-${employee.id}`;
  const describedBy = [
    !canManage ? helperId : null,
    state.message ? statusId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <form action={formAction} className="flex min-w-40 flex-col items-end gap-1.5">
      <input type="hidden" name="employeeId" value={employee.id} />
      <input
        type="hidden"
        name="nextStatus"
        value={displayedActive ? "inactive" : "active"}
      />
      <button
        type="submit"
        role="switch"
        aria-checked={displayedActive}
        aria-label={
          displayedActive
            ? `Skjul ${employee.name} fra booking`
            : `Gør ${employee.name} tilgængelig for booking`
        }
        aria-describedby={describedBy}
        disabled={isDisabled}
        className={cn(
          "inline-flex min-h-11 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition-[background-color,color,opacity] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-60",
          displayedActive ? "text-emerald-800" : "text-gray-700",
          !isDisabled && "cursor-pointer hover:bg-gray-50"
        )}
      >
        {pending ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : null}
        <span>{pending ? "Gemmer…" : displayedActive ? "Aktiv" : "Inaktiv"}</span>
        <span
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full ring-1 ring-inset transition-colors duration-200",
            displayedActive
              ? "bg-emerald-700 ring-emerald-700"
              : "bg-gray-400 ring-gray-400"
          )}
          aria-hidden="true"
        >
          <span
            className={cn(
              "absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 motion-reduce:transition-none",
              displayedActive ? "translate-x-5" : "translate-x-0"
            )}
          />
        </span>
      </button>

      {!canManage ? (
        <span id={helperId} className="text-xs text-gray-500">
          Kun administratorer kan ændre status
        </span>
      ) : null}

      {state.message ? (
        <p
          id={statusId}
          className={cn(
            "max-w-72 text-right text-xs leading-5",
            state.success ? "text-emerald-700" : "text-red-700"
          )}
          role={state.success ? "status" : "alert"}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
