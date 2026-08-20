import {getTranslations} from 'next-intl/server'
import type {Locale} from '@/i18n/routing'
import type {CvExperience} from '@/data/cv'
import {durationInMonths, formatMonth, pickDurationKey, splitDuration} from '@/lib/format'
import {CvAddress} from './CvAddress'
import {MarkToggle} from './MarkToggle'
import styles from './CvEntry.module.css'

type CvEntryProps = {
  entry: CvExperience
  locale: Locale
}

/**
 * One station of the career, and the signature element of the document:
 * identifier in the margin, dates in mono, substance in the sans.
 *
 * Two states are prepared for the wiring:
 * `data-highlight` flashes the entry when matching or chat cites it,
 * `data-entry` identifies it so relevance sorting can set its `order`.
 */
export async function CvEntry({entry, locale}: CvEntryProps) {
  const t = await getTranslations('cv')

  const total = durationInMonths(entry.from, entry.to)
  const {years, months} = splitDuration(total)
  const duration = t(pickDurationKey(years, months), {years, months})

  return (
    <article
      className={`${styles.root} addressable`}
      id={entry.id}
      data-entry={entry.id}
      data-print="entry"
    >
      <div className={styles.gutter}>
        <CvAddress id={entry.id} />
        <MarkToggle
          entryId={entry.id}
          description={`${entry.role[locale]}, ${entry.organisation}`}
        />
      </div>

      <div className={styles.body}>
        <p className={styles.meta}>
          <span className={styles.period}>
            <time dateTime={entry.from}>{formatMonth(entry.from, locale)}</time>
            <span className={styles.dash} aria-hidden="true">
              –
            </span>
            {entry.to ? (
              <time dateTime={entry.to}>{formatMonth(entry.to, locale)}</time>
            ) : (
              <span className={styles.present}>{t('present')}</span>
            )}
          </span>
          <span className={styles.duration}>{duration}</span>
        </p>

        <h3 className={styles.role}>{entry.role[locale]}</h3>
        <p className={styles.organisation}>
          {(() => {
            // Split "Company · Vollzeit" so only the company name links.
            const [company, ...rest] = entry.organisation.split(' · ')
            const meta = [...rest, entry.location]
            return (
              <>
                {entry.organisationHref ? (
                  <a
                    className={styles.organisationLink}
                    href={entry.organisationHref}
                    rel="noreferrer"
                    target="_blank"
                    data-print="resolve-url"
                  >
                    {company}
                  </a>
                ) : (
                  <span className={styles.organisationName}>{company}</span>
                )}
                {meta.map((segment) => (
                  <span className={styles.organisationMeta} key={segment}>
                    {segment}
                  </span>
                ))}
              </>
            )
          })()}
        </p>
        <p className={styles.summary}>{entry.summary[locale]}</p>

        <ul className={styles.highlights}>
          {entry.highlights.map((highlight, index) => (
            <li className={styles.highlight} key={`${entry.id}-h${index}`}>
              {highlight[locale]}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
