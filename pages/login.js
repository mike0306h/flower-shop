'use client'

import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useI18n, languages } from '../context/I18nContext'
import { useAuth } from '../context/AuthContext'
import Toast from '../components/Toast'

export default function Login() {
  const router = useRouter()
  const { t, lang, setLang } = useI18n()
  const { login, isLoggedIn } = useAuth()
  const [showLangMenu, setShowLangMenu] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  if (isLoggedIn) {
    router.push('/profile')
    return null
  }

  const validate = () => {
    const errs = {}
    if (!formData.email) errs.email = t('enter_email')
    if (!formData.password) errs.password = t('enter_password')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const result = await login(formData.email, formData.password)
    if (result.success) {
      router.push('/profile')
    } else {
      setErrors({ form: result.error })
    }
    setLoading(false)
  }

  const currentLang = languages.find(l => l.code === lang) || languages[0]

  return (
    <>
      <Head><title>{t('login')} - 遇见花语</title></Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Language Selector */}
          <div className="flex justify-end mb-4">
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 px-3 py-2 rounded-full bg-white shadow-sm hover:bg-pink-100 transition-colors text-sm"
              >
                <span>{currentLang.flag}</span>
                <span>{currentLang.name}</span>
                <span className="text-xs">▼</span>
              </button>
              {showLangMenu && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-32 z-50">
                  {languages.map(l => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setShowLangMenu(false) }}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-pink-50 ${lang === l.code ? 'text-pink-500 font-medium' : 'text-gray-600'}`}
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Logo */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-4xl">🌸</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">遇见花语</span>
            </Link>
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">{t('welcome_back')}</h2>
            <p className="text-gray-500 text-center mb-8">{t('login_subtitle')}</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errors.form && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center">
                  {errors.form}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder={t('enter_email')}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-300' : 'border-gray-200'} focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all`}
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('password')}</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder={t('enter_password')}
                  className={`w-full px-4 py-3 rounded-xl border ${errors.password ? 'border-red-300' : 'border-gray-200'} focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all`}
                />
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-pink-500 hover:underline">{t('forgot_password')}</Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-200 transition-all disabled:opacity-50"
              >
                {loading ? '...' : t('login_btn')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-500">
                {t('no_account')}{' '}
                <Link href="/register" className="text-pink-500 font-medium hover:underline">{t('create_account')}</Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
