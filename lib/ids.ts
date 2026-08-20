/**
 * Shared DOM contracts. Components in different modules cannot see each
 * other's generated class names, so cross-component wiring goes through
 * these stable ids and data attributes instead.
 */

/** Wraps the CV. A `type="reset"` button anywhere can clear all marks via `form=`. */
export const MARK_FORM_ID = 'cv-marks'

/** `data-focus` targets addressed by the keyboard bindings. */
export const FOCUS_TARGET = {
  query: 'query',
  chat: 'chat',
} as const
