import Link from 'next/link'

export default function PromoBanner() {
  return (
    <section className="w-full px-3 md:px-5 pb-16">
      <div className="relative rounded-3xl overflow-hidden bg-[#4A0F1C]">

        {/* ── decorative background layers ── */}
        <div className="absolute inset-0 pointer-events-none select-none">
          {/* blobs */}
          <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-[#7B1D30]/50 blur-3xl" />
          <div className="absolute right-1/3 -bottom-16 w-64 h-64 rounded-full bg-[#2A0810]/80 blur-2xl" />
          {/* dot grid */}
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          {/* right-side decorative rings */}
          <div className="absolute right-[18%] top-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full border border-white/10" />
          <div className="absolute right-[18%] top-1/2 -translate-y-1/2 w-[460px] h-[460px] rounded-full border border-white/[0.06]" />
          <div className="absolute right-[18%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/[0.04]" />
        </div>

        <div className="relative z-10 grid md:grid-cols-2 gap-0">

          {/* ── Left: copy ── */}
          <div className="flex flex-col justify-center px-8 md:px-14 py-14 md:py-16">

            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-6 h-px bg-[#D4849A]" />
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D4849A]">Members reward</span>
            </div>

            {/* Headline */}
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase tracking-tight mb-1">
              Get 5% Cashback
            </h2>
            <h2 className="text-3xl md:text-4xl font-black text-white leading-tight uppercase tracking-tight mb-3">
              on Every Order
            </h2>

            {/* Amount pill */}
            <div className="inline-flex items-center gap-2 mb-5">
              <span className="text-[#D4849A] text-sm font-semibold">Above</span>
              <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white text-2xl font-black tracking-tight">₦10,000</span>
            </div>

            {/* Description */}
            <p className="text-sm text-white/60 leading-relaxed max-w-xs mb-8">
              You deserve to be rewarded every time you shop. Earn cashback automatically on every qualifying order — no codes needed.
            </p>

            {/* CTA */}
            <div className="flex items-center gap-4">
              <Link
                href="/shop"
                className="px-7 py-3 bg-white text-[#4A0F1C] text-sm font-bold rounded-full hover:bg-gray-100 transition-colors shadow-sm"
              >
                Start Shopping
              </Link>
              <Link href="/account" className="text-sm text-white/50 hover:text-white transition-colors underline underline-offset-2">
                Learn more
              </Link>
            </div>
          </div>

          {/* ── Right: visual ── */}
          <div className="hidden md:flex items-center justify-center py-10 pr-10 pl-4">
            <div className="relative w-full max-w-sm aspect-[4/3]">

              {/* Main product card mock */}
              <div className="absolute inset-0 rounded-2xl bg-white/[0.07] backdrop-blur-sm border border-white/10 flex flex-col items-center justify-center gap-5 p-8">

                {/* Icon */}
                <div className="w-16 h-16 rounded-full bg-[#D4849A]/20 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#D4849A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                  </svg>
                </div>

                <div className="text-center">
                  <p className="text-white/50 text-xs uppercase tracking-widest mb-1">You earn</p>
                  <p className="text-white text-5xl font-black">5%</p>
                  <p className="text-[#D4849A] text-sm font-semibold mt-1">on every purchase</p>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-white/10" />

                {/* Example calc */}
                <div className="w-full space-y-2">
                  {[
                    { order: '₦10,000', back: '₦500' },
                    { order: '₦25,000', back: '₦1,250' },
                    { order: '₦50,000', back: '₦2,500' },
                  ].map(row => (
                    <div key={row.order} className="flex items-center justify-between">
                      <span className="text-white/40 text-xs">Order {row.order}</span>
                      <span className="text-[#D4849A] text-xs font-bold">+{row.back} back</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-3 -right-3 w-14 h-14 rounded-full bg-[#D4849A] flex flex-col items-center justify-center shadow-lg">
                <span className="text-white text-[10px] font-bold leading-none">UP TO</span>
                <span className="text-white text-base font-black leading-none">5%</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
