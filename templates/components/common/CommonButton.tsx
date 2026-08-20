import React from 'react'
import styles from './CommonButton.module.css'

interface CommonButtonProps {
  children: React.ReactNode
  disabled?: boolean
  onClick?: () => void
  // Defaults to 'button' so buttons inside forms don't submit accidentally.
  type?: 'button' | 'submit' | 'reset'
}

// Base look comes from the global `.button` atom (styles/components/button.css) —
// the single source of truth shared with rich-text markup. The module only adds
// component-specific extras. Each element gets its own explicit class — no
// nested/descendant selectors.
export function CommonButton({children, disabled, onClick, type = 'button'}: CommonButtonProps) {
  return (
    <button className="button" type={type} disabled={disabled} onClick={onClick}>
      <span className={styles.label}>{children}</span>
    </button>
  )
}
