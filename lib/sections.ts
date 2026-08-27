/**
 * The document's sections, in reading order. One source for the CV itself
 * and for the chrome navigation, so the two can never drift apart.
 */
export const SECTIONS = ['profile', 'experience', 'education', 'skills', 'languages'] as const

export type SectionKey = (typeof SECTIONS)[number]

/**
 * 1-based position of a section — the running number both media print next to
 * the heading. Derived from `SECTIONS`, so screen and paper can never number
 * the same section differently, and reordering the list above is enough.
 */
export function sectionNumber(key: SectionKey): number {
  return SECTIONS.indexOf(key) + 1
}

/** Anchor target for a section — referenced by the top bar and by deep links. */
export function sectionId(key: SectionKey): string {
  return `sec-${key}`
}
