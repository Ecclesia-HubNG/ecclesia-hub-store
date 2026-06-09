import StoreHeader from '@/components/store/StoreHeader'
import StoreFooter from '@/components/store/StoreFooter'
import WhatsAppButton from '@/components/store/WhatsAppButton'
import NewsletterPopup from '@/components/store/NewsletterPopup'
import { CartProvider } from '@/lib/cart-context'
import { WishlistProvider } from '@/lib/wishlist-context'
import { getMegaMenuConfig, getFooterConfig } from '@/lib/actions/menus'

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [megaMenu, footer] = await Promise.all([
    getMegaMenuConfig(),
    getFooterConfig(),
  ])

  return (
    <CartProvider>
      <WishlistProvider>
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-950">
          <StoreHeader megaMenu={megaMenu} />
          <main className="flex-1">{children}</main>
          <StoreFooter footer={footer} />
          <WhatsAppButton />
          <NewsletterPopup />
        </div>
      </WishlistProvider>
    </CartProvider>
  )
}
