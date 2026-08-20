import {setRequestLocale} from 'next-intl/server'
import {routing, type Locale} from '@/i18n/routing'
import {AppState} from '@/components/app/AppState'
import {AppShell} from '@/components/shell/AppShell'
import {QueryBar} from '@/components/match/QueryBar'
import {CvDocument} from '@/components/cv/CvDocument'
import {ChatPanel} from '@/components/chat/ChatPanel'
import {SummaryDialog} from '@/components/app/SummaryDialog'
import {ErrorToast} from '@/components/app/ErrorToast'

type HomeProps = {
  // Locale, not string — the layout's hasLocale() guard has already rejected
  // unknown locales by the time a page renders.
  params: Promise<{locale: Locale}>
}

/** Per-page alternates: the pathname is only known here, not in the layout. */
export async function generateMetadata({params}: HomeProps) {
  const {locale} = await params

  return {
    alternates: {
      canonical: locale === routing.defaultLocale ? '/' : `/${locale}`,
      languages: {de: '/', en: '/en'},
    },
  }
}

export default async function Home({params}: HomeProps) {
  const {locale} = await params
  setRequestLocale(locale)

  // AppState (client) wraps the whole tree so the interactive layer can drive
  // the server-rendered CV. The CV itself stays plain HTML underneath, so it
  // reads with JavaScript switched off.
  return (
    <AppState locale={locale}>
      <AppShell locale={locale} panel={<ChatPanel />}>
        <QueryBar />
        <CvDocument locale={locale} />
      </AppShell>
      <SummaryDialog />
      <ErrorToast />
    </AppState>
  )
}
