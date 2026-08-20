import fs from 'node:fs'
import path from 'node:path'
import {cv} from '@/data/cv'

/**
 * Binary assets the PDF embeds.
 *
 * The portrait exists twice on purpose: `public/portrait.jpg` is the web copy
 * the dot-matrix samples, `assets/portrait-print.jpg` is the same photograph
 * converted once to greyscale — on screen CSS does that with a filter, and a
 * PDF has no filters. Same picture, same ink-on-paper reading, no second
 * source of truth about the person.
 */

const PRINT_PORTRAIT = path.join(process.cwd(), 'assets', 'portrait-print.jpg')

let portrait: {data: Buffer; format: 'jpg'} | null | undefined

/** The portrait, or null when the data has no photo (or the file is absent). */
export function printPortrait(): {data: Buffer; format: 'jpg'} | null {
  if (portrait !== undefined) return portrait

  // The data decides whether a photo is part of the document at all.
  if (!cv.person.photo) {
    portrait = null
    return portrait
  }

  try {
    portrait = {data: fs.readFileSync(PRINT_PORTRAIT), format: 'jpg'}
  } catch {
    // A missing asset must not cost the whole PDF — the CV reads without it.
    portrait = null
  }
  return portrait
}
