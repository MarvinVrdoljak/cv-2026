import '@/styles/globals.css'

import React from 'react'
import type {Viewport} from 'next'
import {headers} from 'next/headers'
import {notFound} from 'next/navigation'
import {NextIntlClientProvider, hasLocale} from 'next-intl'
import {getTranslations, setRequestLocale} from 'next-intl/server'
import {IBM_Plex_Mono, IBM_Plex_Sans} from 'next/font/google'
import {routing} from '@/i18n/routing'
import {FaviconTheme} from '@/components/app/FaviconTheme'
import {Preloader} from '@/components/app/Preloader'

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

// Statically generate a layout per locale.
export function generateStaticParams() {
  return routing.locales.map((locale) => ({locale}))
}

type LocaleLayoutProps = {
  children: React.ReactNode
  // Must stay `string` — Next's generated route types validate the layout's
  // props against it. hasLocale() narrows it to Locale where needed.
  params: Promise<{locale: string}>
}

// Site-wide metadata. Per-page titles/descriptions (and hreflang alternates,
// which depend on the concrete pathname) belong in each page's generateMetadata.
export async function generateMetadata({params}: Omit<LocaleLayoutProps, 'children'>) {
  const {locale} = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const t = await getTranslations({locale, namespace: 'meta'})

  return {
    title: {
      default: t('title'),
      template: `%s | ${t('title')}`,
    },
    description: t('description'),

    // A personal CV is not for the open index. This emits
    // `<meta name="robots" content="noindex, nofollow, ...">` — the binding
    // signal that keeps the page out of search results even if a crawler
    // ignores robots.txt. `nocache`/`noarchive` also stop cached snapshots.
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noarchive: true,
        'max-snippet': 0,
        'max-image-preview': 'none',
      },
    },

    // Raster baseline: works everywhere and without JS. The theme-aware SVG is
    // added on top by FaviconTheme — see the note there.
    icons: {
      icon: [{url: '/favicon.ico', sizes: '16x16 32x32 48x48'}],
      apple: [{url: '/apple-touch-icon.png', sizes: '180x180'}],
    },
  }
}

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const {locale} = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enables static rendering for this locale.
  setRequestLocale(locale)

  // The middleware minted a per-request nonce; the one inline script we own
  // must carry it so the strict production CSP lets it run.
  const nonce = (await headers()).get('x-nonce') ?? undefined

  return (
    // suppressHydrationWarning: the inline script below stamps data-js on <html>
    // before hydration, so the server markup and client attributes differ by
    // design — this scopes the allowance to <html> only.
    <html
      lang={locale}
      className={`${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        {/* Flag JS before first paint so the preloader shows only with JS on
            (no-JS keeps the CV readable, never a stuck overlay). */}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{__html: "document.documentElement.setAttribute('data-js','1')"}}
        />
        <FaviconTheme />
        <NextIntlClientProvider>
          {children}
          <Preloader />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
