import {routing, type Locale} from '@/i18n/routing'

/**
 * Where this deployment lives — the address the QR code and the share sheet
 * hand out.
 *
 * Derived from the request by default, so a preview deployment prints a QR
 * that leads back to that preview and localhost prints localhost: nothing to
 * configure, nothing to forget. `SITE_URL` overrides it for the case where the
 * public name differs from the host the app actually sees (a CDN or a proxy in
 * front of it).
 *
 * `x-forwarded-host` is set by whatever sits in front of the app and is, in
 * principle, caller-controlled. That is acceptable here and nowhere else: the
 * value only ends up inside a PDF that this same visitor just asked for,
 * pointing at the host they already have open. Set `SITE_URL` if you want the
 * address pinned regardless.
 */
function origin(request: Request): string {
  const configured = process.env.SITE_URL?.trim()
  if (configured) return configured.replace(/\/+$/, '')

  const headers = request.headers
  const host = headers.get('x-forwarded-host') ?? headers.get('host')
  if (!host) return new URL(request.url).origin

  const proto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const scheme = proto ?? (host.startsWith('localhost') ? 'http' : 'https')

  return `${scheme}://${host}`
}

/**
 * The public address of the CV in one locale.
 *
 * Mirrors `localePrefix: 'as-needed'`: the default locale has no prefix, every
 * other one carries it. Kept in step with i18n/routing.ts, not hard-coded.
 */
export function siteUrl(request: Request, locale: Locale): string {
  const base = origin(request)
  return locale === routing.defaultLocale ? base : `${base}/${locale}`
}
