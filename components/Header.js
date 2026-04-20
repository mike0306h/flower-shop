'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { useI18n } from '../context/I18nContext'

export default function Header() {
  const { cartCount, isHydrated } = useCart()
  const { isLoggedIn, user, logout } = useAuth()
  const { lang, setLang, t } = useI18n()
  const [showLangMenu, setShowLangMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  // 加载中不显示数字，避免 hydration mismatch
  const displayCount = isHydrated ? cartCount : 0

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-3xl">🌸</span>
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              遇见花语
            </h1>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-gray-600 hover:text-pink-500 transition-colors font-medium">{t('home')}</Link>
            <Link href="/shop" className="text-gray-600 hover:text-pink-500 transition-colors font-medium">{t('shop')}</Link>
            <Link href="/custom-order" className="text-gray-600 hover:text-pink-500 transition-colors font-medium">{t('custom_order')}</Link>
            <a href="/#about" className="text-gray-600 hover:text-pink-500 transition-colors font-medium">{t('about')}</a>
            <a href="/#contact" className="text-gray-600 hover:text-pink-500 transition-colors font-medium">{t('contact')}</a>
          </nav>

          {/* Right Icons */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Language */}
            <div className="relative">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-1 px-3 py-2 rounded-full hover:bg-pink-100 transition-colors text-sm"
              >
                <span>{lang === 'zh' ? '🇨🇳' : lang === 'th' ? '🇹🇭' : '🇺🇸'}</span>
                <span className="hidden md:inline">{lang === 'zh' ? '中文' : lang === 'th' ? 'ไทย' : 'EN'}</span>
                <span className="text-xs">▼</span>
              </button>
              {showLangMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowLangMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-36 z-50">
                    <button
                      onClick={() => { setLang('zh'); setShowLangMenu(false) }}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-pink-50 ${lang === 'zh' ? 'text-pink-500 font-medium' : 'text-gray-600'}`}
                    >
                      <span>🇨🇳</span><span>中文</span>
                    </button>
                    <button
                      onClick={() => { setLang('th'); setShowLangMenu(false) }}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-pink-50 ${lang === 'th' ? 'text-pink-500 font-medium' : 'text-gray-600'}`}
                    >
                      <span>🇹🇭</span><span>ไทย</span>
                    </button>
                    <button
                      onClick={() => { setLang('en'); setShowLangMenu(false) }}
                      className={`w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-pink-50 ${lang === 'en' ? 'text-pink-500 font-medium' : 'text-gray-600'}`}
                    >
                      <span>🇺🇸</span><span>EN</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Auth */}
            {isLoggedIn ? (
              <Link href="/profile" className="p-2 hover:bg-pink-100 rounded-full transition-colors" title={t('profile')}>
                <span className="text-xl">{user?.avatar || '👤'}</span>
              </Link>
            ) : (
              <Link href="/login" className="px-3 py-2 bg-pink-500 text-white rounded-full text-sm font-medium hover:bg-pink-600 transition-colors">
                {t('login')}
              </Link>
            )}

            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:bg-pink-100 rounded-full transition-colors">
              <span className="text-xl">🛒</span>
              {displayCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
                  {displayCount > 99 ? '99+' : displayCount}
                </span>
              )}
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-pink-100 rounded-full transition-colors"
            >
              <span className="text-xl">{showMobileMenu ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <nav className="md:hidden mt-4 pb-4 border-t border-gray-100 pt-4">
            <div className="flex flex-col gap-3">
              <Link href="/" className="text-gray-600 hover:text-pink-500 transition-colors font-medium py-2" onClick={() => setShowMobileMenu(false)}>{t('home')}</Link>
              <Link href="/shop" className="text-gray-600 hover:text-pink-500 transition-colors font-medium py-2" onClick={() => setShowMobileMenu(false)}>{t('shop')}</Link>
              <Link href="/custom-order" className="text-gray-600 hover:text-pink-500 transition-colors font-medium py-2" onClick={() => setShowMobileMenu(false)}>{t('custom_order')}</Link>
              <a href="/#about" className="text-gray-600 hover:text-pink-500 transition-colors font-medium py-2" onClick={() => setShowMobileMenu(false)}>{t('about')}</a>
              <a href="/#contact" className="text-gray-600 hover:text-pink-500 transition-colors font-medium py-2" onClick={() => setShowMobileMenu(false)}>{t('contact')}</a>
              {isLoggedIn ? (
                <>
                  <Link href="/profile" className="text-gray-600 hover:text-pink-500 transition-colors font-medium py-2" onClick={() => setShowMobileMenu(false)}>{t('profile')}</Link>
                  <button onClick={() => { logout(); setShowMobileMenu(false) }} className="text-left text-gray-600 hover:text-pink-500 transition-colors font-medium py-2">{t('logout')}</button>
                </>
              ) : (
                <Link href="/login" className="text-pink-500 hover:text-pink-600 transition-colors font-medium py-2" onClick={() => setShowMobileMenu(false)}>{t('login')} / {t('register')}</Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
