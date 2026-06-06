export const dynamic = 'force-dynamic'

import { adminGetShippingTree } from '@/lib/actions/shipping'
import { ShippingManager } from '@/components/admin/ShippingManager'

export default async function AdminShippingPage() {
  const states = await adminGetShippingTree()

  return (
    <div className="p-8 max-w-4xl">
      <ShippingManager states={states} />
    </div>
  )
}
