import {getTranslations} from 'next-intl/server'
import {Link} from '@/i18n/navigation'
import {routing, type Locale} from '@/i18n/routing'
import {SECTIONS, sectionId} from '@/lib/sections'
import {cv} from '@/data/cv'
import styles from './TopBar.module.css'

type TopBarProps = {
  locale: Locale
}

/** Identity, section anchors, language. All interface type: mono, uppercase. */
export async function TopBar({locale}: TopBarProps) {
  const t = await getTranslations('shell')
  const sections = await getTranslations('sections')

  return (
    <header className={styles.root} data-print="hide">
      <div className={styles.inner}>
        <p className={styles.identity}>
          <span className={styles.identityLabel}>{t('identity')}</span>
          <span className={styles.identityName}>{cv.person.name}</span>
        </p>

        <nav className={styles.nav} aria-label={t('sectionsLabel')}>
          <ul className={styles.navList}>
            {SECTIONS.map((key) => (
              <li className={styles.navItem} key={key}>
                <a className={styles.navLink} href={`#${sectionId(key)}`}>
                  {sections(key)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className={styles.locales}>
          <span className={styles.localeLabel}>{t('localeLabel')}</span>
          {routing.locales.map((code) => (
            <Link
              className={styles.localeLink}
              key={code}
              href="/"
              locale={code}
              aria-current={code === locale ? 'true' : undefined}
            >
              {code}
            </Link>
          ))}
        </div>
      </div>
    </header>
  )
}
