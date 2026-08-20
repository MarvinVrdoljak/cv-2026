'use client'

import {useTranslations} from 'next-intl'
import {useAppState} from '@/components/app/AppState'
import styles from './StatusBar.module.css'

/**
 * The live half of the status bar: run state, model and latency. Values are
 * `—` until a request has actually produced them — an instrument at rest
 * shows no measurement rather than a plausible-looking placeholder.
 */
export function StatusReadouts() {
  const t = useTranslations('status')
  const {status} = useAppState()

  const streaming = status.state === 'streaming'

  return (
    <>
      <div className={styles.readout}>
        <dt className={styles.key}>{t('state')}</dt>
        <dd className={styles.value} data-state={streaming ? 'streaming' : 'idle'}>
          <span className={styles.dot} aria-hidden="true" />
          {streaming ? t('streaming') : t('ready')}
        </dd>
      </div>

      <div className={`${styles.readout} ${styles.readoutSecondary}`}>
        <dt className={styles.key}>{t('model')}</dt>
        <dd className={styles.value}>{status.model ?? t('pending')}</dd>
      </div>

      <div className={`${styles.readout} ${styles.readoutSecondary}`}>
        <dt className={styles.key}>{t('latency')}</dt>
        <dd className={styles.value}>
          {status.latencyMs !== null ? `${status.latencyMs} ms` : t('pending')}
        </dd>
      </div>
    </>
  )
}
