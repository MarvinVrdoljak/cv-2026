import {getTranslations} from 'next-intl/server'
import type {Locale} from '@/i18n/routing'
import {PdfLink} from './PdfLink'
import {StatusReadouts} from './StatusReadouts'
import styles from './StatusBar.module.css'

/**
 * A narrow instrument readout. The state/model/latency values are live
 * (StatusReadouts, client); the marks count comes from the `marks` CSS counter
 * so it still works with JavaScript switched off.
 */
type StatusBarProps = {
  locale: Locale
}

export async function StatusBar({locale}: StatusBarProps) {
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

            `data-marks-readout` lets AppShell reveal this only once something
            is actually marked — a readout of nothing is not a measurement.
            Same `:has()` rule as the notes tray, so it needs no JavaScript.
          */}
          <div className={styles.readout} data-marks-readout aria-hidden="true">
            <dt className={styles.key}>{t('marks')}</dt>
            <dd className={styles.counter} />
          </div>
        </dl>

        <PdfLink locale={locale} />
      </div>
    </footer>
  )
}
