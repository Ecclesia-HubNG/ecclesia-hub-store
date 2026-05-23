'use client'

import { useState } from 'react'

type Platform = 'youtube' | 'tiktok' | 'instagram' | 'unknown'

type GalleryItem =
  | { type: 'image'; src: string }
  | { type: 'video'; embedUrl: string; platform: Platform }

function parseEmbed(raw: string): { embedUrl: string; platform: string } | null {
  try {
    const url = new URL(raw.trim())
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'youtu.be') {
      let id: string | null = null
      if (host === 'youtu.be') id = url.pathname.slice(1).split('/')[0]
      else if (url.pathname.startsWith('/shorts/')) id = url.pathname.split('/')[2]
      else if (url.pathname.startsWith('/embed/')) id = url.pathname.split('/')[2]
      else id = url.searchParams.get('v')
      if (id) return { embedUrl: `https://www.youtube.com/embed/${id}?rel=0`, platform: 'youtube' as const }
    }

    if (host === 'tiktok.com' || host === 'vm.tiktok.com') {
      const match = url.pathname.match(/\/video\/(\d+)/)
      if (match) return { embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`, platform: 'tiktok' as const }
    }

    if (host === 'instagram.com') {
      const match = url.pathname.match(/\/(reel|p|tv)\/([^/]+)/)
      if (match) return { embedUrl: `https://www.instagram.com/${match[1]}/${match[2]}/embed/`, platform: 'instagram' as const }
    }
  } catch {}
  return null
}

const VIDEO_ASPECT: Record<Platform, string> = {
  youtube:   'aspect-video',
  tiktok:    'aspect-[9/16] max-w-[320px] mx-auto',
  instagram: 'aspect-[4/5] max-w-[400px] mx-auto',
  unknown:   'aspect-video',
}

function PlaceholderIcon() {
  return (
    <svg className="w-16 h-16 text-gray-200 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909" />
    </svg>
  )
}

export default function ImageGallery({
  images,
  name,
  videoUrl,
}: {
  images: string[]
  name: string
  videoUrl?: string | null
}) {
  const [active, setActive] = useState(0)

  // Build gallery items: images first, then video if present
  const items: GalleryItem[] = [
    ...images.map(src => ({ type: 'image' as const, src })),
    ...(videoUrl ? (() => {
      const parsed = parseEmbed(videoUrl)
      return parsed ? [{ type: 'video' as const, ...parsed }] : [{ type: 'video' as const, embedUrl: videoUrl, platform: 'unknown' as const }]
    })() : []),
  ]

  if (!items.length) {
    return (
      <div className="aspect-square bg-gray-100 dark:bg-gray-900 rounded-2xl flex items-center justify-center">
        <PlaceholderIcon />
      </div>
    )
  }

  const current = items[active]

  return (
    <div className="space-y-3">
      {/* Main viewer */}
      {current.type === 'image' ? (
        <div className="w-full aspect-square bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden">
          <img src={current.src} alt={name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className={`bg-black rounded-2xl overflow-hidden ${VIDEO_ASPECT[current.platform]}`}>
          <iframe
            src={current.embedUrl}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
            title={`${current.platform} video`}
          />
        </div>
      )}

      {/* Thumbnail strip — only shown when there are multiple items */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-colors ${
                i === active
                  ? 'border-[#4A0F1C] dark:border-[#E8C4CB]'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {item.type === 'image' ? (
                <img src={item.src} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/80" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}
              {/* Video badge */}
              {item.type === 'video' && (
                <span className="absolute bottom-0.5 left-0 right-0 text-center text-[9px] font-bold text-white bg-[#4A0F1C]/80 leading-tight py-0.5">
                  VIDEO
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
