import {getTranslations} from 'next-intl/server'
import type {Locale} from '@/i18n/routing'
import styles from './PdfLink.module.css'

type PdfLinkProps = {
  locale: Locale
}

/**
 * The way off the screen: an ordinary link to the typeset CV.
 *
 * A link, not a button, and rendered on the server — so paper is available
 * with JavaScript switched off, which `window.print()` never was. Ctrl+P still
 * works too and gets the print stylesheet; this gets the real document.
 */
export async function PdfLink({locale}: PdfLinkProps) {
  const t = await getTranslations('shell')

  return (
    <a
      className={styles.root}
      href={`/api/pdf?doc=cv&locale=${locale}`}
      target="_blank"
      rel="noreferrer"
      aria-label={t('pdfLabel')}
    >
      {t('pdf')}
    </a>
  )
}
