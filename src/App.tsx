import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, MotionConfig } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { RequireAdmin, RequireCustomer, RequireStaff, RedirectIfAdminAuth, RedirectIfAuth } from '@/features/auth/Guards'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { CartDrawer } from '@/features/cart/CartDrawer'
import { WhatsAppFAB } from '@/components/shared/WhatsAppFAB'
import { FlutterwaveScript } from '@/components/shared/FlutterwaveScript'
import { ConfirmProvider } from '@/components/shared/ConfirmProvider'

// Public pages
import HomePage from '@/pages/HomePage'
import ShopPage from '@/pages/ShopPage'
import ProductPage from '@/pages/ProductPage'
import LaunchEditionPage from '@/pages/LaunchEditionPage'
import AboutPage from '@/pages/AboutPage'
import FaqPage from '@/pages/FaqPage'
import ContactPage from '@/pages/ContactPage'
import SizeGuidePage from '@/pages/SizeGuidePage'
import TermsPage from '@/pages/TermsPage'
import PrivacyPage from '@/pages/PrivacyPage'
import ShippingReturnsPage from '@/pages/ShippingReturnsPage'

// Auth pages
import LoginPage from '@/pages/LoginPage'
import AdminLoginPage from '@/pages/AdminLoginPage'
import AdminForgotPasswordPage from '@/pages/AdminForgotPasswordPage'
import SignupPage from '@/pages/SignupPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'

// Account pages
import AccountPage from '@/pages/account/AccountPage'
import OrdersPage from '@/pages/account/OrdersPage'
import OrderDetailPage from '@/pages/account/OrderDetailPage'

// Checkout pages
import CheckoutPage from '@/pages/CheckoutPage'
import OrderConfirmationPage from '@/pages/OrderConfirmationPage'

// Admin pages
import AdminLayout from '@/pages/admin/AdminLayout'
import AdminOverviewPage from '@/pages/admin/AdminOverviewPage'
import AdminOrdersPage from '@/pages/admin/AdminOrdersPage'
import AdminOrderDetailPage from '@/pages/admin/AdminOrderDetailPage'
import AdminProductsPage from '@/pages/admin/AdminProductsPage'
import AdminInventoryPage from '@/pages/admin/AdminInventoryPage'
import AdminProductFormPage from '@/pages/admin/AdminProductFormPage'
import AdminCustomersPage from '@/pages/admin/AdminCustomersPage'
import AdminSettingsPage from '@/pages/admin/AdminSettingsPage'
import AdminContentPage from '@/pages/admin/AdminContentPage'
import AdminAnalyticsPage from '@/pages/admin/AdminAnalyticsPage'

import NotFoundPage from '@/pages/NotFoundPage'

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname])

  return null
}

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-site">
      <Navbar />
      <main className="page-shell">{children}</main>
      <Footer />
      <CartDrawer />
      <WhatsAppFAB />
    </div>
  )
}

function HeaderOnlyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="public-site">
      <Navbar />
      <main className="page-shell">{children}</main>
      <CartDrawer />
    </div>
  )
}

export default function App() {
  const location = useLocation()

  return (
    <MotionConfig reducedMotion="never">
      <AuthProvider>
        <ConfirmProvider>
          <ScrollToTop />
          <FlutterwaveScript />
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                fontFamily: "'Outfit', sans-serif",
                fontSize: '13px',
                letterSpacing: '0.02em',
                borderRadius: '2px',
                background: '#0A0A0A',
                color: '#F5F0E8',
              },
            }}
          />

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            >
              <Routes location={location}>
              {/* Public */}
              <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
              <Route path="/shop" element={<PublicLayout><ShopPage /></PublicLayout>} />
              <Route path="/product/:slug" element={<PublicLayout><ProductPage /></PublicLayout>} />
              <Route path="/collections/launch-edition" element={<PublicLayout><LaunchEditionPage /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
              <Route path="/faq" element={<PublicLayout><FaqPage /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
              <Route path="/size-guide" element={<PublicLayout><SizeGuidePage /></PublicLayout>} />
              <Route path="/terms" element={<PublicLayout><TermsPage /></PublicLayout>} />
              <Route path="/privacy" element={<PublicLayout><PrivacyPage /></PublicLayout>} />
              <Route path="/shipping-returns" element={<PublicLayout><ShippingReturnsPage /></PublicLayout>} />

              {/* Auth */}
              <Route path="/login" element={<RedirectIfAuth><HeaderOnlyLayout><LoginPage /></HeaderOnlyLayout></RedirectIfAuth>} />
              <Route path="/admin/login" element={<RedirectIfAdminAuth><AdminLoginPage /></RedirectIfAdminAuth>} />
              <Route path="/admin/forgot-password" element={<RedirectIfAdminAuth><AdminForgotPasswordPage /></RedirectIfAdminAuth>} />
              <Route path="/signup" element={<RedirectIfAuth><HeaderOnlyLayout><SignupPage /></HeaderOnlyLayout></RedirectIfAuth>} />
              <Route path="/forgot-password" element={<HeaderOnlyLayout><ForgotPasswordPage /></HeaderOnlyLayout>} />

              {/* Account */}
              <Route path="/account" element={<RequireCustomer><PublicLayout><AccountPage /></PublicLayout></RequireCustomer>} />
              <Route path="/account/orders" element={<RequireCustomer><PublicLayout><OrdersPage /></PublicLayout></RequireCustomer>} />
              <Route path="/account/orders/:id" element={<RequireCustomer><PublicLayout><OrderDetailPage /></PublicLayout></RequireCustomer>} />

              {/* Checkout */}
              <Route path="/checkout" element={<RequireCustomer><PublicLayout><CheckoutPage /></PublicLayout></RequireCustomer>} />
              <Route path="/order-confirmation/:id" element={<RequireCustomer><PublicLayout><OrderConfirmationPage /></PublicLayout></RequireCustomer>} />

              {/* Admin */}
              <Route path="/admin" element={<RequireStaff><AdminLayout /></RequireStaff>}>
                <Route index element={<AdminOverviewPage />} />
                <Route path="orders" element={<AdminOrdersPage />} />
                <Route path="orders/:id" element={<AdminOrderDetailPage />} />
                <Route path="products" element={<AdminProductsPage />} />
                <Route path="inventory" element={<AdminInventoryPage />} />
                <Route path="products/new" element={<AdminProductFormPage />} />
                <Route path="products/:id/edit" element={<AdminProductFormPage />} />
                <Route path="customers" element={<AdminCustomersPage />} />
                <Route path="settings" element={<RequireAdmin><AdminSettingsPage /></RequireAdmin>} />
                <Route path="content" element={<AdminContentPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
              </Route>

                <Route path="*" element={<PublicLayout><NotFoundPage /></PublicLayout>} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </ConfirmProvider>
      </AuthProvider>
    </MotionConfig>
  )
}
