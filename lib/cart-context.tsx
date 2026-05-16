'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type CartItem = {
  productId: string
  slug: string
  name: string
  price: number
  thumbnail: string | null
  quantity: number
  selectedVariant?: { groupName: string; value: string }
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
  total: number
  count: number
}

export function itemKey(productId: string, variant?: { groupName: string; value: string }) {
  return variant ? `${productId}__${variant.groupName}__${variant.value}` : productId
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ecclesia-cart')
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem('ecclesia-cart', JSON.stringify(items))
  }, [items, ready])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const key = itemKey(item.productId, item.selectedVariant)
    setItems(prev => {
      const existing = prev.find(i => itemKey(i.productId, i.selectedVariant) === key)
      if (existing) {
        return prev.map(i =>
          itemKey(i.productId, i.selectedVariant) === key
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i
        )
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }]
    })
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems(prev => prev.filter(i => itemKey(i.productId, i.selectedVariant) !== key))
  }, [])

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(key)
      return
    }
    setItems(prev =>
      prev.map(i => itemKey(i.productId, i.selectedVariant) === key ? { ...i, quantity } : i)
    )
  }, [removeItem])

  const clearCart = useCallback(() => setItems([]), [])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
