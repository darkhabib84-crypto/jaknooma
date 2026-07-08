/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useNavigate, Outlet } from 'react-router-dom';
import './lib/i18n';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ProductGrid from './components/ProductGrid';
import Breadcrumbs from './components/Breadcrumbs';
import Footer from './components/Footer';
import Terms from './components/Terms';
import AdminLayout from './components/admin/AdminLayout';
import DashboardHome from './components/admin/DashboardHome';
import AdminProducts from './components/admin/AdminProducts';
import AdminUsers from './components/admin/AdminUsers';
import AdminAnalytics from './components/admin/AdminAnalytics';
import AdminSearch from './components/admin/AdminSearch';
import AdminSettings from './components/admin/AdminSettings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UIProvider, useUI } from './contexts/UIContext';
import AuthModal from './components/AuthModal';
import { isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { auth } from './lib/firebase';
import AddProductForm from './components/AddProductForm';
import AdminStoreManager from './components/AdminStoreManager';
import AdminPayments from './components/AdminPayments';
import UserProfile from './components/UserProfile';
import { Toaster } from 'react-hot-toast';
import CartDrawer from './components/CartDrawer';
import ApiMonitoring from './components/admin/ApiMonitoring';
import ProductDetails from './pages/ProductDetails';
import Checkout from './pages/Checkout';


function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function MainLayout() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] font-sans flex flex-col relative selection:bg-black selection:text-white">
      <Header />
      <Outlet />
      <AuthModal />
      <CartDrawer />
    </div>
  );
}

function AppContent() {
  useEffect(() => {
    // منطق تسجيل الدخول بالرابط (تم تركه كما هو)
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        email = window.prompt('Please provide your email for confirmation');
      }
      if (email) {
        signInWithEmailLink(auth, email, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForSignIn');
            window.history.replaceState({}, document.title, window.location.pathname);
          })
          .catch((error) => console.error("Error signing in with link", error));
      }
    }
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* المسارات الرئيسية مع الـ Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={
            <div className="flex flex-1 overflow-hidden relative">
              <Sidebar />
              <main className="flex-1 flex flex-col overflow-y-auto w-full relative z-0">
                <Breadcrumbs />
                <ProductGrid />
                <Footer />
              </main>
            </div>
          } />
          
          {/* هنا وضعنا صفحة تفاصيل المنتج لتظهر داخل الـ MainLayout */}
          <Route path="/product/:id" element={<ProductDetails />} />
          
          <Route path="/terms" element={<Terms />} />
          <Route path="/add-product" element={<AddProductForm />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/orders" element={<UserProfile />} />
          <Route path="/wishlist" element={<UserProfile />} />
          <Route path="/login" element={<AuthRedirect mode="login" />} />
          <Route path="/register" element={<AuthRedirect mode="signup" />} />
          <Route path="/forgot-password" element={<AuthRedirect mode="login" />} />
          <Route path="/admin/monitoring" element={<ApiMonitoring />} />
          <Route path="/checkout" element={<Checkout />} />
        </Route>

        {/* مسارات الأدمن المنفصلة */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="stores" element={<AdminStoreManager />} />
          <Route path="payments" element={<AdminPayments />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="search" element={<AdminSearch />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="languages" element={<AdminSettings />} />
        </Route>
      </Routes>
      <Toaster position="bottom-center" toastOptions={{ style: { background: '#111', color: '#fff', borderRadius: '100px', fontSize: '14px', fontWeight: '500' } }} />
    </BrowserRouter>
  );
}


function AuthRedirect({ mode }: { mode: 'login' | 'signup' | 'email-link' | 'phone' }) {
  const { openAuthModal } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    openAuthModal(mode);
    navigate('/', { replace: true });
  }, [mode, openAuthModal, navigate]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <UIProvider>
        <AppContent />
      </UIProvider>
    </AuthProvider>
  );
}

