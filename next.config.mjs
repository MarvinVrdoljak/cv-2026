import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next 16 otherwise appends a self-re-adding agent-rules block to CLAUDE.md
  // on every `next dev`; we keep CLAUDE.md hand-curated instead.
  agentRules: false,

  // The PDF renderer is a Node library (fontkit, zlib, streams) and must not be
  // put through the bundler.
  serverExternalPackages: ['@react-pdf/renderer'],

  // The PDF route reads its fonts and the print portrait from disk at request
  // time, so the tracer cannot see them in the import graph — it is told.
  outputFileTracingIncludes: {
    '/api/pdf': ['./assets/**'],
  },

  // Security + indexing headers that don't need a per-request value. The
  // Content-Security-Policy carries a per-request nonce and so lives in the
  // middleware, not here. These are the static, always-on complements.
  async headers() {
    const securityHeaders = [
      // Keep every response out of every index. The HTML pages also carry a
      // `noindex` meta tag; this reaches what a meta tag can't (PDF, API) and
      // covers crawlers that read headers but not markup.
      {key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet, noimageindex'},
      // Never let a response be reinterpreted as a different content type.
      {key: 'X-Content-Type-Options', value: 'nosniff'},
      // Clickjacking: this app is never meant to be framed (CSP frame-ancestors
      // enforces it in modern browsers; this covers the rest).
      {key: 'X-Frame-Options', value: 'DENY'},
      // Send only the origin cross-site, and nothing when downgrading to HTTP.
      {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
      // No component asks for these device capabilities — deny them outright.
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
      },
    ]
    // HSTS only makes sense over HTTPS, so it ships in production only (and
    // never poisons http://localhost during development).
    if (process.env.NODE_ENV === 'production') {
      securityHeaders.push({
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains',
      })
    }
    return [{source: '/:path*', headers: securityHeaders}]
  },
}

export default withNextIntl(nextConfig)
