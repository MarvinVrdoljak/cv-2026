import React from 'react'
import {sectionId, type SectionKey} from '@/lib/sections'
import styles from './CvSection.module.css'

type CvSectionProps = {
  section: SectionKey
  title: string
  /** 1-based position in the document — shown as the section's running number.
      A zero-padded figure next to a heading reads as an index, never a tally,
      so it must be the ordinal, not an entry count. */
  index: number
  children: React.ReactNode
}

/**
 * Section headings are set in mono: they label the document rather than
 * speak in its voice. The rule under them is the section's own baseline.
 */
export function CvSection({section, title, index, children}: CvSectionProps) {
  const id = sectionId(section)

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
