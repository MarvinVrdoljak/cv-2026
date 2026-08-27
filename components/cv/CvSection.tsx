import React from 'react'
import {sectionId, sectionNumber, type SectionKey} from '@/lib/sections'
import styles from './CvSection.module.css'

type CvSectionProps = {
  section: SectionKey
  title: string
  children: React.ReactNode
}

/**
 * Section headings are set in mono: they label the document rather than
 * speak in its voice. The rule under them is the section's own baseline.
 */
export function CvSection({section, title, children}: CvSectionProps) {
  const id = sectionId(section)
  /* The running number is the section's position in `SECTIONS`, not a prop:
     a zero-padded figure next to a heading reads as an index, never a tally,
     and an index that is typed out per call site drifts the moment the
     document is reordered. */
  const index = sectionNumber(section)

  return (
    <section className={styles.root} id={id} aria-labelledby={`${id}-title`} data-print="section">
      <div className={styles.header}>
        <span className={styles.index} aria-hidden="true">
          {String(index).padStart(2, '0')}
        </span>
        <h2 className={styles.title} id={`${id}-title`}>
          {title}
        </h2>
      </div>
      <div className={styles.body}>{children}</div>
    </section>
  )
}
