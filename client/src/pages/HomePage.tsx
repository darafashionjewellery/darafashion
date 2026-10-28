import {
  CollectionBanner,
  HappyCustomers,
  HeroBanner,
  Newsletter,
  ProductSection,
  ShopByCategory,
  ShopByOccasion,
  WhyDara,
} from '../components/home/HomeSections'
import { useDocumentTitle } from '../hooks/misc'

export default function HomePage() {
  useDocumentTitle()
  return (
    <>
      <HeroBanner />
      <ShopByCategory />
      <ProductSection eyebrow="Just in" title="New Arrivals" subtitle="Fresh styles for your next celebration" query={{ tag: 'new', limit: 10, sort: 'newest' }} viewAll="/new-arrivals" tone="cream" />
      <ProductSection eyebrow="Most loved" title="Best Sellers" query={{ tag: 'bestseller', limit: 10 }} viewAll="/best-sellers" />
      <CollectionBanner slug="bridal" variant="bridal" fallbackTitle="Bridal Collection" fallbackText="Statement pieces chosen to complete your bridal look." />
      <CollectionBanner slug="festive" variant="festive" fallbackTitle="Festive Collection" fallbackText="Celebration-ready jewellery for festivals and family gatherings." />
      <ShopByOccasion />
      <ProductSection eyebrow="Handpicked" title="Featured Products" query={{ tag: 'featured', limit: 8 }} viewAll="/shop" layout="grid" showCategory />
      <WhyDara />
      <HappyCustomers />
      <Newsletter />
    </>
  )
}
