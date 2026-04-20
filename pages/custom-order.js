'use client'

import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Toast from '../components/Toast'
import { useI18n } from '../context/I18nContext'
import { createAppointment, uploadImages, getImageUrl } from '../services/api'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isAfter, startOfDay } from 'date-fns'
import { zhCN, th, enUS } from 'date-fns/locale'

const localeMap = { zh: zhCN, th, en: enUS }
const WEEKDAY_KEYS = { zh: ['一', '二', '三', '四', '五', '六', '日'], th: ['จ', 'อ', 'พ', 'ศ', 'ส', 'บ', 'อา'], en: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] }

function Calendar({ value, onChange, lang }) {
  const [open, setOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(value ? new Date(value + 'T00:00:00') : new Date())
  const ref = useRef(null)
  const today = startOfDay(new Date())

  const monthStart = startOfMonth(viewMonth)
  const monthEnd = endOfMonth(viewMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Pad start so Monday is first
  const startPad = (monthStart.getDay() + 6) % 7

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const monthLabel = () => {
    if (lang === 'th') {
      const TH_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']
      return `${TH_MONTHS[viewMonth.getMonth()]} ${viewMonth.getFullYear() + 543}`
    }
    if (lang === 'en') return format(viewMonth, 'MMMM yyyy')
    return format(viewMonth, 'yyyy年M月')
  }

  const weekdays = WEEKDAY_KEYS[lang] || WEEKDAY_KEYS.zh

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-left text-gray-700 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none flex items-center justify-between"
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>
          {value ? format(new Date(value + 'T00:00:00'), lang === 'en' ? 'MMM d, yyyy' : lang === 'th' ? 'd MMM yyyy' : 'yyyy年M月d日') : '—'}
        </span>
        <span className="text-gray-400">📅</span>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-3 w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => setViewMonth(m => subMonths(m, 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-pink-50 text-gray-600 transition-colors"
            >‹</button>
            <span className="text-sm font-medium text-gray-700">{monthLabel()}</span>
            <button
              type="button"
              onClick={() => setViewMonth(m => addMonths(m, 1))}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-pink-50 text-gray-600 transition-colors"
            >›</button>
          </div>
          {/* Weekday headers */}
          <div className="grid grid-cols-7 mb-1">
            {weekdays.map((d, i) => (
              <div key={i} className="text-center text-xs text-gray-400 py-1">{d}</div>
            ))}
          </div>
          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map(day => {
              const isPast = isAfter(startOfDay(new Date()), day)
              const isSelected = value && isSameDay(day, new Date(value + 'T00:00:00'))
              const isToday = isSameDay(day, today)
              const disabled = isPast
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  disabled={disabled}
                  onClick={() => { if (!disabled) { onChange(format(day, 'yyyy-MM-dd')); setOpen(false) } }}
                  className={`
                    w-8 h-8 rounded-full text-xs flex items-center justify-center transition-colors
                    ${disabled ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-pink-50 cursor-pointer'}
                    ${isSelected ? 'bg-pink-500 text-white hover:bg-pink-600 font-medium' : ''}
                    ${isToday && !isSelected ? 'border border-pink-300 text-pink-600' : ''}
                  `}
                >
                  {format(day, 'd')}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

const occasionTypes = [
  { id: 'proposal', label_key: 'proposal', icon: '💍', desc_key: 'proposal_desc' },
  { id: 'wedding', label_key: 'wedding', icon: '💒', desc_key: 'wedding_desc' },
  { id: 'birthday', label_key: 'birthday', icon: '🎂', desc_key: 'birthday_desc' },
  { id: 'anniversary', label_key: 'anniversary', icon: '💕', desc_key: 'anniversary_desc' },
  { id: 'business', label_key: 'business', icon: '🏢', desc_key: 'business_desc' },
  { id: 'other', label_key: 'other', icon: '🌸', desc_key: 'other_desc' },
]

const budgetRanges = [
  { min: 0, max: 500, label_key: 'budget_under_500' },
  { min: 500, max: 1000, label_key: 'budget_500_1000' },
  { min: 1000, max: 2000, label_key: 'budget_1000_2000' },
  { min: 2000, max: 5000, label_key: 'budget_2000_5000' },
  { min: 5000, max: null, label_key: 'budget_over_5000' },
]

export default function CustomOrder() {
  const { t, lang } = useI18n()
  const fileInputRef = useRef(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [images, setImages] = useState([])
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    occasion: '',
    deliveryDate: '',
    budget: '',
    address: '',
    requirements: '',
    cardMessage: '',
    packaging: '',
    callbackTime: 'any',
  })

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      const result = await uploadImages(files, (percent) => {
        setUploadProgress(percent)
      })

      const newImages = result.items.map((item, idx) => ({
        id: Date.now() + idx,
        name: item.filename,
        url: getImageUrl(item.url),
        size: (item.size / 1024 / 1024).toFixed(2),
        path: item.url,  // 存储相对路径
      }))

      setImages(prev => [...prev, ...newImages].slice(0, 5))
    } catch (error) {
      console.error('Upload failed:', error)
      alert(t('upload_failed'))
    } finally {
      setUploading(false)
      setUploadProgress(0)
      // 清空 file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.phone || !formData.occasion) {
      alert(t('fill_required'))
      return
    }

    setSubmitting(true)
    try {
      const result = await createAppointment({
        customer_name: formData.name,
        customer_phone: formData.phone,
        occasion: formData.occasion,
        budget: formData.budget,
        delivery_date: formData.deliveryDate,
        delivery_time: formData.deliveryTime,
        recipient_name: formData.recipientName,
        recipient_phone: formData.recipientPhone,
        delivery_address: formData.recipientAddress,
        // 传真实路径给后端，而不是 blob 预览 URL
        reference_images: images.map(img => img.path || img.url),
        requirements: formData.requirements,
        blessing_card: formData.cardMessage,
        packaging: formData.packaging,
        callback_time: formData.callbackTime,
      })

      setOrderId(result.appointment_no)
      setSubmitted(true)
    } catch (error) {
      console.error('Appointment creation failed:', error)
      alert(error.response?.data?.detail || t('submit_failed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <>
        <Head><title>{t('appointment_success')} - {t('shop_name')}</title></Head>
        <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
          <Header />
          <div className="max-w-xl mx-auto px-4 py-16 text-center">
            <div className="bg-white rounded-3xl shadow-sm p-12">
              <span className="text-8xl block mb-6">🎉</span>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">{t('appointment_success')}</h2>
              <p className="text-gray-600 mb-2">{t('appointment_received')}</p>
              <p className="text-lg mb-4">
                {t('appointment_id')}：<span className="font-bold text-pink-500">{orderId}</span>
              </p>
              <p className="text-gray-500 mb-8">
                {t('florist_contact')}<br/>
                {t('keep_phone_online')}：{formData.phone}
              </p>
              <div className="space-y-3">
                <Link href="/" className="block w-full py-3 bg-pink-500 text-white font-semibold rounded-xl hover:bg-pink-600 transition-colors">
                  {t('back_home')}
                </Link>
                <Link href="/shop" className="block w-full py-3 border border-pink-500 text-pink-500 font-semibold rounded-xl hover:bg-pink-50 transition-colors">
                  {t('continue_shopping')}
                </Link>
              </div>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Head><title>{t('custom_order')} - {t('shop_name')}</title></Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-16">
        <Header />

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">🌸 {t('custom_order')}</h1>
            <p className="text-gray-500">{t('custom_order_desc')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>👤</span> {t('contact_info')}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('your_name')} <span className="text-red-500">*</span>
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('phone_number')} <span className="text-red-500">*</span>
                  </label>
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
            </div>

            {/* Occasion Type */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🎯</span> {t('occasion_type')} <span className="text-red-500">*</span>
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {occasionTypes.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({...formData, occasion: item.id})}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      formData.occasion === item.id
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-200'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{item.icon}</span>
                    <span className="font-medium text-gray-800">{t(item.label_key)}</span>
                    <p className="text-xs text-gray-500 mt-1">{t(item.desc_key)}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Delivery Info */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>🚚</span> {t('delivery_info2')}
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('expected_date')}
                  </label>
                  <div className="relative">
                    <Calendar
                      value={formData.deliveryDate}
                      onChange={date => setFormData({...formData, deliveryDate: date})}
                      lang={lang}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('budget_range')}
                  </label>
                  <select
                    value={formData.budget}
                    onChange={e => setFormData({...formData, budget: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 outline-none"
                  >
                    <option value="">{t('select_budget')}</option>
                    {budgetRanges.map(range => (
                      <option key={range.label_key} value={`${range.min}-${range.max || '∞'}`}>
                        {t(range.label_key)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('delivery_address2')}
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder={t('enter_full_address')}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📷</span> {t('reference_images')}
                <span className="text-sm font-normal text-gray-500">（{t('optional')}）</span>
              </h2>

              {/* Uploaded Images */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                  {images.map(img => (
                    <div key={img.id} className="relative group">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ✕
                      </button>
                      <span className="absolute bottom-0 left-0 right-0 text-xs text-white bg-black/50 px-1 truncate">
                        {img.size}MB
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              {images.length < 5 && (
                <label className={`flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                  uploading ? 'border-pink-300 bg-pink-50' : 'border-gray-300 hover:border-pink-400 hover:bg-pink-50'
                }`}>
                  {uploading ? (
                    <>
                      <span className="text-3xl mb-2 animate-pulse">⏳</span>
                      <span className="text-sm text-gray-500">{t('uploading')}</span>
                      {uploadProgress > 0 && (
                        <div className="w-32 h-2 bg-gray-200 rounded-full mt-2">
                          <div
                            className="h-full bg-pink-500 rounded-full transition-all"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="text-3xl mb-2">📤</span>
                      <span className="text-sm text-gray-500">{t('click_to_upload')}</span>
                      <span className="text-xs text-gray-400">{t('max_5_images')}</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Requirements */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📝</span> {t('requirements')}
                <span className="text-sm font-normal text-gray-500">（{t('optional')}）</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('describe_requirements')}
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={e => setFormData({...formData, requirements: e.target.value})}
                    placeholder={t('requirements_placeholder')}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('blessing_card')}
                  </label>
                  <textarea
                    value={formData.cardMessage}
                    onChange={e => setFormData({...formData, cardMessage: e.target.value})}
                    placeholder={t('blessing_placeholder2')}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('packaging_preference')}
                  </label>
                  <input
                    type="text"
                    value={formData.packaging}
                    onChange={e => setFormData({...formData, packaging: e.target.value})}
                    placeholder={t('packaging_placeholder')}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Callback Time */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span>📞</span> {t('callback_preference')}
              </h2>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: 'any', label_key: 'anytime' },
                  { id: 'morning', label_key: 'morning' },
                  { id: 'afternoon', label_key: 'afternoon' },
                  { id: 'evening', label_key: 'evening' },
                ].map(time => (
                  <button
                    key={time.id}
                    type="button"
                    onClick={() => setFormData({...formData, callbackTime: time.id})}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      formData.callbackTime === time.id
                        ? 'bg-pink-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-pink-100'
                    }`}
                  >
                    {t(time.label_key)}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <div className="bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl p-6 text-white">
              <div className="text-center mb-4">
                <p className="text-pink-100 text-sm">{t('consultation_tip')}</p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-white text-pink-500 font-bold rounded-xl hover:bg-pink-50 transition-colors text-lg disabled:opacity-50"
              >
                {submitting ? t('processing') + '...' : t('submit_order')}
              </button>
              <p className="text-center text-pink-100 text-xs mt-3">
                {t('privacy_notice')}
              </p>
            </div>
          </form>
        </div>
      </main>
    </>
  )
}
