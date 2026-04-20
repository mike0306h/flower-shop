'use client'

import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Header from '../../components/Header'
import Toast from '../../components/Toast'
import { getImageUrl } from '../../utils/image'
import Lightbox from '../../components/Lightbox'
import { useCart } from '../../context/CartContext'
import { useFavorites } from '../../context/FavoritesContext'
import { useI18n } from '../../context/I18nContext'
import { useAuth } from '../../context/AuthContext'
import { getProduct, getProductReviews, createReview } from '../../services/api'

export default function ProductDetail() {
  const router = useRouter()
  const { id } = router.query
  const { t, lang } = useI18n()
  const { addToCart } = useCart()
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()
  const { isLoggedIn } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeImg, setActiveImg] = useState(0)
  const [lightboxSrc, setLightboxSrc] = useState(null)

  // 选中的规格（来自 flower_options）
  const [selectedOption, setSelectedOption] = useState(null)

  // 评价相关状态
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewStats, setReviewStats] = useState({ avg_rating: 0, total: 0, distribution: {} })
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [reviewSuccess, setReviewSuccess] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchProduct = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getProduct(id)
        if (!data) throw new Error('商品不存在')
        setProduct(data)

        // 默认选中第一个规格
        if (data.flower_options && data.flower_options.length > 0) {
          setSelectedOption(data.flower_options[0])
        } else {
          setSelectedOption({ count: 11, price: data.price || 0 })
        }
      } catch (err) {
        console.error('Failed to load product:', err)
        setError(err.message || '加载失败')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  // 加载评价
  const loadReviews = async () => {
    if (!id) return
    setReviewsLoading(true)
    try {
      const res = await getProductReviews(id)
      setReviews(res.items || [])
      setReviewStats({
        avg_rating: res.avg_rating || 0,
        total: res.total || 0,
        distribution: res.rating_distribution || {}
      })
    } catch (err) {
      console.error('Failed to load reviews:', err)
    } finally {
      setReviewsLoading(false)
    }
  }

  useEffect(() => {
    if (id) loadReviews()
  }, [id])

  // 提交评价
  const handleSubmitReview = async (e) => {
    e.preventDefault()
    if (!reviewComment.trim()) {
      alert('请输入评价内容')
      return
    }
    setSubmittingReview(true)
    try {
      await createReview({
        product_id: parseInt(id),
        rating: reviewRating,
        comment: reviewComment,
        images: []
      })
      setReviewSuccess(true)
      setShowReviewForm(false)
      setReviewComment('')
      setReviewRating(5)
      loadReviews()
      setTimeout(() => setReviewSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to submit review:', err)
      alert(err?.response?.data?.detail || '提交评价失败，请稍后重试')
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4 animate-pulse">🌸</span>
          <p className="text-gray-500">{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <div className="text-center">
          <span className="text-6xl block mb-4">🌸</span>
          <p className="text-gray-500">{error || '商品不存在'}</p>
          <Link href="/shop" className="text-pink-500 hover:underline mt-4 inline-block">返回商店</Link>
        </div>
      </div>
    )
  }

  const finalPrice = selectedOption ? selectedOption.price : (product.price || 0)
  const favorited = isFavorite(product.id)

  const handleAddToCart = () => {
    if (!selectedOption) return
    addToCart(product, selectedOption.count, selectedOption.price)
  }

  const handleBuyNow = () => {
    if (!selectedOption) return
    addToCart(product, selectedOption.count, selectedOption.price)
    router.push('/checkout')
  }

  const handleToggleFavorite = () => {
    if (favorited) {
      removeFavorite(product.id)
    } else {
      addFavorite(product)
    }
  }

  // 多语言描述（去除 HTML 标签）
  const getDescription = () => {
    let desc = ''
    if (lang === 'th' && product.description_th) desc = product.description_th
    else if (lang === 'en' && product.description_en) desc = product.description_en
    else desc = product.description || ''
    return desc.replace(/<[^>]+>/g, '').trim()
  }

  const CATEGORY_MAP = {
    'bouquet': { id: 'bouquet', label: '花束' },
    'rose': { id: 'rose', label: '玫瑰' },
    'tulip': { id: 'tulip', label: '郁金香' },
    'tropical': { id: 'tropical', label: 'Tropical' },
  }

  // 商品标签（多语言翻译）
  const getTags = () => {
    if (product.tags && product.tags.length > 0) {
      return product.tags.map(tag => {
        const mapped = CATEGORY_MAP[tag]
        return mapped ? mapped.label : tag
      }).join(' · ')
    }
    const mapped = CATEGORY_MAP[product.category]
    return mapped ? mapped.label : product.category || ''
  }

  // 库存状态
  const getStockLabel = () => {
    if (product.stock === 0) return t('out_of_stock2') || '缺货'
    if (product.stock <= 10) return `${product.stock} ${t('items_unit') || '件'} left`
    return t('in_stock') || 'In Stock'
  }

  const getStockClass = () => {
    if (product.stock === 0) return 'bg-red-500'
    if (product.stock <= 10) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  // 图片列表（处理相对路径 -> 后端完整地址）
  const images = product.images && product.images.length > 0
    ? product.images.map(img => getImageUrl(img))
    : []

  return (
    <>
      {lightboxSrc && (
        <Lightbox src={lightboxSrc} alt={product?.name} onClose={() => setLightboxSrc(null)} />
      )}
      <Head>
        <title>{product?.name} - 遇见花语</title>
      </Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-16">
        <Header />

        {/* Breadcrumb */}
        <div className="max-w-6xl mx-auto px-4 py-4">
          <nav className="text-sm text-gray-500">
            <Link href="/" className="hover:text-pink-500">{t('home')}</Link>
            <span className="mx-2">/</span>
            <Link href="/shop" className="hover:text-pink-500">{t('shop')}</Link>
            <span className="mx-2">/</span>
            <span className="text-pink-500">{product.name}</span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 p-8">
              {/* Image */}
              <div>
                <div className="bg-gradient-to-br from-pink-100 to-rose-200 rounded-2xl h-96 overflow-hidden relative">
                  {images.length > 0 ? (
                    <img
                      src={images[activeImg]}
                      alt={product.name}
                      className="w-full h-full object-cover cursor-zoom-in"
                      onClick={() => setLightboxSrc(images[activeImg])}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-8xl">🌸</span>
                    </div>
                  )}
                  {/* Favorite Button */}
                  <button
                    onClick={handleToggleFavorite}
                    className="absolute top-4 right-4 w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
                  >
                    <span className={`text-2xl ${favorited ? 'text-red-500' : 'text-gray-400'}`}>
                      {favorited ? '♥' : '♡'}
                    </span>
                  </button>
                </div>
                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 mt-4">
                    {images.slice(0, 4).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`w-20 h-20 rounded-lg bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center overflow-hidden border-2 transition-all ${
                          activeImg === i ? 'border-pink-500' : 'border-transparent'
                        }`}
                      >
                        <img src={img} alt={`${product?.name} thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Info */}
              <div>
                {getTags() && (
                  <span className="inline-block px-3 py-1 bg-pink-100 text-pink-600 text-sm font-medium rounded-full mb-4">
                    {getTags()}
                  </span>
                )}
                <h1 className="text-4xl font-bold text-gray-800 mb-4">{product.name}</h1>
                <p className="text-gray-600 mb-6 leading-relaxed">{getDescription()}</p>

                {/* 价格 */}
                <div className="bg-pink-50 rounded-xl p-4 mb-6">
                  {selectedOption ? (
                    <>
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-4xl font-bold text-pink-500">฿{selectedOption.price.toLocaleString()}</span>
                        {product.original_price && product.original_price > selectedOption.price && (
                          <span className="text-xl text-gray-400 line-through">฿{product.original_price.toLocaleString()}</span>
                        )}
                      </div>
                      <p className="text-sm text-pink-600">
                        {selectedOption.count} 朵 · 已选规格
                      </p>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-bold text-pink-500">฿{(product.price || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* 库存 */}
                <div className="flex items-center gap-2 mb-6">
                  <span className={`w-3 h-3 rounded-full ${getStockClass()}`}></span>
                  <span className="text-gray-600">{getStockLabel()}</span>
                </div>

                {/* 规格选择 */}
                {product.flower_options && product.flower_options.length > 0 && (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <p className="font-medium text-gray-700">选择规格</p>
                      <span className="text-2xl font-bold text-pink-500">
                        {selectedOption ? `${selectedOption.count} 朵` : ''}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {product.flower_options.map((opt, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedOption(opt)}
                          className={`py-3 px-4 rounded-xl text-center font-medium transition-all ${
                            selectedOption === opt
                              ? 'bg-pink-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-700 hover:bg-pink-100'
                          }`}
                        >
                          <div className="text-lg font-bold">{opt.count} 朵</div>
                          <div className={`text-sm ${selectedOption === opt ? 'text-pink-100' : 'text-gray-500'}`}>
                            ฿{opt.price.toLocaleString()}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-pink-200 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {product.stock > 0 ? t('add_to_cart') : t('out_of_stock')}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    disabled={product.stock === 0}
                    className="flex-1 py-4 bg-gradient-to-r from-gray-800 to-gray-900 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-gray-200 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t('buy_now')}
                  </button>
                </div>

                {/* Service Icons */}
                <div className="flex items-center justify-center gap-8 mt-6 text-sm text-gray-500">
                  <span>🚚 {t('delivery_fast')}</span>
                  <span>💐 {t('fresh_guarantee2')}</span>
                  <span>💝 {t('free_card2')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products placeholder */}
          <div className="mt-12">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">{t('you_may_like')}</h3>
            <p className="text-gray-400">相关商品推荐</p>
          </div>

          {/* 商品评价区域 */}
          <div className="mt-12">
            <div className="bg-white rounded-2xl shadow-sm p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">商品评价</h3>
                  <p className="text-gray-500 text-sm mt-1">查看其他用户的真实评价</p>
                </div>
                {!showReviewForm && isLoggedIn && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="px-5 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors font-medium"
                  >
                    写评价
                  </button>
                )}
                {!isLoggedIn && (
                  <Link href="/login" className="px-5 py-2 border border-pink-500 text-pink-500 rounded-xl hover:bg-pink-50 transition-colors font-medium">
                    登录后写评价
                  </Link>
                )}
              </div>

              {/* 评价表单 */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="bg-pink-50 rounded-xl p-6 mb-6">
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">评分</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className={`text-3xl transition-colors ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 font-medium mb-2">评价内容</label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="分享您的购买体验..."
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none resize-none"
                      rows={4}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors font-medium disabled:opacity-50"
                    >
                      {submittingReview ? '提交中...' : '提交评价'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReviewForm(false)
                        setReviewComment('')
                        setReviewRating(5)
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 transition-colors font-medium"
                    >
                      取消
                    </button>
                  </div>
                </form>
              )}

              {/* 评分统计 */}
              {reviewStats.total > 0 && (
                <div className="flex items-center gap-8 mb-6 pb-6 border-b border-gray-100">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-pink-500">{reviewStats.avg_rating}</div>
                    <div className="text-yellow-400 text-xl mt-1">
                      {'★'.repeat(Math.round(reviewStats.avg_rating))}
                      <span className="text-gray-300">{'★'.repeat(5 - Math.round(reviewStats.avg_rating))}</span>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">{reviewStats.total} 条评价</p>
                  </div>
                  <div className="flex-1">
                    {[5, 4, 3, 2, 1].map(star => {
                      const count = reviewStats.distribution[star] || 0
                      const percent = reviewStats.total > 0 ? (count / reviewStats.total * 100) : 0
                      return (
                        <div key={star} className="flex items-center gap-2 mb-1">
                          <span className="text-sm text-gray-600 w-8">{star}星</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-yellow-400 h-2 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-8">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* 评价列表 */}
              {reviewsLoading ? (
                <div className="text-center py-8 text-gray-500">加载评价中...</div>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review.id} className="border-b border-gray-100 pb-6 last:border-0">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-lg">
                          {review.user_avatar || review.user_name?.charAt(0) || '👤'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-800">{review.user_name || '匿名用户'}</span>
                            <div className="text-yellow-400 text-sm">
                              {'★'.repeat(review.rating)}
                              <span className="text-gray-300">{'★'.repeat(5 - review.rating)}</span>
                            </div>
                            {review.is_verified && (
                              <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">已购买</span>
                            )}
                          </div>
                          <p className="text-gray-600 mt-2">{review.comment}</p>
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {review.images.map((img, i) => (
                                <img key={i} src={img} alt="评价图片" className="w-20 h-20 object-cover rounded-lg" />
                              ))}
                            </div>
                          )}
                          <p className="text-gray-400 text-xs mt-2">
                            {new Date(review.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <span className="text-6xl block mb-4">💐</span>
                  <p className="text-gray-500">暂无评价，成为第一个评价的人吧！</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 评价成功提示 */}
      {reviewSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          ✓ 评价提交成功，感谢您的反馈！
        </div>
      )}
    </>
  )
}
