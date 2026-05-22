import { adminGetShippingZones } from '@/lib/actions/shipping'
import { ShippingManager } from '@/components/admin/ShippingManager'

export const dynamic = 'force-dynamic'

export default async function AdminShippingPage() {
  const zones = await adminGetShippingZones()
  return (
    <div className="p-8 max-w-4xl">
      <ShippingManager zones={zones} />
    </div>
  )
}
