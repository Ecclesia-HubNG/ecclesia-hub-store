import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import { CartProvider } from '@/lib/cart-context'

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
        <StoreHeader />
        <main className="flex-1">{children}</main>
        <StoreFooter />
      </div>
    </CartProvider>
  )
}
