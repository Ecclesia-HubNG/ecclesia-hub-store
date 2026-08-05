import { createAdminClient } from '@/lib/supabase/admin'

type StockItem = {
  productId: string
  quantity: number
  selectedVariants?: Array<{ groupName: string; value: string }> | null
}

type AdminSupabase = ReturnType<typeof createAdminClient>

// An order sitting in one of these hasn't had its inventory reserved yet.
// Moving OUT of one of these into a confirmed status is what should trigger
// a stock decrement; moving between confirmed statuses (paid -> processing
// -> shipped) must never decrement again.
const UNCONFIRMED_ORDER_STATUSES = ['pending', 'pending_verification', 'pending_bank_transfer']
const CONFIRMED_ORDER_STATUSES = ['paid', 'processing']

export function isStockConfirmingTransition(fromStatus: string, toStatus: string) {
  return UNCONFIRMED_ORDER_STATUSES.includes(fromStatus) && CONFIRMED_ORDER_STATUSES.includes(toStatus)
}

export function isConfirmedOrderStatus(status: string) {
  return CONFIRMED_ORDER_STATUSES.includes(status)
}

// Validates there's enough inventory for a cart — variant stock for items
// with a selected variant, otherwise the product's own stock count.
export async function validateStock(supabase: AdminSupabase, items: StockItem[]): Promise<string | null> {
  const productIds = Array.from(new Set(items.map(i => i.productId)))
  if (productIds.length === 0) return null
  const { data: products } = await supabase.from('products').select('id, name, stock, variants').in('id', productIds)

  for (const item of items) {
    const product = products?.find(p => p.id === item.productId)
    if (!product) continue

    if (item.selectedVariants?.length) {
      const productVariants = Array.isArray(product.variants) ? product.variants : []
      for (const sv of item.selectedVariants) {
        const group = productVariants.find((v: { name: string }) => v.name === sv.groupName)
        if (!group) continue
        const opt = (group.options ?? []).find((o: { value: string; stock?: number | null }) => o.value === sv.value)
        if (opt?.stock != null && opt.stock < item.quantity) {
          return opt.stock === 0
            ? `"${product.name} — ${sv.value}" is out of stock.`
            : `"${product.name} — ${sv.value}" only has ${opt.stock} left in stock.`
        }
      }
    } else if (product.stock < item.quantity) {
      return product.stock === 0
        ? `"${product.name}" is out of stock.`
        : `"${product.name}" only has ${product.stock} left in stock.`
    }
  }
  return null
}

// Decrements inventory for a confirmed order — variant stock for items with
// a selected variant, otherwise the product's own stock count.
export async function decrementStock(supabase: AdminSupabase, items: StockItem[]) {
  const productIds = Array.from(new Set(items.map(i => i.productId)))
  if (productIds.length === 0) return
  const { data: products } = await supabase.from('products').select('id, stock, variants').in('id', productIds)

  for (const item of items) {
    const product = products?.find(p => p.id === item.productId)
    if (!product) continue

    if (item.selectedVariants?.length) {
      type VOption = { value: string; stock?: number | null }
      type VGroup = { name: string; options: VOption[] }
      const productVariants: VGroup[] = Array.isArray(product.variants)
        ? (product.variants as VGroup[]).map(v => ({ ...v, options: [...v.options] }))
        : []
      let changed = false
      for (const sv of item.selectedVariants) {
        const gIdx = productVariants.findIndex(v => v.name === sv.groupName)
        if (gIdx === -1) continue
        const group: VGroup = { ...productVariants[gIdx], options: [...productVariants[gIdx].options] }
        const oIdx = group.options.findIndex(o => o.value === sv.value)
        if (oIdx === -1) continue
        const opt = { ...group.options[oIdx] }
        if (opt.stock != null) {
          opt.stock = Math.max(0, opt.stock - item.quantity)
          group.options[oIdx] = opt
          productVariants[gIdx] = group
          changed = true
        }
      }
      if (changed) await supabase.from('products').update({ variants: productVariants }).eq('id', product.id)
    } else {
      await supabase.from('products').update({ stock: Math.max(0, product.stock - item.quantity) }).eq('id', product.id)
    }
  }
}
