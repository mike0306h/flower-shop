'use client'

import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import { useI18n } from '../context/I18nContext'

export default function NotFound() {
  const { t } = useI18n()

  return (
    <>
      <Head><title>404 - {t('page_not_found')}</title></Head>
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <Header />
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <div className="bg-white rounded-3xl shadow-sm p-12">
            <span className="text-8xl block mb-6">🌸</span>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">404</h2>
            <p className="text-2xl font-bold text-gray-800 mb-4">{t('page_not_found')}</p>
            <p className="text-gray-500 mb-8">{t('page_not_found_desc')}</p>
            <Link href="/" className="inline-block px-6 py-3 bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition-colors">
              {t('back_home')}
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
