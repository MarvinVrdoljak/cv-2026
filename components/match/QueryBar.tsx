'use client'

import {useEffect, useState} from 'react'
import {useTranslations} from 'next-intl'
import {FOCUS_TARGET} from '@/lib/ids'
import {MAX_LENGTH} from '@/lib/rateLimit'
import {useAppState} from '@/components/app/AppState'
import {KeyHint} from '@/components/shell/KeyHint'
import {MatchResults} from './MatchResults'
import styles from './QueryBar.module.css'

/**
 * The matching input, above the document as one quiet line that grows on
 * focus — a job ad is pasted deliberately, so the CV stays what you read
 * first. Submitting streams the analysis into the three result blocks and
 * reorders the CV underneath.
 */
export function QueryBar() {
  const t = useTranslations('match')
  const {matching, runMatching, resetMatching} = useAppState()
  const [text, setText] = useState('')

  // Seed the field from a restored advert once, without clobbering edits.
  useEffect(() => {
    if (matching.advert && text === '') setText(matching.advert)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matching.advert])

  const streaming = matching.state === 'streaming'
  const hasResult =
    matching.state !== 'idle' && (matching.findings.length > 0 || matching.rejected !== null)
  const canReset = hasResult || Boolean(matching.advert)

  function submit() {
    if (!text.trim() || streaming) return
    runMatching(text)
  }

  function reset() {
    resetMatching()
    setText('')
  }

  return (
    <section className={styles.root} aria-labelledby="query-label" data-print="hide">
      <div className={styles.head}>
        <label className={styles.label} htmlFor="query-input" id="query-label">
          {t('label')}
        </label>
        <KeyHint combo="mod-k" />
        <p className={styles.limit}>
          {text.length}/{MAX_LENGTH.advert}
        </p>
      </div>

      <div className={styles.field}>
        <textarea
          className={styles.input}
          id="query-input"
          name="advert"
          rows={1}
          maxLength={MAX_LENGTH.advert}
          placeholder={t('placeholder')}
          aria-describedby="query-hint"
          data-focus={FOCUS_TARGET.query}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            // ⌘/Ctrl+Enter submits from within the field.
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              submit()
            }
          }}
        />
        <div className={styles.actions}>
          <button
            className={`${styles.submit} button`}
            type="button"
            onClick={submit}
            disabled={!text.trim() || streaming}
            aria-busy={streaming}
          >
            {t('submit')}
          </button>
          {/* Always rendered, only hidden — appearing on submit would shove the
              field, which is the same jump the label used to cause. */}
          <button
            className={`${styles.reset} button button-quiet`}
            type="button"
            onClick={reset}
            data-idle={canReset ? undefined : 'true'}
          >
            {t('reset')}
          </button>
        </div>
      </div>

      {/* Reports the start of a run. The results region below can't: it is only
          mounted once the first finding has arrived. */}
      <p className="visually-hidden" role="status">
        {streaming ? t('analysing') : ''}
      </p>

      <p className={styles.hint} id="query-hint">
        {t('hint')}
      </p>

      {hasResult ? <MatchResults /> : null}
    </section>
  )
}
