import Link from 'next/link'

const FALLBACK_COLORS = [
  'bg-[#F5EDE0]',
  'bg-[#F5D6D6]',
  'bg-[#D6E8F5]',
  'bg-[#D6F5E0]',
  'bg-[#EFE0F5]',
  'bg-[#F5F0D6]',
]

type Category = {
  id: string
  name: string
  slug: string
  image: string | null
}

export default function CategoryShowcase({ categories }: { categories: Category[] }) {
  if (!categories.length) return null

  return (
    <section className="w-full px-3 md:px-5 py-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shop Top Categories</h2>
        <Link
          href="/shop"
          className="text-sm font-semibold text-[#4A0F1C] dark:text-[#D4849A] hover:underline flex items-center gap-1"
        >
          View All
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
          <svg className="w-3.5 h-3.5 -ml-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
      </div>

      {/* Scrollable row */}
      <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
        {categories.map((cat, i) => {
          const fallback = FALLBACK_COLORS[i % FALLBACK_COLORS.length]
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="group relative shrink-0 w-52 md:w-64 h-80 rounded-2xl overflow-hidden snap-start flex flex-col justify-between p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Background */}
              {cat.image ? (
                <>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Gradient scrim for readability */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/10 to-black/30" />
                </>
              ) : (
                <div className={`absolute inset-0 ${fallback} transition-opacity duration-300`} />
              )}

              {/* Content */}
              <div className="relative z-10">
                <h3 className={`text-lg font-bold leading-snug ${cat.image ? 'text-white' : 'text-gray-900 dark:text-gray-900'}`}>
                  {cat.name}
                </h3>
                <span className={`text-xs font-medium underline underline-offset-2 mt-1.5 inline-block ${
                  cat.image ? 'text-white/80' : 'text-[#4A0F1C]'
                }`}>
                  Shop Now
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
