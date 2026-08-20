'use client'

import {useEffect, useState} from 'react'
import {useTranslations} from 'next-intl'
import {cv} from '@/data/cv'
import styles from './Preloader.module.css'

const MIN_DURATION = 1200 // ms — the loader runs at least this long
const MAX_WAIT = 5000 // ms — never hang if a resource stalls

/**
 * A full-page boot sequence: a mono counter races 0→100 while fonts and the
 * portrait load behind it, so the page is revealed only once it is actually
 * ready — no flash of the portrait snapping into dot mode. It holds near the
 * end until resources are in, runs at least MIN_DURATION, then fades out.
 *
 * Shown only when JS is on (a pre-paint inline script sets html[data-js]); with
 * JS off the overlay stays hidden and the CV is readable underneath.
 */
export function Preloader() {
  const t = useTranslations('general')
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [removed, setRemoved] = useState(false)

  useEffect(() => {
    const start = performance.now()
    let ready = false
    let raf = 0
    let finishTimer = 0
    let cancelled = false

    // Completion is timer-driven (setTimeout fires even in a backgrounded tab,
    // unlike rAF) so the overlay can never get stuck; rAF only smooths the
    // counter while the tab is visible.
    function finish() {
      if (cancelled) return
      cancelAnimationFrame(raf)
      setProgress(1)
      setDone(true)
    }
    function scheduleFinish() {
      window.clearTimeout(finishTimer)
      const remaining = Math.max(0, MIN_DURATION - (performance.now() - start))
      finishTimer = window.setTimeout(finish, remaining)
    }

    const checks: Promise<unknown>[] = []
    checks.push(document.fonts ? document.fonts.ready : Promise.resolve())
    if (cv.person.photo) {
      checks.push(
        new Promise<void>((resolve) => {
          const img = new window.Image()
          img.onload = () => resolve()
          img.onerror = () => resolve()
          img.src = cv.person.photo as string
          if (img.complete && img.naturalWidth > 0) resolve()
        })
      )
    }
    Promise.all(checks).then(() => {
      ready = true
      scheduleFinish()
    })
    // Never wait forever on a stalled resource.
    const failsafe = window.setTimeout(() => {
      if (!ready) {
        ready = true
        scheduleFinish()
      }
    }, MAX_WAIT)

    const tick = () => {
      if (cancelled) return
      let p = (performance.now() - start) / MIN_DURATION
      if (p > 1) p = 1
      if (!ready) p = Math.min(p, 0.92) // hold near the end until resources are in
      setProgress(p)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      window.clearTimeout(finishTimer)
      window.clearTimeout(failsafe)
    }
  }, [])

  useEffect(() => {
    if (!done) return
    const id = window.setTimeout(() => setRemoved(true), 500) // after the fade
    return () => window.clearTimeout(id)
  }, [done])

  if (removed) return null

  const pct = Math.round(progress * 100)

  return (
    <div
      className={styles.root}
      data-done={done ? 'true' : undefined}
      role="status"
      aria-live="polite"
      aria-label={t('loading')}
    >
      <div className={styles.inner} aria-hidden="true">
        <span className={styles.label}>{cv.person.name}</span>
        <p className={styles.meter}>
          <span className={styles.count}>{String(pct).padStart(3, '0')}</span>
          <span className={styles.percent}>%</span>
        </p>
      </div>
      <div className={styles.bar}>
        <span className={styles.fill} style={{transform: `scaleX(${progress})`}} />
      </div>
    </div>
  )
}
