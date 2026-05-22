'use server'

import { createClient } from '@/lib/supabase/server'
import type { CartItem } from '@/lib/cart-context'

export type ShippingAddress = {
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
}

export async function createOrder(items: CartItem[], shipping: ShippingAddress, total: number, shippingFee = 0) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_id: user?.id ?? null,
      status: 'pending',
      total,
      shipping_fee: shippingFee,
      items: items.map(i => ({
        productId: i.productId,
        slug: i.slug,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        thumbnail: i.thumbnail,
        selectedVariant: i.selectedVariant ?? null,
      })),
      shipping_address: shipping,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Email is sent after payment is confirmed — see lib/actions/paystack.ts
  return { orderId: order.id }
}

export async function getOrder(id: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data
}

export async function getMyOrders() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('orders')
    .select('id, status, total, items, created_at')
    .eq('customer_id', user.id)
    .order('created_at', { ascending: false })

  return data ?? []
}
