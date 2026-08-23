'use client'

import {useEffect, useRef, useState, type ReactNode} from 'react'

type BarMenuProps = {
  /** Spoken name of the control — the bar itself prints only the value. */
  label: string
  /** What is set right now. This is what stands in the bar. */
  value: string
  /** The rows, styled with the global `.bar-menu-option` atom. */
  children: ReactNode
}

/**
 * A value in the chrome that opens: the display switch and the language switch
 * both went from a row of chips to one of these, because five words for two
 * settings shouted louder than the document they sit above.
 *
 * It is a <details> element, and that is the whole point — it opens, closes and
 * answers the keyboard with JavaScript switched off, so the language switch
 * keeps working on a page whose interactive parts have not loaded. Everything
 * this component adds on top is a courtesy: shutting on Escape, on a click
 * outside, and once a row has been picked. Nothing here is load-bearing.
 *
 * The look lives in styles/components/bar-menu.css — an atom, not a module,
 * because one of the two callers renders on the server.
 */
export function BarMenu({label, value, children}: BarMenuProps) {
  const menuRef = useRef<HTMLDetailsElement>(null)
  const summaryRef = useRef<HTMLElement>(null)
  const [open, setOpen] = useState(false)

  // The element is the source of truth, not React: the summary toggles it
  // itself, and without JavaScript that is all that ever happens.
  useEffect(() => {
    const menu = menuRef.current
    if (!menu) return

    const sync = () => setOpen(menu.open)
    menu.addEventListener('toggle', sync)
    return () => menu.removeEventListener('toggle', sync)
  }, [])

  useEffect(() => {
    if (!open) return
    const menu = menuRef.current
    if (!menu) return

    const onPointerDown = (event: PointerEvent) => {
      if (!menu.contains(event.target as Node)) menu.open = false
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      // Escape dismisses the menu, so the focus has to come back out with it —
      // otherwise the next Tab starts from a panel that is no longer there.
      menu.open = false
      summaryRef.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <details className="bar-menu" ref={menuRef}>
      {/* The name is spoken, the value is printed: "DE" in the bar, "Sprache:
          de" for anyone listening. */}
      <summary className="bar-menu-summary" ref={summaryRef} aria-label={`${label}: ${value}`}>
        <span className="bar-menu-row">
          {value}
          <span className="bar-menu-caret" aria-hidden="true" />
        </span>
      </summary>

      {/* A click in the panel has done its work either way — it picked a row or
          it missed one. The rows handle themselves; this only shuts the drawer,
          and it runs after theirs because the event bubbles. */}
      <div
        className="bar-menu-panel"
        role="group"
        aria-label={label}
        onClick={() => {
          if (menuRef.current) menuRef.current.open = false
        }}
      >
        {children}
      </div>
    </details>
  )
}
