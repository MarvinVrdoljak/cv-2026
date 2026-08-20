import {getTranslations} from 'next-intl/server'
import {PrintButton} from './PrintButton'
import {StatusReadouts} from './StatusReadouts'
import styles from './StatusBar.module.css'

/**
 * A narrow instrument readout. The state/model/latency values are live
 * (StatusReadouts, client); the marks count comes from the `marks` CSS counter
 * so it still works with JavaScript switched off.
 */
export async function StatusBar() {
  const t = await getTranslations('status')

  return (
    <footer className={styles.root} aria-label={t('label')} data-print="hide">
      <div className={styles.inner}>
        <dl className={styles.readouts}>
          <StatusReadouts />

          {/*
            The count comes from generated content, which assistive tech does
            not read reliably, so this readout is hidden from it. Each entry's
            own checkbox announces its state.
          */}
          <div className={styles.readout} aria-hidden="true">
            <dt className={styles.key}>{t('marks')}</dt>
            <dd className={styles.counter} />
          </div>
        </dl>

        <PrintButton />
      </div>
    </footer>
  )
}
