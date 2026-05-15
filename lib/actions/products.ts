'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

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
    compare_at_price:  formData.get('compare_at_price') ? parseFloat(formData.get('compare_at_price') as string) : null,
    sale_price:        formData.get('sale_price') ? parseFloat(formData.get('sale_price') as string) : null,
    sale_starts_at:    (formData.get('sale_starts_at') as string) || null,
    sale_ends_at:      (formData.get('sale_ends_at') as string) || null,
    category_id:       (formData.get('category_id') as string) || null,
    brand:             (formData.get('brand') as string) || null,
    thumbnail:         images[0] ?? null,
    images,
    video_url:         (formData.get('video_url') as string) || null,
    stock:             parseInt(formData.get('stock') as string) || 0,
    sku:               (formData.get('sku') as string) || null,
    barcode:           (formData.get('barcode') as string) || null,
    weight:            formData.get('weight') ? parseFloat(formData.get('weight') as string) : null,
    dimensions:        JSON.parse((formData.get('dimensions') as string) || 'null'),
    is_featured:       formData.get('is_featured') === 'on',
    is_active:         formData.get('is_active') === 'on',
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
  const { data, error } = await supabase.from('products').insert(parseForm(formData)).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  redirect(`/admin/products/${data.id}/edit?saved=1`)
}

export async function updateProduct(id: string, _: unknown, formData: FormData) {
  const supabase = createAdminClient()
  const { error } = await supabase.from('products').update(parseForm(formData)).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  revalidatePath(`/admin/products/${id}/edit`)
  return { success: true as const }
}

export async function deleteProduct(formData: FormData) {
  const supabase = createAdminClient()
  await supabase.from('products').delete().eq('id', formData.get('id') as string)
  revalidatePath('/admin/products')
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
