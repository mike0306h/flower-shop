'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Toast from '../components/Toast'
import Lightbox from '../components/Lightbox'
import { useCart } from '../context/CartContext'
import { useI18n } from '../context/I18nContext'
import { useAuth } from '../context/AuthContext'
import { useFavorites } from '../context/FavoritesContext'
import { getUserOrders, changePassword as apiChangePassword, getPoints } from '../services/api'
import { getImageUrl } from '../utils/image'

export default function Profile() {
  const { t } = useI18n()
  const { user, isLoggedIn, logout, updateUserData } = useAuth()
  const { addToCart } = useCart()
  const { favorites, removeFavorite } = useFavorites()
  const [activeTab, setActiveTab] = useState('orders')
  const [lightboxSrc, setLightboxSrc] = useState(null)

  // 订单数据
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersPage, setOrdersPage] = useState(1)
  const [ordersTotal, setOrdersTotal] = useState(0)

  // 会员数据
  const [memberData, setMemberData] = useState({ points: 0, level: 'normal', total_spent: 0 })

  // 修改密码
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)

  // 加载订单
  const loadOrders = async (page = 1) => {
    if (!isLoggedIn) return
    setOrdersLoading(true)
    try {
      const data = await getUserOrders(page, 10)
      setOrders(page === 1 ? data.items : [...orders, ...data.items])
      setOrdersTotal(data.total)
      setOrdersPage(page)
    } catch (e) {
      console.error('Failed to load orders:', e)
    }
    setOrdersLoading(false)
  }

  // 加载会员数据
  const loadMemberData = async () => {
    if (!isLoggedIn) return
    try {
      const data = await getPoints()
      setMemberData(data)
    } catch (e) {
      console.error('Failed to load member data:', e)
    }
  }

  useEffect(() => {
    if (isLoggedIn) {
      loadOrders()
      loadMemberData()
    }
  }, [isLoggedIn])

  const getLevelIcon = (level) => {
    const icons = { normal: '🌸', silver: '🪙', gold: '🥇', diamond: '💎' }
    return icons[level] || '🌸'
  }

  const getLevelName = (level) => {
    const names = { normal: t('member_normal'), silver: t('member_silver'), gold: t('member_gold'), diamond: t('member_diamond') }
    return names[level] || t('member')
  }

  const getStatusLabel = (status) => {
    const map = {
      completed: t('order_completed'),
      delivered: t('order_delivered'),
      shipped: t('order_shipped'),
      preparing: t('order_preparing'),
      confirmed: t('order_confirmed'),
      pending: t('order_pending'),
      cancelled: t('order_cancelled'),
    }
    return map[status] || status
  }

  const getStatusClass = (status) => {
    const map = {
      completed: 'bg-green-100 text-green-600',
      delivered: 'bg-green-100 text-green-600',
      shipped: 'bg-blue-100 text-blue-600',
      preparing: 'bg-orange-100 text-orange-600',
      confirmed: 'bg-blue-100 text-blue-600',
      pending: 'bg-yellow-100 text-yellow-600',
      cancelled: 'bg-red-100 text-red-600',
    }
    return map[status] || 'bg-gray-100 text-gray-600'
  }

  const handleChangePassword = async () => {
    setPasswordError('')
    if (passwordForm.new_password.length < 6) {
      setPasswordError(t('password_too_short'))
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm) {
      setPasswordError(t('password_mismatch'))
      return
    }
    setPasswordLoading(true)
    try {
      await apiChangePassword(passwordForm.old_password, passwordForm.new_password)
      setPasswordSuccess(true)
      setPasswordForm({ old_password: '', new_password: '', confirm: '' })
      setTimeout(() => {
        setShowPasswordModal(false)
        setPasswordSuccess(false)
      }, 2000)
    } catch (e) {
      setPasswordError(e.response?.data?.detail || t('password_change_failed'))
    }
    setPasswordLoading(false)
  }

  if (!isLoggedIn) {
    return (
      <>
        <Head><title>{t('profile')} - {t('shop_name')}</title></Head>
        <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
          <div className="text-center">
            <span className="text-8xl block mb-6">🔐</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('please_login')}</h2>
            <p className="text-gray-500 mb-6">{t('profile_login_desc') || '登录后可查看订单和收藏'}</p>
            <Link href="/login" className="inline-block px-6 py-3 bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition-colors">
              {t('login')}
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} alt={t("enlarge_image")} || "放大图片" onClose={() => setLightboxSrc(null)} />
      )}
      <Head><title>{t('profile')} - {t('shop_name')}</title></Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-16">
        <Header />

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* User Header */}
          <div className="bg-white rounded-3xl shadow-sm p-8 mb-6">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-200 to-rose-300 rounded-full flex items-center justify-center text-4xl">
                {user?.avatar || '👤'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{user?.name || t('member')}</h2>
                <p className="text-gray-500">{getLevelIcon(memberData.level)} {getLevelName(memberData.level)}</p>
                <div className="flex gap-4 mt-2 text-sm">
                  <span className="text-pink-500">🌸 {t('points')}: {memberData.points}</span>
                  <span className="text-gray-400">|</span>
                  <span className="text-gray-500">{t('total_spent')}: ฿{memberData.total_spent.toFixed(0)}</span>
                </div>
              </div>
              <button onClick={logout} className="ml-auto text-gray-400 hover:text-red-500 transition-colors text-sm">
                {t('logout')}
              </button>
            </div>

            {/* 等级进度 */}
            {memberData.next_level && (
              <div className="mt-4 p-4 bg-pink-50 rounded-xl">
                <div className="flex justify-between text-sm mb-2">
                  <span>{getLevelIcon(memberData.level)} {getLevelName(memberData.level)}</span>
                  <span>{getLevelIcon(memberData.next_level.level)} {memberData.next_level.name}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-pink-400 to-rose-500 h-2 rounded-full transition-all"
                    style={{ width: `${memberData.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t("spend_more_to_upgrade") || "再"}消费 ฿{(memberData.next_level.threshold - memberData.total_spent).toFixed(0)} 升级到 {memberData.next_level.name}
                </p>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-sm mb-6">
            <div className="flex border-b border-gray-100">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-4 text-center font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-pink-500 border-b-2 border-pink-500'
                      : 'text-gray-500 hover:text-pink-400'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {t(tab.label_key)}
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* Orders Tab */}
              {activeTab === 'orders' && (
                <div>
                  {ordersLoading && orders.length === 0 ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
                          <div className="space-y-2">
                            <div className="h-16 bg-gray-100 rounded" />
                            <div className="h-12 bg-gray-100 rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-6xl block mb-4">📋</span>
                      <p className="text-gray-500 mb-4">{t('no_orders')}</p>
                      <Link href="/shop" className="text-pink-500 hover:underline">{t('go_explore')}</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map(order => (
                        <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-sm text-gray-500 font-mono">{order.order_no}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(order.created_at).toLocaleDateString(lang === 'th' ? 'th-TH' : lang === 'en' ? 'en-US' : 'zh-CN')}
                            </span>
                            <Link
                              href={`/order-tracking?orderId=${order.order_no}`}
                              className="text-sm text-pink-500 hover:underline"
                            >
                              {t('track_order')} →
                            </Link>
                          </div>
                          <div className="space-y-2 mb-3">
                            {order.items?.map((item, i) => (
                              <div key={i} className="flex items-center gap-3">
                                {item.image ? (
                                  <div
                                    className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-200 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                                    onClick={() => setLightboxSrc(getImageUrl(item.image))}
                                  >
                                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-rose-200 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-2xl">🌸</span>
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-gray-500">x{item.quantity || 1} {item.flowers ? `${item.flowers}朵` : ''}</p>
                                </div>
                                <span className="font-medium text-pink-500">฿{((item.price || 0) * (item.quantity || 1)).toLocaleString()}</span>
                              </div>
                            ))}
                          </div>

                          {/* 发货信息（shipped 状态） */}
                          {order.status === 'shipped' && (order.shipped_image || order.shipped_link) && (
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 mb-3">
                              <p className="text-xs text-purple-600 mb-2 font-medium">{t("order_shipped_desc") || "商品已发货"}</p>
                              {order.shipped_image && (
                                <img
                                  src={order.shipped_image}
                                  alt={t("shipping_image")} || "发货图片"
                                  className="w-full rounded-lg cursor-pointer hover:opacity-90"
                                  onClick={() => setLightboxSrc(order.shipped_image)}
                                />
                              )}
                              {order.shipped_link && (
                                <a
                                  href={order.shipped_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block mt-2 text-xs text-purple-600 hover:underline truncate"
                                >
                                  🔗 {order.shipped_link}
                                </a>
                              )}
                            </div>
                          )}

                          {/* 收货图片（delivered 状态） */}
                          {order.status === 'delivered' && order.delivered_image && (
                            <div className="p-3 bg-green-50 rounded-xl border border-green-100 mb-3">
                              <p className="text-xs text-green-600 mb-2 font-medium">{t("delivery_photo") || "收货图片"}</p>
                              <img
                                src={order.delivered_image}
                                alt={t("delivery_image")} || "收货图片"
                                className="w-full rounded-lg cursor-pointer hover:opacity-90"
                                onClick={() => setLightboxSrc(order.delivered_image)}
                              />
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                            <span className={`px-3 py-1 rounded-full text-sm ${getStatusClass(order.status)}`}>
                              {getStatusLabel(order.status)}
                            </span>
                            <div className="flex items-center gap-4">
                              <span className="font-bold text-lg text-pink-600">฿{order.total.toFixed(0)}</span>
                              {order.status === 'delivered' && (
                                <button
                                  onClick={() => {
                                    const item = order.items?.[0]
                                    if (item) {
                                      addToCart({ id: item.product_id, name: item.name, price: item.price }, item.flowers || 11, item.price)
                                    }
                                  }}
                                  className="px-4 py-1 border border-pink-500 text-pink-500 rounded-full text-sm hover:bg-pink-50"
                                >
                                  {t('buy_again')}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {orders.length < ordersTotal && (
                        <button
                          onClick={() => loadOrders(ordersPage + 1)}
                          className="w-full py-3 text-pink-500 border border-pink-200 rounded-xl hover:bg-pink-50"
                        >
                          {t('load_more')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Favorites Tab */}
              {activeTab === 'favorites' && (
                <div>
                  {favorites.length === 0 ? (
                    <div className="text-center py-12">
                      <span className="text-6xl block mb-4">♥</span>
                      <p className="text-gray-500 mb-4">{t('no_favorites')}</p>
                      <Link href="/shop" className="text-pink-500 hover:underline">{t('go_explore')}</Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {favorites.map(item => (
                        <div key={item.id} className="border border-gray-100 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                          <Link href={`/product/${item.id}`}>
                            <div className={`bg-gradient-to-br ${item.color || 'from-pink-100 to-rose-100'} h-36 flex items-center justify-center relative`}>
                              {item.image ? (
                                <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-6xl">{item.emoji}</span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  removeFavorite(item.id)
                                }}
                                className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center text-red-500 hover:bg-white transition-colors"
                              >
                                ♥
                              </button>
                            </div>
                            <div className="p-4">
                              <h4 className="font-bold text-gray-800">{item.name}</h4>
                              <p className="text-pink-500 font-bold">฿{item.price}/{t('items_unit')}</p>
                            </div>
                          </Link>
                          <div className="px-4 pb-4">
                            <button
                              onClick={() => addToCart(item)}
                              className="w-full py-2 bg-pink-500 text-white rounded-lg text-sm font-medium hover:bg-pink-600 transition-colors"
                            >
                              {t('add_to_cart')}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Settings Tab */}
              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <Link
                    href="/address-book"
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">📍</span>
                      <div>
                        <p className="font-medium">{t('address_book')}</p>
                        <p className="text-sm text-gray-500">{t('address_desc')}</p>
                      </div>
                    </div>
                    <span className="text-gray-400">›</span>
                  </Link>

                  <div
                    onClick={() => setShowPasswordModal(true)}
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">🔑</span>
                      <div>
                        <p className="font-medium">{t('change_password')}</p>
                        <p className="text-sm text-gray-500">{t('change_password_desc')}</p>
                      </div>
                    </div>
                    <span className="text-gray-400">›</span>
                  </div>

                  <Link
                    href="/help"
                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl">❓</span>
                      <div>
                        <p className="font-medium">{t('help_center')}</p>
                        <p className="text-sm text-gray-500">{t('help_desc')}</p>
                      </div>
                    </div>
                    <span className="text-gray-400">›</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 修改密码 Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold mb-4">{t('change_password')}</h3>

              {passwordSuccess ? (
                <div className="text-center py-8">
                  <span className="text-6xl block mb-4">✅</span>
                  <p className="text-green-600 font-medium">{t('password_changed')}</p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('old_password')}</label>
                      <input
                        type="password"
                        value={passwordForm.old_password}
                        onChange={e => setPasswordForm({ ...passwordForm, old_password: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('new_password')}</label>
                      <input
                        type="password"
                        value={passwordForm.new_password}
                        onChange={e => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{t('confirm_password')}</label>
                      <input
                        type="password"
                        value={passwordForm.confirm}
                        onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
                      />
                    </div>
                  </div>

                  {passwordError && (
                    <p className="text-red-500 text-sm mt-2">{passwordError}</p>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => { setShowPasswordModal(false); setPasswordError(''); setPasswordForm({ old_password: '', new_password: '', confirm: '' }) }}
                      className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      onClick={handleChangePassword}
                      disabled={passwordLoading}
                      className="flex-1 py-3 bg-pink-500 text-white rounded-xl hover:bg-pink-600 disabled:opacity-50"
                    >
                      {passwordLoading ? t('loading') : t('confirm')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  )
}

const tabs = [
  { id: 'orders', label_key: 'my_orders', icon: '📋' },
  { id: 'favorites', label_key: 'my_favorites', icon: '♥' },
  { id: 'settings', label_key: 'settings', icon: '⚙️' },
]
