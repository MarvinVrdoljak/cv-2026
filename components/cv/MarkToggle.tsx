import {getTranslations} from 'next-intl/server'
import styles from './MarkToggle.module.css'

type MarkToggleProps = {
  /** Id of the CV entry this mark belongs to — submitted as the field value. */
  entryId: string
  /** What is being marked, spoken to assistive tech: "Mark: Senior Frontend…" */
  description: string
}

/**
 * A native checkbox, styled but never replaced. Three things depend on it
 * staying a real, rendered control: keyboard operation, the announced
 * checked state, and the `marks` CSS counter it increments.
 */
export async function MarkToggle({entryId, description}: MarkToggleProps) {
  const t = await getTranslations('cv')

  return (
    <label className={styles.root}>
      <input
        className={styles.input}
        type="checkbox"
        name="mark"
        value={entryId}
        data-mark
        aria-label={`${t('mark')}: ${description}`}
      />
      <span className={styles.state} aria-hidden="true">
        <span className={styles.stateIdle}>{t('mark')}</span>
        <span className={styles.stateActive}>{t('marked')}</span>
      </span>
    </label>
  )
}
