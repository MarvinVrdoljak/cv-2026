import {cv} from '@/data/cv'

/**
 * Assistant prose, tokenised once for every renderer.
 *
 * The model is told to send plain text with `[id]` citations and does not
 * always comply, so the cleaning rules live here — in one place — rather than
 * once per output medium. `RefText` turns the segments into interactive chips
 * on screen, the PDF documents set the same segments as mono type on paper.
 */

// A real, addressable CV entry id: three letters, dash, two digits.
const ENTRY_ID = /^[a-z]{3}-\d{2}$/
// A Markdown link [text](url) OR a bare bracket tag [id] / [about].
const TOKEN = /\[([^\]]+)\]\(([^)]+)\)|\[([^\][]+)\]/g

const norm = (url: string) => url.trim().replace(/\/+$/, '')

// Only URLs that actually appear in the CV data may be linked — the model does
// not get to invent link targets.
const ALLOWED_HREFS = new Set<string>(
  [
    ...cv.person.links.map((l) => l.href),
    ...cv.experience.map((e) => e.organisationHref),
    ...cv.education.map((e) => e.href),
    ...cv.about.projects.map((p) => p.href),
  ]
    .filter((href): href is string => typeof href === 'string')
    .map(norm)
)

export type AssistantSegment =
  | {kind: 'text'; text: string}
  | {kind: 'ref'; id: string}
  | {kind: 'link'; label: string; href: string}

/** True for a token that names an actual CV entry. */
export function isEntryId(value: string): boolean {
  return ENTRY_ID.test(value)
}

/**
 * Strips the markup that must not survive, then splits what is left:
 *   • [id]        → a `ref` segment, for real CV entries.
 *   • [text](url) → a `link` segment, but only when the url is one from the
 *                   CV data; otherwise the label stays as plain text.
 * Markdown emphasis and stray bracket tags (e.g. [about]) are removed.
 */
export function parseAssistantText(content: string): AssistantSegment[] {
  const text = content
    .replace(/\*\*|__|`/g, '') // strip emphasis / code markers
    .replace(/^[ \t]*[-*•·]\s+/gm, '') // strip leading list bullets (kept as clean lines)
    // Drop bracket tags with no real entry id (an invented [avail-02] or a bare
    // [about] the model appends to uncited context facts), and swallow the
    // spaces around them — otherwise "remote [about]." renders as "remote .".
    // Links [text](url) are spared by the (?!\() lookahead; valid id brackets
    // are left for the tokenizer below. Only spaces/tabs are eaten, never a
    // newline, so paragraph breaks survive.
    .replace(/[ \t]*\[([^\][]+)\](?!\()[ \t]*/g, (whole, inner, offset: number, str: string) => {
      const hasId = inner.split(/[\s,]+/).some((token: string) => ENTRY_ID.test(token))
      if (hasId) return whole // a real citation — leave it for the tokenizer
      // A single space only when real text sits on both sides ("der [x] Mann"
      // → "der Mann"); otherwise nothing, so a line start, line end, or a
      // following punctuation mark keeps no orphan space.
      const before = str[offset - 1]
      const after = str[offset + whole.length]
      if (!before || !after || /\s/.test(before) || /\s/.test(after)) return ''
      if (/[.,;:!?)\]]/.test(after)) return ''
      return ' '
    })

  const segments: AssistantSegment[] = []
  const pushText = (value: string) => {
    if (value === '') return
    const previous = segments[segments.length - 1]
    // Merge adjacent text so consumers never see needless fragments.
    if (previous?.kind === 'text') previous.text += value
    else segments.push({kind: 'text', text: value})
  }

  let lastIndex = 0
  let match: RegExpExecArray | null

  TOKEN.lastIndex = 0
  while ((match = TOKEN.exec(text)) !== null) {
    const [whole, linkLabel, linkUrl, bracket] = match
    if (match.index > lastIndex) pushText(text.slice(lastIndex, match.index))

    if (linkUrl !== undefined) {
      // Markdown link — keep it a link only if the target is a known CV url.
      if (ALLOWED_HREFS.has(norm(linkUrl))) {
        segments.push({kind: 'link', label: linkLabel, href: linkUrl})
      } else {
        pushText(linkLabel)
      }
    } else {
      // Bare bracket — keep only real entry ids as citations, drop the rest.
      const ids = bracket.split(/[\s,]+/).filter(isEntryId)
      ids.forEach((id, index) => {
        if (index > 0) pushText(' ')
        segments.push({kind: 'ref', id})
      })
    }

    lastIndex = match.index + whole.length
  }
  if (lastIndex < text.length) pushText(text.slice(lastIndex))

  return segments
}
