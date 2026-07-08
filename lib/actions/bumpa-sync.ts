'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { logAudit } from '@/lib/audit'
import type { BumpaRow } from '@/lib/bumpa-csv'

type Candidate = { id: string; name: string; price: number; cost_price: number | null; stock: number }

export type MatchedRow = {
  bumpaId: string
  productId: string
  name: string
  linkedByBumpaId: boolean
  currentPrice: number
  newPrice: number | null
  currentCost: number | null
  newCost: number | null
  currentStock: number
  newStock: number | null
}

export type AmbiguousRow = {
  bumpaId: string
  title: string
  candidates: Array<{ id: string; name: string }>
}

export type UnmatchedRow = {
  bumpaId: string
  title: string
}

function normalize(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

export async function matchBumpaRows(rows: BumpaRow[]): Promise<{
  matched: MatchedRow[]
  ambiguous: AmbiguousRow[]
  unmatched: UnmatchedRow[]
}> {
  const supabase = createAdminClient()
  const { data: products } = await supabase
    .from('products')
    .select('id, name, bumpa_id, price, cost_price, stock')

  const all = (products ?? []) as Array<Candidate & { bumpa_id: string | null }>

  const byBumpaId = new Map<string, Candidate & { bumpa_id: string | null }>()
  const byName = new Map<string, Array<Candidate & { bumpa_id: string | null }>>()
  for (const p of all) {
    if (p.bumpa_id) byBumpaId.set(p.bumpa_id, p)
    const key = normalize(p.name)
    const list = byName.get(key) ?? []
    list.push(p)
    byName.set(key, list)
  }

  const matched: MatchedRow[] = []
  const ambiguous: AmbiguousRow[] = []
  const unmatched: UnmatchedRow[] = []

  for (const row of rows) {
    const linked = byBumpaId.get(row.bumpaId)
    if (linked) {
      matched.push({
        bumpaId: row.bumpaId,
        productId: linked.id,
        name: linked.name,
        linkedByBumpaId: true,
        currentPrice: linked.price,
        newPrice: row.price,
        currentCost: linked.cost_price,
        newCost: row.cost,
        currentStock: linked.stock,
        newStock: row.stock,
      })
      continue
    }

    const candidates = (byName.get(normalize(row.title)) ?? []).filter(c => !c.bumpa_id)
    if (candidates.length === 1) {
      const c = candidates[0]
      matched.push({
        bumpaId: row.bumpaId,
        productId: c.id,
        name: c.name,
        linkedByBumpaId: false,
        currentPrice: c.price,
        newPrice: row.price,
        currentCost: c.cost_price,
        newCost: row.cost,
        currentStock: c.stock,
        newStock: row.stock,
      })
    } else if (candidates.length > 1) {
      ambiguous.push({
        bumpaId: row.bumpaId,
        title: row.title,
        candidates: candidates.map(c => ({ id: c.id, name: c.name })),
      })
    } else {
      unmatched.push({ bumpaId: row.bumpaId, title: row.title })
    }
  }

  return { matched, ambiguous, unmatched }
}

export async function applyBumpaSync(updates: Array<{
  productId: string
  bumpaId: string
  price: number | null
  cost_price: number | null
  stock: number | null
}>) {
  if (!updates.length) return { success: true as const, count: 0 }
  const supabase = createAdminClient()

  const results = await Promise.all(updates.map(u => {
    const payload: Record<string, unknown> = { bumpa_id: u.bumpaId }
    if (u.price !== null) payload.price = u.price
    if (u.cost_price !== null) payload.cost_price = u.cost_price
    if (u.stock !== null) payload.stock = u.stock
    return supabase.from('products').update(payload).eq('id', u.productId)
  }))

  const failed = results.find(r => r.error)
  if (failed?.error) return { error: failed.error.message }

  logAudit('product.bumpa_sync', 'product', 'bulk', { count: updates.length }).catch(() => {})
  revalidatePath('/admin/products')
  return { success: true as const, count: updates.length }
}
