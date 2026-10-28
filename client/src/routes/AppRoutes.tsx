import { lazy, Suspense, type ComponentType } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { StoreLayout } from '../layouts/StoreLayout'
import { AccountLayout, RequireAuth } from '../layouts/AccountLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { PageLoader } from '../components/ui/States'
import HomePage from '../pages/HomePage'

/** Lazy-load a named export so each page group becomes its own chunk. */
function lazyNamed<M extends Record<string, unknown>>(loader: () => Promise<M>, name: keyof M) {
  return lazy(() => loader().then((m) => ({ default: m[name] as ComponentType<Record<string, unknown>> })))
}

const catalog = () => import('../pages/CatalogPages')
const ShopAllPage = lazyNamed(catalog, 'ShopAllPage')
const NewArrivalsPage = lazyNamed(catalog, 'NewArrivalsPage')
const BestSellersPage = lazyNamed(catalog, 'BestSellersPage')
const CategoryPage = lazyNamed(catalog, 'CategoryPage')
const CollectionPage = lazyNamed(catalog, 'CollectionPage')
const CollectionsIndexPage = lazyNamed(catalog, 'CollectionsIndexPage')
const OccasionPage = lazyNamed(catalog, 'OccasionPage')
const OccasionsIndexPage = lazyNamed(catalog, 'OccasionsIndexPage')
const SearchPage = lazyNamed(catalog, 'SearchPage')

const ProductPage = lazy(() => import('../pages/ProductPage'))
const WishlistPage = lazy(() => import('../pages/WishlistPage'))
const CartPage = lazy(() => import('../pages/CartPage'))
const OrderConfirmationPage = lazy(() => import('../pages/OrderConfirmationPage'))
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'))

const checkout = () => import('../pages/CheckoutPages')
const CheckoutAddressPage = lazyNamed(checkout, 'CheckoutAddressPage')
const CheckoutPaymentPage = lazyNamed(checkout, 'CheckoutPaymentPage')

const auth = () => import('../pages/AuthPages')
const LoginPage = lazyNamed(auth, 'LoginPage')
const SignupPage = lazyNamed(auth, 'SignupPage')
const VerifySignupPage = lazyNamed(auth, 'VerifySignupPage')
const ForgotPasswordPage = lazyNamed(auth, 'ForgotPasswordPage')

const account = () => import('../pages/account/AccountPages')
const ProfilePage = lazyNamed(account, 'ProfilePage')
const AddressesPage = lazyNamed(account, 'AddressesPage')
const OrdersPage = lazyNamed(account, 'OrdersPage')
const OrderDetailPage = lazyNamed(account, 'OrderDetailPage')

const info = () => import('../pages/InfoPages')
const AboutPage = lazyNamed(info, 'AboutPage')
const ContactPage = lazyNamed(info, 'ContactPage')
const FaqPage = lazyNamed(info, 'FaqPage')
const PolicyPage = lazyNamed(info, 'PolicyPage')
const HappyCustomersPage = lazyNamed(info, 'HappyCustomersPage')
const CareersPage = lazyNamed(info, 'CareersPage')
const JobDetailPage = lazyNamed(info, 'JobDetailPage')

const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'))
const adminOrders = () => import('../pages/admin/AdminOrders')
const AdminOrdersPage = lazyNamed(adminOrders, 'AdminOrdersPage')
const AdminOrderDetailPage = lazyNamed(adminOrders, 'AdminOrderDetailPage')
const adminProducts = () => import('../pages/admin/AdminProducts')
const AdminProductsPage = lazyNamed(adminProducts, 'AdminProductsPage')
const AdminProductEditPage = lazyNamed(adminProducts, 'AdminProductEditPage')
const adminMisc = () => import('../pages/admin/AdminMisc')
const AdminCatalogPage = lazyNamed(adminMisc, 'AdminCatalogPage')
const AdminCustomersPage = lazyNamed(adminMisc, 'AdminCustomersPage')
const AdminReviewsPage = lazyNamed(adminMisc, 'AdminReviewsPage')
const AdminInboxPage = lazyNamed(adminMisc, 'AdminInboxPage')
const AdminCareersPage = lazyNamed(adminMisc, 'AdminCareersPage')

export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Admin (role-gated in AdminLayout and on the API) */}
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductEditPage />} />
          <Route path="products/:id" element={<AdminProductEditPage />} />
          <Route path="catalog" element={<AdminCatalogPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="reviews" element={<AdminReviewsPage />} />
          <Route path="inbox" element={<AdminInboxPage />} />
          <Route path="careers" element={<AdminCareersPage />} />
        </Route>

        <Route element={<StoreLayout />}>
          <Route index element={<HomePage />} />

          {/* Catalogue */}
          <Route path="shop" element={<ShopAllPage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="necklaces" element={<Navigate to="/category/necklaces" replace />} />
          <Route path="earrings" element={<Navigate to="/category/earrings" replace />} />
          <Route path="bangles" element={<Navigate to="/category/bangles" replace />} />
          <Route path="accessories" element={<Navigate to="/category/accessories" replace />} />
          <Route path="new-arrivals" element={<NewArrivalsPage />} />
          <Route path="best-sellers" element={<BestSellersPage />} />
          <Route path="collections" element={<CollectionsIndexPage />} />
          <Route path="collections/:slug" element={<CollectionPage />} />
          <Route path="bridal" element={<CollectionPage slug="bridal" />} />
          <Route path="festive" element={<CollectionPage slug="festive" />} />
          <Route path="wedding-store" element={<Navigate to="/collections" replace />} />
          <Route path="occasions" element={<OccasionsIndexPage />} />
          <Route path="occasions/:slug" element={<OccasionPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="product/:slug" element={<ProductPage />} />

          {/* Shopping */}
          <Route path="wishlist" element={<WishlistPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<RequireAuth><CheckoutAddressPage /></RequireAuth>} />
          <Route path="checkout/payment" element={<RequireAuth><CheckoutPaymentPage /></RequireAuth>} />
          <Route path="order-confirmation/:id" element={<RequireAuth><OrderConfirmationPage /></RequireAuth>} />

          {/* Auth & account */}
          <Route path="login" element={<LoginPage />} />
          <Route path="login/verify" element={<Navigate to="/login" replace />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="signup/verify" element={<VerifySignupPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="account" element={<AccountLayout />}>
            <Route index element={<Navigate to="/account/orders" replace />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="addresses" element={<AddressesPage />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
          </Route>

          {/* Information */}
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="faq" element={<FaqPage />} />
          <Route path="shipping-policy" element={<PolicyPage policy="shipping" />} />
          <Route path="returns" element={<PolicyPage policy="returns" />} />
          <Route path="privacy-policy" element={<PolicyPage policy="privacy" />} />
          <Route path="terms" element={<PolicyPage policy="terms" />} />
          <Route path="happy-customers" element={<HappyCustomersPage />} />
          <Route path="careers" element={<CareersPage />} />
          <Route path="careers/:slug" element={<JobDetailPage />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
