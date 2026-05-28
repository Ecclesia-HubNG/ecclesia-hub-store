import { createAdminClient } from '@/lib/supabase/admin'
import InventoryValueClient from '@/components/admin/InventoryValueClient'

type Product = {
  id: string
  name: string
  price: number
  cost_price: number | null
  stock: number
  is_active: boolean
}

export default async function InventoryValuePage() {
  const supabase = createAdminClient()

  // Try with cost_price; fall back gracefully if the column doesn't exist on live DB yet
  let products: Product[] = []
  const { data, error } = await supabase
    .from('products')
    .select('id, name, price, cost_price, stock, is_active')
    .order('name')

  if (error) {
    const { data: fallback } = await supabase
      .from('products')
      .select('id, name, price, stock, is_active')
      .order('name')
    products = (fallback ?? []).map((p: any) => ({ ...p, cost_price: null }))
  } else {
    products = (data ?? []) as Product[]
  }

  return <InventoryValueClient products={products} />
}
