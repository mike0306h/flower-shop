'use client'

import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Header from '../components/Header'
import Toast from '../components/Toast'
import { useI18n } from '../context/I18nContext'
import { useAuth } from '../context/AuthContext'
import { useAddress } from '../context/AddressContext'

export default function AddressBook() {
  const { t } = useI18n()
  const { isLoggedIn } = useAuth()
  const { addresses, defaultAddress, addAddress, updateAddress, removeAddress, setAsDefault } = useAddress()

  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    fullAddress: '',
  })

  if (!isLoggedIn) {
    return (
      <>
        <Head><title>{t('address_book')} - 遇见花语</title></Head>
        <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
          <div className="text-center">
            <span className="text-8xl block mb-6">🔐</span>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{t('please_login')}</h2>
            <Link href="/login" className="inline-block px-6 py-3 bg-pink-500 text-white font-semibold rounded-full">
              {t('login')}
            </Link>
          </div>
        </main>
      </>
    )
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData({ name: '', phone: '', fullAddress: '' })
    setShowModal(true)
  }

  const openEditModal = (addr) => {
    setEditingId(addr.id)
    setFormData({
      name: addr.name,
      phone: addr.phone,
      fullAddress: addr.fullAddress || addr.address || '',
    })
    setShowModal(true)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (editingId) {
      updateAddress(editingId, {
        name: formData.name,
        phone: formData.phone,
        fullAddress: formData.fullAddress,
        province: '',
        city: '',
        district: '',
        address: formData.fullAddress,
      })
    } else {
      addAddress({
        name: formData.name,
        phone: formData.phone,
        fullAddress: formData.fullAddress,
        province: '',
        city: '',
        district: '',
        address: formData.fullAddress,
      })
    }
    setShowModal(false)
  }

  const handleDelete = (id) => {
    if (confirm(t('delete_address') + '?')) {
      removeAddress(id)
    }
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-pink-300 focus:ring-2 focus:ring-pink-100 outline-none"

  return (
    <>
      <Head><title>{t('address_book')} - 遇见花语</title></Head>
      <Toast />
      <main className="min-h-screen bg-gradient-to-b from-pink-50 to-white pb-16">
        <Header />

        <div className="max-w-2xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/profile" className="p-2 hover:bg-pink-100 rounded-full transition-colors">
              <span className="text-xl">←</span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">{t('address_book')}</h1>
            <button
              onClick={openAddModal}
              className="ml-auto px-4 py-2 bg-pink-500 text-white text-sm font-medium rounded-full hover:bg-pink-600 transition-colors"
            >
              + {t('add_address')}
            </button>
          </div>

          {/* Address List */}
          {addresses.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
              <span className="text-6xl block mb-4">📍</span>
              <p className="text-gray-500 mb-4">{t('no_address')}</p>
              <button
                onClick={openAddModal}
                className="px-6 py-3 bg-pink-500 text-white font-semibold rounded-full hover:bg-pink-600 transition-colors"
              >
                + {t('add_address')}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  className={`bg-white rounded-2xl shadow-sm p-6 ${
                    defaultAddress?.id === addr.id ? 'ring-2 ring-pink-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-lg">{addr.name}</span>
                        <span className="text-gray-600">{addr.phone}</span>
                        {defaultAddress?.id === addr.id && (
                          <span className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full">
                            {t('default_address')}
                          </span>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm">{addr.fullAddress || addr.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex gap-4">
                      {defaultAddress?.id !== addr.id && (
                        <button
                          onClick={() => setAsDefault(addr.id)}
                          className="text-sm text-gray-500 hover:text-pink-500 transition-colors"
                        >
                          ☐ {t('set_as_default')}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => openEditModal(addr)}
                        className="text-sm text-gray-500 hover:text-pink-500 transition-colors"
                      >
                        ✏️ {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDelete(addr.id)}
                        className="text-sm text-gray-500 hover:text-red-500 transition-colors"
                      >
                        🗑️ {t('delete')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">
                    {editingId ? t('edit_address') : t('add_address')}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('recipient')}</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('enter_recipient')}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('phone_number')}</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={t('enter_phone')}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('detailed_address')}</label>
                  <textarea
                    required
                    rows="3"
                    value={formData.fullAddress}
                    onChange={e => setFormData({ ...formData, fullAddress: e.target.value })}
                    placeholder={t('enter_full_address')}
                    className={inputClass + " resize-none"}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 py-3 border border-gray-300 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-pink-500 text-white font-medium rounded-xl hover:bg-pink-600 transition-colors"
                  >
                    {t('save')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </>
  )
}
