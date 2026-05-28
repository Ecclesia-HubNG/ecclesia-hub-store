'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { logAudit } from '@/lib/audit'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function parseForm(formData: FormData) {
  const slug = ((formData.get('slug') as string) || '').trim()
  const name = formData.get('name') as string
  const images: string[] = JSON.parse((formData.get('image_urls') as string) || '[]')

  return {
    name,
    slug: slug || slugify(name),
    short_description: (formData.get('short_description') as string) || null,
    description:       (formData.get('description') as string) || null,
    price:             parseFloat(formData.get('price') as string),
    cost_price:        formData.get('cost_price') ? parseFloat(formData.get('cost_price') as string) : null,
    compare_at_price:  formData.get('compare_at_price') ? parseFloat(formData.get('compare_at_price') as string) : null,
    sale_price:        formData.get('sale_price') ? parseFloat(formData.get('sale_price') as string) : null,
    sale_starts_at:    (formData.get('sale_starts_at') as string) || null,
    sale_ends_at:      (formData.get('sale_ends_at') as string) || null,
    category_id:       (formData.get('category_id') as string) || null,
    brand_id:          (formData.get('brand_id') as string) || null,
    brand:             (formData.get('brand') as string) || null,
    thumbnail:         images[0] ?? null,
    images,
    video_url:         (formData.get('video_url') as string) || null,
    stock:             parseInt(formData.get('stock') as string) || 0,
    sku:               (formData.get('sku') as string) || null,
    barcode:           (formData.get('barcode') as string) || null,
    weight:            formData.get('weight') ? parseFloat(formData.get('weight') as string) : null,
    dimensions:        JSON.parse((formData.get('dimensions') as string) || 'null'),
    is_featured:          formData.get('is_featured') === 'on',
    is_product_of_month:  formData.get('is_product_of_month') === 'on',
    is_active:            formData.get('is_active') === 'on',
    tags:              JSON.parse((formData.get('tags') as string) || '[]'),
    variants:          JSON.parse((formData.get('variants') as string) || '[]'),
    attributes:        JSON.parse((formData.get('attributes') as string) || '[]'),
    shipping_type:     (formData.get('shipping_type') as string) || 'standard',
    related_product_ids: JSON.parse((formData.get('related_product_ids') as string) || '[]'),
    meta_title:        (formData.get('meta_title') as string) || null,
    meta_description:  (formData.get('meta_description') as string) || null,
  }
}

export async function createProduct(_: unknown, formData: FormData) {
  const supabase = createAdminClient()
  const parsed = parseForm(formData)
  const { data, error } = await supabase.from('products').insert(parsed).select('id, name').single()
  if (error) return { error: error.message }
  logAudit('product.create', 'product', data.id, { name: data.name }).catch(() => {})
  revalidatePath('/admin/products')
  redirect(`/admin/products/${data.id}/edit?saved=1`)
}

export async function updateProduct(id: string, _: unknown, formData: FormData) {
  const supabase = createAdminClient()
  const { cost_price, ...parsed } = parseForm(formData)
  const { error } = await supabase.from('products').update(parsed).eq('id', id)
  if (error) return { error: error.message }
  // cost_price is a newer column — apply separately so a missing column never blocks saves
  if (cost_price !== undefined) {
    await supabase.from('products').update({ cost_price }).eq('id', id)
  }
  logAudit('product.update', 'product', id, { name: parsed.name }).catch(() => {})
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}/edit`)
  return { success: true as const }
}

export async function deleteProduct(formData: FormData) {
  const supabase = createAdminClient()
  const id = formData.get('id') as string
  await supabase.from('products').delete().eq('id', id)
  logAudit('product.delete', 'product', id).catch(() => {})
  revalidatePath('/admin/products')
}

export async function checkDuplicateProduct(name: string, excludeId?: string) {
  if (name.trim().length < 2) return []
  const supabase = createAdminClient()
  let query = supabase
    .from('products')
    .select('id, name, slug, thumbnail')
    .ilike('name', `%${name.trim()}%`)
    .limit(5)
  if (excludeId) query = query.neq('id', excludeId)
  const { data } = await query
  return data ?? []
}

export async function bulkDeleteProducts(ids: string[]) {
  if (!ids.length) return { success: true as const }
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').delete().in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { success: true as const }
}

export async function bulkImportProducts(rows: Array<{
  name: string
  description?: string | null
  short_description?: string | null
  price: number
  compare_at_price?: number | null
  stock: number
  is_active: boolean
  is_featured: boolean
  thumbnail?: string | null
  images?: string[]
  sku?: string | null
  barcode?: string | null
  weight?: number | null
  meta_title?: string | null
  meta_description?: string | null
  variants?: Array<{ name: string; values: string[] }>
  category_names?: string[]
}>) {
  if (!rows.length) return { success: true as const, count: 0 }
  const supabase = createAdminClient()
  const now = Date.now()

  // Collect unique first-category names and look them up / create them
  const categoryMap: Record<string, string> = {}
  const uniqueCategoryNames = Array.from(new Set(
    rows.flatMap(r => r.category_names?.[0]?.trim() ? [r.category_names[0].trim()] : [])
  ))
  if (uniqueCategoryNames.length) {
    const { data: existing } = await supabase
      .from('categories')
      .select('id, name')
      .in('name', uniqueCategoryNames)
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

  const toInsert = rows.map((r, i) => ({
    name: r.name,
    slug: `${slugify(r.name)}-${now}-${i}`,
    description: r.description ?? null,
    short_description: r.short_description ?? null,
    price: r.price,
    compare_at_price: r.compare_at_price ?? null,
    stock: r.stock,
    is_active: r.is_active,
    is_featured: r.is_featured,
    thumbnail: r.thumbnail ?? null,
    images: r.images ?? [],
    sku: r.sku ?? null,
    barcode: r.barcode ?? null,
    weight: r.weight ?? null,
    meta_title: r.meta_title ?? null,
    meta_description: r.meta_description ?? null,
    variants: r.variants ? JSON.stringify(r.variants) : '[]',
    category_id: r.category_names?.[0]?.trim()
      ? (categoryMap[r.category_names[0].trim().toLowerCase()] ?? null)
      : null,
  }))
  const { error, data } = await supabase.from('products').insert(toInsert).select('id')
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { success: true as const, count: data?.length ?? 0 }
}

export async function quickUpdateProduct(id: string, data: {
  name: string
  price: number
  compare_at_price: number | null
  stock: number
  category_id: string | null
  brand_id: string | null
  is_active: boolean
  is_featured: boolean
}) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').update(data).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { success: true as const }
}

export async function toggleProductActive(id: string, is_active: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').update({ is_active }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  return { success: true as const }
}

export async function duplicateProduct(formData: FormData) {
  const supabase = createAdminClient()
  const id = formData.get('id') as string
  const { data: src, error: fetchErr } = await supabase.from('products').select('*').eq('id', id).single()
  if (fetchErr || !src) return
  const { id: _id, created_at: _ca, updated_at: _ua, ...fields } = src
  const slug = `${fields.slug}-copy-${Date.now()}`
  const { data, error } = await supabase
    .from('products')
    .insert({ ...fields, name: `Copy of ${fields.name}`, slug, is_active: false })
    .select('id')
    .single()
  if (error || !data) return
  revalidatePath('/admin/products')
  redirect(`/admin/products/${data.id}/edit`)
}

// Atomically sets one product as product of the month, clearing all others.
export async function setProductOfMonth(productId: string) {
  const supabase = createAdminClient()
  await supabase.from('products').update({ is_product_of_month: false }).eq('is_product_of_month', true)
  const { error } = await supabase.from('products').update({ is_product_of_month: true }).eq('id', productId)
  if (error) return { error: error.message }
  revalidatePath('/admin/products/product-of-month')
  revalidatePath('/')
  return { success: true as const }
}

export async function clearProductOfMonth() {
  const supabase = createAdminClient()
  await supabase.from('products').update({ is_product_of_month: false }).eq('is_product_of_month', true)
  revalidatePath('/admin/products/product-of-month')
  revalidatePath('/')
  return { success: true as const }
}

export async function removeProductOfMonth(productId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').update({ is_product_of_month: false }).eq('id', productId)
  if (error) return { error: error.message }
  revalidatePath('/admin/products/product-of-month')
  revalidatePath('/')
  return { success: true as const }
}

export async function setNewArrival(productId: string, value: boolean) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').update({ is_new_arrival: value }).eq('id', productId)
  if (error) return { error: error.message }
  revalidatePath('/admin/new-arrivals')
  revalidatePath('/new-arrivals')
  return { success: true as const }
}
