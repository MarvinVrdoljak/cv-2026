/**
 * The document's sections, in reading order. One source for the CV itself
 * and for the chrome navigation, so the two can never drift apart.
 */
export const SECTIONS = ['profile', 'experience', 'skills', 'education', 'languages'] as const

export type SectionKey = (typeof SECTIONS)[number]

/** Anchor target for a section — referenced by the top bar and by deep links. */
export function sectionId(key: SectionKey): string {
  return `sec-${key}`
}
