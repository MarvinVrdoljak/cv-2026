'use client'

import {useTranslations} from 'next-intl'
import styles from './PrintButton.module.css'

/**
 * Client-only on purpose: without JavaScript the browser's own print command
 * still works, so no affordance is missing — only this shortcut to it.
 */
export function PrintButton() {
  const t = useTranslations('shell')

  return (
    <button className={styles.root} type="button" onClick={() => window.print()}>
      {t('print')}
    </button>
  )
}
