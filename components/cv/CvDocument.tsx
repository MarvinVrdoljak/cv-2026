import {getTranslations} from 'next-intl/server'
import type {Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import {MARK_FORM_ID} from '@/lib/ids'
import {CvIdentity} from './CvIdentity'
import {CvSection} from './CvSection'
import {CvProfile} from './CvProfile'
import {CvEntry} from './CvEntry'
import {CvSkills} from './CvSkills'
import {CvEducation} from './CvEducation'
import {CvLanguages} from './CvLanguages'
import styles from './CvDocument.module.css'

type CvDocumentProps = {
  locale: Locale
}

/**
 * The whole CV, readable top to bottom with no interaction and no JavaScript.
 *
 * The sections sit in a form for one reason: a `type="reset"` button anywhere
 * on the page can clear every mark through `form="cv-marks"`, so the notes
 * state is resettable without a line of script.
 */
export async function CvDocument({locale}: CvDocumentProps) {
  const sections = await getTranslations('sections')
  const t = await getTranslations('cv')

  return (
    <div className={styles.root}>
      <CvIdentity locale={locale} />

      <p className={styles.hint} data-print="hide">
        {t('markHint')}
      </p>

      <form className={styles.form} id={MARK_FORM_ID}>
        <CvSection section="profile" title={sections('profile')} index={1}>
          <CvProfile locale={locale} />
        </CvSection>

        <CvSection section="experience" title={sections('experience')} index={2}>
          {/* Flex column so relevance sorting can move entries with `order` */}
          <div className={styles.entries}>
            {cv.experience.map((entry) => (
              <CvEntry key={entry.id} entry={entry} locale={locale} />
            ))}
          </div>
        </CvSection>

        <CvSection section="skills" title={sections('skills')} index={3}>
          <CvSkills locale={locale} />
        </CvSection>

        <CvSection section="education" title={sections('education')} index={4}>
          <CvEducation locale={locale} />
        </CvSection>

        <CvSection section="languages" title={sections('languages')} index={5}>
          <CvLanguages locale={locale} />
        </CvSection>
      </form>
    </div>
  )
}
