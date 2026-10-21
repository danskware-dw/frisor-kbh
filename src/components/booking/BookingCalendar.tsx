"use client"

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateLabel, formatMonthLabel, getEndOfMonth, getStartOfMonth, isPastDay, isWeekend, toDateKey } from '@/lib/booking-utils'

type BookingCalendarProps = {
  value?: string
  onChange: (date: string) => void
  closedDates?: string[]
  today?: string
}

const weekdayLabels = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']

export default function BookingCalendar({ value, onChange, closedDates = [], today }: BookingCalendarProps) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })

  const days = useMemo(() => {
    const start = getStartOfMonth(visibleMonth)
    const end = getEndOfMonth(visibleMonth)
    const mondayBasedOffset = (start.getDay() + 6) % 7
    const total = end.getDate()
    const cells = [] as Array<Date | null>

    for (let index = 0; index < mondayBasedOffset; index += 1) {
      cells.push(null)
    }

    for (let day = 1; day <= total; day += 1) {
      cells.push(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day))
    }

    while (cells.length % 7 !== 0) {
      cells.push(null)
    }

    return cells
  }, [visibleMonth])

  const canGoBack = useMemo(() => {
    const today = new Date()
    return visibleMonth.getFullYear() > today.getFullYear() || visibleMonth.getMonth() > today.getMonth()
  }, [visibleMonth])

  return (
    <div className="rounded-[22px] border border-gray-300 bg-white p-4 shadow-md md:p-5" aria-describedby="calendar-help">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          disabled={!canGoBack}
          onClick={() => canGoBack && setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))}
          className={cn(
            'inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition-[background-color,border-color]',
            canGoBack ? 'hover:bg-gray-100' : 'cursor-not-allowed opacity-40'
          )}
          aria-label="Forrige måned"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <p className="font-serif text-[24px] text-gray-900" aria-live="polite" aria-atomic="true">
          {formatMonthLabel(visibleMonth)}
        </p>
        <button
          type="button"
          onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 text-gray-700 transition-[background-color,border-color] hover:bg-gray-100"
          aria-label="Næste måned"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {weekdayLabels.map((label) => (
          <div key={label} className="pb-1 text-[10px] uppercase tracking-[0.14em] text-gray-500 md:text-[11px]">
            {label}
          </div>
        ))}

        {days.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />
          }

          const key = toDateKey(day)
          const closed = closedDates.includes(key)
          const disabled = (today ? key < today : isPastDay(day)) || isWeekend(day) || closed
          const selected = value === key
          const dateLabel = formatDateLabel(key)

          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              aria-label={closed ? `${dateLabel}, salonen er lukket` : disabled ? `${dateLabel}, ikke tilgængelig` : dateLabel}
              aria-pressed={selected}
              onClick={() => onChange(key)}
              className={cn(
                'aspect-square min-h-10 rounded-[14px] border text-[13px] font-medium tabular-nums transition-[background-color,border-color,color,box-shadow] md:text-[14px]',
                selected
                  ? 'border-emerald-800 bg-emerald-800 text-white shadow-md shadow-emerald-700/20'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-950 hover:border-emerald-700 hover:bg-emerald-100',
                disabled && 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500 hover:border-gray-200 hover:bg-gray-100'
              )}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
      <div id="calendar-help" className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-gray-700">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-emerald-400 bg-emerald-50" aria-hidden="true" />
          Ledig dato
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-emerald-800 bg-emerald-800" aria-hidden="true" />
          Valgt dato
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-gray-300 bg-gray-100" aria-hidden="true" />
          Ikke tilgængelig
        </span>
      </div>
      <p className="mt-3 text-[12px] text-gray-600">Søndage og salonens lukkedage kan ikke bookes.</p>
    </div>
  )
}
