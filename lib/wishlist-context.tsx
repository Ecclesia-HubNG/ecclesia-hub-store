'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const STORAGE_KEY = 'ecclesia-wishlist'

type WishlistContextType = {
  items: string[]
  toggle: (productId: string) => void
  isInWishlist: (productId: string) => boolean
  count: number
  ready: boolean
}

const WishlistContext = createContext<WishlistContextType | null>(null)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = useRef(createClient()).current

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setReady(true)
  }, [])

  // Persist to localStorage whenever items change
  useEffect(() => {
    if (!ready) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items, ready])

  // Auth state — sync DB items and merge localStorage on login
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) { setUserId(user.id); syncFromDb(user.id) }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      const uid = session?.user?.id ?? null
      setUserId(uid)
      if (uid) syncFromDb(uid)
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function syncFromDb(uid: string) {
    const { data } = await supabase
      .from('wishlists')
      .select('product_id')
      .eq('user_id', uid)
    if (!data) return

    const dbIds = data.map((r: { product_id: string }) => r.product_id)

    // Read current localStorage items
    let localIds: string[] = []
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) localIds = JSON.parse(saved)
    } catch {}

    // Upload local-only items to DB
    const toUpload = localIds.filter(id => !dbIds.includes(id))
    if (toUpload.length > 0) {
      await supabase.from('wishlists').upsert(
        toUpload.map(product_id => ({ user_id: uid, product_id })),
        { onConflict: 'user_id,product_id' }
      )
    }

    // Merge DB + local into a single deduplicated list
    const merged = Array.from(new Set([...dbIds, ...localIds]))
    setItems(merged)
  }

  const toggle = useCallback((productId: string) => {
    setItems(prev => {
      const isIn = prev.includes(productId)
      const next = isIn ? prev.filter(id => id !== productId) : [...prev, productId]

      // Fire-and-forget DB sync — we already have the optimistic update above
      if (userId) {
        if (isIn) {
          supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', productId).then(() => {})
        } else {
          supabase.from('wishlists').upsert(
            { user_id: userId, product_id: productId },
            { onConflict: 'user_id,product_id' }
          ).then(() => {})
        }
      }

      return next
    })
  }, [userId, supabase])

  const isInWishlist = useCallback((productId: string) => items.includes(productId), [items])

  return (
    <WishlistContext.Provider value={{ items, toggle, isInWishlist, count: items.length, ready }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
