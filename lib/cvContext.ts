import type {Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import {formatMonth} from '@/lib/format'

/**
 * The CV, flattened to one locale and shaped for the model context. This is
 * the ONLY thing the three prompts are allowed to reason from — the same
 * single source that renders the document, never a second copy.
 */
export function buildCvContext(locale: Locale) {
  const period = (from: string, to: string | null) =>
    `${formatMonth(from as `${number}-${string}`, locale)}–${
      to ? formatMonth(to as `${number}-${string}`, locale) : locale === 'de' ? 'heute' : 'present'
    }`

  return {
    person: {
      name: cv.person.name,
      role: cv.person.role[locale],
      location: cv.person.location,
      birthDate: cv.person.birthDate,
    },
    profile: {id: cv.profile.id, text: cv.profile.text[locale]},
    experience: cv.experience.map((e) => ({
      id: e.id,
      period: period(e.from, e.to),
      role: e.role[locale],
      organisation: e.organisation,
      location: e.location,
      summary: e.summary[locale],
      highlights: e.highlights.map((h) => h[locale]),
      stack: e.stack,
    })),
    skills: cv.skills.map((s) => ({
      id: s.id,
      label: s.label[locale],
      items: s.items,
      note: s.note ? s.note[locale] : null,
    })),
    education: cv.education.map((e) => ({
      id: e.id,
      period: period(e.from, e.to),
      qualification: e.qualification[locale],
      institution: e.institution,
      note: e.note ? e.note[locale] : null,
      credentialId: e.credentialId ?? null,
    })),
    languages: cv.languages.map((l) => ({
      id: l.id,
      language: l.language[locale],
      level: l.level[locale],
    })),
    // Extra context (not printed): only non-empty parts are sent, so the model
    // sees a fact when there is one and nothing to pad an answer with otherwise.
    about: buildAbout(locale),
  }
}

function buildAbout(locale: Locale) {
  const {projects, interests, strengths, weaknesses, extra} = cv.about
  const flatten = (items: {de: string; en: string}[]) => items.map((item) => item[locale])

  const about: Record<string, unknown> = {}
  if (projects.length > 0) {
    about.projects = projects.map((p) => ({
      name: p.name,
      description: p.description[locale],
      href: p.href ?? null,
      stack: p.stack,
    }))
  }
  if (interests.length > 0) about.interests = flatten(interests)
  if (strengths.length > 0) about.strengths = flatten(strengths)
  if (weaknesses.length > 0) about.weaknesses = flatten(weaknesses)
  if (extra.length > 0) about.extra = flatten(extra)
  return about
}

/** Every addressable id in the CV — used to validate model references. */
export function collectValidIds(): string[] {
  return [
    cv.profile.id,
    ...cv.experience.map((e) => e.id),
    ...cv.skills.map((s) => s.id),
    ...cv.education.map((e) => e.id),
    ...cv.languages.map((l) => l.id),
  ]
}

/** Just the experience ids, in document order — the reorderable set. */
export function experienceIds(): string[] {
  return cv.experience.map((e) => e.id)
}
