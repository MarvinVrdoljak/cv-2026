'use client'

import {useTranslations} from 'next-intl'
import {MARK_FORM_ID} from '@/lib/ids'
import {useAppState} from '@/components/app/AppState'
import styles from './NoteTray.module.css'

/**
 * Appears only once something is marked — the reveal is driven by `:has()` in
 * AppShell and the count by the `marks` CSS counter, both working without
 * JavaScript. The reset stays a native `type="reset"` bound to the CV form, so
 * clearing marks also needs no script. Only "generate summary" requires JS.
 *
 * Each action carries two labels. The full one does not fit a phone: measured
 * in IBM Plex Mono at the tray's own size, the two German buttons want 406px
 * against the 335px a 375px viewport leaves, so they used to collide. The
 * shorter label is shown there instead, while `aria-label` keeps the full
 * wording for assistive tech in both cases.
 */
export function NoteTray() {
  const t = useTranslations('notes')
  const {runSummary, summary} = useAppState()

  const streaming = summary.state === 'streaming'

  return (
    <div className={styles.root}>
      <p className={styles.label}>
        <span className={styles.labelText}>{t('label')}</span>
        <span className={styles.counter} aria-hidden="true" />
      </p>

      <div className={styles.actions}>
        <button
          className={`${styles.action} button`}
          type="button"
          onClick={runSummary}
          disabled={streaming}
          aria-label={streaming ? t('generating') : t('summary')}
        >
          {streaming ? (
            t('generating')
          ) : (
            <>
              <span className={styles.long} aria-hidden="true">
                {t('summary')}
              </span>
              <span className={styles.short} aria-hidden="true">
                {t('summaryShort')}
              </span>
            </>
          )}
        </button>

        <button
          className={`${styles.action} button button-quiet`}
          type="reset"
          form={MARK_FORM_ID}
          aria-label={t('reset')}
        >
          <span className={styles.long} aria-hidden="true">
            {t('reset')}
          </span>
          <span className={styles.short} aria-hidden="true">
            {t('resetShort')}
          </span>
        </button>
      </div>
    </div>
  )
}
