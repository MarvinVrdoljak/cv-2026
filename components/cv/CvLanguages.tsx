import type {Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import {CvAddress} from './CvAddress'
import {MarkToggle} from './MarkToggle'
import styles from './CvLanguages.module.css'

type CvLanguagesProps = {
  locale: Locale
}

export async function CvLanguages({locale}: CvLanguagesProps) {
  return (
    <div className={styles.root}>
      {cv.languages.map((entry) => (
        <div
          className={`${styles.entry} addressable`}
          key={entry.id}
          id={entry.id}
          data-entry={entry.id}
          data-print="entry"
        >
          <div className={styles.gutter}>
            <CvAddress id={entry.id} />
            <MarkToggle
              entryId={entry.id}
              description={`${entry.language[locale]} — ${entry.level[locale]}`}
            />
          </div>

          <p className={styles.body}>
            <span className={styles.language}>{entry.language[locale]}</span>
            <span className={styles.level}>{entry.level[locale]}</span>
          </p>
        </div>
      ))}
    </div>
  )
}
