'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Header from '../components/Header'
import Toast from '../components/Toast'
import { useI18n } from '../context/I18nContext'
import api from '../services/api'

export default function Coupons() {
  const { t, lang } = useI18n()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState(null)

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    setLoading(true)
    try {
      // 调用公开接口获取可用优惠券
      const res = await api.get('/api/coupons/available')
      setCoupons(res.items || [])
    } catch (err) {
      console.error('Failed to load coupons:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const getDiscountLabel = (coupon) => {
    if (coupon.discount_type === 'percent') {
      return `${coupon.discount_value}% OFF`
    } else {
      return `฿${coupon.discount_value} OFF`
    }
  }

  const getMinAmountLabel = (coupon) => {
    if (coupon.min_amount > 0) {
      return `${t('coupon_min_amount') || '满'}฿${coupon.min_amount}${t('coupon_available') || '可用'}`
    }
    return t('coupon_no_threshold') || '无门槛'
  }

  const getExpiryLabel = (coupon) => {
    if (!coupon.expires_at) return t('coupon_long_term') || '长期有效'
    const date = new Date(coupon.expires_at)
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')} ${t('expires') || '到期'}`
  }

  const getRemainingUses = (coupon) => {
    if (coupon.max_uses === 0) return t('coupon_unlimited') || '无限次'
    const remaining = coupon.max_uses - coupon.used_count
    return `${t('coupon_remaining') || '剩余'} ${remaining} ${t('times') || '次'}`
  }

  return (
    <>
      <Head><title>{t('coupons_title') || '优惠券'} - {t('shop_name')}</title></Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-16">
        <Header />

        {/* Hero */}
        <div className="bg-gradient-to-r from-pink-100 via-rose-50 to-pink-100 py-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{t('coupon_center_title') || '🎁 优惠券中心'}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{t('coupon_center_desc') || '领取专属优惠券，购物更优惠'}</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="bg-pink-100 h-32"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Coupons Grid */}
          {!loading && coupons.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coupons.map(coupon => (
                <div key={coupon.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                  {/* Left colored side */}
                  <div className="flex">
                    <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-6 flex flex-col items-center justify-center min-w-[120px]">
                      <span className="text-3xl font-bold text-white">{getDiscountLabel(coupon)}</span>
                      <span className="text-pink-100 text-sm mt-1">{getMinAmountLabel(coupon)}</span>
                    </div>
                    <div className="flex-1 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-400 text-xs">{getExpiryLabel(coupon)}</span>
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">{getRemainingUses(coupon)}</span>
                      </div>
                      <div className="font-mono text-lg font-bold text-gray-800 bg-gray-50 px-3 py-2 rounded-lg mb-3">
                        {coupon.code}
                      </div>
                      <button
                        onClick={() => handleCopyCode(coupon.code, coupon.id)}
                        className={`w-full py-2 rounded-xl font-medium transition-colors ${
                          copiedId === coupon.id
                            ? 'bg-green-100 text-green-600'
                            : 'bg-pink-500 text-white hover:bg-pink-600'
                        }`}
                      >
                        {copiedId === coupon.id ? (t('copied') || '✓ 已复制') : (t('copy_code') || '复制券码')}
                      </button>
                    </div>
                  </div>
                  {/* Coupon details */}
                  <div className="px-4 pb-4">
                    <div className="text-xs text-gray-400 mt-2 pt-3 border-t border-gray-100">
                      {coupon.discount_type === 'percent'
                        ? `${t('discount_coupon_label') || '折扣券'} | ${t('coupon_desc') || '全场商品满'}${coupon.min_amount}${t('currency_unit') || '元可用'}`
                        : `${t('flat_coupon_label') || '立减券'} | ${t('coupon_desc') || '全场商品满'}${coupon.min_amount}${t('currency_unit') || '元可用'}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && coupons.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl">
              <span className="text-6xl block mb-4">🎁</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('no_coupons') || '暂无优惠券'}</h3>
              <p className="text-gray-500">{t('no_coupons_desc') || '关注店铺，第一时间获取优惠信息'}</p>
            </div>
          )}

          {/* How to use */}
          <div className="mt-12 bg-white rounded-2xl shadow-sm p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">如何使用优惠券</h3>
            <ol className="space-y-3 text-gray-600">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <span>选择心仪的商品，加入购物车</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <span>进入结算页面，点击"使用优惠券"</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <span>输入优惠券码或点击复制券码粘贴</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                <span>验证成功后，优惠金额将自动抵扣</span>
              </li>
            </ol>
          </div>
        </div>
      </main>
    </>
  )
}
