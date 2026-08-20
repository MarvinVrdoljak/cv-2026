import React from 'react'
import {cv} from '@/data/cv'
import {EntryRef} from './EntryRef'
import styles from './RefText.module.css'

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

/**
 * Renders assistant prose. Two kinds of markup survive, everything else is
 * cleaned away (the model is told to send plain text and does not always
 * comply):
 *   • [id]            → an interactive EntryRef chip, for real CV entries.
 *   • [text](url)     → a link, but only when the url is one from the CV data
 *                       (e.g. a project's site); otherwise just the text.
 * Markdown emphasis and stray bracket tags (e.g. [about]) are stripped.
 */
export function RefText({content}: {content: string}) {
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
  const nodes: React.ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0

  TOKEN.lastIndex = 0
  while ((match = TOKEN.exec(text)) !== null) {
    const [whole, linkLabel, linkUrl, bracket] = match
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    if (linkUrl !== undefined) {
      // Markdown link — render only if the target is a known CV url.
      if (ALLOWED_HREFS.has(norm(linkUrl))) {
        nodes.push(
          <a
            className={styles.link}
            href={linkUrl}
            rel="noreferrer"
            target="_blank"
            key={`lnk-${key++}`}
          >
            {linkLabel}
          </a>
        )
      } else {
        nodes.push(linkLabel)
      }
    } else {
      // Bare bracket — keep only real entry ids as chips, drop the rest.
      const ids = bracket.split(/[\s,]+/).filter((token) => ENTRY_ID.test(token))
      ids.forEach((id, index) => {
        if (index > 0) nodes.push(' ')
        nodes.push(<EntryRef key={`ref-${key++}`} id={id} />)
      })
    }

    lastIndex = match.index + whole.length
  }
  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return <>{nodes}</>
}
