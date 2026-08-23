'use client'

import {useEffect} from 'react'

type DocumentLocaleProps = {
  locale: string
}

/**
 * Keeps `<html lang>` honest across a client-side language switch.
 *
 * The attribute is rendered by the root layout, which sits above the `[locale]`
 * segment and therefore does not re-render when the segment changes — the whole
 * point of putting it there (see app/layout.tsx). Every document request already
 * arrives with the right value, so this only has work to do after a switch
 * inside the running page, where JavaScript is present by definition.
 */
export function DocumentLocale({locale}: DocumentLocaleProps) {
  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  return null
}
