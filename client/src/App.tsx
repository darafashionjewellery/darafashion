import { BrowserRouter } from 'react-router'
import { ToastProvider } from './context/ToastContext'
import { SiteProvider } from './context/SiteContext'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { QuickViewProvider } from './components/product/QuickView'
import { AppRoutes } from './routes/AppRoutes'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SiteProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <QuickViewProvider>
                  <AppRoutes />
                </QuickViewProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </SiteProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
