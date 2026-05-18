const BRANDS = [
  'Nivea',
  'Olay',
  'Aveeno',
  'Vaseline',
  'Creme',
  'Cussons',
  'Saltair',
  'Advanced Clinical',
  'Neutrogena',
  'CeraVe',
  'Dove',
  'Palmer\'s',
]

const DOT = (
  <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
)

export default function BrandTicker() {
  return (
    <div className="w-full overflow-hidden border-y border-gray-100 bg-white py-5 my-2">
      <div className="flex items-center gap-8 ticker-track">
        {/* Render twice for seamless loop */}
        {[...BRANDS, ...BRANDS].map((brand, i) => (
          <span key={i} className="flex items-center gap-8 shrink-0">
            <span className="text-sm font-semibold tracking-[0.12em] uppercase text-gray-400 whitespace-nowrap hover:text-gray-700 transition-colors cursor-default">
              {brand}
            </span>
            {DOT}
          </span>
        ))}
      </div>
    </div>
  )
}
