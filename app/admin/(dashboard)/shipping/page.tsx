export const dynamic = 'force-dynamic'

import { adminGetShippingZones } from '@/lib/actions/shipping'
import { getDeliveryData } from '@/lib/actions/delivery'
import { ShippingManager } from '@/components/admin/ShippingManager'

export default async function AdminShippingPage() {
  const [zones, { types }] = await Promise.all([
    adminGetShippingZones(),
    getDeliveryData(),
  ])

  const deliveryZoneNames = types.flatMap((t: { zones: { name: string }[] }) => t.zones.map(z => z.name))

  return (
    <div className="p-8 max-w-4xl">
      <ShippingManager zones={zones} deliveryZoneNames={deliveryZoneNames} />
    </div>
  )
}
