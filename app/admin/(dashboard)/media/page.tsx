import { getMediaAssets } from '@/lib/actions/media'
import MediaLibrary from '@/components/admin/MediaLibrary'

export default async function MediaPage() {
  const assets = await getMediaAssets()

  return (
    <div className="p-6 md:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Media</h1>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          All uploaded images — upload once, reuse anywhere.
        </p>
      </div>
      <MediaLibrary initialAssets={assets} />
    </div>
  )
}
