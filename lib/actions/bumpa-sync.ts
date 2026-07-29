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

export type PossibleDuplicateRow = {
  bumpaId: string
  title: string
  closestMatch: { id: string; name: string }
  similarity: number
  row: BumpaRow
}

export type NewProductRow = {
  bumpaId: string
  row: BumpaRow
}

function normalize(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, ' ')
}

function tokenize(name: string): Set<string> {
  return new Set(normalize(name).split(' ').filter(Boolean))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let intersection = 0
  a.forEach(t => { if (b.has(t)) intersection++ })
  const union = a.size + b.size - intersection
  return union === 0 ? 0 : intersection / union
}

// Above this word-overlap threshold, a "not found" row is treated as a
// likely rename/variant of an existing product and held for manual review
// instead of being auto-created as a new, possibly-duplicate listing.
const DUPLICATE_SIMILARITY_THRESHOLD = 0.5

export async function matchBumpaRows(rows: BumpaRow[]): Promise<{
  matched: MatchedRow[]
  ambiguous: AmbiguousRow[]
  possibleDuplicates: PossibleDuplicateRow[]
  newProducts: NewProductRow[]
  error?: string
}> {
  const supabase = createAdminClient({ noStore: true })
  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, bumpa_id, price, cost_price, stock')

  // Surface DB errors explicitly — without this, a failed query (e.g. a
  // missing column) silently produces an empty product list, which makes
  // every row look "not found" instead of showing the real problem.
  if (error) return { matched: [], ambiguous: [], possibleDuplicates: [], newProducts: [], error: error.message }

  const all = (products ?? []) as Array<Candidate & { bumpa_id: string | null }>

  const byBumpaId = new Map<string, Candidate & { bumpa_id: string | null }>()
  const byName = new Map<string, Array<Candidate & { bumpa_id: string | null }>>()
  const tokensById = new Map<string, Set<string>>()
  for (const p of all) {
    if (p.bumpa_id) byBumpaId.set(p.bumpa_id, p)
    const key = normalize(p.name)
    const list = byName.get(key) ?? []
    list.push(p)
    byName.set(key, list)
    tokensById.set(p.id, tokenize(p.name))
  }

  const matched: MatchedRow[] = []
  const ambiguous: AmbiguousRow[] = []
  const possibleDuplicates: PossibleDuplicateRow[] = []
  const newProducts: NewProductRow[] = []

  // Bumpa exports can repeat the same Product ID across multiple rows (e.g.
  // per-location stock breakdowns even on "product" row type). Keep only the
  // first occurrence so every bumpaId is processed once — otherwise two
  // "new" rows sharing an id would both attempt to insert with the same
  // bumpa_id and violate the unique constraint on that column.
  const seenBumpaIds = new Set<string>()
  const dedupedRows = rows.filter(row => {
    if (seenBumpaIds.has(row.bumpaId)) return false
    seenBumpaIds.add(row.bumpaId)
    return true
  })

  for (const row of dedupedRows) {
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
      // No exact name match — check word-overlap against every existing
      // product before concluding it's genuinely new, so a renamed/variant
      // product doesn't get created as a duplicate.
      const rowTokens = tokenize(row.title)
      let best: { p: Candidate; score: number } | null = null
      for (const p of all) {
        const score = jaccard(rowTokens, tokensById.get(p.id)!)
        if (!best || score > best.score) best = { p, score }
      }

      if (best && best.score >= DUPLICATE_SIMILARITY_THRESHOLD) {
        possibleDuplicates.push({
          bumpaId: row.bumpaId,
          title: row.title,
          closestMatch: { id: best.p.id, name: best.p.name },
          similarity: best.score,
          row,
        })
      } else {
        newProducts.push({ bumpaId: row.bumpaId, row })
      }
    }
  }

  return { matched, ambiguous, possibleDuplicates, newProducts }
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

// Creates genuinely-new products from Bumpa rows that matched nothing in
// the store (not even a near-duplicate by name). Each is linked to its
// bumpa_id immediately so it's matched directly on every future sync.
export async function createBumpaProducts(rowsToCreate: BumpaRow[]) {
  if (!rowsToCreate.length) return { success: true as const, count: 0, skipped: [] as string[] }

  // Defensive: a batch insert with two rows sharing a bumpa_id violates the
  // unique constraint on that column and rolls back the whole insert.
  const seenBumpaIds = new Set<string>()
  rowsToCreate = rowsToCreate.filter(r => {
    if (seenBumpaIds.has(r.bumpaId)) return false
    seenBumpaIds.add(r.bumpaId)
    return true
  })

  const supabase = createAdminClient({ noStore: true })
  const now = Date.now()

  // Defensive: even with a fresh read, a row can carry a bumpa_id that's
  // already linked to an existing product (e.g. linked by an Apply-updates
  // click run moments earlier in the same session). Drop those rather than
  // letting one bad row fail the whole batch insert.
  const incomingIds = rowsToCreate.map(r => r.bumpaId)
  const { data: alreadyLinked } = await supabase
    .from('products').select('bumpa_id').in('bumpa_id', incomingIds)
  const linkedIds = new Set((alreadyLinked ?? []).map((p: any) => p.bumpa_id))
  const skipped = rowsToCreate.filter(r => linkedIds.has(r.bumpaId))
  rowsToCreate = rowsToCreate.filter(r => !linkedIds.has(r.bumpaId))

  if (!rowsToCreate.length) {
    return { success: true as const, count: 0, skipped: skipped.map(r => r.title) }
  }

  const categoryMap: Record<string, string> = {}
  const uniqueCategoryNames = Array.from(new Set(
    rowsToCreate.flatMap(r => r.categoryName?.trim() ? [r.categoryName.trim()] : [])
  ))
  if (uniqueCategoryNames.length) {
    const { data: existing } = await supabase.from('categories').select('id, name').in('name', uniqueCategoryNames)
    for (const cat of existing ?? []) categoryMap[cat.name.toLowerCase()] = cat.id
    const missing = uniqueCategoryNames.filter(n => !categoryMap[n.toLowerCase()])
    if (missing.length) {
      const { data: created } = await supabase
        .from('categories')
        .insert(missing.map((name, i) => ({ name, slug: `${slugify(name)}-${now}-${i}` })))
        .select('id, name')
      for (const cat of created ?? []) categoryMap[cat.name.toLowerCase()] = cat.id
    }
  }

  const payload = rowsToCreate.map((r, i) => ({
    name: r.title,
    slug: `${slugify(r.title)}-${now}-${i}`,
    description: r.description,
    price: r.price ?? 0,
    cost_price: r.cost,
    stock: r.stock ?? 0,
    is_active: r.isActive,
    thumbnail: r.thumbnail,
    images: r.images,
    category_id: r.categoryName?.trim() ? (categoryMap[r.categoryName.trim().toLowerCase()] ?? null) : null,
    bumpa_id: r.bumpaId,
  }))

  const { error, data } = await supabase.from('products').insert(payload).select('id')
  if (error) return { error: error.message }

  logAudit('product.bumpa_sync', 'product', 'bulk', { created: data?.length ?? 0 }).catch(() => {})
  revalidatePath('/admin/products')
  return { success: true as const, count: data?.length ?? 0, skipped: skipped.map(r => r.title) }
}

export async function applyBumpaSync(updates: Array<{
  productId: string
  bumpaId: string
  price: number | null
  cost_price: number | null
  stock: number | null
}>) {
  if (!updates.length) return { success: true as const, count: 0 }
  const supabase = createAdminClient({ noStore: true })

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
