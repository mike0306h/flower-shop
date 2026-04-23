'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import Toast from '../components/Toast'
import { useCart } from '../context/CartContext'
import { useI18n } from '../context/I18nContext'
import { useAuth } from '../context/AuthContext'
import { useAddress } from '../context/AddressContext'
import { createOrder, validateCoupon } from '../services/api'
import { getImageUrl } from '../utils/image'
import Lightbox from '../components/Lightbox'

const deliveryTimes = [
  { id: 'am', label_key: 'morning', extra: 0 },
  { id: 'pm', label_key: 'afternoon', extra: 0 },
  { id: 'eve', label_key: 'evening', extra: 10 },
]

const payMethods = [
  { id: 'alipay', label_key: 'alipay', icon: '💙' },
  { id: 'wechat', label_key: 'wechat_pay', icon: '💚' },
  { id: 'card', label_key: 'bank_card', icon: '💳' },
]

export default function Checkout() {
  const router = useRouter()
  const { t } = useI18n()
  const { cart, subtotal, deliveryFee, total, clearCart } = useCart()
  const { isLoggedIn } = useAuth()
  const { defaultAddress, isHydrated } = useAddress()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    date: '',
    timeSlot: 'am',
    message: '',
    payMethod: 'alipay',
  })
  const [orderPlaced, setOrderPlaced] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponError, setCouponError] = useState('')
  const [showCouponInput, setShowCouponInput] = useState(false)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [orderError, setOrderError] = useState('')
  const [lightboxSrc, setLightboxSrc] = useState(null)

  // Auto-fill default address
  useEffect(() => {
    if (isHydrated && defaultAddress && !formData.name) {
      setFormData(prev => ({
        ...prev,
        name: defaultAddress.name || '',
        phone: defaultAddress.phone || '',
        address: defaultAddress.fullAddress || '',
      }))
    }
  }, [isHydrated, defaultAddress])

  // 只有登录后才让结账
  if (!isLoggedIn && !orderPlaced) {
    return (
      <>
        <Head><title>{t('checkout_title')} - {t('shop_name')}</title></Head>
        <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
          <Header />
          <div className="max-w-md mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-3xl shadow-sm p-12">
              <span className="text-8xl block mb-6">🔐</span>
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('please_login')}</h2>
              <p className="text-gray-500 mb-8">{t('please_login_desc')}</p>
              <div className="space-y-3">
                <Link href="/login" className="block w-full py-3 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors">
                  {t('login_to_checkout')}
                </Link>
                <Link href="/register" className="block w-full py-3 border border-pink-500 text-pink-500 font-semibold rounded-xl hover:bg-pink-50 transition-colors">
                  {t('register_to_checkout')}
                </Link>
              </div>
              <Link href="/cart" className="block mt-6 text-gray-500 hover:text-pink-500">
                ← {t('shopping_cart')}
              </Link>
            </div>
          </div>
        </main>
      </>
    )
  }

  if (cart.length === 0 && !orderPlaced) {
    return (
      <>
        <Head><title>{t('checkout_title')} - {t('shop_name')}</title></Head>
        <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
          <Header />
          <div className="max-w-2xl mx-auto px-4 py-16 text-center">
            <span className="text-8xl block mb-4">🛒</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('cart_empty')}</h2>
            <p className="text-gray-500 mb-6">{t('go_shopping')}</p>
            <Link href="/shop" className="inline-block px-6 py-3 bg-pink-500 text-white font-semibold rounded-full">
              {t('go_choose')}
            </Link>
          </div>
        </main>
      </>
    )
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponError('')

    try {
      const result = await validateCoupon(couponCode.trim())
      if (result.valid) {
        setAppliedCoupon({
          code: result.code,
          type: result.discount_type,
          discount: result.discount_value,
          minAmount: result.min_amount,
        })
        setCouponError('')
      }
    } catch (error) {
      setCouponError(error.response?.data?.detail || t('coupon_failed') || (t('coupon_not_available') || '优惠券不可用'))
      setAppliedCoupon(null)
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
  }

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0
    if (appliedCoupon.minAmount && subtotal < appliedCoupon.minAmount) return 0
    if (appliedCoupon.type === 'percent') {
      return Math.round(subtotal * appliedCoupon.discount / 100)
    }
    return appliedCoupon.discount
  }

  const discount = calculateDiscount()
  const finalTotal = total - discount + (deliveryTimes.find(d => d.id === formData.timeSlot)?.extra || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (step === 1) {
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else {
      // 提交订单到后端
      setPlacingOrder(true)
      setOrderError('')

      try {
        // 构建订单数据（适配新的购物车结构）
        const orderItems = cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.qty || 1,
          flowers: item.flowerCount || 11,
          image: item.image || '',
        }))

        const selectedDelivery = deliveryTimes.find(d => d.id === formData.timeSlot)
        const deliveryExtra = selectedDelivery?.extra || 0
        const discount = calculateDiscount()
        const finalTotal = total - discount + deliveryExtra

        const orderData = {
          user_name: formData.name,
          phone: formData.phone,
          address: formData.address,
          total: finalTotal,
          status: 'pending',
          items: orderItems,
          note: formData.message,
          coupon_code: appliedCoupon?.code || null,
          discount: discount,
          time_slot: formData.timeSlot,
          pay_method: formData.payMethod
        }

        const result = await createOrder(orderData)

        // 清空购物车
        clearCart()

        setOrderId(result.order_no)
        setOrderPlaced(true)
      } catch (error) {
        console.error('Order creation failed:', error)
        setOrderError(error.response?.data?.detail || (t('order_create_fail') || '订单创建失败，请稍后重试'))
      } finally {
        setPlacingOrder(false)
      }
    }
  }

  const selectedDelivery = deliveryTimes.find(td => td.id === formData.timeSlot)

  if (orderPlaced) {
    return (
      <>
        <Head><title>{t('order_success')} - {t('shop_name')}</title></Head>
        <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
          <Header />
          <div className="max-w-xl mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-3xl shadow-sm p-12">
              <span className="text-8xl block mb-6">🎉</span>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('order_success')}</h2>
              <p className="text-gray-600 mb-2">{t('order_id')}：<span className="font-bold text-pink-500">{orderId}</span></p>
              <p className="text-gray-500 mb-8">{t('order_desc')}</p>
              <div className="space-y-3">
                <Link href="/shop" className="block w-full py-3 bg-pink-500 text-white font-semibold rounded-xl">
                  {t('continue_shopping')}
                </Link>
                <Link href="/profile" className="block w-full py-3 border border-pink-500 text-pink-500 font-semibold rounded-xl">
                  {t('view_order')}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  const steps = [t('step_info'), t('step_payment'), t('step_confirm')]

  return (
    <>
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} alt={t("product_image")} onClose={() => setLightboxSrc(null)} />
      )}
      <Head><title>{t('checkout_title')} - {t('shop_name')}</title></Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-16">
        <Header />

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Progress */}
          <div className="flex items-center justify-center mb-8">
            {steps.map((s, i) => (
              <div key={i} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step > i + 1 ? 'bg-pink-500 text-white' : step === i + 1 ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`ml-2 font-medium ${step === i + 1 ? 'text-pink-500' : 'text-gray-400'}`}>{s}</span>
                {i < 2 && <div className={`w-16 h-1 mx-4 rounded ${step > i + 1 ? 'bg-pink-500' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('delivery_info')}</h2>

                {/* Coupon Section */}
                <div className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-gray-700">{t('coupon')}</span>
                    {!appliedCoupon && (
                      <button
                        type="button"
                        onClick={() => setShowCouponInput(!showCouponInput)}
                        className="text-sm text-pink-500 hover:underline"
                      >
                        {showCouponInput ? (t('collapse') || '收起') : (t('use_coupon') || '使用优惠券')}
                      </button>
                    )}
                  </div>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 rounded-lg p-3">
                      <div>
                        <span className="text-green-600 font-medium">{appliedCoupon.code}</span>
                        <span className="text-sm text-gray-500 ml-2">{appliedCoupon.desc}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ✕
                      </button>
                    </div>
                  ) : showCouponInput && (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={e => { setCouponCode(e.target.value); setCouponError('') }}
                        placeholder={t('enter_coupon')}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-pink-300 outline-none"
                      />
                      <button
                        type="button"
                        onClick={applyCoupon}
                        className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600"
                      >
                        {t('apply_coupon')}
                      </button>
                    </div>
                  )}
                  {couponError && (
                    <p className="text-red-500 text-sm mt-2">{couponError}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('recipient')}</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      placeholder={t('enter_name')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('phone_number')}</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                      placeholder={t('enter_phone')}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('delivery_address')}</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder={t('enter_address')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('delivery_date')}</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('time_slot')}</label>
                    <select
                      value={formData.timeSlot}
                      onChange={e => setFormData({...formData, timeSlot: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 outline-none"
                    >
                      {deliveryTimes.map(td => (
                        <option key={td.id} value={td.id}>
                          {td.extra > 0 ? t('evening_extra') : t(td.label_key)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('blessing')}</label>
                  <textarea
                    value={formData.message}
                    onChange={e => setFormData({...formData, message: e.target.value})}
                    placeholder={t('blessing_placeholder')}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 outline-none resize-none"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
                <h2 className="text-2xl font-bold text-gray-800">{t('payment_method')}</h2>
                <div className="space-y-3">
                  {payMethods.map(m => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        formData.payMethod === m.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="payMethod"
                        value={m.id}
                        checked={formData.payMethod === m.id}
                        onChange={e => setFormData({...formData, payMethod: e.target.value})}
                        className="hidden"
                      />
                      <span className="text-2xl">{m.icon}</span>
                      <span className="font-medium">{t(m.label_key)}</span>
                      <span className="ml-auto">
                        {formData.payMethod === m.id && <span className="text-pink-500">✓</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('confirm_order')}</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">{t('recipient')}</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">{t('phone_number')}</span>
                    <span className="font-medium">{formData.phone}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">{t('delivery_address')}</span>
                    <span className="font-medium">{formData.address}</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">{t('delivery_date')}</span>
                    <span className="font-medium">{formData.date} {t(selectedDelivery?.label_key)}</span>
                  </div>
                  {formData.message && (
                    <div className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600">{t('blessing')}</span>
                      <span className="font-medium">{formData.message}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">{t('payment_method')}</span>
                    <span className="font-medium">{t(payMethods.find(m => m.id === formData.payMethod)?.label_key)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between py-3 border-b border-gray-100">
                      <span className="text-gray-600">{t('coupon')}</span>
                      <span className="font-medium text-green-600">{appliedCoupon.code} (-฿{discount})</span>
                    </div>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-3 mb-6">
                  {cart.map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                        {item.image ? (
                          <img
                            src={getImageUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover cursor-zoom-in"
                            onClick={() => setLightboxSrc(getImageUrl(item.image))}
                          />
                        ) : <span className="text-2xl">🌸</span>}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.flowerCount}{t("flowers_unit") || "朵"} × {item.qty}{t("units_unit") || "份"}</p>
                      </div>
                      <span className="font-bold text-pink-500">฿{(item.price * item.qty).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6 mt-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">{t('subtotal_price')}</span>
                <span>฿{subtotal.toLocaleString()}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between mb-2 text-green-600">
                  <span>{t('discount')}</span>
                  <span>-฿{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between mb-4">
                <span className="text-gray-600">{t('delivery_fee')}</span>
                <span>{deliveryFee === 0 ? t('free_delivery') : `฿${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <span className="text-xl font-bold">{t('total_amount')}</span>
                <span className="text-3xl font-bold text-pink-500">฿{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 mt-6">
              {orderError && (
                <div className="w-full mb-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center">
                  {orderError}
                </div>
              )}
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="px-6 py-3 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50"
                >
                  {t('previous_step')}
                </button>
              )}
              <button
                type="submit"
                disabled={placingOrder}
                className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-200 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placingOrder ? t('processing') + '...' : (step === 3 ? t('place_order') : t('next_step'))}
              </button>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}
