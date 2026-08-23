import '@/styles/globals.css'

import React from 'react'
import type {Viewport} from 'next'
import {headers} from 'next/headers'
import {IBM_Plex_Mono, IBM_Plex_Sans} from 'next/font/google'
import {hasLocale} from 'next-intl'
import {routing} from '@/i18n/routing'
import {THEME_BOOTSTRAP} from '@/lib/theme'

// Two self-hosted families exposed as CSS variables consumed by tokens.css.
// The sans carries content, the mono carries interface — that switch is the
// central design device, so both are loaded up front, never swapped later.
const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600'],
  variable: '--font-sans',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500'],
  variable: '--font-plex-mono',
})

// The chat is a bar at the bottom edge on a phone, so the on-screen keyboard
// must not be allowed to slide over it: this asks the browser to shrink the
// layout viewport instead, which moves the fixed chrome up with it. Chrome and
// Android honour it; Safari ignores it, which is what ViewportSync covers.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  interactiveWidget: 'resizes-content',
}

/**
 * The document shell, and it exists for one reason: it sits **above** the
 * `[locale]` segment.
 *
 * Everything here is rendered once per document request and then reused — a
 * language switch changes the segment below, so Next re-renders that subtree on
 * the client and leaves this one alone. That is exactly what the inline script
 * needs: it must run while the parser is here (before the first paint, or the
 * preloader and the palette both flash), and a script React renders during a
 * client navigation never runs at all — React says so, loudly, in dev.
 *
 * The price is that `lang` cannot come from the segment's param. It comes from
 * the header the middleware sets, which is right on every document request
 * (no-JS included); after a client-side language switch this layout does not
 * re-render, so [DocumentLocale] carries the change to the attribute.
 */
export default async function RootLayout({children}: {children: React.ReactNode}) {
  const requestHeaders = await headers()

  // The middleware minted a per-request nonce; the one inline script we own
  // must carry it so the strict production CSP lets it run.
  const nonce = requestHeaders.get('x-nonce') ?? undefined
  const requested = requestHeaders.get('x-locale')
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return (
    // suppressHydrationWarning: the inline script below stamps data-js (and,
    // where the reader chose one, data-theme) on <html> before hydration, so the
    // server markup and client attributes differ by design — this scopes the
    // allowance to <html> only.
    <html
      lang={locale}
      className={`${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Two things that must be settled before the first paint: the JS flag,
            so the preloader shows only with JavaScript on (no-JS keeps the CV
            readable, never a stuck overlay), and the reader's stored display
            choice, which applied a frame later would flash the other palette.
            One script, one nonce — see lib/theme.ts for the snippet.

            It has to be a raw tag the parser runs where it stands. `next/script`
            with `beforeInteractive` only queues the code for the framework
            runtime (`__next_s`), which lands after the first paint — exactly the
            flash this prevents. */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.setAttribute('data-js','1');" + THEME_BOOTSTRAP,
          }}
        />
        {children}
      </body>
    </html>
  )
}
