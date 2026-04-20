'use client'

import { useEffect } from 'react'

export default function Lightbox({ src, alt, onClose }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white text-3xl font-bold transition-colors"
        style={{ lineHeight: 1 }}
      >
        ×
      </button>
      {src && (
        <img
          src={src}
          alt={alt || '放大图片'}
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-zoom-out"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  )
}
