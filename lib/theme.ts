/**
 * The reader's display choice.
 *
 * The app follows the environment — that stays the resting state, the default,
 * and the only behaviour without JavaScript. The switch in the top bar is an
 * override on top of it, which is why `auto` is the *absence* of a stamp on
 * <html>: with no attribute the `prefers-color-scheme` query in tokens.css
 * decides, and `light` / `dark` outrank it (see the palette blocks there).
 *
 * Everything the client knows about the theme comes from here — the switch, the
 * favicon, and the portrait canvas, which mixes its own tints from the token
 * values and has to remix them when the palette changes.
 */
export type Theme = 'light' | 'dark'
export type ThemePreference = 'auto' | Theme

/** Offered in this order: the environment first, then the two overrides. */
export const THEME_PREFERENCES: readonly ThemePreference[] = ['auto', 'light', 'dark']

const STORE_KEY = 'cv-theme'
const ATTR = 'data-theme'

/**
 * Runs in the layout's inline script, before first paint — a preference applied
 * after hydration would show the wrong palette for a frame. Kept to one line of
 * plain ES5 and wrapped in try/catch: storage throws outright in a locked-down
 * Safari, and a broken script here would take the `data-js` flag with it.
 */
export const THEME_BOOTSTRAP =
  `try{var t=localStorage.getItem('${STORE_KEY}');` +
  `if(t==='light'||t==='dark')document.documentElement.setAttribute('${ATTR}',t)}catch(e){}`

/** What is stored, not what is showing — `auto` for anything unreadable. */
export function readTheme(): ThemePreference {
  try {
    const value = localStorage.getItem(STORE_KEY)
    if (value === 'light' || value === 'dark') return value
  } catch {
    // Storage refused (private mode, blocked cookies). Following the
    // environment is the honest answer then, and it is also the default.
  }
  return 'auto'
}

/**
 * Stamps the attribute the palette keys on and remembers the choice. `auto`
 * clears both, so a reader who returns to it is back to the plain default
 * rather than to a copy of it that could drift.
 */
export function applyTheme(preference: ThemePreference) {
  const root = document.documentElement

  if (preference === 'auto') root.removeAttribute(ATTR)
  else root.setAttribute(ATTR, preference)

  try {
    if (preference === 'auto') localStorage.removeItem(STORE_KEY)
    else localStorage.setItem(STORE_KEY, preference)
  } catch {
    // The switch still works for this visit; only the memory of it is gone.
  }
}

/** Which palette is actually on screen right now. */
export function resolveTheme(): Theme {
  const stamped = document.documentElement.getAttribute(ATTR)
  if (stamped === 'light' || stamped === 'dark') return stamped

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Calls back whenever the palette on screen changes — from the environment or
 * from the switch. Two sources, one signal: the media query, and the attribute
 * on <html> (observed rather than published through React, so a plain DOM
 * consumer like the portrait canvas needs nothing from the component tree).
 */
export function watchTheme(onChange: (theme: Theme) => void): () => void {
  const query = window.matchMedia('(prefers-color-scheme: dark)')
  const notify = () => onChange(resolveTheme())

  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, {attributeFilter: [ATTR]})
  query.addEventListener('change', notify)

  return () => {
    observer.disconnect()
    query.removeEventListener('change', notify)
  }
}
