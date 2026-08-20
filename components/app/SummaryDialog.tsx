'use client'

import {useEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'
import {useAppState} from './AppState'
import {RefText} from './RefText'
import styles from './SummaryDialog.module.css'

/** Reads a human label for an id from the rendered document. */
function labelFor(id: string): string {
  const el = document.querySelector<HTMLElement>(`[data-entry='${id}']`)
  const heading = el?.querySelector('h3')?.textContent?.trim()
  return heading ? `${id} · ${heading}` : id
}

/**
 * The notes summary: the marked entries plus a short, streamed assessment.
 * Output is offered as copyable text and as a print view — no email, no form,
 * no data capture, exactly as the brief requires.
 */
export function SummaryDialog() {
  const t = useTranslations('notes')
  const {summary, closeSummary} = useAppState()
  const [copied, setCopied] = useState(false)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Focus the dialog on open; restore nothing special on close.
  useEffect(() => {
    if (summary.open) closeRef.current?.focus()
  }, [summary.open])

  // Escape closes.
  useEffect(() => {
    if (!summary.open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') closeSummary()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [summary.open, closeSummary])

  if (!summary.open) return null

  const labels = summary.ids.map((id) => ({id, label: labelFor(id)}))

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary.text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard blocked — leave the text selectable for a manual copy.
    }
  }

  function print() {
    const root = document.documentElement
    root.setAttribute('data-summary-print', 'true')
    const clear = () => root.removeAttribute('data-summary-print')
    window.addEventListener('afterprint', clear, {once: true})
    window.print()
  }

  return (
    <div className={styles.backdrop} onMouseDown={closeSummary}>
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="summary-title"
        data-print="summary"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.head}>
          <h2 className={styles.title} id="summary-title">
            {t('summaryTitle')}
          </h2>
          <button
            className={styles.close}
            type="button"
            onClick={closeSummary}
            ref={closeRef}
            aria-label={t('close')}
          >
            {t('close')}
          </button>
        </div>

        <div className={styles.marked}>
          <p className={styles.markedLabel}>{t('markedLabel')}</p>
          <ul className={styles.markedList}>
            {labels.map(({id, label}) => (
              <li className={styles.markedItem} key={id}>
                {label}
              </li>
            ))}
          </ul>
        </div>

        <div
          className={styles.assessment}
          aria-live="polite"
          aria-busy={summary.state === 'streaming'}
        >
          <p className={styles.assessmentLabel}>{t('assessmentLabel')}</p>
          <div className={styles.assessmentText}>
            <RefText content={summary.text} />
            {summary.state === 'streaming' && summary.text === '' ? (
              <span className={styles.caret} aria-hidden="true" />
            ) : null}
          </div>
        </div>

        <div className={styles.actions} data-print="hide">
          <button
            className={`${styles.action} button`}
            type="button"
            onClick={copy}
            disabled={summary.state !== 'done'}
          >
            {copied ? t('copied') : t('copy')}
          </button>
          <button
            className={`${styles.action} button button-quiet`}
            type="button"
            onClick={print}
            disabled={summary.state !== 'done'}
          >
            {t('print')}
          </button>
        </div>
      </div>
    </div>
  )
}
