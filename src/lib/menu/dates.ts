/**
 * Date helpers for calendar dates (no time of day). Dates are handled as ISO
 * `YYYY-MM-DD` strings and computed in UTC so results never depend on the
 * build machine's or the visitor's timezone.
 */
export type ISODate = string
/** `YYYY-MM` */
export type MonthKey = string

const DAY_MS = 86_400_000
const LOCALE = 'es-ES'

export function parseISODate(iso: ISODate): Date {
  return new Date(`${iso}T00:00:00Z`)
}

export function toISODate(date: Date): ISODate {
  return date.toISOString().slice(0, 10)
}

/** Today's date in the visitor's local timezone. */
export function localISODate(now: Date = new Date()): ISODate {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(iso: ISODate, days: number): ISODate {
  return toISODate(new Date(parseISODate(iso).getTime() + days * DAY_MS))
}

/** 0 = lunes … 6 = domingo */
export function weekdayIndex(iso: ISODate): number {
  return (parseISODate(iso).getUTCDay() + 6) % 7
}

export function startOfWeek(iso: ISODate): ISODate {
  return addDays(iso, -weekdayIndex(iso))
}

export function monthKey(iso: ISODate): MonthKey {
  return iso.slice(0, 7)
}

/**
 * Returns `key` if present in the sorted list, otherwise the closest earlier
 * entry, falling back to the first entry when `key` precedes the whole list.
 */
export function nearestAtOrBefore<T extends string>(sorted: readonly T[], key: string): T {
  let found = sorted[0]
  for (const item of sorted) {
    if (item > key) break
    found = item
  }
  return found
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDate(iso: ISODate, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', ...options }).format(parseISODate(iso))
}

/** "Lunes, 7 de septiembre de 2026" */
export function formatLongDate(iso: ISODate): string {
  return capitalize(
    formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  )
}

/** "7 sept" */
export function formatShortDate(iso: ISODate): string {
  return formatDate(iso, { day: 'numeric', month: 'short' }).replace('.', '')
}

/** "Septiembre 2026" */
export function formatMonth(month: MonthKey): string {
  const label = formatDate(`${month}-01`, { month: 'long' })
  return `${capitalize(label)} ${month.slice(0, 4)}`
}

/** "7 – 11 sept" or "28 sept – 2 oct" */
export function formatRange(start: ISODate, end: ISODate): string {
  if (monthKey(start) === monthKey(end)) {
    return `${formatDate(start, { day: 'numeric' })} – ${formatShortDate(end)}`
  }
  return `${formatShortDate(start)} – ${formatShortDate(end)}`
}
