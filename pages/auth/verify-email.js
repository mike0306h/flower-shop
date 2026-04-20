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
  const { t, lang } = useI18n()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    const code = router.query.code
    if (code) {
      verifyEmailCode(code)
        .then((res) => {
          if (res.success) {
            setStatus('success')
            setEmail(res.user?.email || '')
            setTimeout(() => {
              router.push('/login')
            }, 3000)
          } else {
            setStatus('error')
            setMessage(res.message || '验证失败')
          }
        })
        .catch((err) => {
          setStatus('error')
          setMessage(err.response?.data?.detail || '验证码无效或已过期')
        })
    } else {
      setStatus('error')
      setMessage('无效的验证链接')
    }
  }, [router.query.code])

  const statusConfig = {
    loading: { icon: '⏳', title: '验证中...', color: 'text-blue-500' },
    success: { icon: '✅', title: '邮箱验证成功！', color: 'text-green-500' },
    error: { icon: '❌', title: '验证失败', color: 'text-red-500' }
  }
  const config = statusConfig[status]

  return (
    <>
      <Head><title>邮箱验证 - 遇见花语</title></Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-4xl">🌸</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">遇见花语</span>
            </Link>
          </div>
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
            <div className={'text-6xl mb-4 ' + config.color}>{config.icon}</div>
            <h2 className={'text-2xl font-bold mb-4 ' + config.color}>{config.title}</h2>
            <p className="text-gray-600 mb-6">
              {status === 'success' && '邮箱验证成功！'}
              {status === 'error' && message}
              {status === 'loading' && '正在验证您的邮箱，请稍候...'}
            </p>
            {status === 'success' && (
              <p className="text-gray-500 text-sm mb-6">页面将自动跳转到登录页...</p>
            )}
            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-gray-500 text-sm">请返回注册页面重新获取验证邮件</p>
                <Link href="/register" className="inline-block w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-200 transition-all">
                  返回注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  )
}
