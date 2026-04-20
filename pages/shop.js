'use client'

import Head from 'next/head'
import { useState, useEffect } from 'react'
import Header from '../components/Header'
import ProductCard from '../components/ProductCard'
import { useI18n } from '../context/I18nContext'
import { getProducts, getCategories } from '../services/api'

export default function Shop() {
  const { t, lang } = useI18n()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [sort, setSort] = useState('default')
  const [priceRange, setPriceRange] = useState([0, 99999])
  const [total, setTotal] = useState(0)
  // 动态分类
  const [categoryList, setCategoryList] = useState([])

  // 加载分类（已按sort_order排序存储，仅显示前台使用的）
  const loadCategories = async () => {
    try {
      const cats = await getCategories()
      // 过滤前台显示的分类，并按 sort_order 排序后存储
      const filtered = (cats || []).filter(cat => cat.show_on_home !== false)
      const sorted = filtered.slice().sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))
      setCategoryList(sorted)
    } catch (err) {
      console.error('Failed to load categories:', err)
    }
  }

  // 根据当前语言获取分类名称
  const getCategoryLabel = (cat) => {
    if (lang === 'th') return cat.name_th
    if (lang === 'en') return cat.name_en
    return cat.name_zh
  }

  // 构建分类选项（all + 动态分类）
  const categoryOptions = [
    { id: 'all', label: t('all') || '全部' },
    ...categoryList.map(cat => ({ id: cat.slug, label: getCategoryLabel(cat) }))
  ]

  // 加载商品
  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = {
        page: 1,
        page_size: 100,
        active: true,  // 只获取上架商品
      }
      if (category !== 'all') params.category = category
      if (search) params.search = search

      const res = await getProducts(params)
      let items = res.items || []

      // 前端价格筛选（因为最低规格价格可能不同）
      if (priceRange[0] > 0 || priceRange[1] < 99999) {
        items = items.filter(p => {
          const minPrice = getMinPrice(p)
          return minPrice >= priceRange[0] && minPrice <= priceRange[1]
        })
      }

      // 前端排序
      if (sort === 'price_asc') {
        items.sort((a, b) => getMinPrice(a) - getMinPrice(b))
      } else if (sort === 'price_desc') {
        items.sort((a, b) => getMinPrice(b) - getMinPrice(a))
      } else if (sort === 'stock') {
        items.sort((a, b) => a.stock - b.stock)
      }

      setProducts(items)
      setTotal(res.total)
    } catch (err) {
      console.error('Failed to load products:', err)
      setError('加载商品失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCategories()
  }, [lang])

  useEffect(() => {
    loadProducts()
  }, [category])

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search || category) {
        loadProducts()
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  // 获取商品最低价格
  const getMinPrice = (product) => {
    if (product.flower_options && product.flower_options.length > 0) {
      return Math.min(...product.flower_options.map(o => o.price))
    }
    return product.price
  }

  const handleClear = () => {
    setSearch('')
    setCategory('all')
    setSort('default')
    setPriceRange([0, 99999])
  }

  // 分类墙 - 始终按 sort_order 排序渲染
  const sortedCategories = categoryList.slice().sort((a, b) => (a.sort_order ?? 99) - (b.sort_order ?? 99))

  return (
    <>
      <Head><title>{t('flower_selection')} - 遇见花语</title></Head>
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-16">
        <Header />

        {/* Hero */}
        <div className="bg-gradient-to-r from-pink-100 via-rose-50 to-pink-100 py-12 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">{t('flower_selection')}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto mb-8">{t('shop_subtitle')}</p>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadProducts()}
              placeholder={t('search_placeholder')}
              className="w-full max-w-md px-6 py-3 rounded-full border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Category Emoji Wall */}
          {sortedCategories.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {/* All Button */}
                <button
                  onClick={() => setCategory('all')}
                  className={`flex flex-col items-center justify-center rounded-2xl py-4 px-2 transition-all duration-200 ${
                    category === 'all'
                      ? 'bg-pink-500 text-white shadow-lg shadow-pink-200 scale-105'
                      : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-600 shadow-sm'
                  }`}
                >
                  <span className="text-2xl mb-1">🌸</span>
                  <span className="text-xs font-medium">{t('all') || '全部'}</span>
                </button>

                {/* Category Buttons */}
                {sortedCategories.map(cat => {
                  const isActive = category === cat.slug
                  const emoji = cat.emoji || '🌸'
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setCategory(cat.slug)}
                      className={`flex flex-col items-center justify-center rounded-2xl py-4 px-2 transition-all duration-200 ${
                        isActive
                          ? 'bg-pink-500 text-white shadow-lg shadow-pink-200 scale-105'
                          : 'bg-white text-gray-700 hover:bg-pink-50 hover:text-pink-600 shadow-sm'
                      }`}
                    >
                      <span className="text-2xl mb-1">{emoji}</span>
                      <span className="text-xs font-medium">{getCategoryLabel(cat)}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="flex flex-wrap items-center gap-4">
              {/* Category */}
              <div>
                <label className="text-sm text-gray-500 mb-2 block">{t('category')}</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-200 focus:border-pink-300 outline-none"
                >
                  {categoryOptions.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div>
                <label className="text-sm text-gray-500 mb-2 block">{t('sort')}</label>
                <select
                  value={sort}
                  onChange={e => { setSort(e.target.value); loadProducts() }}
                  className="px-4 py-2 rounded-lg border border-gray-200 focus:border-pink-300 outline-none"
                >
                  <option value="default">{t('default_sort')}</option>
                  <option value="price_asc">{t('price_asc')}</option>
                  <option value="price_desc">{t('price_desc')}</option>
                  <option value="stock">{t('low_stock_sort')}</option>
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="text-sm text-gray-500 mb-2 block">{t('price_range')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={priceRange[0]}
                    onChange={e => setPriceRange([Number(e.target.value), priceRange[1]])}
                    onBlur={loadProducts}
                    className="w-20 px-3 py-2 rounded-lg border border-gray-200 focus:border-pink-300 outline-none"
                    min="0"
                    placeholder="0"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    value={priceRange[1]}
                    onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                    onBlur={loadProducts}
                    className="w-20 px-3 py-2 rounded-lg border border-gray-200 focus:border-pink-300 outline-none"
                    min="0"
                    placeholder="99999"
                  />
                </div>
              </div>

              {/* Clear */}
              <button
                onClick={handleClear}
                className="px-4 py-2 text-pink-500 border border-pink-500 rounded-lg hover:bg-pink-50 transition-colors mt-5"
              >
                {t('clear_filters')}
              </button>
            </div>

            {/* Results count */}
            <p className="text-gray-500 text-sm mt-4">
              {loading ? '加载中...' : `${t('products_found', { count: products.length })}`}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm animate-pulse">
                  <div className="bg-gray-200 h-48"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-16 bg-white rounded-2xl">
              <span className="text-6xl block mb-4">😵</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{error}</h3>
              <button onClick={loadProducts} className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600">
                重试
              </button>
            </div>
          )}

          {/* Products Grid */}
          {!loading && !error && products.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && products.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl">
              <span className="text-6xl block mb-4">🔍</span>
              <h3 className="text-xl font-bold text-gray-800 mb-2">{t('no_products')}</h3>
              <p className="text-gray-500">{t('try_adjust')}</p>
              <button onClick={handleClear} className="mt-4 text-pink-500 hover:underline">
                {t('clear_filters')}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
