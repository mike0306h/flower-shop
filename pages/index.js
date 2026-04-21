'use client'

import Head from 'next/head'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import Header from '../components/Header'
import ProductCard from '../components/ProductCard'
import { useI18n } from '../context/I18nContext'
import { getProducts, getCategories, submitContact, getShopInfo } from '../services/api'

const shuffleArray = (array, seed = 42) => {
  const arr = [...array]
  let m = arr.length
  let s = seed
  while (m) {
    s = (s * 16807) % 2147483647
    const i = Math.floor((s / 2147483647) * m--)
    ;[arr[m], arr[i]] = [arr[i], arr[m]]
  }
  return arr
}

export default function Home() {
  const { t, lang } = useI18n()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [categoryCounts, setCategoryCounts] = useState({})
  const [contactForm, setContactForm] = useState({ name: '', phone: '', message: '' })
  const [contactSent, setContactSent] = useState(false)
  const [shopInfo, setShopInfo] = useState(null)

  // 获取分类名称（多语言）
  const getCategoryLabel = (cat) => {
    if (lang === 'th') return cat.name_th
    if (lang === 'en') return cat.name_en
    return cat.name_zh
  }

  // 加载分类和每个分类的商品数量
  const loadCategories = async () => {
    try {
      const cats = await getCategories()
      const sorted = (cats || []).slice().sort((a, b) => (a.sort_order || 99) - (b.sort_order || 99))
      setCategories(sorted)

      // 并行获取每个分类的商品数量
      const countPromises = cats.map(async (cat) => {
        try {
          const res = await getProducts({ category: cat.slug, active: true, page_size: 1 })
          return { slug: cat.slug, count: res.total || 0 }
        } catch {
          return { slug: cat.slug, count: 0 }
        }
      })
      const counts = await Promise.all(countPromises)
      const countMap = {}
      counts.forEach(c => { countMap[c.slug] = c.count })
      setCategoryCounts(countMap)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  // 加载商品（全部，取前8个随机展示）
  const loadProducts = async () => {
    try {
      const res = await getProducts({ active: true, page_size: 20 })
      const shuffled = shuffleArray(res.items || [], Date.now() % 1000)
      setProducts(shuffled.slice(0, 8))
    } catch (err) {
      console.error('Failed to load products:', err)
    }
  }

  // 根据语言返回地址
  const getShopAddress = () => {
    if (!shopInfo) return ''
    if (lang === 'th') return shopInfo.address_th
    if (lang === 'en') return shopInfo.address_en
    return shopInfo.address_zh
  }

  // 根据语言返回营业时间
  const getShopHours = () => {
    if (!shopInfo) return ''
    if (lang === 'th') return shopInfo.hours_th
    if (lang === 'en') return shopInfo.hours_en
    return shopInfo.hours_zh
  }

  // 完整图片URL
  const getImageUrl = (path) => {
    if (!path) return ''
    if (path.startsWith('http')) return path
    return `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3457'}${path}`
  }

  useEffect(() => {
    loadCategories()
    loadProducts()
    getShopInfo().then(setShopInfo).catch(console.error)
  }, [])

  const handleContactSubmit = async (e) => {
    e.preventDefault()
    if (!contactForm.name || !contactForm.phone) {
      alert('请填写姓名和电话')
      return
    }
    try {
      await submitContact(contactForm)
      setContactSent(true)
      setContactForm({ name: '', phone: '', message: '' })
      setTimeout(() => setContactSent(false), 3000)
    } catch (error) {
      console.error('Failed to submit contact:', error)
      alert('提交失败，请稍后重试')
    }
  }

  const features = [
    { emoji: '🚚', title: t('fast_delivery'), desc: t('delivery_desc') },
    { emoji: '💐', title: t('fresh_guarantee'), desc: t('fresh_desc') },
    { emoji: '💝', title: t('free_card'), desc: t('card_desc') },
  ]

  return (
    <>
      <Head>
        <title>🌸 {shopInfo?.shop_name || '花店'} - Floral Shop</title>
        <meta name="description" content={shopInfo?.seo_description || '专业花店，提供鲜花定制、生日花束、婚礼花艺等服务'} />
        {shopInfo?.seo_keywords && <meta name="keywords" content={shopInfo.seo_keywords} />}
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <Header />

        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-100 via-rose-50 to-pink-100 opacity-70" />
          <div className="relative max-w-7xl mx-auto text-center">
            <p className="text-pink-500 font-medium mb-4 tracking-widest uppercase">{t('hero_subtitle')}</p>
            <h2 className="text-5xl md:text-7xl font-bold text-gray-800 mb-6">
              {t('hero_title')}<br />
              <span className="bg-gradient-to-r from-pink-500 via-rose-500 to-pink-500 bg-clip-text text-transparent">
                {t('hero_title2')}
              </span>
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">
              {t('hero_desc')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a href="/shop" className="px-8 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold rounded-full hover:shadow-lg hover:shadow-pink-200 transition-all transform hover:-translate-y-1">
                {t('shop_now')}
              </a>
              <Link href="/custom-order" className="px-8 py-4 border-2 border-pink-500 text-pink-500 font-semibold rounded-full hover:bg-pink-50 transition-colors">
                {t('book_custom')}
              </Link>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-pink-500 font-medium mb-2">{t('categories')}</p>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-800">{t('categories')}</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories
                .filter(cat => cat.show_on_home !== false)
                .slice()
                .sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
                .map((cat) => (
                <a key={cat.id} href={`/shop?category=${cat.slug}`} className="block">
                  <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 p-6 text-center hover:shadow-xl hover:shadow-pink-100 transition-all duration-300 transform hover:-translate-y-2">
                    <span className="text-5xl block mb-3">{cat.emoji || '🌸'}</span>
                    <h4 className="font-bold text-gray-800 mb-1">{getCategoryLabel(cat)}</h4>
                    <p className="text-sm text-gray-500">{categoryCounts[cat.slug] || 0} {t('items')}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-pink-500 font-medium mb-2">{t('best_sellers')}</p>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-800">{t('best_sellers')}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="text-center mt-8">
              <a href="/shop" className="inline-block px-8 py-3 border-2 border-pink-500 text-pink-500 font-semibold rounded-full hover:bg-pink-500 hover:text-white transition-colors">
                {t('view_all')}
              </a>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4 bg-gradient-to-b from-white to-pink-50">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-4 p-6 bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <span className="text-4xl">{f.emoji}</span>
                  <div>
                    <h4 className="font-bold text-gray-800">{f.title}</h4>
                    <p className="text-sm text-gray-500">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-pink-500 font-medium mb-2">{t('about_us')}</p>
                <h3 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">{t('about_us')}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{t('about_p1')}</p>
                <p className="text-gray-600 mb-6 leading-relaxed">{t('about_p2')}</p>
                <div className="flex gap-8">
                  <div>
                    <p className="text-3xl font-bold text-pink-500">8+</p>
                    <p className="text-sm text-gray-500">{t('years_exp')}</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-pink-500">50K+</p>
                    <p className="text-sm text-gray-500">{t('happy_customers')}</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-pink-500">99%</p>
                    <p className="text-sm text-gray-500">{t('reviews')}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-pink-200 to-rose-300 rounded-2xl h-48 flex items-center justify-center text-8xl">🌸</div>
                <div className="bg-gradient-to-br from-amber-100 to-yellow-200 rounded-2xl h-48 mt-8 flex items-center justify-center text-8xl">🌷</div>
                <div className="bg-gradient-to-br from-purple-200 to-pink-200 rounded-2xl h-48 flex items-center justify-center text-8xl">💐</div>
                <div className="bg-gradient-to-br from-rose-200 to-pink-300 rounded-2xl h-48 mt-8 flex items-center justify-center text-8xl">🌹</div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="py-16 px-4 bg-gradient-to-b from-pink-50 to-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-pink-500 font-medium mb-2">{t('contact_us')}</p>
              <h3 className="text-3xl md:text-4xl font-bold text-gray-800">{t('contact_us')}</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                  <span className="text-2xl">📍</span>
                  <div>
                    <p className="font-medium text-gray-800">{t('address')}</p>
                    <p className="text-gray-500">{getShopAddress() || t('address_detail')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="font-medium text-gray-800">{t('phone')}</p>
                    <p className="text-gray-500">{shopInfo?.phone || t('phone_num')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                  <span className="text-2xl">⏰</span>
                  <div>
                    <p className="font-medium text-gray-800">{t('hours')}</p>
                    <p className="text-gray-500">{getShopHours() || t('hours_detail')}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white p-8 rounded-2xl shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4">{t('leave_message')}</h4>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <input
                    type="text"
                    placeholder={t('your_name')}
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                  />
                  <input
                    type="tel"
                    placeholder={t('your_phone')}
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({...contactForm, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all"
                  />
                  <textarea
                    placeholder={t('message_content')}
                    rows="4"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none transition-all resize-none"
                  />
                  <button
                    type="submit"
                    className={`w-full py-3 font-semibold rounded-xl transition-all ${
                      contactSent
                        ? 'bg-green-500 text-white'
                        : 'bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:shadow-lg hover:shadow-pink-200'
                    }`}
                  >
                    {contactSent ? '✓ 留言已发送！' : t('submit_message')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* Brand */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🌸</span>
                  <span className="font-bold text-xl">{t('shop_name')}</span>
                </div>
                <p className="text-gray-400 text-sm">{t('footer_desc')}</p>
              </div>

              {/* Quick Links */}
              <div>
                <h5 className="font-medium mb-4">{t('quick_links')}</h5>
                <ul className="space-y-2 text-gray-400 text-sm">
                  <li><a href="/#about" className="hover:text-pink-400 transition-colors">{t('about')}</a></li>
                  <li><a href="/shop" className="hover:text-pink-400 transition-colors">{t('shop')}</a></li>
                  <li><a href="#" className="hover:text-pink-400 transition-colors">{t('latest_promo')}</a></li>
                  <li><Link href="/help#delivery" className="hover:text-pink-400 transition-colors">{t('shipping_info')}</Link></li>
                  <li><Link href="/help#refund" className="hover:text-pink-400 transition-colors">{t('return_policy')}</Link></li>
                </ul>
              </div>

              {/* Contact / Shop Info */}
              <div>
                <h5 className="font-medium mb-4">{t('contact_us')}</h5>
                <div className="space-y-3 text-gray-400 text-sm">
                  {shopInfo?.phone && (
                    <div className="flex items-start gap-2">
                      <span>📞</span>
                      <a href={`tel:${shopInfo.phone}`} className="hover:text-pink-400 transition-colors">{shopInfo.phone}</a>
                    </div>
                  )}
                  {getShopAddress() && (
                    <div className="flex items-start gap-2">
                      <span>📍</span>
                      <span>{getShopAddress()}</span>
                    </div>
                  )}
                  {getShopHours() && (
                    <div className="flex items-start gap-2">
                      <span>🕐</span>
                      <span>{getShopHours()}</span>
                    </div>
                  )}
                  {shopInfo?.line_qr_image && (
                    <div className="flex items-start gap-2 mt-3">
                      <img
                        src={getImageUrl(shopInfo.line_qr_image)}
                        alt="Line"
                        className="w-20 h-20 object-contain bg-white rounded-lg"
                      />
                      <div className="text-xs text-gray-400 pt-1 leading-relaxed">
                        <p className="font-medium text-white mb-0.5">{t('line_qr_title') || '添加我们'}</p>
                        <p>{t('line_qr_desc') || '扫描二维码添加好友'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
              <p>© {new Date().getFullYear()} {t('shop_name')} Floral Shop. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </main>
    </>
  )
}
