import path from 'node:path'
import {Font} from '@react-pdf/renderer'

/**
 * The document's two families, for paper.
 *
 * The screen gets IBM Plex through `next/font`, which hands out CSS variables
 * and WOFF2 — neither of which a PDF renderer can use. So the same families
 * are kept as WOFF files in `assets/fonts` (fontkit reads WOFF, not WOFF2, and
 * IBM Plex is not published as TTF on npm) and registered here. The sans/mono
 * switch is the central design device; it must survive the print, or the PDF
 * is a different document than the one on screen.
 *
 * `assets/` rather than `public/`: these files are read by the server, never
 * served to a browser. next.config.mjs traces them into the deployment.
 */

export const SANS = 'IBM Plex Sans'
export const MONO = 'IBM Plex Mono'

const DIR = path.join(process.cwd(), 'assets', 'fonts')

// A path, not a buffer: the renderer reads local font files itself, and the
// files stay out of memory until a document actually needs a face.
const file = (name: string) => path.join(DIR, name)

let registered = false

/** Idempotent: the module stays warm between requests, the fonts load once. */
export function registerPdfFonts(): void {
  if (registered) return

  Font.register({
    family: SANS,
    fonts: [
      {src: file('IBMPlexSans-400-normal.woff'), fontWeight: 400},
      {src: file('IBMPlexSans-400-italic.woff'), fontWeight: 400, fontStyle: 'italic'},
      {src: file('IBMPlexSans-500-normal.woff'), fontWeight: 500},
      {src: file('IBMPlexSans-600-normal.woff'), fontWeight: 600},
    ],
  })

  Font.register({
    family: MONO,
    fonts: [
      {src: file('IBMPlexMono-400-normal.woff'), fontWeight: 400},
      {src: file('IBMPlexMono-500-normal.woff'), fontWeight: 500},
    ],
  })

  // The renderer hyphenates with English patterns, which mangles German
  // compounds ("Pro-duktober-flächen"). One word in, one word out: no
  // hyphenation, exactly as the browser does it in the CV column.
  Font.registerHyphenationCallback((word) => [word])

  registered = true
}
