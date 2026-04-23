'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext()

export function CartProvider({ children }) {
  const [cart, setCart] = useState([])
  const [toast, setToast] = useState(null)
  const [isHydrated, setIsHydrated] = useState(false)

  // 购物车商品件数（份数，不是花朵数）
  const cartCount = cart.reduce((sum, item) => sum + (item.qty || 1), 0)

  // 从 localStorage 恢复购物车
  useEffect(() => {
    try {
      const saved = localStorage.getItem('flower_cart')
      if (saved) {
        setCart(JSON.parse(saved))
      }
    } catch (e) {
      console.log('Failed to load cart')
    }
    setIsHydrated(true)
  }, [])

  // 保存到 localStorage
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem('flower_cart', JSON.stringify(cart))
      } catch (e) {
        console.log('Failed to save cart')
      }
    }
  }, [cart, isHydrated])

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  /**
   * 添加商品到购物车
   * @param {object} product - 商品对象（来自后端 API，包含 flower_options）
   * @param {number} flowerCount - 选择的朵数（如 11, 52）
   * @param {number} price - 该规格的单价（从 flower_options 中获取）
   */
  const addToCart = (product, flowerCount, price) => {
    setCart(prev => {
      // 使用 product.id + flowerCount 作为唯一标识
      const key = `${product.id}-${flowerCount}`
      const existing = prev.find(item => item.key === key)

      if (existing) {
        showToast(`已增加 1 份「${product.name}」${flowerCount}朵`, 'success')
        return prev.map(item =>
          item.key === key
            ? { ...item, qty: item.qty + 1 }
            : item
        )
      }

      const image = product.images?.[0] || ''
      showToast(`已添加「${product.name}」${flowerCount}朵 到购物车`, 'success')
      return [...prev, {
        key,
        productId: product.id,
        name: product.name,
        image,
        flowerCount,
        price,  // 该规格的单价
        qty: 1, // 份数
        product, // 保存完整商品对象，方便后续使用
      }]
    })
  }

  const updateQuantity = (key, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.key === key) {
          const newQty = item.qty + delta
          return newQty > 0 ? { ...item, qty: newQty } : item
        }
        return item
      }).filter(item => item.qty > 0)
    })
  }

  const removeFromCart = (key) => {
    setCart(prev => {
      const item = prev.find(i => i.key === key)
      if (item) {
        showToast(`已删除「${item.name}」`, 'info')
      }
      return prev.filter(i => i.key !== key)
    })
  }

  const clearCart = () => {
    setCart([])
    showToast('Cart cleared', 'info')
  }

  /**
   * 计算小计：每件商品的 规格单价 × 份数 之和
   */
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0)

  /**
   * 配送费：满฿200免运费，否则฿20
   */
  const deliveryFee = subtotal >= 200 ? 0 : 20

  /**
   * 总计
   */
  const total = subtotal + deliveryFee

  return (
    <CartContext.Provider value={{
      cart, cartCount, addToCart, updateQuantity, removeFromCart, clearCart,
      subtotal, deliveryFee, total, toast, showToast, isHydrated
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  return useContext(CartContext)
}
