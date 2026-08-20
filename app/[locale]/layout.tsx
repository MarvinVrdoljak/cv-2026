import '@/styles/globals.css'

import React from 'react'
import {notFound} from 'next/navigation'
import {NextIntlClientProvider, hasLocale} from 'next-intl'
import {getTranslations, setRequestLocale} from 'next-intl/server'
import {IBM_Plex_Mono, IBM_Plex_Sans} from 'next/font/google'
import {routing} from '@/i18n/routing'

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
  }
}

export default async function LocaleLayout({children, params}: LocaleLayoutProps) {
  const {locale} = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Enables static rendering for this locale.
  setRequestLocale(locale)

  return (
    <html lang={locale} className={`${plexSans.variable} ${plexMono.variable}`}>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
