'use client'

import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useI18n, languages } from '../context/I18nContext'
import { useAuth } from '../context/AuthContext'
import { sendVerifyEmail } from '../services/api'
import Toast from '../components/Toast'

export default function Register() {
  const router = useRouter()
  const { t, lang, setLang } = useI18n()
  const { register, isLoggedIn } = useAuth()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [step, setStep] = useState(1) // 1: 填写信息, 2: 验证邮箱

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  if (isLoggedIn) {
    router.push('/profile')
    return null
  }

  const validate = () => {
    const errs = {}
    if (!formData.name) errs.name = t('enter_name')
    if (!formData.email) errs.email = t('enter_email')
    if (!formData.phone) errs.phone = t('enter_phone')
    if (!formData.password) errs.password = t('enter_password')
    if (formData.password.length < 6) errs.password = t('password_too_short')
    if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = t('password_mismatch')
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSendVerifyEmail = async () => {
    if (!formData.email) {
      setErrors({ email: t('enter_email') })
      return
    }
    if (!validate()) return

    setSendLoading(true)
    try {
      await sendVerifyEmail(formData.email)
      // 保存注册信息到 sessionStorage，邮箱验证成功后自动注册
      sessionStorage.setItem('pending_register', JSON.stringify({
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        email: formData.email,
      }))
      setEmailSent(true)
      setStep(2)
    } catch (err) {
      const detail = err.response?.data?.detail || '发送失败'
      if (detail.includes('已注册')) {
        setErrors({ email: detail })
      } else {
        setErrors({ form: detail })
      }
    }
    setSendLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    const result = await register(formData.name, formData.email, formData.phone, formData.password)
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
      <Head><title>{t('register')} - 遇见花语</title></Head>
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
                      className={'w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-pink-50 ' + (lang === l.code ? 'text-pink-500 font-medium' : 'text-gray-600')}
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
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">遇见花语</span>
            </Link>
          </div>

          {step === 1 && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">{t('join_us')}</h2>
              <p className="text-gray-500 text-center mb-8">{t('register_subtitle')}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {errors.form && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center">
                    {errors.form}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('your_name')}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder={t('enter_name')}
                    className={'w-full px-4 py-3 rounded-xl border ' + (errors.name ? 'border-red-300' : 'border-gray-200') + ' focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all'}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('email')}</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    placeholder={t('enter_email')}
                    className={'w-full px-4 py-3 rounded-xl border ' + (errors.email ? 'border-red-300' : 'border-gray-200') + ' focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all'}
                  />
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('phone')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder={t('enter_phone')}
                    className={'w-full px-4 py-3 rounded-xl border ' + (errors.phone ? 'border-red-300' : 'border-gray-200') + ' focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all'}
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('password')}</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    placeholder={t('enter_password')}
                    className={'w-full px-4 py-3 rounded-xl border ' + (errors.password ? 'border-red-300' : 'border-gray-200') + ' focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all'}
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('confirm_password')}</label>
                  <input
                    type="password"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    placeholder={t('enter_confirm_password')}
                    className={'w-full px-4 py-3 rounded-xl border ' + (errors.confirmPassword ? 'border-red-300' : 'border-gray-200') + ' focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all'}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="button"
                  onClick={handleSendVerifyEmail}
                  disabled={sendLoading}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-200 transition-all disabled:opacity-50 mt-6"
                >
                  {sendLoading ? '发送中...' : '发送验证邮件'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-500">
                  {t('have_account')}{' '}
                  <Link href="/login" className="text-pink-500 font-medium hover:underline">{t('login_link')}</Link>
                </p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="text-5xl mb-4">📧</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">验证邮箱</h2>
                <p className="text-gray-500">
                  我们已发送验证邮件到<br/>
                  <span className="font-bold text-pink-500">{formData.email}</span>
                </p>
              </div>

              <div className="bg-pink-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600">
                  请点击邮件中的链接完成验证，验证后即可完成注册。<br/>
                  如果没有收到邮件，请检查垃圾邮件文件夹。
                </p>
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full py-3 border border-pink-300 text-pink-500 font-medium rounded-xl hover:bg-pink-50 transition-all mb-3"
              >
                修改邮箱
              </button>

              <p className="text-center text-gray-500 text-sm">
                <Link href="/login" className="text-pink-500 font-medium">返回登录</Link>
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
