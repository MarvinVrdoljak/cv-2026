'use client'

import {useEffect, useState} from 'react'
import {resolveTheme, watchTheme} from '@/lib/theme'

/**
 * Renders the SVG favicon link and points it at the variant that matches the
 * environment — dark tile on light chrome, light tile on dark chrome.
 *
 * Which variant that is comes from lib/theme.ts, so an explicit choice in the
 * top bar moves the favicon with the page instead of leaving it on whatever the
 * system prefers.
 *
 * public/favicon.svg already carries the switch itself via prefers-color-scheme,
 * which Firefox and Safari honour. Chromium does not evaluate media queries
 * inside a favicon, so the dark case needs its own file. Owning the <link> in
 * React (rather than mutating the one from the metadata API) keeps it correct
 * across locale navigation, where Next re-applies metadata.
 *
 * The link is hoisted into the prerendered HTML too, so with JS off Firefox and
 * Safari still switch via the media query in the file; Chromium then keeps the
 * light variant, and browsers without SVG favicon support take /favicon.ico
 * from the metadata — static, but legible on either chrome.
 */
export function FaviconTheme() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(resolveTheme() === 'dark')
    return watchTheme((theme) => setDark(theme === 'dark'))
  }, [])

  // React 19 hoists this into <head>.
  return <link rel="icon" type="image/svg+xml" href={dark ? '/favicon-dark.svg' : '/favicon.svg'} />
}
