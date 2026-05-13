'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function parseForm(formData: FormData) {
  const imagesRaw = (formData.get('images') as string) || ''
  const slug = ((formData.get('slug') as string) || '').trim()
  const name = formData.get('name') as string
  return {
    name,
    slug: slug || slugify(name),
    description: (formData.get('description') as string) || null,
    price: parseFloat(formData.get('price') as string),
    compare_at_price: formData.get('compare_at_price')
      ? parseFloat(formData.get('compare_at_price') as string)
      : null,
    category_id: (formData.get('category_id') as string) || null,
    thumbnail: (formData.get('thumbnail') as string) || null,
    images: imagesRaw.split('\n').map((s: string) => s.trim()).filter(Boolean),
    stock: parseInt(formData.get('stock') as string) || 0,
    is_featured: formData.get('is_featured') === 'on',
    is_active: formData.get('is_active') === 'on',
  }
}

export async function createProduct(_: unknown, formData: FormData) {
  const supabase = createClient()
  const { error } = await supabase.from('products').insert(parseForm(formData))
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function updateProduct(id: string, _: unknown, formData: FormData) {
  const supabase = createClient()
  const { error } = await supabase.from('products').update(parseForm(formData)).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function deleteProduct(formData: FormData) {
  const supabase = createClient()
  await supabase.from('products').delete().eq('id', formData.get('id') as string)
  revalidatePath('/admin/products')
}
