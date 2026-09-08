"use client";

import { useActionState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import {
  setAdminStatus,
  type AdminStatusActionState,
} from "@/app/admin/settings/actions";
import { cn } from "@/lib/utils";

const initialState: AdminStatusActionState = {
  success: false,
  message: "",
};

type AdminStatusControlProps = {
  user: {
    id: string;
    fullName: string;
    isActive: boolean;
  };
  canManage: boolean;
  isCurrent: boolean;
};

export function AdminStatusControl({
  user,
  canManage,
  isCurrent,
}: AdminStatusControlProps) {
  const [state, formAction, pending] = useActionState(
    setAdminStatus,
    initialState
  );
  const displayedActive =
    state.success && state.userId === user.id && state.isActive !== undefined
      ? state.isActive
      : user.isActive;
  const isDisabled = pending || !canManage || isCurrent;
  const helperId = `admin-status-helper-${user.id}`;
  const statusId = `admin-status-message-${user.id}`;
  const describedBy = [
    isCurrent || !canManage ? helperId : null,
    state.message ? statusId : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <form action={formAction} className="flex min-w-40 flex-col items-end gap-1.5">
      <input type="hidden" name="userId" value={user.id} />
      <input
        type="hidden"
        name="nextStatus"
        value={displayedActive ? "inactive" : "active"}
      />
      <button
        type="submit"
        role="switch"
        aria-checked={displayedActive}
        aria-label={`${displayedActive ? "Deaktivér" : "Aktivér"} ${user.fullName}`}
        aria-describedby={describedBy}
        disabled={isDisabled}
        className={cn(
          "group inline-flex min-h-11 items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm font-semibold transition-[background-color,color,opacity] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-65",
          displayedActive
            ? "text-emerald-800"
            : "text-gray-700",
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
        {isCurrent ? (
          <LockKeyhole className="h-4 w-4 text-gray-500" aria-hidden="true" />
        ) : null}
      </button>

      {isCurrent ? (
        <span id={helperId} className="text-xs text-gray-500">
          Din konto kan ikke deaktiveres
        </span>
      ) : !canManage ? (
        <span id={helperId} className="text-xs text-gray-500">
          Kun administratorer kan ændre status
        </span>
      ) : null}

      {state.message ? (
        <p
          id={statusId}
          className={cn(
            "max-w-64 text-right text-xs leading-5",
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
