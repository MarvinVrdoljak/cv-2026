import {getTranslations} from 'next-intl/server'
import {Link} from '@/i18n/navigation'
import {routing, type Locale} from '@/i18n/routing'
import {SECTIONS, sectionId} from '@/lib/sections'
import {cv} from '@/data/cv'
import {BarMenu} from './BarMenu'
import {ThemeSwitch} from './ThemeSwitch'
import styles from './TopBar.module.css'

type TopBarProps = {
  locale: Locale
}

/** Identity, section anchors, display, language. All interface type: mono. */
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

        {/* The two things a reader may set about the page itself — how it is lit
            and what language it speaks. Both print only their current value and
            keep the rest in a drawer: laid out flat they were five words of
            interface above a document that has to speak first. The names are
            spoken, not printed (see BarMenu). */}
        <div className={styles.settings}>
          <ThemeSwitch />

          <BarMenu label={t('localeLabel')} value={locale}>
            {routing.locales.map((code) => (
              <Link
                className="bar-menu-option"
                key={code}
                href="/"
                locale={code}
                aria-current={code === locale ? 'true' : undefined}
              >
                {code}
              </Link>
            ))}
          </BarMenu>
        </div>
      </div>
    </header>
  )
}
