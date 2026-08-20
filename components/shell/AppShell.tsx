import React from 'react'
import {getTranslations} from 'next-intl/server'
import type {Locale} from '@/i18n/routing'
import {TopBar} from './TopBar'
import {StatusBar} from './StatusBar'
import {NoteTray} from './NoteTray'
import {KeyBindings} from './KeyBindings'
import styles from './AppShell.module.css'

type AppShellProps = {
  locale: Locale
  /** The document column: matching input and the CV itself. */
  children: React.ReactNode
  /** The permanent chat column (right on desktop, bottom bar on mobile). */
  panel: React.ReactNode
}

/**
 * The instrument around the document. Two mono chrome bars frame a
 * hairline-separated two-column frame; nothing here scrolls away.
 *
 * DOM order matters: the mark checkboxes inside `children` increment the
 * `marks` CSS counter that the tray and the status bar read further down.
 * That is what makes the counter work without JavaScript.
 */
export async function AppShell({locale, children, panel}: AppShellProps) {
  const t = await getTranslations('shell')
  const chat = await getTranslations('chat')

  return (
    <div className={styles.root}>
      <a className={styles.skip} href="#document">
        {t('skipToDocument')}
      </a>
      <a className={styles.skip} href="#chat">
        {t('skipToChat')}
      </a>

      <TopBar locale={locale} />

      <div className={styles.frame}>
        <main className={styles.document} id="document" data-print="document">
          {children}
        </main>
        <aside className={styles.panel} id="chat" aria-label={chat('title')} data-print="hide">
          {panel}
        </aside>
      </div>

      <div className={styles.tray} data-print="hide">
        <NoteTray />
      </div>

      <StatusBar locale={locale} />
      <KeyBindings />
    </div>
  )
}
