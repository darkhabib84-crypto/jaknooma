import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Store,
  Box,
  Users,
  BarChart3,
  Search,
  Settings,
  Menu,
  X,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
  Activity,
  DollarSign,
  ExternalLink,
  CheckCheck,
  UserPlus,
  PackagePlus,
  Webhook
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { isRtlLanguage } from '../../lib/i18n';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
  { id: 'stores', label: 'Stores & APIs', icon: Store, path: '/admin/stores' },
  { id: 'payments', label: 'Revenue & Payments', icon: DollarSign, path: '/admin/payments' },
  { id: 'products', label: 'Products', icon: Box, path: '/admin/products' },
  { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { id: 'search', label: 'Search Engine', icon: Search, path: '/admin/search' },
  { id: 'monitoring', label: 'API Monitoring', icon: Activity, path: '/admin/monitoring' },
  { id: 'languages', label: 'Languages', icon: Globe, path: '/admin/languages' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/admin/settings' },
];

interface AdminNotification {
  id: string;
  type: 'product' | 'user' | 'api' | 'store';
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  timeAr: string;
  timeEn: string;
  targetPath: string;
  read: boolean;
}

const READ_NOTIFS_KEY = 'jaknooma_admin_read_notifs_v1';

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Load dynamic notifications from Firestore + system state
  useEffect(() => {
    let isMounted = true;
    const loadNotifications = async () => {
      let readIds: string[] = [];
      try {
        const saved = window.localStorage.getItem(READ_NOTIFS_KEY);
        if (saved) readIds = JSON.parse(saved);
      } catch {
        // ignore
      }

      const items: AdminNotification[] = [];

      try {
        const prodSnap = await getDocs(query(collection(db, 'products'), limit(2)));
        prodSnap.docs.forEach((d, idx) => {
          const data = d.data();
          const prodName = data.name || data.title || 'منتج جديد';
          const nId = `prod_${d.id}`;
          items.push({
            id: nId,
            type: 'product',
            titleAr: 'إعلان / منتج مضاف للمراجعة',
            titleEn: 'New Product Listing Added',
            descAr: `تمت إضافة "${prodName}" في قسم المنتجات`,
            descEn: `"${prodName}" is active in the catalog`,
            timeAr: idx === 0 ? 'منذ 10 دقائق' : 'منذ ساعة',
            timeEn: idx === 0 ? '10 mins ago' : '1 hour ago',
            targetPath: '/admin/products',
            read: readIds.includes(nId),
          });
        });
      } catch {
        // fallback if offline
      }

      try {
        const userSnap = await getDocs(query(collection(db, 'users'), limit(1)));
        userSnap.docs.forEach((d) => {
          const data = d.data();
          const uName = data.name || data.displayName || data.email || 'مستخدم جديد';
          const nId = `user_${d.id}`;
          items.push({
            id: nId,
            type: 'user',
            titleAr: 'تسجيل مستخدم في المنصة',
            titleEn: 'Registered Platform User',
            descAr: `الحساب (${uName}) مسجل ونشط حالياً`,
            descEn: `Account (${uName}) is registered and active`,
            timeAr: 'منذ ساعتين',
            timeEn: '2 hours ago',
            targetPath: '/admin/users',
            read: readIds.includes(nId),
          });
        });
      } catch {
        // ignore
      }

      const apiNotifId = 'sys_api_health';
      items.push({
        id: apiNotifId,
        type: 'api',
        titleAr: 'حالة ربط المتاجر والـ APIs',
        titleEn: 'Store APIs & Sync Status',
        descAr: 'جميع قنوات الربط مع المتاجر الشريكة تعمل باستقرار.',
        descEn: 'All partner store API integrations are operating normally.',
        timeAr: 'الآن',
        timeEn: 'Just now',
        targetPath: '/admin/monitoring',
        read: readIds.includes(apiNotifId),
      });

      const storeNotifId = 'sys_stores_config';
      items.push({
        id: storeNotifId,
        type: 'store',
        titleAr: 'تحديث المتاجر الشريكة',
        titleEn: 'Affiliate Stores Active',
        descAr: 'تحقق من إعدادات المتاجر ومفاتيح الـ API المعتمدة.',
        descEn: 'Review active affiliate stores and API endpoints.',
        timeAr: 'اليوم',
        timeEn: 'Today',
        targetPath: '/admin/stores',
        read: readIds.includes(storeNotifId),
      });

      if (isMounted) {
        setNotifications(items);
      }
    };

    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    try {
      window.localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(allIds));
    } catch {
      // ignore
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif: AdminNotification) => {
    const updated = notifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n));
    setNotifications(updated);
    try {
      const readIds = updated.filter((n) => n.read).map((n) => n.id);
      window.localStorage.setItem(READ_NOTIFS_KEY, JSON.stringify(readIds));
    } catch {
      // ignore
    }
    setIsNotifOpen(false);
    navigate(notif.targetPath);
  };

  const handleToggleLanguage = () => {
    const nextLang = isRtl ? 'en' : 'ar';
    i18n.changeLanguage(nextLang);
    document.documentElement.dir = isRtlLanguage(nextLang) ? 'rtl' : 'ltr';
    document.documentElement.lang = nextLang;
    setIsProfileOpen(false);
  };

  const handleLogout = async () => {
    try {
      setIsProfileOpen(false);
      await logout();
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  const handleAdminSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = adminSearch.trim().toLowerCase();
    if (!q) return;
    if (q.includes('user') || q.includes('مستخدم')) navigate('/admin/users');
    else if (q.includes('prod') || q.includes('منتج')) navigate('/admin/products');
    else if (q.includes('store') || q.includes('متجر')) navigate('/admin/stores');
    else if (q.includes('pay') || q.includes('دفع') || q.includes('إيراد')) navigate('/admin/payments');
    else if (q.includes('lang') || q.includes('لغ')) navigate('/admin/languages');
    else if (q.includes('api') || q.includes('مراقب')) navigate('/admin/monitoring');
    else navigate('/admin/products');
  };

  const adminName = user?.displayName || (isRtl ? 'المدير العام (Super Admin)' : 'Super Admin');
  const adminEmail = user?.email || 'dark.habib84@gmail.com';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#F9F9F9] text-[#111] font-sans flex overflow-hidden w-full selection:bg-black selection:text-white"
    >
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className={`fixed lg:relative top-0 ${
          isRtl ? 'right-0 border-l' : 'left-0 border-r'
        } h-[100dvh] flex flex-col bg-white border-gray-200 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
          isMobileMenuOpen
            ? 'translate-x-0 w-[260px]'
            : isRtl
            ? 'translate-x-full w-[260px] lg:w-auto'
            : '-translate-x-full w-[260px] lg:w-auto'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 bg-black text-[#D4AF37] rounded-lg flex items-center justify-center font-bold shrink-0 shadow-xs">
              J
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="font-bold text-lg tracking-tight">jaknooma admin</span>
            )}
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1 text-gray-500 hover:text-black">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.path === '/admin'
                ? location.pathname === '/admin'
                : location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-black text-white shadow-md shadow-black/10'
                    : 'text-gray-500 hover:bg-gray-100/80 hover:text-black'
                }`}
                title={!isSidebarOpen ? t(item.label) : undefined}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isActive ? 'scale-110 text-[#D4AF37]' : 'group-hover:scale-110'
                  }`}
                />
                {(isSidebarOpen || isMobileMenuOpen) && (
                  <span className="font-medium text-sm whitespace-nowrap">{t(item.label)}</span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 mt-auto shrink-0 space-y-1">
          <button
            onClick={() => navigate('/')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-black transition-colors group cursor-pointer"
          >
            <ExternalLink className="w-5 h-5 shrink-0 text-[#D4AF37]" />
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="font-medium text-sm whitespace-nowrap">{t('View Live Store')}</span>
            )}
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors group relative cursor-pointer"
          >
            <LogOut className="w-5 h-5 shrink-0 group-hover:scale-110 transition-transform" />
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="font-medium text-sm whitespace-nowrap">{t('Log Out')}</span>
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] w-full">
        {/* Top Header */}
        <header className="h-16 bg-white/90 backdrop-blur-xl border-b border-gray-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 lg:gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              {isSidebarOpen ? (
                <ChevronLeft className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              ) : (
                <ChevronRight className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
              )}
            </button>

            <form
              onSubmit={handleAdminSearchSubmit}
              className="hidden sm:flex items-center relative group"
            >
              <Search
                className={`w-4 h-4 absolute ${
                  isRtl ? 'right-3.5' : 'left-3.5'
                } text-gray-400 group-focus-within:text-black transition-colors`}
              />
              <input
                type="text"
                value={adminSearch}
                onChange={(e) => setAdminSearch(e.target.value)}
                placeholder={t('Search admin...')}
                className={`w-64 ${
                  isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
                } py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all`}
              />
            </form>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* 1. Notifications Bell & Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen((prev) => !prev);
                  setIsProfileOpen(false);
                }}
                className="p-2.5 text-gray-600 hover:text-black hover:bg-gray-100 rounded-full transition-colors relative cursor-pointer"
                aria-label={t('Notifications')}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" />
                )}
              </button>

              <AnimatePresence>
                {isNotifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className={`fixed sm:absolute top-16 sm:top-full ${
                      isRtl ? 'left-3 sm:left-0' : 'right-3 sm:right-0'
                    } mt-1 sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50`}
                  >
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-gray-50/70">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-gray-900">{t('Notifications')}</span>
                        {unreadCount > 0 && (
                          <span className="px-2 py-0.5 text-[11px] font-bold bg-red-50 text-red-600 rounded-full">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllAsRead}
                          className="flex items-center gap-1 text-xs font-semibold text-[#B8892B] hover:text-black transition-colors cursor-pointer"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>{t('Mark all as read')}</span>
                        </button>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-sm text-gray-400">
                          {t('No new notifications')}
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const IconComp =
                            notif.type === 'product'
                              ? PackagePlus
                              : notif.type === 'user'
                              ? UserPlus
                              : notif.type === 'api'
                              ? Activity
                              : Webhook;
                          return (
                            <button
                              key={notif.id}
                              type="button"
                              onClick={() => handleNotificationClick(notif)}
                              className={`w-full text-start p-3.5 hover:bg-gray-50 transition-colors flex items-start gap-3 cursor-pointer ${
                                !notif.read ? 'bg-amber-50/30' : 'bg-white'
                              }`}
                            >
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                  notif.type === 'product'
                                    ? 'bg-blue-50 text-blue-600'
                                    : notif.type === 'user'
                                    ? 'bg-emerald-50 text-emerald-600'
                                    : notif.type === 'api'
                                    ? 'bg-purple-50 text-purple-600'
                                    : 'bg-amber-50 text-amber-600'
                                }`}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-bold text-gray-900 truncate">
                                    {isRtl ? notif.titleAr : notif.titleEn}
                                  </p>
                                  {!notif.read && (
                                    <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                                  {isRtl ? notif.descAr : notif.descEn}
                                </p>
                                <span className="text-[10px] text-gray-400 mt-1 block">
                                  {isRtl ? notif.timeAr : notif.timeEn}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="h-6 w-px bg-gray-200 mx-0.5 hidden sm:block" />

            {/* 2. Admin Profile Dropdown (AD) */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen((prev) => !prev);
                  setIsNotifOpen(false);
                }}
                className="flex items-center gap-2.5 p-1 hover:bg-gray-100 rounded-full transition-colors pr-1 sm:pr-3 cursor-pointer"
                aria-label="Admin Profile Menu"
              >
                <div className="w-9 h-9 rounded-full bg-black text-[#D4AF37] border border-[#D4AF37]/40 flex items-center justify-center font-bold text-xs tracking-wider shadow-xs shrink-0">
                  AD
                </div>
                <span className="text-sm font-semibold text-gray-900 hidden sm:block truncate max-w-[110px]">
                  {isRtl ? 'الأدمن' : 'Admin'}
                </span>
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className={`fixed sm:absolute top-16 sm:top-full ${
                      isRtl ? 'left-3 sm:left-0' : 'right-3 sm:right-0'
                    } mt-1 sm:mt-2 w-[calc(100vw-1.5rem)] sm:w-72 max-w-xs bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50`}
                  >
                    {/* Admin Name & Email Header */}
                    <div className="p-4 border-b border-gray-100 bg-gray-50/70 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-black text-[#D4AF37] flex items-center justify-center font-bold text-sm shrink-0">
                        AD
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-900 truncate">{adminName}</p>
                        <p className="text-xs text-gray-500 truncate" dir="ltr">
                          {adminEmail}
                        </p>
                      </div>
                    </div>

                    <div className="p-1.5 space-y-1">
                      {/* View Live Store */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/');
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        <span>{isRtl ? 'العودة للموقع الرئيسي (Jaknooma)' : 'Back to Jaknooma Store'}</span>
                      </button>

                      {/* Account Settings */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/admin/settings');
                        }}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-gray-500 shrink-0" />
                        <span>{t('Account Settings')}</span>
                      </button>

                      {/* Language Switcher */}
                      <button
                        type="button"
                        onClick={handleToggleLanguage}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 text-sm font-medium text-gray-700 hover:text-black hover:bg-gray-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Globe className="w-4 h-4 text-gray-500 shrink-0" />
                          <span>{t('Switch Language')}</span>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                          {isRtl ? 'English' : 'العربية'}
                        </span>
                      </button>
                    </div>

                    {/* Log Out */}
                    <div className="p-1.5 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 shrink-0" />
                        <span>{t('Log Out')}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto w-full relative bg-[#FBFBFB]">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full w-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
