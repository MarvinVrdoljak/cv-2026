import qrcode from 'qrcode-generator'

/**
 * A URL turned into one SVG path.
 *
 * The PDF has no canvas and no raster step, so the code is drawn as vector
 * geometry — it stays crisp at any print resolution and adds a few hundred
 * bytes rather than an image. A `<Rect>` per module would be a thousand nodes
 * and the renderer's antialiasing would leave hairline seams between them, so
 * every horizontal run of dark modules becomes a single sub-path instead.
 *
 * Coordinates are in modules, not points: the caller sets the printed size via
 * the viewBox, and the scan target only has to stay square.
 */

/** The spec's minimum silent margin. Without it a scanner cannot lock on. */
const QUIET = 4

/**
 * Error correction M — 15% recoverable. A CV is handed over, folded and
 * photographed under bad light; L saves a couple of modules and gives that up,
 * H makes the code denser than the page has room for.
 */
const CORRECTION = 'M'

export type QrCode = {
  /** Modules per side, quiet zone included — the viewBox is `0 0 size size`. */
  size: number
  /** Every dark module, as one path in module coordinates. */
  path: string
}

export function encodeQr(text: string): QrCode {
  // Type 0 = the smallest version the payload fits into, so a short URL yields
  // a coarse code with large, forgiving modules.
  const qr = qrcode(0, CORRECTION)
  qr.addData(text)
  qr.make()

  const count = qr.getModuleCount()
  const parts: string[] = []

  for (let row = 0; row < count; row++) {
    let col = 0
    while (col < count) {
      if (!qr.isDark(row, col)) {
        col++
        continue
      }
      let run = 1
      while (col + run < count && qr.isDark(row, col + run)) run++
      parts.push(`M${col + QUIET} ${row + QUIET}h${run}v1h-${run}z`)
      col += run
    }
  }

  return {size: count + QUIET * 2, path: parts.join('')}
}
