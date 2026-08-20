'use client'

import {useEffect} from 'react'
import {FOCUS_TARGET} from '@/lib/ids'

function focusTarget(name: string): boolean {
  const element = document.querySelector<HTMLElement>(`[data-focus='${name}']`)
  if (!element) return false

  element.focus()
  return true
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false

  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target.isContentEditable
  )
}

/**
 * The shortcuts the chrome advertises — nothing more. Renders no markup, and
 * every one of them is a shortcut to something reachable by Tab as well.
 */
export function KeyBindings() {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (focusTarget(FOCUS_TARGET.query)) event.preventDefault()
        return
      }

      // A bare "/" must never swallow a character someone is typing
      if (event.key === '/' && !isTyping(event.target)) {
        if (focusTarget(FOCUS_TARGET.chat)) event.preventDefault()
        return
      }

      if (event.key === 'Escape' && isTyping(event.target)) {
        ;(event.target as HTMLElement).blur()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return null
}
