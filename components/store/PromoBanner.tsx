import Link from 'next/link'

export default function PromoBanner() {
  return (
    <section className="w-full px-3 md:px-5 pb-16">
      <div className="relative rounded-3xl overflow-hidden min-h-[380px] md:min-h-[420px] flex items-center">

        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://pub-10bc4fec8b2b43a0992e28a4cf1acf41.r2.dev/categories/1779113596296-fn43gmt8l8h.jpg')`,
          }}
        />
        {/* Dark overlay so image doesn't fight the card */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Promo card — right-aligned */}
        <div className="relative z-10 ml-auto mr-6 md:mr-14 w-full max-w-xs md:max-w-sm bg-[#4A0F1C] rounded-2xl px-8 py-10 flex flex-col gap-4">
          <h3 className="text-2xl md:text-3xl font-black text-white leading-snug">
            Get 5% Cashback<br />on Orders Above
          </h3>
          <p className="text-4xl font-black text-white">₦10,000</p>
          <p className="text-sm text-white/70 leading-relaxed">
            You deserve to be rewarded every time you shop. We've made that easy — earn cashback automatically on qualifying orders.
          </p>
          <Link
            href="/shop"
            className="mt-2 inline-flex items-center justify-center px-6 py-3 bg-white text-[#4A0F1C] text-sm font-bold rounded-full hover:bg-gray-100 transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    </section>
  )
}
