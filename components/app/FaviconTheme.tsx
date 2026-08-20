'use client'

import {useEffect, useState} from 'react'

/**
 * Renders the SVG favicon link and points it at the variant that matches the
 * environment — dark tile on light chrome, light tile on dark chrome.
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
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setDark(query.matches)

    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  // React 19 hoists this into <head>.
  return <link rel="icon" type="image/svg+xml" href={dark ? '/favicon-dark.svg' : '/favicon.svg'} />
}
