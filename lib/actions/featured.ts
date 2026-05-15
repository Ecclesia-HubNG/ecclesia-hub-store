'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function toggleProductFeatured(id: string, is_featured: boolean) {
  const supabase = createAdminClient()
  await supabase.from('products').update({ is_featured }).eq('id', id)
  revalidatePath('/admin/featured')
  revalidatePath('/admin/products')
}

export async function toggleCategoryFeatured(id: string, is_featured: boolean) {
  const supabase = createAdminClient()
  await supabase.from('categories').update({ is_featured }).eq('id', id)
  revalidatePath('/admin/featured')
  revalidatePath('/admin/categories')
}

export async function toggleBrandFeatured(id: string, is_featured: boolean) {
  const supabase = createAdminClient()
  await supabase.from('brands').update({ is_featured }).eq('id', id)
  revalidatePath('/admin/featured')
  revalidatePath('/admin/brands')
}
