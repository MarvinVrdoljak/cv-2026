import type {Locale} from '@/i18n/routing'
import type {YearMonth} from '@/data/cv'

/** Splits `YYYY-MM` without going through Date — no timezone surprises. */
function parse(value: YearMonth): {year: number; month: number} {
  const [year, month] = value.split('-')
  return {year: Number(year), month: Number(month)}
}

const SEPARATOR: Record<Locale, string> = {de: '.', en: '/'}

/** `03.2021` (de) · `03/2021` (en) — set in mono with tabular figures. */
export function formatMonth(value: YearMonth, locale: Locale): string {
  const {year, month} = parse(value)
  return `${String(month).padStart(2, '0')}${SEPARATOR[locale]}${year}`
}

/** `03.2021 – 08.2024`, or `03.2021 – heute` for an ongoing engagement. */
export function formatPeriod(
  from: YearMonth,
  to: YearMonth | null,
  locale: Locale,
  presentLabel: string
): string {
  return `${formatMonth(from, locale)} – ${to ? formatMonth(to, locale) : presentLabel}`
}

/**
 * Whole months between two points, inclusive of the starting month.
 * `to = null` measures against `reference` (the render time).
 */
export function durationInMonths(
  from: YearMonth,
  to: YearMonth | null,
  reference: Date = new Date()
): number {
  const start = parse(from)
  const end = to ? parse(to) : {year: reference.getFullYear(), month: reference.getMonth() + 1}

  return Math.max(1, (end.year - start.year) * 12 + (end.month - start.month) + 1)
}

/** Months split into years + remaining months, for a compact mono readout. */
export function splitDuration(months: number): {years: number; months: number} {
  return {years: Math.floor(months / 12), months: months % 12}
}

/** `2011–2014` — years only, enough for education rows. */
export function formatYearRange(
  from: YearMonth,
  to: YearMonth | null,
  presentLabel: string
): string {
  const start = parse(from).year
  if (!to) return `${start}–${presentLabel}`

  const end = parse(to).year
  return start === end ? `${start}` : `${start}–${end}`
}
