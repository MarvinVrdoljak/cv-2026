import {getTranslations, setRequestLocale} from 'next-intl/server'
import {CommonButton} from '@/components/common/CommonButton'
import type {Locale} from '@/i18n/routing'
import styles from './page.module.css'

type HomeProps = {
  // Locale, not string — the layout's hasLocale() guard has already rejected
  // unknown locales by the time a page renders.
  params: Promise<{locale: Locale}>
}

export default async function Home({params}: HomeProps) {
  const {locale} = await params
  setRequestLocale(locale)

  // Server Component: await getTranslations(). In a Client Component use useTranslations().
  const t = await getTranslations('home')

  return (
    <main className={`${styles.root} container`}>
      <h1>{t('title')}</h1>
      <p>{t('intro')}</p>
      <CommonButton>{t('title')}</CommonButton>
    </main>
  )
}
