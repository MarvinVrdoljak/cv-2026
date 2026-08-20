'use client'

import {useTranslations} from 'next-intl'
import {useAppState} from './AppState'
import styles from './ErrorToast.module.css'

/**
 * A single dry error line for the whole app — rate limit, missing key, input
 * too long. Announced to assistive tech, dismissible, never a modal.
 */
export function ErrorToast() {
  const t = useTranslations('errors')
  const {error, dismissError} = useAppState()

  if (!error) return null

  return (
    <div className={styles.root} role="alert" data-print="hide">
      <span className={styles.text}>{error}</span>
      <button className={styles.dismiss} type="button" onClick={dismissError}>
        {t('dismiss')}
      </button>
    </div>
  )
}
