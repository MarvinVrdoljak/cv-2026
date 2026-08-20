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
 */
export function NoteTray() {
  const t = useTranslations('notes')
  const {runSummary, summary} = useAppState()

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
          disabled={summary.state === 'streaming'}
        >
          {summary.state === 'streaming' ? t('generating') : t('summary')}
        </button>
        <button className={`${styles.action} button button-quiet`} type="reset" form={MARK_FORM_ID}>
          {t('reset')}
        </button>
      </div>
    </div>
  )
}
