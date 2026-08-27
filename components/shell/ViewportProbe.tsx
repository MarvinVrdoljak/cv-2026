'use client'

import {useEffect, useState} from 'react'

/**
 * TEMPORARY diagnostic. Delete once the iOS keyboard geometry is settled.
 *
 * Prints the numbers the fixed chrome positions itself against, so a screenshot
 * from a real device answers what no emulator can: whether Safari resizes the
 * layout viewport for the keyboard (then `client` shrinks and `inset` stays ~0),
 * or keeps it and slides the keyboard over it (then `inset` carries the whole
 * occluded height). `safe` is the inset Safari reserves for its own floating
 * bars — the strip where the document currently shows through.
 *
 * Renders nothing unless the URL carries `?vp=1`, so it cannot appear for a
 * reader by accident. Inline styles on purpose: it borrows nothing from the
 * design system and leaves no CSS behind when it goes.
 */
export function ViewportProbe() {
  const [on, setOn] = useState(false)
  const [lines, setLines] = useState<string[]>([])

  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('vp')) return
    setOn(true)

    const root = document.documentElement

    // env() is only readable through a property that resolves it.
    const probe = document.createElement('div')
    probe.style.cssText =
      'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-bottom,0px);pointer-events:none'
    document.body.append(probe)

    let frame = 0
    const read = () => {
      frame = 0
      const vv = window.visualViewport
      const safe = Math.round(parseFloat(getComputedStyle(probe).height) || 0)
      const inset = getComputedStyle(root).getPropertyValue('--keyboard-inset').trim()

      setLines([
        `client ${root.clientHeight}  inner ${Math.round(window.innerHeight)}`,
        vv
          ? `vv ${Math.round(vv.height)}  off ${Math.round(vv.offsetTop)}  sc ${vv.scale.toFixed(2)}`
          : 'vv —',
        `inset ${inset || '—'}  safe ${safe}`,
        `screen ${window.screen.height}  dpr ${window.devicePixelRatio}`,
      ])
    }
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(read)
    }

    read()
    window.visualViewport?.addEventListener('resize', schedule)
    window.visualViewport?.addEventListener('scroll', schedule)
    window.addEventListener('resize', schedule)

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.visualViewport?.removeEventListener('resize', schedule)
      window.visualViewport?.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      probe.remove()
    }
  }, [])

  if (!on) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: '50px',
        left: '8px',
        zIndex: 90,
        padding: '6px 8px',
        background: 'rgba(0, 0, 0, 0.82)',
        color: '#fff',
        font: '500 11px/1.45 ui-monospace, monospace',
        whiteSpace: 'pre',
        pointerEvents: 'none',
        borderRadius: '3px',
      }}
    >
      {lines.join('\n')}
    </div>
  )
}
