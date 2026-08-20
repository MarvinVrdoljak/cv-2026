'use client'

import {useEffect, useRef, useState} from 'react'
import {useLocale, useTranslations} from 'next-intl'
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
 * Output is offered as copyable text and as a typeset PDF — no email, no
 * form, no data capture, exactly as the brief requires.
 *
 * Two paths lead to paper, and neither needs the other: the button opens the
 * typeset document from `/api/pdf` in a new tab, while `data-summary-print`
 * (set for as long as the dialog is open) makes a plain Ctrl+P print this
 * summary alone — so paper stays reachable even with JavaScript half-dead.
 */
export function SummaryDialog() {
  const t = useTranslations('notes')
  const locale = useLocale()
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

  // While the dialog is open, the print stylesheet treats the summary as the
  // whole page — so Ctrl+P prints the note, not the instrument behind it.
  useEffect(() => {
    if (!summary.open) return
    const root = document.documentElement
    root.setAttribute('data-summary-print', 'true')
    return () => root.removeAttribute('data-summary-print')
  }, [summary.open])

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

  /**
   * Opens the typeset summary in a new tab.
   *
   * A form submission rather than `fetch`, because that makes it a real
   * navigation: the tab lands on `/api/pdf`, the same kind of address the CV
   * link in the status bar produces, and the browser's viewer gets the
   * filename the server sent. A fetched document could only be shown as a
   * `blob:` url, with the file name lost and the object url to clean up.
   *
   * It has to be a POST: the marked ids and the streamed assessment live only
   * here, and neither belongs in a url (length, history, server logs).
   */
  function openPdf() {
    const form = document.createElement('form')
    form.method = 'POST'
    form.action = '/api/pdf'
    form.target = '_blank'

    const field = (name: string, value: string) => {
      const input = document.createElement('input')
      input.type = 'hidden'
      input.name = name
      input.value = value
      form.append(input)
    }

    field('locale', locale)
    field('assessment', summary.text)
    // One field per id, so the server reads them with `getAll`.
    summary.ids.forEach((id) => field('markedIds', id))

    // In the document, not detached: a detached form does not submit.
    document.body.append(form)
    form.submit()
    form.remove()
  }

  return (
    <div className={styles.backdrop} onMouseDown={closeSummary} data-print="overlay">
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
            onClick={openPdf}
            disabled={summary.state !== 'done'}
          >
            {t('pdf')}
          </button>
        </div>
      </div>
    </div>
  )
}
