import Link from 'next/link'

export default function HeroSection({
  heroImage,
}: {
  heroImage?: string | null
}) {
  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 pt-6 pb-12">
      <div className="relative overflow-hidden rounded-3xl bg-[#FAF6F0] grid grid-cols-1 md:grid-cols-2 min-h-[500px]">

        {/* ── Left: text content ── */}
        <div className="flex flex-col justify-center px-8 md:px-14 py-14 md:py-0 relative z-10">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit mb-7" style={{ backgroundColor: 'rgba(74,15,28,0.07)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4A0F1C]" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#4A0F1C]">New Collection</span>
          </div>

          {/* Headline */}
          <h1 className="text-[2.6rem] md:text-[3rem] lg:text-[3.5rem] font-bold text-gray-900 leading-[1.06] tracking-tight mb-5">
            Radiant skin<br />
            for the<br />
            everyday believer.
          </h1>

          {/* Description */}
          <p className="text-sm text-gray-500 max-w-[270px] leading-relaxed mb-9">
            Premium body care curated for those who live with intention — delivered across Nigeria.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/shop"
              className="px-7 py-3 bg-[#4A0F1C] text-white text-sm font-semibold rounded-full hover:bg-[#3A0B15] transition-colors shadow-sm"
            >
              Shop Now
            </Link>
            <Link
              href="/shop"
              className="px-7 py-3 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-full hover:border-gray-400 hover:text-gray-900 transition-colors shadow-sm"
            >
              Explore More
            </Link>
          </div>
        </div>

        {/* ── Right: visual panel ── */}
        <div className="relative hidden md:block overflow-hidden min-h-[420px]">
          {/* Gradient fill */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#EDD9C8] via-[#E4BCC6]/70 to-[#4A0F1C]/15" />

          {/* Blurred depth blobs */}
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#4A0F1C]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full bg-[#D4849A]/20 blur-2xl" />

          {/* Product image (real) or decorative mockup */}
          {heroImage ? (
            <img
              src={heroImage}
              alt="Featured product"
              className="absolute inset-0 w-full h-full object-contain p-10 z-10"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="relative">
                {/* Main card */}
                <div className="w-44 h-60 rounded-[36px] bg-white/50 backdrop-blur-md shadow-2xl border border-white/70 flex flex-col items-center justify-center gap-4">
                  {/* Icon ring */}
                  <div className="w-14 h-14 rounded-full bg-[#4A0F1C]/12 flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#4A0F1C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                    </svg>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-[11px] font-bold text-[#4A0F1C] tracking-widest uppercase">Ecclesia</p>
                    <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Premium Body Care</p>
                  </div>
                </div>
                {/* Decorative dots */}
                <div className="absolute -top-5 -left-5 w-12 h-12 rounded-full bg-[#D4849A]/25 blur-sm" />
                <div className="absolute -bottom-4 -right-4 w-9 h-9 rounded-full bg-[#4A0F1C]/15" />
                <div className="absolute top-8 -right-8 w-5 h-5 rounded-full bg-white/60" />
              </div>
            </div>
          )}

          {/* ── Floating badge: price ── */}
          <div className="absolute top-10 right-10 bg-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3 z-20">
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

          {/* ── Floating badge: feature ── */}
          <div className="absolute bottom-14 right-8 bg-[#4A0F1C] rounded-2xl shadow-xl px-4 py-4 w-[158px] z-20">
            <p className="text-[11px] text-white/90 font-medium leading-snug">
              Premium quality,<br />
              delivered across<br />
              Nigeria.
            </p>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4849A]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4849A]/50" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4849A]/25" />
              </div>
              <Link
                href="/shop"
                className="w-6 h-6 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              >
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile: subtle bottom gradient (no right panel on mobile) */}
        <div className="md:hidden h-2 bg-gradient-to-r from-[#4A0F1C]/5 to-[#D4849A]/10 rounded-b-3xl" />
      </div>
    </section>
  )
}
