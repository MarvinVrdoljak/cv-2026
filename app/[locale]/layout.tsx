import React from 'react'
import {notFound} from 'next/navigation'
import {NextIntlClientProvider, hasLocale} from 'next-intl'
import {getTranslations, setRequestLocale} from 'next-intl/server'
import {routing} from '@/i18n/routing'
import {DocumentLocale} from '@/components/app/DocumentLocale'
import {FaviconTheme} from '@/components/app/FaviconTheme'
import {Preloader} from '@/components/app/Preloader'

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

/**
 * The locale's own layer. <html>, <body>, the fonts and the pre-paint script
 * live one level up in the root layout, on purpose: this subtree re-renders on
 * a language switch, and an inline script must not (see app/layout.tsx).
 */
export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const {locale} = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enables static rendering for this locale.
  setRequestLocale(locale)

  return (
    <>
      <DocumentLocale locale={locale} />
      <FaviconTheme />
      <NextIntlClientProvider>
        {children}
        <Preloader />
      </NextIntlClientProvider>
    </>
  )
}
