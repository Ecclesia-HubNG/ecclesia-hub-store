export const dynamic = 'force-dynamic'

import { getDeliveryData } from '@/lib/actions/delivery'
import DeliveryTypeManager from '@/components/admin/DeliveryTypeManager'

export default async function DeliveryTypePage() {
  const { types, channels } = await getDeliveryData()

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Delivery Types</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Configure delivery methods, zones, and rates. Add logistics partners under Delivery Channels.
        </p>
      </div>
      <DeliveryTypeManager initial={types as any} initialChannels={channels as any} />
    </div>
  )
}
