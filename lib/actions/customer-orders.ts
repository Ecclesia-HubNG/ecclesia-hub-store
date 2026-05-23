'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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
  const adminSupabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Stock validation ─────────────────────────────────────
  const productIds = Array.from(new Set(items.map(i => i.productId)))
  const { data: products } = await adminSupabase
    .from('products')
    .select('id, name, variants')
    .in('id', productIds)

  for (const item of items) {
    if (!item.selectedVariants?.length) continue

    const product = products?.find(p => p.id === item.productId)
    if (!product) continue

    const productVariants = Array.isArray(product.variants) ? product.variants : []

    for (const sv of item.selectedVariants) {
      const group = productVariants.find((v: { name: string }) => v.name === sv.groupName)
      if (!group) continue

      const opt = (group.options ?? []).find((o: { value: string; stock?: number | null }) => o.value === sv.value)
      if (opt?.stock != null && opt.stock < item.quantity) {
        const remaining = opt.stock
        return {
          error: remaining === 0
            ? `"${item.name} — ${sv.value}" is out of stock.`
            : `"${item.name} — ${sv.value}" only has ${remaining} left in stock.`,
        }
      }
    }
  }
  // ────────────────────────────────────────────────────────

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
        selectedVariants: i.selectedVariants ?? null,
      })),
      shipping_address: shipping,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

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
