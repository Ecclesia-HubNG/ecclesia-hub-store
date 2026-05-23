'use client'

type Platform = 'youtube' | 'tiktok' | 'instagram'

type Parsed = { platform: Platform; embedUrl: string } | null

function parseVideoUrl(raw: string): Parsed {
  try {
    const url = new URL(raw.trim())
    const host = url.hostname.replace(/^www\./, '')

    // ── YouTube ──────────────────────────────────────────────
    if (host === 'youtube.com' || host === 'youtu.be') {
      let id: string | null = null
      if (host === 'youtu.be') {
        id = url.pathname.slice(1).split('/')[0]
      } else if (url.pathname.startsWith('/shorts/')) {
        id = url.pathname.split('/')[2]
      } else if (url.pathname.startsWith('/embed/')) {
        id = url.pathname.split('/')[2]
      } else {
        id = url.searchParams.get('v')
      }
      if (id) return { platform: 'youtube', embedUrl: `https://www.youtube.com/embed/${id}?rel=0` }
    }

    // ── TikTok ───────────────────────────────────────────────
    if (host === 'tiktok.com' || host === 'vm.tiktok.com') {
      const match = url.pathname.match(/\/video\/(\d+)/)
      if (match) return { platform: 'tiktok', embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}` }
    }

    // ── Instagram ────────────────────────────────────────────
    if (host === 'instagram.com') {
      const match = url.pathname.match(/\/(reel|p|tv)\/([^/]+)/)
      if (match) return { platform: 'instagram', embedUrl: `https://www.instagram.com/${match[1]}/${match[2]}/embed/` }
    }
  } catch {}

  return null
}

const LABELS: Record<Platform, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
}

const ICONS: Record<Platform, React.ReactNode> = {
  youtube: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  tiktok: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
    </svg>
  ),
  instagram: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
  ),
}

// Aspect ratios per platform
const ASPECT: Record<Platform, string> = {
  youtube: 'aspect-video',          // 16:9
  tiktok: 'aspect-[9/16] max-w-xs', // 9:16 (vertical), capped width
  instagram: 'aspect-[4/5]',        // roughly square/portrait
}

export default function VideoEmbed({ url }: { url: string }) {
  const parsed = parseVideoUrl(url)

  if (!parsed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm text-[#4A0F1C] dark:text-[#E8C4CB] hover:underline"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
        Watch video
      </a>
    )
  }

  const { platform, embedUrl } = parsed

  return (
    <div>
      {/* Platform badge */}
      <div className="flex items-center gap-1.5 mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">
        {ICONS[platform]}
        <span>{LABELS[platform]}</span>
      </div>

      {/* Embed */}
      <div className={`w-full ${ASPECT[platform]} rounded-2xl overflow-hidden bg-black`}>
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          title={`${LABELS[platform]} video`}
        />
      </div>
    </div>
  )
}
