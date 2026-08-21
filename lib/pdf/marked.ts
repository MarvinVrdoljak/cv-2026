import type {Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import {formatMonth, formatYearRange} from '@/lib/format'
import type {SectionKey} from '@/lib/sections'
import type {PdfSectionLabels} from './labels'

/**
 * Marked ids, resolved to printable entries.
 *
 * The dialog on screen can read a heading out of the rendered DOM; a PDF is
 * built on the server and has no DOM, so the ids are resolved against the same
 * single source the document renders from. That also makes the printed
 * summary self-contained: it carries what was marked, not just its id.
 *
 * A digest, not a copy — one meta line, the title, one line of substance (and
 * for a skill group its items, which *are* the substance). The full detail
 * lives in the CV itself.
 */

export type MarkedItem = {
  id: string
  section: SectionKey
  /** Appended to the section name in the mono line: period, level, or nothing. */
  meta: string | null
  /** Null where a title would only repeat the section name (the profile). */
  title: string | null
  /** One line of prose — role summary, note, institution. */
  detail: string | null
  /** Named items, for skill groups. */
  items: string[]
}

type Options = {
  locale: Locale
  present: string
  sections: PdfSectionLabels
}

/** Every addressable entry, in document order — the order marks print in. */
function everyEntry({locale, present, sections}: Options): MarkedItem[] {
  const items: MarkedItem[] = [
    {
      id: cv.profile.id,
      section: 'profile',
      meta: null,
      // The section is already named in the mono line above; a heading reading
      // "Kurzprofil" under a line reading "Kurzprofil" says nothing twice.
      title: null,
      // The lead paragraph is enough of a digest; the CV carries the rest.
      detail: (cv.profile.text[locale] ?? cv.profile.text.de).split('\n')[0] ?? null,
      items: [],
    },
  ]

  for (const entry of cv.experience) {
    items.push({
      id: entry.id,
      section: 'experience',
      meta: `${formatMonth(entry.from, locale)} – ${
        entry.to ? formatMonth(entry.to, locale) : present
      }`,
      title: `${entry.role[locale]} · ${entry.organisation.split(' · ')[0]}`,
      detail: entry.summary[locale],
      items: [],
    })
  }

  for (const group of cv.skills) {
    items.push({
      id: group.id,
      section: 'skills',
      meta: null,
      title: group.label[locale],
      detail: group.note ? group.note[locale] : null,
      items: group.items.map((i) => i.name),
    })
  }

  for (const entry of cv.education) {
    items.push({
      id: entry.id,
      section: 'education',
      meta: formatYearRange(entry.from, entry.to, present),
      title: entry.qualification[locale],
      detail: entry.institution,
      items: [],
    })
  }

  for (const entry of cv.languages) {
    items.push({
      id: entry.id,
      section: 'languages',
      meta: entry.level[locale],
      title: entry.language[locale],
      detail: null,
      items: [],
    })
  }

  return items
}

/**
 * The marked entries in document order (not in the order they were ticked) —
 * a note that follows the CV reads back against it. Unknown ids are dropped:
 * the route validates first, and a stale mark from `localStorage` must never
 * print as an empty row.
 */
export function resolveMarked(ids: string[], options: Options): MarkedItem[] {
  const wanted = new Set(ids)
  return everyEntry(options).filter((item) => wanted.has(item.id))
}
