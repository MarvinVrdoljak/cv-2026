'use client'

import {useEffect, useRef, useState} from 'react'
import {useTranslations} from 'next-intl'

type ShareLinkProps = {
  /** Set by DocumentLinks, so all three actions share one class. */
  className: string
}

/** How long the copy confirmation stays up before the label returns. */
const CONFIRM_MS = 2000

/**
 * Hands this page on: the operating system's own share sheet where there is
 * one, the clipboard where there is not.
 *
 * It renders nothing until an effect has established which of the two the
 * browser actually offers — the same rule the status bar follows everywhere
 * else: show only what there is. That also settles the no-JavaScript case
 * without a second code path, and keeps the server markup and the first client
 * render identical.
 *
 * The address is read from the browser rather than composed, minus query and
 * hash: what gets shared is the CV in the language the reader is looking at,
 * not their scroll position or a stale matching state.
 */
export function ShareLink({className}: ShareLinkProps) {
  const t = useTranslations('shell')
  const [mode, setMode] = useState<'unknown' | 'share' | 'copy'>('unknown')
  const [copied, setCopied] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof navigator.share === 'function') setMode('share')
    else if (navigator.clipboard) setMode('copy')
  }, [])

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  if (mode === 'unknown') return null

  const confirm = () => {
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), CONFIRM_MS)
  }

  const share = async () => {
    const url = `${window.location.origin}${window.location.pathname}`

    if (mode === 'share') {
      try {
        // Title only, no `text`: several targets glue text and url together,
        // and a sentence in front of the link reads as spam there.
        await navigator.share({title: document.title, url})
      } catch {
        // A dismissed sheet throws the same way a failure does. Neither is
        // worth telling the reader about — they were just there.
      }
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      confirm()
    } catch {
      // Clipboard permission can be refused after the fact; saying "copied"
      // then would be a lie, so the label simply stays as it was.
    }
  }

  const label = mode === 'share' ? t('shareLabel') : t('shareCopyLabel')

  return (
    <button
      className={className}
      type="button"
      onClick={share}
      aria-label={copied ? t('shareCopied') : label}
    >
      {copied ? t('shareCopied') : t('share')}
    </button>
  )
}
