import type {Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import {CvAddress} from './CvAddress'
import {MarkToggle} from './MarkToggle'
import styles from './CvSkills.module.css'

type CvSkillsProps = {
  locale: Locale
}

/**
 * Skills by category. No bars, no percentages, no self-assessment on a
 * scale nobody calibrated — the items are named, and the optional note
 * qualifies depth in one sentence of prose.
 */
export async function CvSkills({locale}: CvSkillsProps) {
  return (
    <div className={styles.root}>
      {cv.skills.map((group) => (
        <div
          className={`${styles.group} addressable`}
          key={group.id}
          id={group.id}
          data-entry={group.id}
          data-print="entry"
        >
          <div className={styles.gutter}>
            <CvAddress id={group.id} />
            <MarkToggle entryId={group.id} description={group.label[locale]} />
          </div>

          <div className={styles.body}>
            <h3 className={styles.label}>{group.label[locale]}</h3>
            <ul className={styles.items} aria-label={group.label[locale]}>
              {group.items.map((item) => (
                <li className={styles.item} key={item}>
                  {item}
                </li>
              ))}
            </ul>
            {group.note ? <p className={styles.note}>{group.note[locale]}</p> : null}
          </div>
        </div>
      ))}
    </div>
  )
}
