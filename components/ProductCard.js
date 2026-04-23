'use client'

import Link from 'next/link'
import { useCart } from '../context/CartContext'
import { useI18n } from '../context/I18nContext'

import { getImageUrl } from '../utils/image'

// 后端商品分类与翻译 key 的映射
const CATEGORY_MAP = {
  'bouquet': { id: 'bouquet', label: t('shop') },
  'rose': { id: 'rose', label: t('category_rose') },
  'tulip': { id: 'tulip', label: t('category_tulip') },
  'tropical': { id: 'tropical', label: 'Tropical' },
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart()
  const { t, lang } = useI18n()

  // 从 flower_options 获取最低价格
  const getMinPrice = () => {
    if (product.flower_options && product.flower_options.length > 0) {
      return Math.min(...product.flower_options.map(o => o.price))
    }
    return product.price || 0
  }

  // 获取描述（多语言）- 去除 HTML 标签
  const getDescription = () => {
    let desc = ''
    if (lang === 'th' && product.description_th) desc = product.description_th
    else if (lang === 'en' && product.description_en) desc = product.description_en
    else desc = product.description || ''
    // 去除 HTML 标签
    return desc.replace(/<[^>]+>/g, '').trim()
  }

  // 获取标签（优先 tags[0]，没有则用分类翻译）
  const getTag = () => {
    if (product.tags && product.tags.length > 0) {
      const firstTag = product.tags[0]
      // 如果 tag 匹配 CATEGORY_MAP，用翻译后的中文
      const mapped = CATEGORY_MAP[firstTag]
      return mapped ? mapped.label : firstTag
    }
    const mapped = CATEGORY_MAP[product.category]
    return mapped ? mapped.label : product.category || ''
  }

  // 获取图片（处理相对路径 /static/ -> 后端完整地址）
  const getImage = () => {
    if (product.images && product.images.length > 0) {
      return getImageUrl(product.images[0])
    }
    return null
  }

  // 默认emoji/颜色
  const getEmoji = () => product.emoji || '🌸'
  const getColor = () => product.color || 'from-pink-100 to-rose-200'

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    // 默认选第一个规格
    const defaultOption = product.flower_options && product.flower_options.length > 0
      ? product.flower_options[0]
      : { count: 11, price: product.price || 0 }
    addToCart(product, defaultOption.count, defaultOption.price)
  }

  const minPrice = getMinPrice()
  const hasDiscount = product.original_price && product.original_price > minPrice

  return (
    <Link href={`/product/${product.id}`}>
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className={`relative bg-gradient-to-br ${getColor()} h-48 overflow-hidden`}>
          {getImage() ? (
            <img
              src={getImage()}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-7xl">
              {getEmoji()}
            </div>
          )}
          {getTag() && (
            <span className="absolute top-3 left-3 px-2 py-1 bg-white/90 text-pink-500 text-xs font-medium rounded-full">
              {getTag()}
            </span>
          )}
          {product.stock === 0 && (
            <span className="absolute top-3 right-3 px-2 py-1 bg-gray-800 text-white text-xs font-medium rounded-full">
              缺货
            </span>
          )}
          {!product.active && (
            <span className="absolute top-3 right-3 px-2 py-1 bg-gray-800/70 text-white text-xs font-medium rounded-full">
              已下架
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-bold text-gray-800 text-lg mb-1">{product.name}</h3>
          <p className="text-gray-500 text-sm mb-2 line-clamp-1">{getDescription().substring(0, 30)}</p>

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-xl font-bold text-pink-500">฿{minPrice.toLocaleString()}</span>
            {hasDiscount && (
              <span className="text-gray-400 text-sm line-through">฿{product.original_price.toLocaleString()}</span>
            )}
          </div>

          {/* 多规格提示 - 有多个 flower_options 时显示按钮组 */}
          {product.flower_options && product.flower_options.length > 1 ? (
            <div className="flex flex-wrap gap-1 mb-2">
              {product.flower_options.slice(0, 3).map((opt, i) => (
                <span key={i} className="px-2 py-0.5 bg-pink-50 text-pink-600 text-xs rounded-full">
                  {opt.count}朵 ฿{opt.price}
                </span>
              ))}
              {product.flower_options.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                  +{product.flower_options.length - 3}更多
                </span>
              )}
            </div>
          ) : product.flower_options && product.flower_options.length === 1 ? (
            <p className="text-xs text-gray-400 mb-2">
              {product.flower_options[0].count} 朵 · 已选规格
            </p>
          ) : null}

          <div className="mt-auto">
            <button
              onClick={handleAddToCart}
              disabled={product.stock === 0 || !product.active}
              className="w-full py-2 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-pink-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {product.stock === 0 ? t('temp_out_of_stock') : !product.active ? t('discontinued') : t('add_to_cart')}
            </button>
          </div>
        </div>
      </div>
    </Link>
  )
}
