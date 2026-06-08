'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import type { ChangeEvent, DragEvent } from 'react'
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

type QueuedFile = {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

type Props = {
  initialAssets: Asset[]
  onSelect?: (asset: Asset) => void
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const ACCEPTED_FORMATS = ['JPG', 'PNG', 'WebP', 'GIF', 'SVG']

export default function MediaLibrary({ initialAssets, onSelect }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const modalFileInputRef = useRef<HTMLInputElement>(null)
  const [assets, setAssets] = useState<Asset[]>(initialAssets)
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState<string>('all')
  const [copied, setCopied] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Upload modal
  const [showModal, setShowModal] = useState(false)
  const [queue, setQueue] = useState<QueuedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [modalDragging, setModalDragging] = useState(false)
  const modalDragCounter = useRef(0)

  const KNOWN_FOLDERS = ['products', 'brands', 'categories', 'homepage', 'featured', 'general']
  const dynamicFolders = Array.from(new Set(assets.map(a => a.folder)))
  const allFolders = ['all', ...Array.from(new Set([...KNOWN_FOLDERS, ...dynamicFolders])).sort()]

  const filtered = assets.filter(a => {
    const matchFolder = folder === 'all' || a.folder === folder
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase())
    return matchFolder && matchSearch
  })

  // Close modal on Escape
  useEffect(() => {
    if (!showModal) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isUploading) closeModal() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showModal, isUploading])

  const closeModal = () => {
    if (isUploading) return
    setShowModal(false)
    setQueue([])
    setModalDragging(false)
    modalDragCounter.current = 0
  }

  const addFilesToQueue = useCallback((files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith('image/'))
    if (!imageFiles.length) return
    setQueue(prev => [
      ...prev,
      ...imageFiles.map(f => ({
        id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
        file: f,
        status: 'pending' as const,
      })),
    ])
  }, [])

  const handleModalFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    addFilesToQueue(Array.from(e.target.files ?? []))
    e.target.value = ''
  }

  const handleModalDragEnter = (e: DragEvent) => {
    e.preventDefault()
    modalDragCounter.current++
    if (modalDragCounter.current === 1) setModalDragging(true)
  }
  const handleModalDragLeave = (e: DragEvent) => {
    e.preventDefault()
    modalDragCounter.current--
    if (modalDragCounter.current === 0) setModalDragging(false)
  }
  const handleModalDragOver = (e: DragEvent) => { e.preventDefault() }
  const handleModalDrop = (e: DragEvent) => {
    e.preventDefault()
    modalDragCounter.current = 0
    setModalDragging(false)
    addFilesToQueue(Array.from(e.dataTransfer.files))
  }

  const removeFromQueue = (id: string) => {
    setQueue(prev => prev.filter(f => f.id !== id))
  }

  const startUpload = async () => {
    const pending = queue.filter(q => q.status === 'pending')
    if (!pending.length) return
    const targetFolder = folder === 'all' ? 'general' : folder
    setIsUploading(true)

    for (const item of pending) {
      setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q))
      const fd = new FormData()
      fd.append('file', item.file)
      const result = await uploadMedia(fd, targetFolder)

      if (result.error) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'error', error: result.error } : q))
      } else if (result.url && result.id) {
        setQueue(prev => prev.map(q => q.id === item.id ? { ...q, status: 'done' } : q))
        setAssets(prev => [{
          id: result.id!,
          url: result.url!,
          key: `${targetFolder}/${item.file.name}`,
          name: item.file.name,
          size: item.file.size,
          mime_type: item.file.type,
          folder: targetFolder,
          created_at: new Date().toISOString(),
        }, ...prev])
      }
    }

    setIsUploading(false)
  }

  const allDone = queue.length > 0 && queue.every(q => q.status === 'done' || q.status === 'error')
  const pendingCount = queue.filter(q => q.status === 'pending').length

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

        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex-wrap">
          {allFolders.map(f => (
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
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
          </svg>
          Upload
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div
          onClick={() => setShowModal(true)}
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
              <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" loading="lazy" />

              <div className="absolute inset-0 bg-black/50 flex flex-col justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
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
                  <span className="px-3 py-1.5 bg-[#4A0F1C] text-white text-xs font-medium rounded-lg shadow">Select</span>
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

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Upload images</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Uploading to <span className="font-medium text-gray-600 dark:text-gray-300 capitalize">{folder === 'all' ? 'general' : folder}</span>
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={isUploading}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Drop zone */}
              <div
                onDragEnter={handleModalDragEnter}
                onDragLeave={handleModalDragLeave}
                onDragOver={handleModalDragOver}
                onDrop={handleModalDrop}
                onClick={() => modalFileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed cursor-pointer transition-all py-10 px-6 ${
                  modalDragging
                    ? 'border-[#4A0F1C] bg-[#4A0F1C]/5 dark:bg-[#4A0F1C]/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-gray-50/50 dark:bg-gray-800/50'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  modalDragging ? 'bg-[#4A0F1C]/10' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <svg className={`w-6 h-6 transition-colors ${modalDragging ? 'text-[#4A0F1C] dark:text-[#D4849A]' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {modalDragging ? 'Drop to add files' : 'Drag & drop or click to browse'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {ACCEPTED_FORMATS.join(' · ')} &nbsp;·&nbsp; Max 10MB per file
                  </p>
                </div>
                <input
                  ref={modalFileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleModalFileInput}
                />
              </div>

              {/* Accepted formats */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {ACCEPTED_FORMATS.map(fmt => (
                  <span key={fmt} className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-500 dark:text-gray-400">
                    .{fmt.toLowerCase()}
                  </span>
                ))}
              </div>

              {/* File queue */}
              {queue.length > 0 && (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {queue.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                      {/* Status icon */}
                      <div className="shrink-0">
                        {item.status === 'pending' && (
                          <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
                            </svg>
                          </div>
                        )}
                        {item.status === 'uploading' && (
                          <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          </div>
                        )}
                        {item.status === 'done' && (
                          <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                            <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 dark:text-gray-200 truncate">{item.file.name}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {item.status === 'error' ? (
                            <span className="text-red-400">{item.error ?? 'Upload failed'}</span>
                          ) : (
                            formatBytes(item.file.size)
                          )}
                        </p>
                      </div>

                      {/* Remove (pending only) */}
                      {item.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => removeFromQueue(item.id)}
                          className="shrink-0 w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-5 flex items-center justify-between gap-3">
              <p className="text-xs text-gray-400">
                {queue.length === 0 && 'No files selected'}
                {queue.length > 0 && !allDone && `${queue.length} file${queue.length > 1 ? 's' : ''} queued`}
                {allDone && `${queue.filter(q => q.status === 'done').length} uploaded successfully`}
              </p>
              <div className="flex items-center gap-2">
                {allDone ? (
                  <button
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-colors"
                  >
                    Done
                  </button>
                ) : (
                  <>
                    <button
                      onClick={closeModal}
                      disabled={isUploading}
                      className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-40"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={startUpload}
                      disabled={isUploading || pendingCount === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium rounded-lg hover:bg-gray-700 dark:hover:bg-gray-100 disabled:opacity-40 transition-colors"
                    >
                      {isUploading ? (
                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                        </svg>
                      )}
                      {isUploading ? 'Uploading…' : `Upload${pendingCount > 0 ? ` ${pendingCount} file${pendingCount > 1 ? 's' : ''}` : ''}`}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
