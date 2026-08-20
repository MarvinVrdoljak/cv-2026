'use client'

import {useEffect, useState} from 'react'
import {useTranslations} from 'next-intl'
import {FOCUS_TARGET} from '@/lib/ids'
import {MAX_LENGTH} from '@/lib/rateLimit'
import {useAppState} from '@/components/app/AppState'
import {KeyHint} from '@/components/shell/KeyHint'
import {MatchResults} from './MatchResults'
import styles from './QueryBar.module.css'

type Source = 'text' | 'url'

/** The two inputs persist on their own, independent of the matched ad. */
const QUERY_STORE = 'cv:query:v1'

/**
 * The matching input, above the document as one quiet line that grows on
 * focus — a job ad is pasted deliberately, so the CV stays what you read
 * first. Two ways in: paste the ad text, or give a URL that the server fetches
 * and reads for you. Submitting streams the analysis into the result blocks
 * and reorders the CV underneath.
 */
export function QueryBar() {
  const t = useTranslations('match')
  const {matching, runMatching, resetMatching} = useAppState()
  const [source, setSource] = useState<Source>('text')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')

  // The two inputs are independent and persist on their own — a URL match must
  // never pour its extracted text into the Text field. Rehydrate once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(QUERY_STORE)
      if (!raw) return
      const saved = JSON.parse(raw) as {text?: string; url?: string; source?: Source}
      if (typeof saved.text === 'string') setText(saved.text)
      if (typeof saved.url === 'string') setUrl(saved.url)
      if (saved.source === 'text' || saved.source === 'url') setSource(saved.source)
    } catch {
      // corrupt store — ignore
    }
  }, [])

  // Persist what the visitor typed in each tab, plus the active tab.
  useEffect(() => {
    try {
      localStorage.setItem(QUERY_STORE, JSON.stringify({text, url, source}))
    } catch {
      // storage full / unavailable — non-fatal
    }
  }, [text, url, source])

  const streaming = matching.state === 'streaming'
  const hasResult =
    matching.state !== 'idle' && (matching.findings.length > 0 || matching.rejected !== null)
  const current = source === 'text' ? text : url
  const canReset = hasResult || Boolean(matching.advert) || current.trim() !== ''

  function submit() {
    const value = current.trim()
    if (!value || streaming) return
    runMatching(value, source)
  }

  function reset() {
    resetMatching()
    setText('')
    setUrl('')
  }

  // Two tabs, so arrow keys just flip between them.
  function onTabKey(event: React.KeyboardEvent) {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      setSource((s) => (s === 'text' ? 'url' : 'text'))
    }
  }

  return (
    <section className={styles.root} aria-labelledby="query-label" data-print="hide">
      <div className={styles.head}>
        <span className={styles.label} id="query-label">
          {t('label')}
        </span>
        <div className={styles.tabs} role="tablist" aria-label={t('sourceLabel')}>
          <button
            className={styles.tab}
            role="tab"
            id="query-tab-text"
            type="button"
            aria-selected={source === 'text'}
            aria-controls="query-panel"
            tabIndex={source === 'text' ? 0 : -1}
            onClick={() => setSource('text')}
            onKeyDown={onTabKey}
          >
            {t('sourceText')}
          </button>
          <button
            className={styles.tab}
            role="tab"
            id="query-tab-url"
            type="button"
            aria-selected={source === 'url'}
            aria-controls="query-panel"
            tabIndex={source === 'url' ? 0 : -1}
            onClick={() => setSource('url')}
            onKeyDown={onTabKey}
          >
            {t('sourceUrl')}
          </button>
        </div>
        {/* Counter first, key hint last: the hint then sits at the right edge
            in both modes instead of sliding when the counter goes away. */}
        {source === 'text' ? (
          <p className={styles.limit}>
            {text.length}/{MAX_LENGTH.advert}
          </p>
        ) : null}
        <KeyHint combo="mod-k" />
      </div>

      <div
        className={styles.field}
        role="tabpanel"
        id="query-panel"
        aria-labelledby={source === 'text' ? 'query-tab-text' : 'query-tab-url'}
      >
        {source === 'text' ? (
          <textarea
            className={styles.input}
            id="query-input"
            name="advert"
            rows={1}
            maxLength={MAX_LENGTH.advert}
            placeholder={t('placeholder')}
            aria-label={t('label')}
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
        ) : (
          <input
            className={styles.url}
            id="query-url"
            name="advert-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            spellCheck={false}
            placeholder={t('urlPlaceholder')}
            aria-label={t('sourceUrl')}
            aria-describedby="query-hint"
            data-focus={FOCUS_TARGET.query}
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            onKeyDown={(event) => {
              // A URL is one line — Enter submits.
              if (event.key === 'Enter') {
                event.preventDefault()
                submit()
              }
            }}
          />
        )}
        <div className={styles.actions}>
          <button
            className={`${styles.submit} button`}
            type="button"
            onClick={submit}
            disabled={!current.trim() || streaming}
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
        {source === 'text' ? t('hint') : t('urlHint')}
      </p>

      {hasResult ? <MatchResults /> : null}
    </section>
  )
}
