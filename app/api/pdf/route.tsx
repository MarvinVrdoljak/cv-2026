import {cookies} from 'next/headers'
import {hasLocale} from 'next-intl'
import {getTranslations} from 'next-intl/server'
import {renderToBuffer} from '@react-pdf/renderer'
import {routing, type Locale} from '@/i18n/routing'
import {cv} from '@/data/cv'
import {collectValidIds} from '@/lib/cvContext'
import {formatFullDate, pickDurationKey} from '@/lib/format'
import {MAX_LENGTH, checkRenderLimit} from '@/lib/rateLimit'
import {SECTIONS} from '@/lib/sections'
import {siteUrl} from '@/lib/siteUrl'
import {registerPdfFonts} from '@/lib/pdf/fonts'
import {CvPdf} from '@/lib/pdf/CvPdf'
import {QrPdf} from '@/lib/pdf/QrPdf'
import {SummaryPdf} from '@/lib/pdf/SummaryPdf'
import {resolveMarked} from '@/lib/pdf/marked'
import {
  pdfFilename,
  type CvPdfLabels,
  type QrPdfLabels,
  type SummaryPdfLabels,
} from '@/lib/pdf/labels'

/**
 * The two documents, typeset on the server.
 *
 * Why a route and not `window.print()`: a print stylesheet can only rearrange
 * the page it is given, and the page is an instrument, not a document. Here the
 * CV is set as a real document — A4, margins, running foot, entries that keep
 * together — out of the same single source that renders the screen.
 *
 * GET fetches the CV or the one-page card, so both are ordinary links and work
 * with JavaScript switched off. POST is for the notes summary, which has to
 * carry the marked ids and the streamed assessment with it.
 *
 * The browser's own print path stays intact (styles/print.css) as the fallback
 * for Ctrl+P and for anyone without JavaScript who wants paper right now.
 */
export const runtime = 'nodejs'

const SESSION_COOKIE = 'cv_sid'

function readLocale(value: string | null | undefined): Locale {
  return hasLocale(routing.locales, value) ? (value as Locale) : routing.defaultLocale
}

/** Section names, in one place — both documents label sections. */
async function sectionLabels(locale: Locale) {
  const t = await getTranslations({locale, namespace: 'sections'})
  return Object.fromEntries(SECTIONS.map((key) => [key, t(key)])) as Record<
    (typeof SECTIONS)[number],
    string
  >
}

async function cvLabels(locale: Locale): Promise<CvPdfLabels> {
  const pdf = await getTranslations({locale, namespace: 'pdf'})
  const entry = await getTranslations({locale, namespace: 'cv'})

  return {
    docTitle: pdf('cvTitle'),
    sections: await sectionLabels(locale),
    born: entry('born'),
    present: entry('present'),
    verify: entry('verify'),
    duration: (years, months) => entry(pickDurationKey(years, months), {years, months}),
    pageLabel: (page, total) => pdf('page', {page, total}),
  }
}

async function qrLabels(locale: Locale): Promise<QrPdfLabels> {
  const pdf = await getTranslations({locale, namespace: 'pdf'})
  const entry = await getTranslations({locale, namespace: 'cv'})

  return {
    docTitle: pdf('qrTitle'),
    sections: await sectionLabels(locale),
    born: entry('born'),
    present: entry('present'),
    duration: (years, months) => entry(pickDurationKey(years, months), {years, months}),
    scanLabel: pdf('qrScanLabel'),
    scanTitle: pdf('qrScanTitle'),
    scanHint: pdf('qrScanHint'),
    pageLabel: (page, total) => pdf('page', {page, total}),
  }
}

async function summaryLabels(locale: Locale): Promise<SummaryPdfLabels> {
  const pdf = await getTranslations({locale, namespace: 'pdf'})
  const notes = await getTranslations({locale, namespace: 'notes'})
  const entry = await getTranslations({locale, namespace: 'cv'})

  return {
    docTitle: notes('summaryTitle'),
    sourceTitle: pdf('cvTitle'),
    markedLabel: notes('markedLabel'),
    assessmentLabel: notes('assessmentLabel'),
    assessmentMissing: pdf('assessmentMissing'),
    generated: (date) => pdf('generated', {date}),
    countLabel: (count) => pdf('markedCount', {count}),
    sections: await sectionLabels(locale),
    present: entry('present'),
    pageLabel: (page, total) => pdf('page', {page, total}),
  }
}

/** Session id from the cookie, minted here when the visit has none yet. */
async function session(): Promise<{id: string; fresh: boolean}> {
  const jar = await cookies()
  const existing = jar.get(SESSION_COOKIE)?.value
  return {id: existing ?? crypto.randomUUID(), fresh: !existing}
}

function pdfResponse(body: Buffer, filename: string, fresh: boolean, id: string): Response {
  const headers = new Headers({
    'Content-Type': 'application/pdf',
    // `inline` so a click opens the document; the browser's own save dialog
    // keeps the filename. Nothing here is stored, so nothing may be cached.
    'Content-Disposition': `inline; filename="${filename}"`,
    'Cache-Control': 'no-store',
    'Content-Length': String(body.byteLength),
  })
  if (fresh) {
    headers.append(
      'Set-Cookie',
      `${SESSION_COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
    )
  }
  return new Response(new Uint8Array(body), {headers})
}

function jsonError(code: string, status: number) {
  return Response.json({error: code}, {status})
}

/**
 * The same failure, for a browser that navigated here rather than fetched.
 *
 * The summary is opened by submitting a form into a new tab, so an error lands
 * in front of a reader instead of in a `catch`. A sentence they can read beats
 * a line of JSON; the page carries no chrome because it is a dead end, not a
 * destination.
 */
async function pageError(code: string, status: number, locale: Locale) {
  const t = await getTranslations({locale, namespace: 'errors'})
  const message = code === 'rate_limited' ? t('rate_limited') : t('generic')
  const escape = (value: string) => value.replace(/[<>&]/g, (c) => `&#${c.charCodeAt(0)};`)

  const html = `<!doctype html>
<html lang="${locale}">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escape(message)}</title>
<style>
  body { margin: 0; padding: 10vh 6vw; background: #fbfaf8; color: #16161a;
         font: 400 1rem/1.6 ui-sans-serif, system-ui, sans-serif; }
  p { max-width: 34em; margin: 0; }
  @media (prefers-color-scheme: dark) { body { background: #101013; color: #eceae5; } }
</style>
<p>${escape(message)}</p>
`

  return new Response(html, {
    status,
    headers: {'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store'},
  })
}

/**
 * Both printable documents — plain links, no JavaScript involved.
 *
 * `doc=cv` is the full document, `doc=qr` the one-page card whose whole job is
 * to hand the reader back to the web version: it carries the QR code and the
 * address, resolved from this very request rather than from a constant.
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const doc = url.searchParams.get('doc') ?? 'cv'
  if (doc !== 'cv' && doc !== 'qr') return jsonError('bad_request', 400)

  const locale = readLocale(url.searchParams.get('locale'))
  const {id, fresh} = await session()
  if (!checkRenderLimit(id)) return jsonError('rate_limited', 429)

  registerPdfFonts()

  const name = cv.person.name

  if (doc === 'qr') {
    const labels = await qrLabels(locale)
    const body = await renderToBuffer(
      <QrPdf locale={locale} labels={labels} url={siteUrl(request, locale)} />
    )
    return pdfResponse(body, pdfFilename(name, labels.docTitle, locale), fresh, id)
  }

  const labels = await cvLabels(locale)
  const body = await renderToBuffer(<CvPdf locale={locale} labels={labels} />)

  return pdfResponse(body, pdfFilename(name, labels.docTitle, locale), fresh, id)
}

type SummaryPayload = {
  locale?: string
  markedIds?: string[]
  /** The streamed assessment, as the reader saw it on screen. */
  assessment?: string
}

/**
 * Two ways in, because there are two kinds of caller.
 *
 * A form submission navigates a new tab straight to this route, so the reader
 * ends up on `/api/pdf` with the document in front of them — the same kind of
 * address the CV link produces, rather than a `blob:` url. JSON stays for
 * anything calling the route programmatically.
 */
async function readSummary(request: Request): Promise<SummaryPayload | null> {
  const type = request.headers.get('Content-Type') ?? ''

  if (type.includes('application/json')) {
    try {
      return (await request.json()) as SummaryPayload
    } catch {
      return null
    }
  }

  if (type.includes('form-urlencoded') || type.includes('form-data')) {
    const form = await request.formData()
    return {
      locale: String(form.get('locale') ?? ''),
      markedIds: form.getAll('markedIds').map(String),
      assessment: String(form.get('assessment') ?? ''),
    }
  }

  return null
}

/** The notes summary — needs the marks and the assessment, so it is a POST. */
export async function POST(request: Request) {
  // A form submission is a navigation: its failures have to be readable.
  const navigated = !(request.headers.get('Content-Type') ?? '').includes('application/json')
  const payload = await readSummary(request)
  const locale = readLocale(payload?.locale)
  const fail = (code: string, status: number) =>
    navigated ? pageError(code, status, locale) : jsonError(code, status)

  if (!payload) return fail('bad_request', 400)

  const {id, fresh} = await session()
  if (!checkRenderLimit(id)) return fail('rate_limited', 429)

  // Only ids that exist in the CV, so a stale mark cannot print an empty row.
  const valid = new Set(collectValidIds())
  const markedIds = (payload.markedIds ?? []).filter((value) => valid.has(value))
  if (markedIds.length === 0) return fail('bad_request', 400)

  const assessment = (payload.assessment ?? '').slice(0, MAX_LENGTH.assessment)

  registerPdfFonts()
  const labels = await summaryLabels(locale)
  const marked = resolveMarked(markedIds, {
    locale,
    present: labels.present,
    sections: labels.sections,
  })

  const body = await renderToBuffer(
    <SummaryPdf
      locale={locale}
      labels={labels}
      marked={marked}
      assessment={assessment}
      date={formatFullDate(new Date().toISOString().slice(0, 10), locale)}
    />
  )

  return pdfResponse(body, pdfFilename(cv.person.name, labels.docTitle, locale), fresh, id)
}
