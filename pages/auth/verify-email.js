'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useI18n } from '../../context/I18nContext'
import { verifyEmailCode } from '../../services/api'
import Toast from '../../components/Toast'

export default function VerifyEmail() {
  const router = useRouter()
  const { t } = useI18n()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [autoLoginDone, setAutoLoginDone] = useState(false)
  const [verifiedEmail, setVerifiedEmail] = useState('')

  useEffect(() => {
    const code = router.query.code
    if (!code) {
      setStatus('error')
      setMessage(t('verify_invalid_link'))
      return
    }

    verifyEmailCode(code)
      .then(async (res) => {
        if (res.success) {
          const email = res.email || res.user?.email
          if (!email) {
            setStatus('error')
            setMessage(t('verify_no_email_info'))
            return
          }

          setVerifiedEmail(email)

          // 从 localStorage 读取注册时保存的临时数据
          const stored = localStorage.getItem('pending_register')
          if (stored) {
            const { name, phone, password } = JSON.parse(stored)
            localStorage.removeItem('pending_register')

            // 直接调用注册 API，自动登录
            try {
              const { register: apiRegister } = await import('../../services/api')
              const regRes = await apiRegister({ name, email, phone, password })
              if (regRes.token && regRes.user) {
                // 存储登录状态
                localStorage.setItem('flower_user_token', regRes.token)
                localStorage.setItem('flower_user', JSON.stringify(regRes.user))
                setAutoLoginDone(true)
                setStatus('success')
                setMessage(t('verify_auto_login_msg'))
                setTimeout(() => { router.push('/profile') }, 500)
                return
              }
            } catch (e) {
              console.error('Auto register failed:', e)
              // 注册失败可能已注册过，直接跳转登录
              setStatus('success')
              setMessage(t('verify_email_success_msg'))
              setTimeout(() => { router.push('/login') }, 2000)
              return
            }
          }

          // 没有临时数据 → 跳转登录
          setStatus('success')
          setMessage(t('verify_email_success_msg'))
          setTimeout(() => { router.push('/login') }, 2000)
        } else {
          setStatus('error')
          setMessage(res.message || t('verify_error_title'))
        }
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.response?.data?.detail || t('verify_code_error'))
      })
  }, [router.query.code])

  const statusConfig = {
    loading: { icon: '⏳', title: t('verify_loading'), color: 'text-blue-500' },
    success: { icon: '✅', title: t('verify_success_title'), color: 'text-green-500' },
    error: { icon: '❌', title: t('verify_error_title'), color: 'text-red-500' }
  }
  const config = statusConfig[status]

  return (
    <>
      <Head><title>{t('verify_email')} - {t('shop_name')}</title></Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-4xl">🌸</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">{t('shop_name')}</span>
            </Link>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className={'text-6xl mb-4 ' + config.color}>{config.icon}</div>
            <h2 className={'text-2xl font-bold mb-4 ' + config.color}>{config.title}</h2>
            <p className="text-gray-600 mb-6">
              {status === 'success' && (message || t('verify_success_title'))}
              {status === 'error' && message}
              {status === 'loading' && t('verify_loading')}
            </p>
            {status === 'success' && !autoLoginDone && (
              <p className="text-gray-500 text-sm mb-6">{t('verify_redirecting')}</p>
            )}
            {status === 'success' && autoLoginDone && (
              <p className="text-green-500 text-sm mb-6 font-medium">🎉 {t('verify_auto_login_msg')}</p>
            )}
            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">{t('retry_verify')}</p>
                <Link href="/register" className="inline-block w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-200 transition-all">
                  {t('back_to_register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
