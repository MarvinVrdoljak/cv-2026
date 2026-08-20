import {lookup} from 'node:dns/promises'
import {isIP} from 'node:net'
import {MAX_LENGTH} from './rateLimit'

/**
 * Fetches a job ad from a URL the visitor supplied and returns its readable
 * text, so the matching can treat a link exactly like pasted ad text.
 *
 * A URL from an untrusted visitor is an SSRF vector, so this is deliberately
 * strict: http(s) only, the host must resolve to a public address (private,
 * loopback, link-local and metadata ranges are refused), redirects are
 * followed by hand so every hop is re-checked, the response is size- and
 * time-capped, and only HTML/plain text is read.
 *
 * The direct read only sees a page's server HTML, so the big job portals
 * (jobs.ch, LinkedIn, Indeed …) defeat it two ways: they render the ad with
 * JavaScript, and they reset non-browser TCP connections (bot protection). So
 * when the direct read comes back blocked or too thin, we fall back to a
 * reader service that renders the page and returns its text — unless it is
 * switched off with `ADVERT_READER=0`. The fallback runs ONLY after the URL's
 * own host passed the public-address check, and never for an `invalid_url`
 * (a redirect into a private range), so it cannot become an SSRF bypass.
 * The pasted URL does leave our server for that third party — that is the
 * trade for reaching portals a plain fetch can't.
 */
export class AdvertError extends Error {
  code: 'invalid_url' | 'fetch_failed'
  constructor(code: 'invalid_url' | 'fetch_failed') {
    super(code)
    this.code = code
  }
}

const FETCH_TIMEOUT_MS = 8000
/** The reader renders the page, so it needs longer than a raw GET. */
const READER_TIMEOUT_MS = 22_000
const MAX_BYTES = 1_500_000
const MAX_REDIRECTS = 4
/** Below this, treat the page as unreadable (JS-rendered, blocked, empty). */
const MIN_TEXT = 120

/** Reader endpoint: prepend to a URL to get the rendered page as text. */
const READER_ENDPOINT = 'https://r.jina.ai/'

function readerEnabled(): boolean {
  return process.env.ADVERT_READER !== '0'
}

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number)
    if (a === 0 || a === 10 || a === 127) return true
    if (a === 169 && b === 254) return true // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    if (a >= 224) return true // multicast / reserved
    return false
  }
  const s = ip.toLowerCase().replace(/^\[|\]$/g, '')
  if (s === '::1' || s === '::') return true
  if (s.startsWith('fe80')) return true // link-local
  if (s.startsWith('fc') || s.startsWith('fd')) return true // unique-local
  const mapped = s.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIp(mapped[1])
  return false
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '')
  if (
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal')
  ) {
    throw new AdvertError('invalid_url')
  }
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new AdvertError('invalid_url')
    return
  }
  let addresses
  try {
    addresses = await lookup(host, {all: true})
  } catch {
    throw new AdvertError('fetch_failed')
  }
  if (addresses.length === 0) throw new AdvertError('fetch_failed')
  for (const {address} of addresses) {
    if (isPrivateIp(address)) throw new AdvertError('invalid_url')
  }
}

/** Strips a chunk of HTML down to its visible text. */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(?:br|\/p|\/div|\/li|\/h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim()
}

/** Fetches one hop with a timeout, without following redirects itself. */
async function fetchOnce(url: URL): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      redirect: 'manual',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; CV-Matcher/1.0; +matching)',
        Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
      },
    })
  } catch {
    throw new AdvertError('fetch_failed')
  } finally {
    clearTimeout(timer)
  }
}

/** The direct path: fetch the URL's own server HTML and strip it to text. */
async function readDirect(rawUrl: string): Promise<string> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new AdvertError('invalid_url')
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AdvertError('invalid_url')
  }

  // Follow redirects by hand so every hop's host is re-validated (a page can
  // otherwise redirect a vetted public host to an internal one).
  let response: Response | null = null
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    await assertPublicHost(url.hostname)
    const res = await fetchOnce(url)
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location) throw new AdvertError('fetch_failed')
      try {
        url = new URL(location, url)
      } catch {
        throw new AdvertError('fetch_failed')
      }
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new AdvertError('invalid_url')
      }
      continue
    }
    response = res
    break
  }
  if (!response) throw new AdvertError('fetch_failed') // too many redirects
  if (!response.ok || !response.body) throw new AdvertError('fetch_failed')

  const contentType = response.headers.get('content-type') ?? ''
  if (!/text\/html|text\/plain|application\/xhtml/i.test(contentType)) {
    throw new AdvertError('fetch_failed')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let html = ''
  let bytes = 0
  for (;;) {
    const {value, done} = await reader.read()
    if (done) break
    if (value) {
      bytes += value.byteLength
      html += decoder.decode(value, {stream: true})
      if (bytes >= MAX_BYTES) {
        await reader.cancel().catch(() => {})
        break
      }
    }
  }

  const text = htmlToText(html).slice(0, MAX_LENGTH.advert)
  if (text.length < MIN_TEXT) throw new AdvertError('fetch_failed')
  return text
}

/**
 * The fallback path: a reader service renders the page (JS and all) and hands
 * back plain text, so portals that block or defer their content still resolve.
 * The URL's public-address check has already passed by the time this runs.
 */
async function readViaReader(rawUrl: string): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), READER_TIMEOUT_MS)
  let response: Response
  try {
    response = await fetch(READER_ENDPOINT + rawUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'text/plain',
        // Ask for the readable text, not the full DOM dump.
        'X-Return-Format': 'text',
        ...(process.env.ADVERT_READER_KEY
          ? {Authorization: `Bearer ${process.env.ADVERT_READER_KEY}`}
          : {}),
      },
    })
  } catch {
    throw new AdvertError('fetch_failed')
  } finally {
    clearTimeout(timer)
  }
  if (!response.ok) throw new AdvertError('fetch_failed')
  const text = (await response.text()).trim().slice(0, MAX_LENGTH.advert)
  if (text.length < MIN_TEXT) throw new AdvertError('fetch_failed')
  return text
}

export async function fetchAdvert(rawUrl: string): Promise<string> {
  try {
    return await readDirect(rawUrl)
  } catch (err) {
    // A blocked-host verdict must never be retried through the reader — that
    // is the SSRF guard. Only a plain read failure is worth a second attempt.
    if (err instanceof AdvertError && err.code === 'invalid_url') throw err
    if (!readerEnabled()) throw err
    return await readViaReader(rawUrl)
  }
}
