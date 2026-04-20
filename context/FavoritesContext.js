'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const FavoritesContext = createContext()

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([])
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('flower_favorites')
      if (saved) {
        setFavorites(JSON.parse(saved))
      }
    } catch (e) {}
    setIsHydrated(true)
  }, [])

  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('flower_favorites', JSON.stringify(favorites))
      } catch (e) {}
    }
  }, [favorites, isHydrated])

  const addFavorite = (product) => {
    if (!favorites.find(f => f.id === product.id)) {
      setFavorites(prev => [...prev, { id: product.id, name: product.name, emoji: product.emoji, price: product.price, color: product.color, image: product.images?.[0] }])
    }
  }

  const removeFavorite = (id) => {
    setFavorites(prev => prev.filter(f => f.id !== id))
  }

  const isFavorite = (id) => {
    return favorites.some(f => f.id === id)
  }

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, isHydrated }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  return useContext(FavoritesContext)
}
