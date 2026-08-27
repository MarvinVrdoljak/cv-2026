'use client'

import {useEffect, useRef} from 'react'
import Image from 'next/image'
import {cv} from '@/data/cv'
import {watchTheme} from '@/lib/theme'
import styles from './CvPortrait.module.css'

function hexToRgb(value: string): [number, number, number] {
  let h = value.trim().replace('#', '')
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
  const n = parseInt(h || '161616', 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

/**
 * The portrait as a dot matrix on a 2D canvas — abstract at rest. As the
 * pointer moves across it, the cells it passes reveal the real photo for a
 * moment and then fade back, leaving a trailing wake; the fading edge glows in
 * the accent. A per-cell "reveal field" that the pointer stamps into and that
 * decays every frame produces the lag.
 *
 * The matrix is the rest state on **every** device: a touch screen has no
 * pointer to trace with, so it loses the wake — but not the picture. There the
 * tap runs the same sweep a click runs on the desktop (whole photo at once,
 * then receding from the rim inward), which is the one gesture both media
 * share. Filling the field on touch instead, as this used to, meant the photo
 * simply sat there, and the first tap's synthetic pointer-enter started the
 * decay that took it away for good.
 *
 * Keyboard focus and reduced motion show the whole photo statically; no-JS and
 * print fall back to the plain image.
 */
export function CvPortrait() {
  const {photo, name} = cv.person
  const figureRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!photo) return
    const figure = figureRef.current
    const canvas = canvasRef.current
    if (!figure || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const noHover = window.matchMedia('(hover: none)').matches
    const CELL = 6 // px per cell — smaller means more, finer dots
    const WAKE_SECONDS = 4 // how long a fully revealed cell takes to fade back
    const STAMP_PX = 34 // brush radius in px, so the reach does not follow CELL
    const CLICK_FLASH = 0.12 // × WAKE_SECONDS the whole photo holds, fully revealed
    const CLICK_SWEEP = 0.45 // × WAKE_SECONDS the centre outlasts the rim by
    const TINT_STEPS = 32 // quantisation of the ink→accent ramp, see palette()
    const DOT_GAIN = 1.05 // overshoot at full coverage, so the densest cells just touch
    const DOT_GAMMA = 0.8 // bends mid coverage down — keeps the grid reading as a grid

    let cols = 0
    let sizePx = 0
    let sampledWidth = 0 // the width the current grid was built for
    let step = 0
    let stampCells = 0
    let radial: Float32Array = new Float32Array(0) // distance to centre, 0…1 at the corner
    let coverage: Float32Array = new Float32Array(0)
    let field: Float32Array = new Float32Array(0)
    let photoLayer: HTMLCanvasElement | null = null
    let srcStep = 0
    let tints: string[] = []

    let raf = 0
    let prevFrame = 0 // rAF timestamp of the previous frame, 0 while idle
    let hovering = false
    let tapFlashed = false // `pointerup` already answered this tap
    let last: {x: number; y: number} | null = null

    const source = new window.Image()
    source.decoding = 'async'

    function palette() {
      const cs = getComputedStyle(document.documentElement)
      const ink = hexToRgb(cs.getPropertyValue('--color-text'))
      const accent = hexToRgb(cs.getPropertyValue('--color-accent'))

      // One string per step instead of one per dot per frame: the canvas caches
      // its parse per string, and the draw loop stops allocating entirely.
      tints = []
      for (let s = 0; s <= TINT_STEPS; s++) {
        const t = s / TINT_STEPS
        const r = (ink[0] + (accent[0] - ink[0]) * t) | 0
        const g = (ink[1] + (accent[1] - ink[1]) * t) | 0
        const b = (ink[2] + (accent[2] - ink[2]) * t) | 0
        tints.push(`rgb(${r}, ${g}, ${b})`)
      }
    }

    function sample() {
      sizePx = figure!.clientWidth
      if (sizePx === 0 || source.naturalWidth === 0) return
      cols = Math.max(8, Math.round(sizePx / CELL))
      step = sizePx / cols
      stampCells = STAMP_PX / step

      const off = document.createElement('canvas')
      off.width = cols
      off.height = cols
      const octx = off.getContext('2d')
      if (!octx) return
      octx.drawImage(source, 0, 0, cols, cols)
      const {data} = octx.getImageData(0, 0, cols, cols)
      const cells = cols * cols
      const luminance = new Float32Array(cells)
      let sum = 0
      for (let i = 0; i < cells; i++) {
        const l = (0.2126 * data[i * 4] + 0.7152 * data[i * 4 + 1] + 0.0722 * data[i * 4 + 2]) / 255
        luminance[i] = l
        sum += l
      }

      // Which tone carries the subject? In a low-key photo (dark ground, lit
      // face) the bright cells must be inked, not the dark ones — inking the
      // dark ones turns the background into a solid slab with the face as a
      // hole in it, which in dark mode is just a pale rectangle.
      const subjectIsLight = sum / cells < 0.5

      // Cube root rather than raw luminance. The backdrop of a studio portrait
      // occupies a sliver of the linear scale — here 0.004…0.03 — which a
      // linear mapping flattens into one value, leaving the whole ground bare.
      // A perceptual scale (what halftone printing works in) pulls that sliver
      // apart far enough for the light falloff behind the head to survive as a
      // sparse sprinkle, while the highlights still separate into single dots.
      const raw = new Float32Array(cells)
      for (let i = 0; i < cells; i++) {
        raw[i] = Math.cbrt(subjectIsLight ? luminance[i] : 1 - luminance[i])
      }

      // Stretch the range the photo actually occupies onto 0…1, so a flat or
      // clipped original still uses the full dot range. Percentiles rather
      // than min/max, so a few extreme cells cannot set the scale — and a low
      // black point, so the darkest corner of the ground stays bare.
      const ranked = Float32Array.from(raw).sort()
      const lo = ranked[Math.floor(0.01 * (cells - 1))]
      const hi = ranked[Math.floor(0.97 * (cells - 1))]
      const span = Math.max(0.001, hi - lo)

      coverage = new Float32Array(cells)
      for (let i = 0; i < cells; i++) {
        const v = (raw[i] - lo) / span
        coverage[i] = (v < 0 ? 0 : v > 1 ? 1 : v) ** DOT_GAMMA
      }
      // Carry the reveal over when the grid comes out the same size. A
      // re-sample rebuilds the *picture*; it is no reason to blank what is
      // revealed right now — a fresh zeroed field cuts a running fade back to
      // bare dots in a single frame.
      if (field.length !== cells) field = new Float32Array(cells)

      radial = new Float32Array(cells)
      const mid = (cols - 1) / 2
      const corner = Math.hypot(mid, mid) || 1
      for (let y = 0; y < cols; y++) {
        for (let x = 0; x < cols; x++) {
          radial[y * cols + x] = Math.hypot(x - mid, y - mid) / corner
        }
      }

      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas!.width = Math.round(sizePx * dpr)
      canvas!.height = Math.round(sizePx * dpr)
      canvas!.style.width = `${sizePx}px`
      canvas!.style.height = `${sizePx}px`
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      photoLayer = document.createElement('canvas')
      photoLayer.width = Math.round(sizePx * dpr)
      photoLayer.height = Math.round(sizePx * dpr)
      photoLayer.getContext('2d')?.drawImage(source, 0, 0, photoLayer.width, photoLayer.height)
      srcStep = photoLayer.width / cols

      palette()
      sampledWidth = sizePx
      figure!.dataset.matrix = 'ready'

      draw()
    }

    /** Sets the whole field to a value (focus / reduced motion). */
    function fill(v: number) {
      field.fill(v)
    }

    /**
     * Click: the photo is there at once, then recedes from the rim inward.
     *
     * One pass, no second clock. Above 1 the field reads as full photo and no
     * dot at all, and the field loses a factor of 100 per WAKE_SECONDS, so an
     * exponent to base 100 *is* hold time measured in wakes: the rim gets
     * CLICK_FLASH and lets go first, the centre carries CLICK_SWEEP wakes more
     * and lets go last. Everything is in wakes, so the gesture follows
     * WAKE_SECONDS. From here the ordinary decay does all the work.
     */
    function flash() {
      for (let i = 0; i < field.length; i++) {
        field[i] = 100 ** (CLICK_FLASH + CLICK_SWEEP * (1 - radial[i]))
      }
    }

    function stamp(px: number, py: number) {
      const cxCell = px / step
      const cyCell = py / step
      const minX = Math.max(0, Math.floor(cxCell - stampCells))
      const maxX = Math.min(cols - 1, Math.ceil(cxCell + stampCells))
      const minY = Math.max(0, Math.floor(cyCell - stampCells))
      const maxY = Math.min(cols - 1, Math.ceil(cyCell + stampCells))
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const dist = Math.hypot(x + 0.5 - cxCell, y + 0.5 - cyCell)
          if (dist > stampCells) continue
          const bump = (1 - dist / stampCells) ** 2
          const i = y * cols + x
          // Cells held above 1 by a click keep their surplus — capping here
          // would cut the retreat short the moment the pointer moves.
          if (field[i] < 1) field[i] = Math.min(1, field[i] + bump)
        }
      }
    }

    function draw() {
      if (!ctx || cols === 0 || !photoLayer) return
      const maxR = step * 0.52
      ctx.clearRect(0, 0, sizePx, sizePx)

      for (let y = 0; y < cols; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x
          const r = field[i]

          // Photo underneath, as strong as the reveal at this cell.
          if (r > 0.04) {
            ctx.globalAlpha = r > 1 ? 1 : r
            ctx.drawImage(
              photoLayer,
              x * srcStep,
              y * srcStep,
              srcStep,
              srcStep,
              x * step,
              y * step,
              step,
              step
            )
          }

          // Matrix dot on top: fades as the photo reveals, tinting toward the
          // accent through the mid-reveal — that is the glow in the wake.
          let dotR = coverage[i] * maxR * DOT_GAIN
          if (dotR < 0.2) continue
          if (dotR > maxR) dotR = maxR
          const dotAlpha = 1 - r
          if (dotAlpha <= 0.02) continue
          ctx.globalAlpha = dotAlpha
          ctx.fillStyle = tints[((r < 0.75 ? r / 0.75 : 1) * TINT_STEPS) | 0]
          ctx.beginPath()
          ctx.arc(x * step + step / 2, y * step + step / 2, dotR, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }

    function frame(now: number) {
      // Elapsed-time decay, so the wake lasts WAKE_SECONDS regardless of
      // refresh rate. Clamped, so a backgrounded tab cannot wipe the field in
      // one huge step on return.
      const dt = prevFrame ? Math.min((now - prevFrame) / 1000, 0.1) : 1 / 60
      prevFrame = now
      const decay = 0.01 ** (dt / WAKE_SECONDS)

      let energy = 0
      for (let i = 0; i < field.length; i++) {
        if (field[i] > 0) {
          field[i] *= decay
          if (field[i] < 0.01) field[i] = 0
          else energy += field[i]
        }
      }
      draw()
      raf = hovering || energy > 0 ? requestAnimationFrame(frame) : 0
      if (!raf) prevFrame = 0
    }

    function ensureRunning() {
      if (!raf && !reduceMotion) raf = requestAnimationFrame(frame)
    }

    function onPointerMove(event: PointerEvent) {
      if (reduceMotion || noHover) return
      const rect = canvas!.getBoundingClientRect()
      const px = event.clientX - rect.left
      const py = event.clientY - rect.top
      if (last) {
        // Stamp along the segment so fast moves stay continuous.
        const dist = Math.hypot(px - last.x, py - last.y)
        const steps = Math.max(1, Math.ceil(dist / (step * 0.7)))
        for (let s = 1; s <= steps; s++) {
          stamp(last.x + ((px - last.x) * s) / steps, last.y + ((py - last.y) * s) / steps)
        }
      } else {
        stamp(px, py)
      }
      last = {x: px, y: py}
      ensureRunning()
    }

    function onEnter() {
      // A tap emits one synthetic enter/leave pair around itself. That is not
      // a hover: there is no wake to trace, and reading it as one is what used
      // to start the decay and strand the portrait as dots.
      if (noHover) return
      hovering = true
      if (reduceMotion) {
        fill(1)
        draw()
      } else {
        ensureRunning()
      }
    }
    function onLeave() {
      if (noHover) return
      hovering = false
      last = null
      if (reduceMotion) {
        fill(0)
        draw()
      }
    }
    /** The gesture both media share: the whole photo, then the sweep back. */
    function runTap() {
      if (reduceMotion) {
        // Nothing to animate: show the photo and let focus-out take it back.
        fill(1)
        draw()
        return
      }
      flash()
      ensureRunning()
    }

    function onClick() {
      // The trailing click of a tap `pointerup` already answered. WebKit can
      // send it a frame or two later, and a second flash then reads as the
      // photo snapping back to full just after it started to recede.
      if (tapFlashed) {
        tapFlashed = false
        return
      }
      runTap()
    }
    /**
     * Touch: the tap, taken from the pointer rather than from `click`.
     *
     * WebKit only synthesises a click for elements it considers clickable, and
     * the reveal should not hang off that heuristic. `pointerup` is not fired
     * for a gesture that turned into a scroll — that one ends in
     * `pointercancel` — so a swipe past the portrait still does not flash it.
     * The `click` that normally follows is swallowed by `tapFlashed`, so the
     * tap is answered exactly once however the engine reports it.
     */
    function onPointerUp() {
      if (!noHover) return
      // Set before the flash, and left standing if no click ever follows: the
      // next tap's own `pointerup` sets it again, so the gesture never depends
      // on the click arriving.
      tapFlashed = true
      runTap()
    }
    /** Keyboard focus, as opposed to the focus a tap or a click leaves behind. */
    function focusIsVisible() {
      try {
        return figure!.matches(':focus-visible')
      } catch {
        // Engines without the selector throw; there the old behaviour stands.
        return true
      }
    }

    function onFocusIn() {
      // A tap and a click focus this element too, and there the pointer gesture
      // owns the reveal. Filling the field here as well snapped a fade that was
      // already running back to the full photo.
      if (!focusIsVisible()) return
      fill(1)
      draw()
    }
    function onFocusOut() {
      if (reduceMotion) {
        // No wake to fade on, so this is the only way back to the matrix.
        fill(0)
        draw()
        return
      }
      // Let it fade on the wake's own schedule. Zeroing here would cut a
      // running click gesture dead the moment the pointer lands elsewhere.
      ensureRunning()
    }

    let resizeTimer = 0
    const onResize = () => {
      // Mobile Safari fires `resize` *while scrolling* — its toolbars grow and
      // shrink, so the viewport height moves under the finger. The grid's only
      // input is the portrait's own width, and that does not move, so anything
      // else has to be ignored: re-sampling on every scroll is what made a
      // running fade jump straight to bare dots.
      if (figure.clientWidth === sampledWidth) return
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(sample, 150)
    }

    // The tints are mixed from the token values, so they have to be remixed
    // whenever the palette changes — the environment or the top bar's switch.
    const stopWatchingTheme = watchTheme(() => {
      palette()
      draw()
    })

    source.onload = sample
    source.src = photo

    figure.addEventListener('click', onClick)
    figure.addEventListener('pointermove', onPointerMove)
    figure.addEventListener('pointerenter', onEnter)
    figure.addEventListener('pointerleave', onLeave)
    figure.addEventListener('pointerup', onPointerUp)
    figure.addEventListener('focusin', onFocusIn)
    figure.addEventListener('focusout', onFocusOut)
    window.addEventListener('resize', onResize)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      window.clearTimeout(resizeTimer)
      figure.removeEventListener('click', onClick)
      figure.removeEventListener('pointermove', onPointerMove)
      figure.removeEventListener('pointerenter', onEnter)
      figure.removeEventListener('pointerleave', onLeave)
      figure.removeEventListener('pointerup', onPointerUp)
      figure.removeEventListener('focusin', onFocusIn)
      figure.removeEventListener('focusout', onFocusOut)
      window.removeEventListener('resize', onResize)
      stopWatchingTheme()
      delete figure.dataset.matrix
    }
  }, [photo])

  if (!photo) return null

  return (
    <figure className={styles.root} ref={figureRef} tabIndex={0} role="img" aria-label={name}>
      {/* Fallback shown until the matrix draws, and for no-JS / print. */}
      <Image
        className={styles.image}
        src={photo}
        alt=""
        width={640}
        height={640}
        priority
        sizes="(min-width: 768px) 150px, 96px"
      />
      <canvas className={styles.canvas} ref={canvasRef} aria-hidden="true" />
      <span className={styles.frame} aria-hidden="true" />
    </figure>
  )
}
