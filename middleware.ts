import createMiddleware from 'next-intl/middleware'
import type {NextRequest} from 'next/server'
import {routing} from '@/i18n/routing'

const handleI18nRouting = createMiddleware(routing)

/**
 * Builds the Content-Security-Policy. Production is strict: scripts run only
 * with the per-request nonce (and whatever a nonced script loads, via
 * `strict-dynamic`), everything else is same-origin, framing is forbidden, and
 * mixed content is upgraded. Development has to loosen `script-src` — Turbopack
 * and React Fast Refresh use `eval` and inline scripts, and the HMR socket
 * needs `ws:` — so the strict policy only ships in production.
 *
 * `style-src` keeps `'unsafe-inline'` in both: Next and `next/font` inject
 * inline styles, and a stylesheet is a far weaker injection vector than script.
 */
function buildCsp(nonce: string, isProd: boolean): string {
  const scriptSrc = isProd
    ? `'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `'self' 'unsafe-eval' 'unsafe-inline'`

  const directives = [
    `default-src 'self'`,
    `script-src ${scriptSrc}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob:`,
    `font-src 'self'`,
    `connect-src 'self'${isProd ? '' : ' ws: wss:'}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `frame-src 'none'`,
    `manifest-src 'self'`,
    `worker-src 'self' blob:`,
  ]
  if (isProd) directives.push('upgrade-insecure-requests')
  return directives.join('; ')
}

export default function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const csp = buildCsp(nonce, process.env.NODE_ENV === 'production')

  // Set on the *request* too: Next reads the nonce from here and stamps it onto
  // its own inline (hydration/RSC) scripts. The layout reads `x-nonce` for the
  // one inline script we own.
  request.headers.set('x-nonce', nonce)
  request.headers.set('content-security-policy', csp)

  const response = handleI18nRouting(request)
  response.headers.set('content-security-policy', csp)
  return response
}

export const config = {
  // Match all paths except API routes, Next internals, and static files.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
