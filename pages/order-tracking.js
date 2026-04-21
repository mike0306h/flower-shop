'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import Lightbox from '../components/Lightbox'
import { useI18n } from '../context/I18nContext'
import { useAuth } from '../context/AuthContext'
import { getUserOrders, updateOrder, cancelOrder } from '../services/api'
import { getImageUrl } from '../utils/image'

export default function OrderTracking() {
  const { t } = useI18n()
  const router = useRouter()
  const { isLoggedIn } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [lightboxSrc, setLightboxSrc] = useState(null)
  const [confirming, setConfirming] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/login')
      return
    }
    loadOrders()
  }, [isLoggedIn])

  const loadOrders = async () => {
    try {
      const data = await getUserOrders(1, 50)
      setOrders(data.items || [])
      const orderId = router.query.orderId
      if (orderId) {
        const found = data.items?.find(o => o.order_no === orderId)
        setOrder(found || null)
      }
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelivery = async () => {
    if (!window.confirm('确认已收到商品？')) return
    setConfirming(true)
    try {
      await updateOrder(order.id, { status: 'delivered' })
      await loadOrders()
      const updated = orders.find(o => o.id === order.id)
      if (updated) {
        setOrder({ ...updated, status: 'delivered' })
      }
    } catch (error) {
      alert('确认收货失败，请稍后重试')
    } finally {
      setConfirming(false)
    }
  }

  const handleCancelRequest = async () => {
    if (!cancelReason.trim()) {
      alert('请输入取消原因')
      return
    }
    setCancelling(true)
    try {
      await cancelOrder(order.id, cancelReason)
      alert('取消申请已提交，等待商家处理')
      setShowCancelModal(false)
      loadOrders()
    } catch (error) {
      alert(error?.response?.data?.detail || '取消申请失败，请稍后重试')
    } finally {
      setCancelling(false)
    }
  }

  const getStatusIndex = (status) => {
    const map = { pending: 0, confirmed: 1, preparing: 2, shipped: 3, delivered: 4, completed: 5, cancelled: -1, cancellation_requested: -2 }
    return map[status] || 0
  }

  const getStatusLabel = (status) => {
    const map = {
      pending: t('order_pending'),
      confirmed: t('order_confirmed'),
      preparing: t('order_preparing'),
      shipped: t('order_shipped'),
      delivered: t('order_delivered'),
      completed: t('order_completed'),
      cancelled: t('order_cancelled'),
      cancellation_requested: '取消申请中',
    }
    return map[status] || status
  }

  const getStatusClass = (status) => {
    const map = {
      pending: 'bg-yellow-100 text-yellow-600',
      confirmed: 'bg-blue-100 text-blue-600',
      preparing: 'bg-orange-100 text-orange-600',
      shipped: 'bg-purple-100 text-purple-600',
      delivered: 'bg-green-100 text-green-600',
      completed: 'bg-green-100 text-green-600',
      cancelled: 'bg-red-100 text-red-600',
      cancellation_requested: 'bg-red-100 text-red-600',
    }
    return map[status] || 'bg-gray-100 text-gray-600'
  }

  const getStatusIcon = (status) => {
    const map = {
      pending: '⏳',
      confirmed: '✅',
      preparing: '🌸',
      shipped: '🚚',
      delivered: '💐',
      completed: '✨',
      cancelled: '❌',
      cancellation_requested: '⏳',
    }
    return map[status] || '📦'
  }

  const steps = [
    { key: 'pending', label: t('order_pending') || '待处理' },
    { key: 'confirmed', label: t('order_confirmed') || '已确认' },
    { key: 'preparing', label: t('order_preparing') || '制作中' },
    { key: 'shipped', label: t('order_shipped') || '已发货' },
    { key: 'delivered', label: t('order_delivered') || '已送达' },
  ]

  if (loading) {
    return (
      <>
        <Head><title>{t('track_order')} - {t('shop_name')}</title></Head>
        <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
          <Header />
          <div className="max-w-2xl mx-auto px-4 py-12 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto" />
            </div>
          </div>
        </main>
      </>
    )
  }

  if (!order) {
    return (
      <>
        <Head><title>{t('track_order')} - {t('shop_name')}</title></Head>
        <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
          <Header />
          <div className="max-w-2xl mx-auto px-4 py-12 text-center">
            <span className="text-6xl block mb-4">🔍</span>
            <h2 className="text-xl font-bold text-gray-800 mb-2">{t('order_not_found') || '订单不存在'}</h2>
            <p className="text-gray-500 mb-6">{t('order_not_found_desc') || '未找到该订单'}</p>

            {orders.length > 0 && (
              <div className="text-left mt-8">
                <h3 className="font-bold text-lg mb-4">{t('my_orders') || '我的订单'}</h3>
                <div className="space-y-3">
                  {orders.map(o => (
                    <Link
                      key={o.id}
                      href={`/order-tracking?orderId=${o.order_no}`}
                      className="block p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-mono text-sm text-gray-500">{o.order_no}</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {new Date(o.created_at).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${getStatusClass(o.status)}`}>
                          {getStatusLabel(o.status)}
                        </span>
                      </div>
                      <div className="mt-3 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {o.items?.slice(0, 2).map((item, i) => (
                            <div key={i} className="w-8 h-8 bg-gradient-to-br from-pink-100 to-rose-200 rounded flex items-center justify-center overflow-hidden">
                              {item.image ? (
                                <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-sm">🌸</span>
                              )}
                            </div>
                          ))}
                          {o.items?.length > 2 && <span className="text-gray-400">+{o.items.length - 2}</span>}
                        </div>
                        <span className="font-bold text-pink-500">฿{o.total.toFixed(0)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <Link href="/profile" className="inline-block mt-6 text-pink-500 hover:underline">
              ← {t('back_to_profile') || '返回个人中心'}
            </Link>
          </div>
        </main>
      </>
    )
  }

  const currentStep = getStatusIndex(order.status)

  return (
    <>
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} alt="放大图片" onClose={() => setLightboxSrc(null)} />
      )}
      <Head><title>{t('track_order')} - {t('shop_name')}</title></Head>
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <Header />

        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/profile" className="text-gray-400 hover:text-pink-500">←</Link>
            <div>
              <h1 className="text-xl font-bold text-gray-800">{t('track_order')}</h1>
              <p className="text-sm text-gray-500 font-mono">{order.order_no}</p>
            </div>
            <span className={`ml-auto px-3 py-1 rounded-full text-sm ${getStatusClass(order.status)}`}>
              {getStatusIcon(order.status)} {getStatusLabel(order.status)}
            </span>
          </div>

          {/* Status Timeline */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-bold text-gray-800 mb-6">{t('order_progress') || '订单进度'}</h2>
            <div className="flex justify-between relative">
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />
              <div
                className="absolute top-5 left-0 h-0.5 bg-pink-500 transition-all"
                style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
              />
              {steps.map((step, index) => (
                <div key={step.key} className="flex flex-col items-center relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                      index <= currentStep ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {index < currentStep ? '✓' : getStatusIcon(step.key)}
                  </div>
                  <span className={`text-xs mt-2 ${index <= currentStep ? 'text-pink-500' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 发货信息区（当状态为 shipped 时显示） */}
          {order.status === 'shipped' && (order.shipped_image || order.shipped_link) && (
            <div className="bg-purple-50 rounded-2xl shadow-sm p-6 mb-6 border border-purple-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📦</span>
                <h2 className="font-bold text-purple-800">{t('order_shipped') || '商品已发货'}</h2>
              </div>
              <div className="space-y-3">
                {order.shipped_image && (
                  <div>
                    <p className="text-sm text-purple-600 mb-2">发货图片</p>
                    <img
                      src={order.shipped_image}
                      alt="发货图片"
                      className="w-full max-w-xs rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setLightboxSrc(order.shipped_image)}
                    />
                  </div>
                )}
                {order.shipped_link && (
                  <div className="flex items-center gap-2">
                    <span className="text-purple-500">🔗</span>
                    <a
                      href={order.shipped_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline font-medium"
                    >
                      {order.shipped_link}
                    </a>
                  </div>
                )}
              </div>
              {/* 确认收货按钮 */}
              <button
                onClick={handleConfirmDelivery}
                disabled={confirming}
                className="mt-4 w-full py-3 bg-purple-500 text-white font-bold rounded-xl hover:bg-purple-600 transition-colors disabled:opacity-50"
              >
                {confirming ? '确认中...' : '✓ 确认收货'}
              </button>
            </div>
          )}

          {/* 收货图片区（当状态为 delivered 时显示） */}
          {order.status === 'delivered' && order.delivered_image && (
            <div className="bg-green-50 rounded-2xl shadow-sm p-6 mb-6 border border-green-100">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">💐</span>
                <h2 className="font-bold text-green-800">买家秀 · 收货图片</h2>
              </div>
              <img
                src={order.delivered_image}
                alt="收货图片"
                className="w-full max-w-xs rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setLightboxSrc(order.delivered_image)}
              />
            </div>
          )}

          {/* Order Details */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">{t('order_details') || '订单详情'}</h2>

            {/* Items */}
            <div className="space-y-3 mb-6">
              {order.items?.map((item, index) => (
                <div key={index} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                  {item.image ? (
                    <div
                      className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-200 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer"
                      onClick={() => setLightboxSrc(getImageUrl(item.image))}
                    >
                      <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 bg-gradient-to-br from-pink-100 to-rose-200 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">🌸</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-500">
                      {item.flowers}朵 × {item.quantity}份
                      {item.price && <span className="ml-2">@฿{item.price}</span>}
                    </p>
                  </div>
                  <span className="font-bold text-pink-500">฿{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">{t('subtotal') || '商品总价'}</span>
                <span className="text-gray-800">฿{(order.total + order.discount).toFixed(0)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-green-500">
                  <span>{t('discount') || '优惠'}</span>
                  <span>-฿{order.discount.toFixed(0)}</span>
                </div>
              )}
              {order.coupon_code && (
                <div className="flex justify-between text-pink-500">
                  <span>{t('coupon') || '优惠券'}</span>
                  <span>{order.coupon_code}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-100">
                <span>{t('total') || '合计'}</span>
                <span className="text-pink-500">฿{order.total.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h2 className="font-bold text-gray-800 mb-4">{t('delivery_info') || '配送信息'}</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-gray-400">📍</span>
                <div>
                  <p className="text-gray-500">{t('delivery_address') || '配送地址'}</p>
                  <p className="font-medium text-gray-800">{order.address}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">📞</span>
                <div>
                  <p className="text-gray-500">{t('contact_phone') || '联系电话'}</p>
                  <p className="font-medium text-gray-800">{order.phone}</p>
                </div>
              </div>
              {order.note && (
                <div className="flex items-center gap-3">
                  <span className="text-gray-400">📝</span>
                  <div>
                    <p className="text-gray-500">{t('order_note') || '订单备注'}</p>
                    <p className="font-medium text-pink-600 bg-pink-50 p-2 rounded-lg mt-1">{order.note}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Time */}
          <div className="text-center text-sm text-gray-400">
            {t('order_created_at') || '下单时间'}：{new Date(order.created_at).toLocaleString('zh-CN')}
          </div>

          {/* 取消订单按钮（仅在可以取消的状态显示） */}
          {['pending', 'confirmed', 'in_progress', 'preparing'].includes(order.status) && !order.note?.includes('取消申请') && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setCancelReason('')
                  setShowCancelModal(true)
                }}
                className="w-full py-3 border border-red-300 text-red-500 rounded-xl hover:bg-red-50 transition-colors font-medium"
              >
                申请取消订单
              </button>
            </div>
          )}
        </div>
      </main>

      {/* 取消订单弹窗 */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">取消订单申请</h3>
            <p className="text-gray-500 text-sm mb-4">
              请输入取消原因，商家审核通过后将为您办理退款。
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="请输入取消原因..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleCancelRequest}
                disabled={cancelling}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {cancelling ? '提交中...' : '提交申请'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-3 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
