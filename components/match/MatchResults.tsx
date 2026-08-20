'use client'

import {useTranslations} from 'next-intl'
import type {MatchBucket, MatchFinding} from '@/lib/types'
import {useAppState} from '@/components/app/AppState'
import {EntryRef} from '@/components/app/EntryRef'
import styles from './MatchResults.module.css'

const BUCKETS: {key: MatchBucket; label: 'resultFit' | 'resultPartial' | 'resultGap'}[] = [
  {key: 'fit', label: 'resultFit'},
  {key: 'partial', label: 'resultPartial'},
  {key: 'gap', label: 'resultGap'},
]

/**
 * The analysis, above the CV in three honest blocks. Each finding lights up
 * the entries it rests on when hovered; its id chips scroll to them on click.
 * A live region announces the streaming so it is not silent for screen readers.
 */
export function MatchResults() {
  const t = useTranslations('match')
  const {matching, setHover, clearHover} = useAppState()

  if (matching.rejected) {
    return (
      <div className={styles.rejected} role="status">
        {matching.rejected}
      </div>
    )
  }

  const streaming = matching.state === 'streaming'

  return (
    <div className={styles.root} aria-live="polite" aria-busy={streaming}>
      {BUCKETS.map(({key, label}) => {
        const items = matching.findings.filter((f) => f.bucket === key)
        return (
          <section className={styles.bucket} key={key} data-bucket={key}>
            <h3 className={styles.bucketTitle}>
              <span className={styles.bucketMark} aria-hidden="true" />
              {t(label)}
              <span className={styles.bucketCount} aria-hidden="true">
                {String(items.length).padStart(2, '0')}
              </span>
            </h3>
            {items.length > 0 ? (
              <ul className={styles.list}>
                {items.map((finding, index) => (
                  <Finding
                    key={`${key}-${index}`}
                    finding={finding}
                    onEnter={() => setHover(finding.refs)}
                    onLeave={clearHover}
                  />
                ))}
              </ul>
            ) : (
              <p className={styles.bucketEmpty}>{streaming ? '…' : '—'}</p>
            )}
          </section>
        )
      })}
    </div>
  )
}

function Finding({
  finding,
  onEnter,
  onLeave,
}: {
  finding: MatchFinding
  onEnter: () => void
  onLeave: () => void
}) {
  return (
    <li className={styles.finding} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <span className={styles.findingText}>{finding.text}</span>
      {finding.refs.length > 0 ? (
        <span className={styles.refs}>
          {finding.refs.map((id) => (
            <EntryRef key={id} id={id} />
          ))}
        </span>
      ) : null}
    </li>
  )
}
