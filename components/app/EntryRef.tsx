'use client'

import type {ReactNode} from 'react'
import {useAppState} from './AppState'
import styles from './EntryRef.module.css'

type EntryRefProps = {
  id: string
  /** Optional label; defaults to the id itself, set in mono. */
  children?: ReactNode
}

/**
 * A citation of a CV entry. Hovering lights the entry up; clicking scrolls to
 * it and flashes it. The same behaviour for matching findings and chat answers.
 */
export function EntryRef({id, children}: EntryRefProps) {
  const {setHover, clearHover, focusEntry} = useAppState()

  return (
    <button
      className={styles.root}
      type="button"
      onMouseEnter={() => setHover([id])}
      onMouseLeave={clearHover}
      onFocus={() => setHover([id])}
      onBlur={clearHover}
      onClick={() => focusEntry(id)}
    >
      {children ?? id}
    </button>
  )
}
