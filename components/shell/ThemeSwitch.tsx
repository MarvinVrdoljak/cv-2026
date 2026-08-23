'use client'

import {useEffect, useState} from 'react'
import {useTranslations} from 'next-intl'
import {THEME_PREFERENCES, applyTheme, readTheme, type ThemePreference} from '@/lib/theme'
import {BarMenu} from './BarMenu'

/** Three states, in the order the menu lists them. */
const LABEL = {auto: 'themeAuto', light: 'themeLight', dark: 'themeDark'} as const

/**
 * Light or dark, or neither — "auto" hands the decision back to the system,
 * which is where it rests by default and the only behaviour the CV has without
 * JavaScript. The palette itself lives in tokens.css; this only stamps the
 * attribute those rules key on (lib/theme.ts).
 *
 * It renders nothing until an effect has read the stored preference: the server
 * cannot know it, so anything else would be a hydration mismatch, and it also
 * settles the no-JavaScript case the way the status bar settles it everywhere
 * else — show only what there is. The palette is already right before this
 * mounts; the inline script in the layout applies it before the first paint.
 */
export function ThemeSwitch() {
  const t = useTranslations('shell')
  const [preference, setPreference] = useState<ThemePreference | null>(null)

  useEffect(() => setPreference(readTheme()), [])

  if (!preference) return null

  return (
    <BarMenu label={t('themeLabel')} value={t(LABEL[preference])}>
      {THEME_PREFERENCES.map((value) => (
        <button
          className="bar-menu-option"
          key={value}
          type="button"
          onClick={() => {
            applyTheme(value)
            setPreference(value)
          }}
          // Three switches of which one is on — not three links to somewhere.
          // The accent shows everyone else the same thing.
          aria-pressed={value === preference}
        >
          {t(LABEL[value])}
        </button>
      ))}
    </BarMenu>
  )
}
