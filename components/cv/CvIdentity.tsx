import {getTranslations} from 'next-intl/server'
import type {Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import styles from './CvIdentity.module.css'

type CvIdentityProps = {
  locale: Locale
}

/**
 * The head of the document. Deliberately not a hero: name, role, and the
 * contact data as a mono row under a rule. Nothing here scrolls, reveals
 * or animates.
 */
export async function CvIdentity({locale}: CvIdentityProps) {
  const t = await getTranslations('cv')

  return (
    <header className={styles.root}>
      <h1 className={styles.name}>{cv.person.name}</h1>
      <p className={styles.role}>{cv.person.role[locale]}</p>

      <ul className={styles.meta} aria-label={t('contactLabel')}>
        <li className={styles.metaItem}>{cv.person.location}</li>
        <li className={styles.metaItem}>
          <a className={styles.metaLink} href={`mailto:${cv.person.email}`}>
            {cv.person.email}
          </a>
        </li>
        {cv.person.links.map((link) => (
          <li className={styles.metaItem} key={link.id}>
            <a className={styles.metaLink} href={link.href} rel="me noreferrer" target="_blank">
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </header>
  )
}
