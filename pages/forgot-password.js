'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useI18n, languages } from '../context/I18nContext'
import { sendResetPasswordEmail } from '../services/api'
import Toast from '../components/Toast'

export default function ForgotPassword() {
  const router = useRouter()
  const { t, lang, setLang } = useI18n()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [step, setStep] = useState(1) // 1: 输入邮箱, 2: 发送成功
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(5)

  // step=2 时 5秒后自动跳转登录页
  useEffect(() => {
    if (step !== 2) return
    setCountdown(5)
    const timer = setTimeout(() => {
      window.location.href = '/login'
    }, 5000)
    const interval = setInterval(() => {
      setCountdown(c => c > 1 ? c - 1 : 1)
    }, 1000)
    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [step])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) {
      setError(t('enter_email'))
      return
    }
    
    setLoading(true)
    setError('')
    try {
      await sendResetPasswordEmail(email)
      setStep(2)
    } catch (err) {
      const detail = err.response?.data?.detail || '发送失败'
      if (detail.includes('如果')) {
        // 这是正常响应，邮箱不存在也返回成功
        setStep(2)
      } else {
        setError(detail)
      }
    }
    setLoading(false)
  }

  const currentLang = languages.find(l => l.code === lang) || languages[0]

  return (
    <>
      <Head><title>忘记密码 - {t('shop_name')}</title></Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Language Selector */}
          <div className="flex justify-end mb-4">
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 px-3 py-2 rounded-full bg-white shadow-sm hover:bg-blue-100 transition-colors text-sm"
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
                      className={'w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-blue-50 ' + (lang === l.code ? 'text-blue-500 font-medium' : 'text-gray-600')}
                    >
                      <span>{l.flag}</span>
                      <span>{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-4xl">🌸</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">{t('shop_name')}</span>
            </Link>
          </div>

          {step === 1 && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">🔑 忘记密码</h2>
              <p className="text-gray-500 text-center mb-8">输入您的注册邮箱，我们将发送重置链接</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('enter_email')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50 mt-6"
                >
                  {loading ? '发送中...' : '发送重置链接'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-blue-500 font-medium hover:underline">返回登录</Link>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              <div className="text-6xl mb-4">📧</div>
              <h2 className="text-2xl font-bold text-green-500 mb-4">发送成功！</h2>
              <p className="text-gray-600 mb-6">
                如果该邮箱已注册，重置链接已发送到您的邮箱。<br/>
                请在 5 分钟内点击链接重置密码。
              </p>
              <div className="bg-blue-50 rounded-xl p-4 mb-6 text-sm text-gray-600">
                <p>💡 如果没有收到邮件，请检查：</p>
                <ul className="text-left mt-2 space-y-1">
                  <li>• 垃圾邮件文件夹</li>
                  <li>• 邮箱地址是否正确</li>
                </ul>
              </div>
              <div className="text-center text-gray-500 text-sm mb-4">
                {countdown > 0 ? <span>{countdown}秒后自动跳转登录页面...</span> : null}
              </div>
              <Link href="/login" className="inline-block w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all">
                返回登录
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
