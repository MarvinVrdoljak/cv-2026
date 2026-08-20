import {getTranslations} from 'next-intl/server'
import type {Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import {formatYearRange} from '@/lib/format'
import {CvAddress} from './CvAddress'
import {MarkToggle} from './MarkToggle'
import styles from './CvEducation.module.css'

type CvEducationProps = {
  locale: Locale
}

export async function CvEducation({locale}: CvEducationProps) {
  const t = await getTranslations('cv')

  return (
    <div className={styles.root}>
      {cv.education.map((entry) => (
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
              description={`${entry.qualification[locale]}, ${entry.institution}`}
            />
          </div>

          <div className={styles.body}>
            <p className={styles.period}>{formatYearRange(entry.from, entry.to, t('present'))}</p>
            <h3 className={styles.qualification}>{entry.qualification[locale]}</h3>
            <p className={styles.institution}>{entry.institution}</p>
            {entry.note ? <p className={styles.note}>{entry.note[locale]}</p> : null}
            {entry.href ? (
              <p className={styles.credential}>
                <a
                  className={styles.verify}
                  href={entry.href}
                  rel="noreferrer"
                  target="_blank"
                  data-print="resolve-url"
                >
                  {t('verify')}
                </a>
              </p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}
