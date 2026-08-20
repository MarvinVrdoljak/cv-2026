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

  return (
    <div className={`${styles.root} addressable`} id={id} data-entry={id} data-print="entry">
      <div className={styles.gutter}>
        <CvAddress id={id} />
        <MarkToggle entryId={id} description={cv.person.role[locale]} />
      </div>
      <p className={styles.text}>{text[locale]}</p>
    </div>
  )
}
