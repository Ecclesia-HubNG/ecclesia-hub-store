import Link from 'next/link'

export default function HeroSection({
  heroImage,
}: {
  heroImage?: string | null
}) {
  return (
    <section className="w-full px-3 md:px-5 pt-4 pb-10">
      <div className="relative overflow-hidden rounded-3xl grid grid-cols-1 md:grid-cols-2 min-h-[560px]">

        {/* ── Left: cream panel ── */}
        <div className="bg-[#FAF6F0] flex flex-col justify-center px-10 md:px-16 py-16 md:py-0">
          {/* Tag */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit mb-8"
            style={{ backgroundColor: 'rgba(74,15,28,0.07)' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A0F1C]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A0F1C]">
              New Collection
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-[2.8rem] md:text-[3.2rem] lg:text-[3.8rem] font-bold text-gray-900 leading-[1.05] tracking-tight mb-6">
            Radiant skin<br />
            for the<br />
            everyday believer.
          </h1>

          {/* Description */}
          <p className="text-sm text-gray-500 max-w-[280px] leading-relaxed mb-10">
            Premium body care curated for those who live with intention — delivered across Nigeria.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/shop"
              className="px-7 py-3.5 bg-[#4A0F1C] text-white text-sm font-semibold rounded-full hover:bg-[#3A0B15] transition-colors"
            >
              Shop Now
            </Link>
            <Link
              href="/shop"
              className="px-7 py-3.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-full hover:border-gray-500 hover:text-gray-900 transition-colors bg-white"
            >
              Explore More
            </Link>
          </div>
        </div>

        {/* ── Right: dark brand panel ── */}
        <div className="relative bg-[#4A0F1C] overflow-hidden min-h-[360px] md:min-h-0">
          {/* Radial glow */}
          <div className="absolute inset-0 bg-radial-at-center from-[#6B1A2A] to-[#4A0F1C]" />

          {/* Decorative rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] rounded-full border border-white/[0.05]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-white/[0.07]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[180px] h-[180px] rounded-full border border-white/[0.10]" />

          {/* Centre glow blob */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-[#D4849A]/10 blur-3xl" />

          {/* Product image (if available) */}
          {heroImage && (
            <img
              src={heroImage}
              alt="Featured product"
              className="absolute inset-0 w-full h-full object-contain p-12 z-10 opacity-90"
            />
          )}

          {/* ── Floating badge: price ── */}
          <div className="absolute top-10 right-10 bg-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 z-20">
            <div>
              <p className="text-[9px] text-gray-400 uppercase tracking-wide leading-none mb-1">Starting from</p>
              <p className="text-[15px] font-bold text-gray-900 leading-none">₦8,500</p>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#4A0F1C] flex items-center justify-center shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
          </div>

          {/* ── Floating badge: tagline ── */}
          <div className="absolute bottom-12 right-10 border border-white/20 bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 w-[172px] z-20">
            <p className="text-xs text-white font-semibold leading-snug">
              Premium quality,<br />
              delivered across<br />
              Nigeria.
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4849A]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4849A]/50" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4849A]/20" />
              </div>
              <Link
                href="/shop"
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </Link>
            </div>
          </div>

          {/* ── Bottom-left: stat strip ── */}
          <div className="absolute bottom-12 left-10 z-20 flex flex-col gap-3">
            {[
              { label: 'Products', value: '20+' },
              { label: 'Delivered', value: '500+' },
            ].map(s => (
              <div key={s.label} className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-white">{s.value}</span>
                <span className="text-[11px] text-white/40 uppercase tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
