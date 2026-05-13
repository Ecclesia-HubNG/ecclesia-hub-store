import Link from 'next/link'

function StoreHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home" className="font-semibold text-gray-900 tracking-tight text-lg">
          Ecclesia Hub
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-8">
          <Link href="/home" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Home
          </Link>
          <Link href="/shop" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Shop
          </Link>
          <Link href="/about" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            About
          </Link>
        </nav>

        {/* Cart */}
        <Link
          href="/cart"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
          Cart
        </Link>
      </div>
    </header>
  )
}

function StoreFooter() {
  return (
    <footer className="border-t border-gray-100 mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10 flex items-center justify-between">
        <p className="text-sm font-medium text-gray-900">Ecclesia Hub</p>
        <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} All rights reserved.</p>
      </div>
    </footer>
  )
}

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <StoreHeader />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  )
}
