'use client'

import { useRef, useState, useTransition } from 'react'
import type { ChangeEvent } from 'react'
import { uploadMedia, deleteMedia } from '@/lib/actions/media'

type Asset = {
  id: string
  url: string
  key: string
  name: string
  size: number | null
  mime_type: string | null
  folder: string
  created_at: string
}

type Props = {
  initialAssets: Asset[]
  /** If provided, renders in picker mode — clicking an image calls onSelect */
  onSelect?: (asset: Asset) => void
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function MediaLibrary({ initialAssets, onSelect }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState<string>('all')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const KNOWN_FOLDERS = ['products', 'brands', 'categories', 'homepage', 'featured', 'general']
  const dynamicFolders = Array.from(new Set(assets.map(a => a.folder)))
  const allFolders = ['all', ...Array.from(new Set([...KNOWN_FOLDERS, ...dynamicFolders])).sort()]
  const folders = allFolders

  const filtered = assets.filter(a => {
    const matchFolder = folder === 'all' || a.folder === folder
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
    return matchFolder && matchSearch
  })

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    e.target.value = ''
    setUploading(true)
    setUploadError('')

    for (const file of Array.from(files)) {
      const fd = new FormData()
      fd.append('file', file)
      const result = await uploadMedia(fd, folder === 'all' ? 'general' : folder)
      if (result.error) {
        setUploadError(result.error)
      } else if (result.url && result.id) {
        const newAsset: Asset = {
          id: result.id,
          url: result.url,
          key: `${folder === 'all' ? 'general' : folder}/${file.name}`,
          name: file.name,
          size: file.size,
          mime_type: file.type,
          folder: folder === 'all' ? 'general' : folder,
          created_at: new Date().toISOString(),
        }
        setAssets(prev => [newAsset, ...prev])
      }
    }
    setUploading(false)
  }

  const copyUrl = async (url: string, id: string) => {
    await navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = (asset: Asset) => {
    if (!confirm(`Delete "${asset.name}"? This cannot be undone.`)) return
    setDeleting(asset.id)
    startTransition(async () => {
      try {
        await deleteMedia(asset.id, asset.key)
        setAssets(prev => prev.filter(a => a.id !== asset.id))
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to delete')
      } finally {
        setDeleting(null)
      }
    })
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
          </svg>
          <input
            type="text"
            placeholder="Search files…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 dark:focus:ring-white/10"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {folders.map(f => (
            <button
              key={f}
              onClick={() => setFolder(f)}
              className={`px-3 py-1 text-xs font-medium rounded-md capitalize transition-colors ${
                folder === f
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-50 transition-colors"
        >
          {uploading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
            </svg>
          )}
          Upload
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
      </div>

      {uploadError && (
        <p className="text-sm text-red-500 dark:text-red-400 mb-4">{uploadError}</p>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl py-20 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
        >
          <svg className="w-10 h-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {search ? 'No images match your search' : 'No images yet — click to upload'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(asset => (
            <div
              key={asset.id}
              className={`group relative rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 aspect-square ${
                onSelect ? 'cursor-pointer hover:ring-2 hover:ring-[#4A0F1C] transition-all' : ''
              }`}
              onClick={() => onSelect?.(asset)}
            >
              <img
                src={asset.url}
                alt={asset.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />

              {/* Hover overlay */}
              <div className={`absolute inset-0 bg-black/50 flex flex-col justify-between p-2 transition-opacity duration-150 ${onSelect ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <div className="flex justify-end">
                  {!onSelect && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleDelete(asset) }}
                      disabled={deleting === asset.id || isPending}
                      className="w-7 h-7 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deleting === asset.id ? (
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  {!onSelect && (
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); copyUrl(asset.url, asset.id) }}
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-white/90 hover:bg-white text-gray-900 text-xs font-medium rounded-lg transition-colors"
                    >
                      {copied === asset.id ? (
                        <>
                          <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                          </svg>
                          Copy URL
                        </>
                      )}
                    </button>
                  )}
                  <p className="text-white/70 text-[10px] truncate px-0.5">{asset.name}</p>
                  {asset.size && <p className="text-white/50 text-[10px] px-0.5">{formatBytes(asset.size)}</p>}
                </div>
              </div>

              {onSelect && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="px-3 py-1.5 bg-[#4A0F1C] text-white text-xs font-medium rounded-lg shadow">
                    Select
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400 dark:text-gray-600">
        {filtered.length} {filtered.length === 1 ? 'image' : 'images'}{folder !== 'all' ? ` in ${folder}` : ''}
        {search ? ` matching "${search}"` : ''}
      </p>
    </div>
  )
}
