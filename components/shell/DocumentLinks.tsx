import {getTranslations} from 'next-intl/server'
import type {Locale} from '@/i18n/routing'
import {ShareLink} from './ShareLink'
import styles from './DocumentLinks.module.css'

type DocumentLinksProps = {
  locale: Locale
}

/**
 * The ways off the screen, at the end of the status bar.
 *
 * Two of them are ordinary links, rendered on the server — so paper is
 * available with JavaScript switched off, which `window.print()` never was.
 * Ctrl+P still works too and gets the print stylesheet; these get the real
 * documents: the full CV, and the one-page card that carries the QR code back
 * to this page.
 *
 * Sharing is the exception: there is no markup for a share sheet, so it is a
 * client component that removes itself when the browser has nothing to offer.
 */
export async function DocumentLinks({locale}: DocumentLinksProps) {
  const t = await getTranslations('shell')

  return (
    <div className={styles.root}>
      {/* Ordered by how much they commit the reader: passing the link on, the
          card, then the full document. */}
      <ShareLink className={styles.link} />

      <a
        className={styles.link}
        href={`/api/pdf?doc=qr&locale=${locale}`}
        target="_blank"
        rel="noreferrer"
        aria-label={t('qrLabel')}
      >
        {t('qr')}
      </a>

      <a
        className={styles.link}
        href={`/api/pdf?doc=cv&locale=${locale}`}
        target="_blank"
        rel="noreferrer"
        aria-label={t('pdfLabel')}
      >
        {t('pdf')}
      </a>
    </div>
  )
}
