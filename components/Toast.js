'use client'

import { useCart } from '../context/CartContext'

export default function Toast() {
  const { toast } = useCart()

  if (!toast) return null

  return (
    <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-lg text-white font-medium transition-all animate-fade-in-down ${
      toast.type === 'success' ? 'bg-pink-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-gray-700'
    }`}>
      {toast.message}
      <style jsx>{`
        @keyframes fade-in-down {
          from { opacity: 0; transform: translate(-50%, -20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out; }
      `}</style>
    </div>
  )
}
