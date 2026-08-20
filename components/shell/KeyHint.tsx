'use client'

import {useEffect, useState} from 'react'
import styles from './KeyHint.module.css'

type KeyHintProps = {
  /** `mod` renders the platform's own modifier, so the hint is never wrong. */
  combo: 'mod-k' | 'slash'
}

export function KeyHint({combo}: KeyHintProps) {
  const [isMac, setIsMac] = useState(false)

  useEffect(() => {
    setIsMac(/mac|iphone|ipad/i.test(navigator.userAgent))
  }, [])

  if (combo === 'slash') {
    return <kbd className={styles.root}>/</kbd>
  }

  return <kbd className={styles.root}>{isMac ? '⌘' : 'Ctrl'} K</kbd>
}
