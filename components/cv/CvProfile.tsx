import type {Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import {CvAddress} from './CvAddress'
import {MarkToggle} from './MarkToggle'
import styles from './CvProfile.module.css'

type CvProfileProps = {
  locale: Locale
}

export async function CvProfile({locale}: CvProfileProps) {
  const {id, text} = cv.profile
  // The profile may hold several paragraphs, separated by newlines. Fall back
  // to the default locale so an unexpected/empty locale never crashes render.
  const body = text[locale] ?? text.de
  const paragraphs = body.split('\n').filter((line) => line.trim() !== '')

  return (
    <div className={`${styles.root} addressable`} id={id} data-entry={id} data-print="entry">
      <div className={styles.gutter}>
        <CvAddress id={id} />
        <MarkToggle entryId={id} description={cv.person.role[locale]} />
      </div>
      <div className={styles.text}>
        {paragraphs.map((paragraph, index) => (
          <p className={styles.paragraph} key={index}>
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  )
}
