import type {SectionKey} from '@/lib/sections'

/**
 * Every string a PDF prints, handed in from the outside.
 *
 * The documents stay pure functions of data + labels: the route resolves the
 * locale through next-intl and passes the result down. That keeps the layout
 * free of translation plumbing and makes both documents renderable in a test
 * script without a request context.
 */

export type PdfSectionLabels = Record<SectionKey, string>

export type CvPdfLabels = {
  /** "Lebenslauf" — names the document in the running foot and the metadata. */
  docTitle: string
  sections: PdfSectionLabels
  born: string
  present: string
  verify: string
  /** "07.2019 – heute" carries the span; this carries "6 J. 2 M.". */
  duration: (years: number, months: number) => string
  pageLabel: (current: number, total: number) => string
}

export type QrPdfLabels = {
  /** "Kurzprofil" — names the card in the running foot and the metadata. */
  docTitle: string
  sections: PdfSectionLabels
  born: string
  present: string
  duration: (years: number, months: number) => string
  /** Mono kicker above the scan band, in the accent — the one call to action. */
  scanLabel: string
  scanTitle: string
  /** One sentence on what waits behind the code. Never a promise, a list. */
  scanHint: string
  pageLabel: (current: number, total: number) => string
}

export type SummaryPdfLabels = {
  docTitle: string
  /** "Lebenslauf" — the source document the marks were taken from. */
  sourceTitle: string
  markedLabel: string
  assessmentLabel: string
  /** Shown when the assessment is empty — never an invented text. */
  assessmentMissing: string
  generated: (date: string) => string
  countLabel: (count: number) => string
  sections: PdfSectionLabels
  present: string
  pageLabel: (current: number, total: number) => string
}

/** `Marvin-Vrdoljak-Lebenslauf-de.pdf` — a filename a recruiter can file. */
export function pdfFilename(name: string, title: string, locale: string): string {
  const slug = (value: string) =>
    value
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ß/g, 'ss')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

  return `${slug(name)}-${slug(title)}-${locale}.pdf`
}
