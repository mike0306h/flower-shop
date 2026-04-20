'use client'

import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Toast from '../components/Toast'
import { useCart } from '../context/CartContext'
import { useI18n } from '../context/I18nContext'
import { getImageUrl } from '../utils/image'

export default function Cart() {
  const { t } = useI18n()
  const { cart, updateQuantity, removeFromCart, clearCart, subtotal, deliveryFee, total } = useCart()

  return (
    <>
      <Head><title>{t('shopping_cart')} - 遇见花语</title></Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-16">
        <Header />

        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">{t('shopping_cart')}</h2>

          {cart.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl">
              <span className="text-8xl block mb-4">🛒</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('cart_empty')}</h3>
              <p className="text-gray-500 mb-6">{t('go_shopping')}</p>
              <Link href="/shop" className="inline-block px-6 py-3 bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition-colors">
                {t('go_choose')}
              </Link>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
                {cart.map((item) => (
                  <div key={item.key} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0 hover:bg-pink-50/50 transition-colors">
                    <Link href={`/product/${item.productId}`}>
                      <div className={`bg-gradient-to-br from-pink-100 to-rose-200 w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden`}>
                        {item.image ? (
                          <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl">🌸</span>
                        )}
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.productId}`}>
                        <h4 className="font-bold text-gray-800 hover:text-pink-500 cursor-pointer">{item.name}</h4>
                      </Link>
                      <p className="text-sm text-pink-500 font-medium">
                        {item.flowerCount}朵 · ฿{item.price}/朵
                      </p>
                      <p className="text-lg font-bold text-pink-500 mt-1">
                        ฿{(item.price * item.qty).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.key, -1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 flex items-center justify-center text-gray-600 hover:text-pink-500 transition-colors"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold">{item.qty}</span>
                      <button
                        onClick={() => updateQuantity(item.key, 1)}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-pink-100 flex items-center justify-center text-gray-600 hover:text-pink-500 transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <div className="text-right min-w-[60px]">
                      <button
                        onClick={() => removeFromCart(item.key)}
                        className="text-sm text-gray-400 hover:text-red-500 transition-colors mt-1"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="bg-white rounded-2xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-600">
                    {t('total_items', { count: cart.reduce((sum, i) => sum + i.qty, 0) })}
                    <span className="text-gray-400 ml-2">
                      （共 {cart.reduce((sum, i) => sum + i.flowerCount * i.qty, 0)} 朵）
                    </span>
                  </span>
                  <button onClick={clearCart} className="text-sm text-gray-400 hover:text-red-500 transition-colors">
                    {t('clear_cart')}
                  </button>
                </div>
                <div className="border-t border-gray-100 pt-4 mb-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">{t('subtotal_price')}</span>
                    <span className="font-medium">฿{subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-600">{t('delivery_fee')}</span>
                    <span className={deliveryFee === 0 ? 'text-green-500 font-medium' : ''}>
                      {deliveryFee === 0 ? t('free_delivery') : `฿${deliveryFee}`}
                    </span>
                  </div>
                  {deliveryFee > 0 && (
                    <p className="text-sm text-gray-400 mb-2">满฿200免运费，还差฿{200 - subtotal}</p>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <span className="text-xl font-bold text-gray-800">{t('total_amount')}</span>
                    <div>
                      <span className="text-3xl font-bold text-pink-500">฿{total.toLocaleString()}</span>
                      {deliveryFee > 0 && <span className="text-sm text-gray-400 ml-2">（{t('delivery_fee')} ฿{deliveryFee}）</span>}
                    </div>
                  </div>
                </div>
                <Link href="/checkout">
                  <button className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-200 transition-all text-lg">
                    {t('checkout')}
                  </button>
                </Link>
                <Link href="/shop" className="block text-center mt-4 text-pink-500 hover:underline">
                  {t('continue_shopping')}
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
