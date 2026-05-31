'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type SelectedVariant = { groupName: string; value: string; price: number }

export type CartItem = {
  productId: string
  slug: string
  name: string
  price: number
  thumbnail: string | null
  quantity: number
  selectedVariants?: SelectedVariant[]
}

export type AppliedCoupon = {
  code: string
  description: string | null
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  discountAmount: number
}

type CartContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void
  removeItem: (key: string) => void
  updateQuantity: (key: string, quantity: number) => void
  clearCart: () => void
  total: number
  count: number
  coupon: AppliedCoupon | null
  applyCoupon: (c: AppliedCoupon) => void
  removeCoupon: () => void
}

export function itemKey(productId: string, variants?: SelectedVariant[]) {
  if (!variants || variants.length === 0) return productId
  const sorted = [...variants].sort((a, b) => a.groupName.localeCompare(b.groupName))
  return `${productId}__${sorted.map(v => `${v.groupName}:${v.value}`).join('__')}`
}

function migrateItem(raw: Record<string, unknown>): CartItem {
  if (raw.selectedVariant && !raw.selectedVariants) {
    const sv = raw.selectedVariant as { groupName: string; value: string }
    return {
      ...(raw as unknown as CartItem),
      selectedVariants: [{ groupName: sv.groupName, value: sv.value, price: 0 }],
      selectedVariant: undefined,
    } as CartItem
  }
  return raw as unknown as CartItem
}

const CartContext = createContext<CartContextType | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('ecclesia-cart')
      if (saved) setItems((JSON.parse(saved) as Record<string, unknown>[]).map(migrateItem))
      const savedCoupon = localStorage.getItem('ecclesia-coupon')
      if (savedCoupon) setCoupon(JSON.parse(savedCoupon))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    localStorage.setItem('ecclesia-cart', JSON.stringify(items))
  }, [items, ready])

  useEffect(() => {
    if (!ready) return
    if (coupon) localStorage.setItem('ecclesia-coupon', JSON.stringify(coupon))
    else localStorage.removeItem('ecclesia-coupon')
  }, [coupon, ready])

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const key = itemKey(item.productId, item.selectedVariants)
    setItems(prev => {
      const existing = prev.find(i => itemKey(i.productId, i.selectedVariants) === key)
      if (existing) {
        return prev.map(i =>
          itemKey(i.productId, i.selectedVariants) === key
            ? { ...i, quantity: i.quantity + (item.quantity ?? 1) }
            : i
        )
      }
      return [...prev, { ...item, quantity: item.quantity ?? 1 }]
    })
  }, [])

  const removeItem = useCallback((key: string) => {
    setItems(prev => prev.filter(i => itemKey(i.productId, i.selectedVariants) !== key))
  }, [])

  const updateQuantity = useCallback((key: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(key)
      return
    }
    setItems(prev =>
      prev.map(i => itemKey(i.productId, i.selectedVariants) === key ? { ...i, quantity } : i)
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
    setCoupon(null)
  }, [])

  const applyCoupon = useCallback((c: AppliedCoupon) => setCoupon(c), [])
  const removeCoupon = useCallback(() => setCoupon(null), [])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count, coupon, applyCoupon, removeCoupon }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
