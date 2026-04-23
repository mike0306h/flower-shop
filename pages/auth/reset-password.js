'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useI18n } from '../../context/I18nContext'
import { resetPassword } from '../../services/api'
import Toast from '../../components/Toast'

export default function ResetPassword() {
  const router = useRouter()
  const { t, lang } = useI18n()
  const [status, setStatus] = useState('form') // form, success, error, expired
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [countdown, setCountdown] = useState(5)

  // 重置成功时 5秒后自动跳转登录页
  useEffect(() => {
    if (status !== 'success') return
    setCountdown(5)
    const timer = setTimeout(() => {
      window.location.href = '/login'
    }, 5000)
    const interval = setInterval(() => {
      setCountdown(c => c > 1 ? c - 1 : 1)
    }, 1000)
    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [status])

  useEffect(() => {
    const urlCode = router.query.code
    if (urlCode) {
      setCode(urlCode)
    }
  }, [router.query.code])

  const validate = () => {
    const errs = {}
    if (!newPassword) errs.newPassword = '请输入新密码'
    if (newPassword.length < 6) errs.newPassword = '密码至少6位'
    if (newPassword !== confirmPassword) errs.confirmPassword = '两次密码不一致'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await resetPassword(code, newPassword)
      if (res.success) {
        setStatus('success')
      } else {
        setStatus('error')
      }
    } catch (err) {
      const detail = err.response?.data?.detail || '重置失败'
      if (detail.includes('过期') || detail.includes('无效')) {
        setStatus('expired')
      } else {
        setStatus('error')
      }
    }
    setLoading(false)
  }

  return (
    <>
      <Head><title>重置密码 - {t('shop_name')}</title></Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-4xl">🌸</span>
              <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">{t('shop_name')}</span>
            </Link>
          </div>

          {status === 'form' && (
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-gray-800 text-center mb-2">🔑 设置新密码</h2>
              <p className="text-gray-500 text-center mb-6">请输入您的新密码</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="至少6位"
                    className={'w-full px-4 py-3 rounded-xl border ' + (errors.newPassword ? 'border-red-300' : 'border-gray-200') + ' focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all'}
                  />
                  {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="再次输入新密码"
                    className={'w-full px-4 py-3 rounded-xl border ' + (errors.confirmPassword ? 'border-red-300' : 'border-gray-200') + ' focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all'}
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-50 mt-6"
                >
                  {loading ? '提交中...' : '确认重置'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-blue-500 font-medium hover:underline">返回登录</Link>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-green-500 mb-4">密码重置成功！</h2>
              <p className="text-gray-600 mb-2">请使用新密码登录您的账号</p>
              <p className="text-gray-400 text-sm mb-6">{countdown}秒后自动跳转登录页面...</p>
              <Link href="/login" className="inline-block w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all">
                返回登录
              </Link>
            </div>
          )}

          {(status === 'error' || status === 'expired') && (
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              <div className="text-6xl mb-4">❌</div>
              <h2 className="text-2xl font-bold text-red-500 mb-4">
                {status === 'expired' ? '链接已过期' : '重置失败'}
              </h2>
              <p className="text-gray-600 mb-6">
                {status === 'expired' ? '验证码已过期，请重新获取' : '链接无效，请重新获取'}
              </p>
              <Link href="/forgot-password" className="inline-block w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-200 transition-all">
                重新获取
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
