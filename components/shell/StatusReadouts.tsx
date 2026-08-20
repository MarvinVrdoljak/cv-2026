'use client'

import {useTranslations} from 'next-intl'
import {useAppState} from '@/components/app/AppState'
import styles from './StatusBar.module.css'

/**
 * The live half of the status bar: what the assistant is doing, and — once it
 * has done something — which model answered and how long it took.
 *
 * The first readout names the assistant rather than saying "status", because a
 * bar that reads "status: ready" leaves open what is ready. Model and latency
 * appear only after a request has produced them: an instrument shows a
 * measurement or nothing, never a label with a dash where a value belongs.
 */
export function StatusReadouts() {
  const t = useTranslations('status')
  const {status} = useAppState()

  const streaming = status.state === 'streaming'

  return (
    <>
      <div className={styles.readout}>
        <dt className={styles.key}>{t('assistant')}</dt>
        <dd className={styles.value} data-state={streaming ? 'streaming' : 'idle'}>
          <span className={styles.dot} aria-hidden="true" />
          {streaming ? t('streaming') : t('ready')}
        </dd>
      </div>

      {status.model !== null ? (
        <div className={`${styles.readout} ${styles.readoutSecondary}`}>
          <dt className={styles.key}>{t('model')}</dt>
          <dd className={styles.value}>{status.model}</dd>
        </div>
      ) : null}

      {status.latencyMs !== null ? (
        <div className={`${styles.readout} ${styles.readoutSecondary}`}>
          <dt className={styles.key}>{t('latency')}</dt>
          <dd className={styles.value}>{status.latencyMs} ms</dd>
        </div>
      ) : null}
    </>
  )
}
