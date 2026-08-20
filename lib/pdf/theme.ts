/**
 * Paper tokens. The same palette and the same relationships as
 * `styles/base/tokens.css`, restated in points because a PDF is a physical
 * page: no rem, no clamp, no dark mode (paper has one ground).
 *
 * The rules from the brief hold here too — hierarchy through size, weight and
 * space, never through colour; the accent only where something is actually
 * marked; hairlines instead of cards.
 */

export const color = {
  paper: '#fff',
  ink: '#16161a',
  muted: '#62626a',
  rule: '#e3e1db',
  ruleStrong: '#c9c6be',
  accent: '#b0350f',
  accentWash: '#fbeae3',
} as const

/**
 * Four sizes for the whole document, plus two for a document's own name. The
 * screen works the same way — one step for interface (xs), one for secondary
 * prose (sm), one for running text (base), one for headings (h4) — because
 * hierarchy here comes from weight, case and space, not from size. Every extra
 * size is a decision the reader has to parse, so there are as few as possible.
 */
export const size = {
  /** All interface type: ids, section labels, dates, chips, the running foot. */
  mono: 7.5,
  /** Secondary prose: employer line, institution, notes. */
  small: 8.5,
  /** Running text: profile, summaries, highlights, the assessment. */
  body: 9.5,
  /** Entry titles: role, skill group, qualification, language. */
  title: 11,
  docTitle: 14,
  name: 20,
} as const

export const leading = {
  body: 1.5,
  heading: 1.2,
  mono: 1.3,
} as const

export const space = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  section: 20,
} as const

/**
 * The id gutter, the document's signature: identifier in the margin, substance
 * to the right of it. On screen that column is 104px wide — on A4 it has to be
 * narrower, but it stays a column, not an indent.
 */
export const GUTTER = 62

/** A4 in points, as the renderer measures it. */
export const A4 = {width: 595.28, height: 841.89} as const

/** A4 with generous, asymmetric margins: more foot than head, room to bind. */
export const page = {
  top: 40,
  bottom: 46,
  left: 48,
  right: 46,
} as const

/**
 * The running foot is placed from the top of the sheet, not the bottom. The
 * page number is a dynamic node, and the renderer resets a dynamic text box to
 * zero height while paginating: anchored with `bottom` it then never paints,
 * anchored with `top` it does. Same position on paper, one fewer surprise.
 */
export const foot = {
  rule: A4.height - page.bottom + 10,
  text: A4.height - page.bottom + 16,
} as const

export const tracking = {
  label: 0.7,
  mono: 0.15,
  display: -0.4,
} as const
