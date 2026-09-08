"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Phone,
  Scissors,
  UserRound,
} from "lucide-react";
import BookingCalendar from "@/components/booking/BookingCalendar";
import {
  formatDateLabel,
  isValidEmail,
  isValidPhone,
} from "@/lib/booking-utils";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/data/site";
import {
  getBookingPriceLabel,
  getOpeningOffer,
  openingOffer,
} from "@/data/opening-offer";

type CustomerState = {
  name: string;
  phone: string;
  email: string;
  notes: string;
};

type Category = { id: string; name: string; description: string };
type Treatment = {
  id: string;
  categoryId: string;
  name: string;
  durationMinutes: number;
  price: string;
};
type Employee = { id: string; name: string };
type Catalog = {
  categories: Category[];
  treatments: Treatment[];
  employees: Employee[];
};

const BOOKING_STATE_KEY = "frisor-kbh-booking-state";

type BookingStep = { id: number; label: string };

function displayEmployeeName(name?: string) {
  return name?.trim() || "Valgfri medarbejder";
}

function buildCalendarUrl(
  date: string,
  time: string,
  durationMinutes: number,
  treatmentName: string
) {
  const [hour, minute] = time.split(":").map(Number);
  const endMinutes = hour * 60 + minute + durationMinutes;
  const endHour = Math.floor(endMinutes / 60) % 24;
  const endMinute = endMinutes % 60;
  const compactDate = date.replaceAll("-", "");
  const formatTime = (value: number) => value.toString().padStart(2, "0");
  const dates = `${compactDate}T${formatTime(hour)}${formatTime(minute)}00/${compactDate}T${formatTime(endHour)}${formatTime(endMinute)}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${treatmentName} hos FRISØR KBH`,
    dates,
    ctz: "Europe/Copenhagen",
    location: `${siteConfig.contact.address}, ${siteConfig.contact.postalCode} ${siteConfig.contact.city}`,
    details: `Booking hos FRISØR KBH. Telefon: ${siteConfig.contact.phone}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export default function BookingWizard() {
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get("service");
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [step, setStep] = useState(0);
  const [selectedTreatment, setSelectedTreatment] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerState>({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof CustomerState, string>>
  >({});
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorAlertRef = useRef<HTMLDivElement>(null);
  const hasRestoredState = useRef(false);

  // ── Fetch catalog on mount ──
  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);
    setError(null);

    fetch("/api/services", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Kunne ikke hente behandlinger.");
        return response.json() as Promise<Catalog>;
      })
      .then((payload) => {
        if (cancelled) return;
        setCatalog(payload);

        const storedState = (() => {
          try {
            return JSON.parse(sessionStorage.getItem(BOOKING_STATE_KEY) ?? "null") as {
              treatment?: string;
              employee?: string;
              date?: string;
              customer?: Partial<CustomerState>;
            } | null;
          } catch {
            return null;
          }
        })();

        const requestedTreatment = initialServiceId ?? storedState?.treatment;
        const restoredTreatment = payload.treatments.some(
          (treatment) => treatment.id === requestedTreatment
        )
          ? requestedTreatment ?? null
          : null;
        const soleEmployee = payload.employees.length === 1 ? payload.employees[0] : null;
        const restoredEmployee = soleEmployee?.id ?? (
          payload.employees.some((employee) => employee.id === storedState?.employee)
            ? storedState?.employee ?? null
            : null
        );

        if (restoredTreatment) {
          setSelectedTreatment(restoredTreatment);
          setSelectedEmployee(restoredEmployee);
          setSelectedDate(storedState?.date ?? null);
          setCustomer((current) => ({ ...current, ...storedState?.customer }));
          setStep(restoredEmployee ? 2 : 1);
        }
        hasRestoredState.current = true;
      })
      .catch((fetchError: Error) => {
        if (!cancelled) setError(fetchError.message);
      })
      .finally(() => {
        if (!cancelled) setLoadingCatalog(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialServiceId]);

  const allTreatments = useMemo(() => catalog?.treatments ?? [], [catalog]);
  const allEmployees = useMemo(() => catalog?.employees ?? [], [catalog]);
  const offerTreatment = useMemo(
    () =>
      allTreatments.find(
        (treatment) => treatment.id === openingOffer.treatmentId
      ) ?? null,
    [allTreatments]
  );

  const selectedTreatmentObject = useMemo(
    () => allTreatments.find((t) => t.id === selectedTreatment) ?? null,
    [allTreatments, selectedTreatment]
  );
  const selectedEmployeeObject = useMemo(
    () => allEmployees.find((e) => e.id === selectedEmployee) ?? null,
    [allEmployees, selectedEmployee]
  );
  const calendarUrl = useMemo(() => {
    if (!selectedDate || !selectedTime || !selectedTreatmentObject) return null;
    return buildCalendarUrl(
      selectedDate,
      selectedTime,
      selectedTreatmentObject.durationMinutes,
      selectedTreatmentObject.name
    );
  }, [selectedDate, selectedTime, selectedTreatmentObject]);
  const hasSingleEmployee = allEmployees.length === 1;
  const visibleSteps = useMemo<BookingStep[]>(
    () => [
      { id: 0, label: "Behandling" },
      ...(!hasSingleEmployee ? [{ id: 1, label: "Medarbejder" }] : []),
      { id: 2, label: "Dato & tid" },
      { id: 3, label: "Oplysninger" },
    ],
    [hasSingleEmployee]
  );
  const activeStepIndex = Math.max(
    0,
    visibleSteps.findIndex((bookingStep) => bookingStep.id === step)
  );

  // ── Fetch available slots when date/employee/treatment change ──
  useEffect(() => {
    if (!selectedDate || !selectedEmployee || !selectedTreatment) {
      setAvailableSlots([]);
      return;
    }

    let cancelled = false;
    setLoadingSlots(true);
    setError(null);

    fetch(
      `/api/availability?date=${encodeURIComponent(selectedDate)}&employeeId=${encodeURIComponent(selectedEmployee)}&treatmentId=${encodeURIComponent(selectedTreatment)}`,
      { cache: "no-store" }
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Kunne ikke hente ledige tider.");
        return response.json();
      })
      .then((payload) => {
        if (!cancelled) {
          const fetchedSlots = Array.isArray(payload.slots) ? payload.slots : [];
          
          // Filter out past slots if the selected date is today
          const now = new Date();
          const [year, month, day] = selectedDate.split('-').map(Number);
          
          let validSlots = fetchedSlots;
          
          if (
            year === now.getFullYear() &&
            month === now.getMonth() + 1 &&
            day === now.getDate()
          ) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            validSlots = fetchedSlots.filter((slot: string) => {
              const [slotHour, slotMinute] = slot.split(':').map(Number);
              if (slotHour > currentHour) return true;
              if (slotHour === currentHour && slotMinute > currentMinute) return true;
              return false;
            });
          }
          
          setAvailableSlots(validSlots);
        }
      })
      .catch((fetchError: Error) => {
        if (!cancelled) {
          setAvailableSlots([]);
          setError(fetchError.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, selectedEmployee, selectedTreatment]);

  useEffect(() => {
    if (!loadingCatalog) stepHeadingRef.current?.focus();
  }, [step, loadingCatalog]);

  useEffect(() => {
    if (error) errorAlertRef.current?.focus();
  }, [error]);

  useEffect(() => {
    if (!hasRestoredState.current || loadingCatalog || successId) return;
    sessionStorage.setItem(
      BOOKING_STATE_KEY,
      JSON.stringify({
        treatment: selectedTreatment,
        employee: selectedEmployee,
        date: selectedDate,
        customer,
      })
    );
  }, [customer, loadingCatalog, selectedDate, selectedEmployee, selectedTreatment, successId]);

  useEffect(() => {
    const hasUnsavedDetails =
      step === 3 && !successId && Object.values(customer).some((value) => value.trim());
    if (!hasUnsavedDetails) return;

    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [customer, step, successId]);

  const goToStep = (nextStep: number) => {
    setError(null);
    setStep(nextStep);
  };

  const chooseTreatment = (treatmentId: string) => {
    setSelectedTreatment(treatmentId);
    const soleEmployee = allEmployees.length === 1 ? allEmployees[0].id : null;
    setSelectedEmployee(soleEmployee);
    setSelectedDate(null);
    setSelectedTime(null);
    goToStep(soleEmployee ? 2 : 1);
  };

  const chooseEmployee = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setSelectedDate(null);
    setSelectedTime(null);
    goToStep(2);
  };

  const goBackFromDate = () => goToStep(hasSingleEmployee ? 0 : 1);

  const goToCompletedStep = (targetStep: number) => {
    if (step === 4 || targetStep >= step) return;
    goToStep(targetStep);
  };

  const validateCustomer = (): keyof CustomerState | null => {
    const nextErrors: Partial<Record<keyof CustomerState, string>> = {};
    if (!customer.name.trim()) nextErrors.name = "Skriv dit navn.";
    if (!customer.phone.trim()) nextErrors.phone = "Skriv dit telefonnummer.";
    else if (!isValidPhone(customer.phone))
      nextErrors.phone = "Telefonnummeret ser ikke rigtigt ud.";
    if (!customer.email.trim()) nextErrors.email = "Skriv din e-mail.";
    if (customer.email.trim() && !isValidEmail(customer.email))
      nextErrors.email = "E-mailen ser ikke rigtigt ud.";

    setFieldErrors(nextErrors);
    const invalidFields: (keyof CustomerState)[] = ["name", "phone", "email"];
    return invalidFields.find((field) => nextErrors[field]) ?? null;
  };

  const clearFieldError = (field: keyof CustomerState) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!selectedTreatmentObject || !selectedEmployeeObject || !selectedDate || !selectedTime) {
      setError("Bookingflowet mangler valg. Start fra toppen.");
      return;
    }

    const firstInvalidField = validateCustomer();
    if (firstInvalidField) {
      document.getElementById(`booking-${firstInvalidField}`)?.focus();
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treatmentId: selectedTreatmentObject.id,
          employeeId: selectedEmployeeObject.id,
          date: selectedDate,
          time: selectedTime,
          customerName: customer.name.trim(),
          customerPhone: customer.phone.trim(),
          customerEmail: customer.email.trim(),
          notes: customer.notes.trim(),
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? `Booking kunne ikke gennemføres. Prøv igen, eller ring til os på ${siteConfig.contact.phone}.`);
      }

      setSuccessId(payload.booking?.id ?? "OK");
      sessionStorage.removeItem(BOOKING_STATE_KEY);
      goToStep(4);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : `Booking kunne ikke gennemføres. Prøv igen, eller ring til os på ${siteConfig.contact.phone}.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    sessionStorage.removeItem(BOOKING_STATE_KEY);
    setStep(0);
    setSelectedTreatment(null);
    setSelectedEmployee(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setAvailableSlots([]);
    setCustomer({ name: "", phone: "", email: "", notes: "" });
    setFieldErrors({});
    setError(null);
    setSuccessId(null);
  };

  return (
    <div className="space-y-6 md:space-y-7">
      <div className="space-y-3 text-center">
        <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--color-brand-light)]">
          [ Book tid ]
        </div>
        <div className="mx-auto max-w-[820px] space-y-3">
          <h1 className="text-balance text-[38px] font-bold leading-[0.98] tracking-[-0.04em] text-white sm:text-[46px] lg:text-[58px]">
            Booking hos FRISØR KBH
          </h1>
          <p className="mx-auto max-w-[760px] text-pretty text-[15px] leading-[1.7] text-[var(--color-text-muted)] sm:text-[17px]">
            Vælg behandling og ledig tid — book din frisørtid på Vesterbrogade
            171, eller ring, hvis du hellere vil aftale tiden telefonisk.
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[var(--color-brand)]/30 bg-white shadow-xl md:rounded-[28px]">
        <nav aria-label="Booking trin">
          <div className="border-b border-gray-200 px-5 py-4 sm:hidden">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="font-semibold text-gray-900">
                {step === 4 ? "Booking gennemført" : visibleSteps[activeStepIndex]?.label}
              </span>
              <span className="text-gray-600">
                {step === 4
                  ? `${visibleSteps.length} af ${visibleSteps.length}`
                  : `Trin ${activeStepIndex + 1} af ${visibleSteps.length}`}
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-200" aria-hidden="true">
              <div
                className="h-full rounded-full bg-emerald-700 transition-[width] duration-300"
                style={{
                  width: `${step === 4 ? 100 : ((activeStepIndex + 1) / visibleSteps.length) * 100}%`,
                }}
              />
            </div>
          </div>
          <ol
            className="hidden border-b border-gray-200 sm:grid"
            style={{ gridTemplateColumns: `repeat(${visibleSteps.length}, minmax(0, 1fr))` }}
          >
            {visibleSteps.map((bookingStep, index) => {
              const active = step === bookingStep.id;
              const completed = step === 4 || index < activeStepIndex;
              const canNavigate = step !== 4 && completed;
              return (
                <li
                  key={bookingStep.id}
                  aria-current={active ? "step" : undefined}
                  className="text-center"
                >
                  <button
                    type="button"
                    disabled={!canNavigate}
                    onClick={() => goToCompletedStep(bookingStep.id)}
                    className={cn(
                      "flex w-full flex-col items-center gap-2 px-3 py-4 text-center transition-[background-color,color] md:gap-3 md:px-4 md:py-5",
                      canNavigate && "cursor-pointer hover:bg-emerald-50",
                      !canNavigate && "cursor-default"
                    )}
                    aria-label={
                      canNavigate ? `Gå tilbage til ${bookingStep.label}` : bookingStep.label
                    }
                  >
                    <span
                      className={cn(
                      "flex h-11 w-11 items-center justify-center rounded-full border text-[15px] font-semibold transition-[background-color,border-color,color] md:h-12 md:w-12 md:text-[16px]",
                      active || completed
                        ? "border-emerald-700 bg-emerald-700 text-white"
                        : "border-gray-300 bg-white text-gray-600"
                    )}
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.16em] text-gray-600 md:text-[12px] md:tracking-[0.2em]">
                      {bookingStep.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="px-4 py-6 md:px-7 md:py-7 lg:px-8 lg:py-8">
          {error ? (
            <div
              ref={errorAlertRef}
              role="alert"
              tabIndex={-1}
              className="mb-6 rounded-[18px] border border-red-300 bg-red-50 px-4 py-3 text-[14px] text-red-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"
            >
              {error}
            </div>
          ) : null}

          {loadingCatalog ? (
            <div
              aria-live="polite"
              aria-label="Henter behandlinger…"
              className="py-8 space-y-4"
            >
              {/* Skeleton header */}
              <div className="mx-auto mb-8 h-6 w-48 animate-pulse rounded-lg bg-gray-200" />
              {/* Skeleton cards */}
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded-xl bg-gray-200" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-3/4 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="h-6 w-16 flex-shrink-0 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : null}

          {!loadingCatalog && !catalog ? (
            <p className="py-10 text-center text-[15px] text-red-800" role="alert">
              Vi kunne ikke hente behandlinger lige nu. Prøv igen senere, eller ring til os på {siteConfig.contact.phone}.
            </p>
          ) : null}

          {/* ── Step 0: Choose Treatment ── */}
          {!loadingCatalog && catalog && step === 0 ? (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-balance text-[34px] font-bold leading-none text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 md:text-[42px]"
                >
                  Vælg behandling
                </h2>
                <p className="mx-auto max-w-[620px] text-[15px] leading-[1.7] text-gray-500 md:text-[16px]">
                  Vælg den behandling, der passer bedst til dit besøg.
                </p>
              </div>

              {offerTreatment ? (
                <aside
                  aria-labelledby="booking-offer-title"
                  aria-describedby="booking-offer-description"
                  className="overflow-hidden rounded-[22px] border border-[var(--color-brand)]/60 bg-gray-950 px-5 py-5 text-white shadow-md md:px-6"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--color-brand)]/40 bg-[var(--color-brand)]/10 text-[var(--color-brand-light)]">
                        <Scissors className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-brand-light)]">
                          {openingOffer.badge}
                        </p>
                        <h3 id="booking-offer-title" className="mt-1 text-[22px] font-bold leading-tight text-white md:text-[26px]">
                          {openingOffer.treatmentName} kun {openingOffer.priceLabel}
                        </h3>
                        <p id="booking-offer-description" className="mt-1 text-[14px] leading-6 text-gray-300">
                          Vælg åbningstilbuddet her, eller find behandlingen i listen nedenfor.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => chooseTreatment(offerTreatment.id)}
                      className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-emerald-700 px-5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {openingOffer.ctaLabel}
                    </button>
                  </div>
                </aside>
              ) : null}

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {allTreatments.map((treatment) => {
                  const offer = getOpeningOffer(treatment.id);

                  return (
                    <button
                      key={treatment.id}
                      type="button"
                      onClick={() => chooseTreatment(treatment.id)}
                      className={cn(
                        "relative rounded-[22px] border bg-white px-5 py-5 text-left transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-emerald-700 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700",
                        offer ? "border-emerald-700 shadow-sm" : "border-gray-300"
                      )}
                    >
                      {offer ? (
                        <span className="mb-3 inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-900">
                          {offer.badge}
                        </span>
                      ) : null}
                      <h3 className="text-[24px] font-bold leading-none text-gray-900 md:text-[28px]">
                        {treatment.name}
                      </h3>
                      {offer ? (
                        <p className="mt-3 flex flex-wrap items-baseline gap-2 text-[14px]">
                          <span className="text-gray-500 line-through" aria-hidden="true">
                            {treatment.price}
                          </span>
                          <span className="text-[17px] font-bold text-emerald-800" aria-hidden="true">
                            {offer.priceLabel}
                          </span>
                          <span className="sr-only">
                            Normalpris {treatment.price}. Tilbudspris {offer.priceLabel}.
                          </span>
                        </p>
                      ) : (
                        <p className="mt-3 text-[14px] font-semibold text-emerald-800">
                          {treatment.price}
                        </p>
                      )}
                      <p className="mt-1 text-[14px] text-gray-500">
                        Ca. {treatment.durationMinutes} min
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* ── Step 1: Choose Employee ── */}
          {!loadingCatalog && catalog && step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-balance text-[34px] font-bold leading-none text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 md:text-[42px]"
                >
                  Vælg medarbejder
                </h2>
                <p className="mx-auto max-w-[620px] text-[15px] leading-[1.7] text-gray-500 md:text-[16px]">
                  Vælg den medarbejder du ønsker tid hos.
                </p>
              </div>
              <div className="mx-auto grid max-w-2xl gap-3 md:grid-cols-2">
                {allEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => chooseEmployee(employee.id)}
                    className="rounded-[22px] border border-gray-300 bg-white px-5 py-6 text-center transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:border-emerald-700 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                  >
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600">
                      <UserRound className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="text-[24px] font-bold leading-none text-gray-900 md:text-[28px]">
                      {displayEmployeeName(employee.name)}
                    </h3>
                  </button>
                ))}
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => goToStep(0)}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 bg-white px-6 text-[15px] font-medium text-gray-800 transition-[background-color,border-color] hover:border-gray-400 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Tilbage til behandlinger
                </button>
              </div>
            </div>
          ) : null}

          {/* ── Step 2: Choose Date & Time ── */}
          {!loadingCatalog && catalog && step === 2 ? (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-balance text-[34px] font-bold leading-none text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 md:text-[42px]"
                >
                  Vælg dato & tid
                </h2>
                <p className="mx-auto max-w-[620px] text-[15px] leading-[1.7] text-gray-500 md:text-[16px]">
                  Vælg en dag i kalenderen og derefter en ledig tid.
                </p>
              </div>

              <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
                <BookingCalendar
                  value={selectedDate ?? undefined}
                  onChange={(date) => {
                    setSelectedDate(date);
                    setSelectedTime(null);
                    setError(null);
                  }}
                />

                <div className="rounded-[22px] border border-gray-200 bg-white p-4 md:p-5">
                  <div className="mb-4 flex items-center gap-2.5 text-gray-600">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                    <span className="text-[12px] uppercase tracking-[0.16em]">
                      Ledige tider
                    </span>
                  </div>

                  <div aria-live="polite" aria-atomic="true">
                  {!selectedDate ? (
                    <p className="text-[14px] leading-[1.7] text-gray-500">
                      Vælg først en dato for at se ledige tider.
                    </p>
                  ) : loadingSlots ? (
                    <p className="text-[14px] leading-[1.7] text-gray-500">
                      Henter ledige tider…
                    </p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-[14px] leading-[1.7] text-gray-500">
                      Ingen ledige tider på den valgte dag. Prøv en anden dato, eller ring til os på {siteConfig.contact.phone}.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[14px] leading-[1.7] text-gray-500">
                        {formatDateLabel(selectedDate)}
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => {
                              setSelectedTime(slot);
                              goToStep(3);
                            }}
                            className={cn(
                              "min-h-11 rounded-[14px] border px-3.5 py-2.5 text-[14px] font-medium tabular-nums transition-[background-color,border-color,color]",
                              selectedTime === slot
                                ? "border-emerald-600 bg-emerald-600 text-white"
                                : "border-gray-300 bg-white text-gray-700 hover:border-emerald-700"
                            )}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={goBackFromDate}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 bg-white px-6 text-[15px] font-medium text-gray-800 transition-[background-color,border-color] hover:border-gray-400 hover:bg-gray-50"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {hasSingleEmployee ? "Tilbage til behandlinger" : "Tilbage til medarbejder"}
                </button>
              </div>
            </div>
          ) : null}

          {/* ── Step 3: Customer Details ── */}
          {!loadingCatalog && catalog && step === 3 ? (
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <h2
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-balance text-[34px] font-bold leading-none text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 md:text-[42px]"
                >
                  Dine oplysninger
                </h2>
                <p className="mx-auto max-w-[620px] text-[15px] leading-[1.7] text-gray-500 md:text-[16px]">
                  Udfyld dine oplysninger for at færdiggøre bookingen.
                </p>
              </div>

              <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[22px] border border-gray-200 bg-white p-5 md:p-6">
                  <h3 className="text-[24px] font-bold text-gray-900">
                    Bookingoversigt
                  </h3>
                  <dl className="mt-5 space-y-3 text-[14px] leading-[1.7] text-gray-500">
                    <div>
                      <dt className="text-[12px] uppercase tracking-[0.18em] text-gray-500">
                        Behandling
                      </dt>
                      <dd className="text-gray-900">{selectedTreatmentObject?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] uppercase tracking-[0.18em] text-gray-500">
                        Pris
                      </dt>
                      <dd className="text-gray-900">
                        {selectedTreatmentObject
                          ? getBookingPriceLabel(selectedTreatmentObject)
                          : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[12px] uppercase tracking-[0.18em] text-gray-500">
                        Medarbejder
                      </dt>
                      <dd className="text-gray-900">{displayEmployeeName(selectedEmployeeObject?.name)}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] uppercase tracking-[0.18em] text-gray-500">
                        Dato
                      </dt>
                      <dd className="text-gray-900">
                        {selectedDate ? formatDateLabel(selectedDate) : ""}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[12px] uppercase tracking-[0.18em] text-gray-500">
                        Tid
                      </dt>
                      <dd className="text-gray-900">{selectedTime}</dd>
                    </div>
                  </dl>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="grid gap-4 rounded-[22px] border border-gray-200 bg-white p-5 md:p-6"
                >
                  <label className="grid gap-2">
                    <span className="text-[14px] font-medium text-gray-500">
                      Navn
                    </span>
                    <input
                      id="booking-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Fx Ahmad Hansen…"
                      required
                      value={customer.name}
                      aria-invalid={fieldErrors.name ? true : undefined}
                      aria-describedby={
                        fieldErrors.name ? "booking-name-error" : undefined
                      }
                      onChange={(event) => {
                        clearFieldError("name");
                        setCustomer((c) => ({ ...c, name: event.target.value }));
                      }}
                      className="rounded-[14px] border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-[border-color,box-shadow] placeholder:text-gray-500 focus:border-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    />
                    {fieldErrors.name ? (
                      <span id="booking-name-error" className="text-[13px] font-medium text-red-700" role="alert">
                        {fieldErrors.name}
                      </span>
                    ) : null}
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[14px] font-medium text-gray-500">
                      Telefon
                    </span>
                    <input
                      id="booking-phone"
                      name="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="Fx 42 20 24 29…"
                      required
                      value={customer.phone}
                      aria-invalid={fieldErrors.phone ? true : undefined}
                      aria-describedby={
                        fieldErrors.phone ? "booking-phone-error" : undefined
                      }
                      onChange={(event) => {
                        clearFieldError("phone");
                        setCustomer((c) => ({ ...c, phone: event.target.value }));
                      }}
                      className="rounded-[14px] border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-[border-color,box-shadow] placeholder:text-gray-500 focus:border-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    />
                    {fieldErrors.phone ? (
                      <span id="booking-phone-error" className="text-[13px] font-medium text-red-700" role="alert">
                        {fieldErrors.phone}
                      </span>
                    ) : null}
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[14px] font-medium text-gray-500">
                      E-mail
                    </span>
                    <input
                      id="booking-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      spellCheck={false}
                      placeholder="Fx navn@eksempel.dk…"
                      required
                      value={customer.email}
                      aria-invalid={fieldErrors.email ? true : undefined}
                      aria-describedby={
                        fieldErrors.email ? "booking-email-error" : undefined
                      }
                      onChange={(event) => {
                        clearFieldError("email");
                        setCustomer((c) => ({ ...c, email: event.target.value }));
                      }}
                      className="rounded-[14px] border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-[border-color,box-shadow] placeholder:text-gray-500 focus:border-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    />
                    {fieldErrors.email ? (
                      <span id="booking-email-error" className="text-[13px] font-medium text-red-700" role="alert">
                        {fieldErrors.email}
                      </span>
                    ) : null}
                  </label>

                  <label className="grid gap-2">
                    <span className="text-[14px] font-medium text-gray-500">
                      Noter <span className="font-normal text-gray-500">(valgfrit)</span>
                    </span>
                    <textarea
                      id="booking-notes"
                      name="notes"
                      autoComplete="off"
                      placeholder="Fx særlige ønsker til klipningen…"
                      value={customer.notes}
                      onChange={(event) =>
                        setCustomer((c) => ({ ...c, notes: event.target.value }))
                      }
                      rows={4}
                      className="rounded-[14px] border border-gray-300 bg-white px-4 py-3 text-gray-900 transition-[border-color,box-shadow] placeholder:text-gray-500 focus:border-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                    />
                  </label>

                  <p className="text-pretty text-[13px] leading-6 text-gray-600">
                    Vi bruger kun dine oplysninger til at administrere din booking. Læs vores{" "}
                    <Link href="/privatlivspolitik" className="font-medium text-emerald-800 underline decoration-emerald-700/40 underline-offset-4 hover:text-emerald-950">
                      privatlivspolitik
                    </Link>.
                  </p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => goToStep(2)}
                      className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 bg-white px-6 text-[15px] font-medium text-gray-800 transition-[background-color,border-color] hover:border-gray-400 hover:bg-gray-50"
                    >
                      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                      Tilbage
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-800 px-6 text-[15px] font-semibold text-white transition-[filter,opacity] hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
                    >
                      {submitting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                      {submitting ? "Bekræfter…" : "Bekræft booking"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : null}

          {/* ── Step 4: Success ── */}
          {step === 4 ? (
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
              </div>
              <div className="space-y-2">
                <h2
                  ref={stepHeadingRef}
                  tabIndex={-1}
                  className="text-balance text-[34px] font-bold leading-none text-gray-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 md:text-[42px]"
                >
                  Booking bekræftet
                </h2>
                <p className="mx-auto max-w-[640px] text-[15px] leading-[1.7] text-gray-500 md:text-[16px]">
                  Tak for din booking! Vi har sendt en bekræftelse til{" "}
                  <strong className="text-gray-900">{customer.email}</strong>.
                </p>
              </div>
              <div className="mx-auto max-w-[640px] rounded-[22px] border border-gray-200 bg-white p-5 text-left md:p-6">
                <p className="mb-4 text-[12px] uppercase tracking-[0.18em] text-gray-500">
                  Booking ID
                </p>
                <p className="mb-6 text-[16px] text-gray-500">{successId}</p>
                <dl className="grid gap-4 text-[15px] leading-[1.7] text-gray-500 sm:grid-cols-2">
                  <div>
                    <dt className="text-[12px] uppercase tracking-[0.18em] text-gray-500">
                      Behandling
                    </dt>
                    <dd className="text-gray-900">{selectedTreatmentObject?.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] uppercase tracking-[0.18em] text-gray-500">
                      Pris
                    </dt>
                    <dd className="text-gray-900">
                      {selectedTreatmentObject
                        ? getBookingPriceLabel(selectedTreatmentObject)
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12px] uppercase tracking-[0.18em] text-gray-500">
                      Medarbejder
                    </dt>
                    <dd className="text-gray-900">{displayEmployeeName(selectedEmployeeObject?.name)}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] uppercase tracking-[0.18em] text-gray-500">
                      Dato
                    </dt>
                    <dd className="text-gray-900">
                      {selectedDate ? formatDateLabel(selectedDate) : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[12px] uppercase tracking-[0.18em] text-gray-500">
                      Tid
                    </dt>
                    <dd className="text-gray-900">{selectedTime}</dd>
                  </div>
                  <div>
                    <dt className="text-[12px] uppercase tracking-[0.18em] text-gray-500">
                      Navn
                    </dt>
                    <dd className="text-gray-900">{customer.name}</dd>
                  </div>
                </dl>
              </div>
              <div className="mx-auto max-w-[640px] rounded-[22px] bg-emerald-50 p-5 text-left text-[14px] leading-6 text-gray-700">
                <p className="font-semibold text-gray-900">Har du brug for at ændre tiden?</p>
                <p className="mt-1">
                  Ring til os på {siteConfig.contact.phone}, så hjælper vi dig med at flytte eller annullere bookingen.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                {calendarUrl ? (
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 bg-white px-6 text-[15px] font-medium text-gray-800 transition-[background-color,border-color] hover:border-gray-400 hover:bg-gray-50"
                  >
                    <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                    Føj til kalender
                  </a>
                ) : null}
                <a
                  href={siteConfig.contact.directionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 bg-white px-6 text-[15px] font-medium text-gray-800 transition-[background-color,border-color] hover:border-gray-400 hover:bg-gray-50"
                >
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  Få rutevejledning
                </a>
                <a
                  href={`tel:${siteConfig.contact.phone.replace(/\s/g, "")}`}
                  className="inline-flex min-h-12 items-center gap-2 rounded-full border border-gray-300 bg-white px-6 text-[15px] font-medium text-gray-800 transition-[background-color,border-color] hover:border-gray-400 hover:bg-gray-50"
                >
                  <Phone className="h-4 w-4" aria-hidden="true" />
                  Ring til salonen
                </a>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-gray-300 bg-white px-6 text-[15px] font-medium text-gray-800 transition-[background-color,border-color] hover:border-gray-400 hover:bg-gray-50"
                >
                  Opret ny booking
                </button>
                <Link
                  href="/"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-800 px-6 text-[15px] font-semibold text-white transition-[filter] hover:brightness-110"
                >
                  Tilbage til forsiden
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
