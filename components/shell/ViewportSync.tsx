'use client'

import {useEffect} from 'react'

/**
 * Publishes what the visual viewport is doing as two custom properties, so the
 * fixed chrome can position itself against the part of the screen that is
 * actually visible:
 *
 *   `--keyboard-inset`   how much of the bottom edge is covered right now
 *   `--viewport-height`  the height that is left
 *
 * iOS is the reason. It keeps the layout viewport at full height when the
 * on-screen keyboard opens and slides the keyboard over it, so a
 * `position: fixed` bar at `bottom: 0` stays glued to the bottom of the *page*
 * — behind the keyboard. Only the visual viewport knows about any of it.
 * (Android resizes the layout viewport instead, see `interactiveWidget` in the
 * layout; there the inset simply stays 0 and this changes nothing.)
 *
 * Renders no markup. Without JavaScript both properties keep the resting
 * values from tokens.css, which is the no-keyboard case — the honest fallback.
 */
export function ViewportSync() {
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    const root = document.documentElement
    let frame = 0

    function publish() {
      frame = 0
      if (!viewport) return

      // The gap between the bottom of the layout viewport and the bottom of
      // what is visible: the keyboard, plus whatever iOS scrolled the page by
      // to bring the focused field into view.
      const covered = window.innerHeight - viewport.height - viewport.offsetTop

      root.style.setProperty('--keyboard-inset', `${Math.max(0, Math.round(covered))}px`)
      root.style.setProperty('--viewport-height', `${Math.round(viewport.height)}px`)
    }

    // resize and scroll both fire in bursts while the keyboard slides in
    function schedule() {
      if (frame) return
      frame = window.requestAnimationFrame(publish)
    }

    publish()
    viewport.addEventListener('resize', schedule)
    viewport.addEventListener('scroll', schedule)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      viewport.removeEventListener('resize', schedule)
      viewport.removeEventListener('scroll', schedule)
      root.style.removeProperty('--keyboard-inset')
      root.style.removeProperty('--viewport-height')
    }
  }, [])

  return null
}
