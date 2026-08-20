import React from 'react'
import {parseAssistantText} from '@/lib/citations'
import {EntryRef} from './EntryRef'
import styles from './RefText.module.css'

/**
 * Renders assistant prose on screen. The tokenising and cleaning rules live in
 * `lib/citations` because the PDF documents render the very same prose — this
 * component only decides what a segment looks like in the browser:
 *   • a citation → an interactive EntryRef chip (hover lights the entry,
 *     click scrolls to it),
 *   • a link     → an anchor, already validated against the CV data,
 *   • text       → text.
 */
export function RefText({content}: {content: string}) {
  const segments = parseAssistantText(content)

  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === 'ref') {
          return <EntryRef id={segment.id} key={`ref-${index}`} />
        }
        if (segment.kind === 'link') {
          return (
            <a
              className={styles.link}
              href={segment.href}
              rel="noreferrer"
              target="_blank"
              key={`lnk-${index}`}
            >
              {segment.label}
            </a>
          )
        }
        return <React.Fragment key={`txt-${index}`}>{segment.text}</React.Fragment>
      })}
    </>
  )
}
