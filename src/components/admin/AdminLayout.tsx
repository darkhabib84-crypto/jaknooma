import React, { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  ShieldAlert,
  Globe,
  Activity,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

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

export default function AdminLayout() {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] text-[#111] font-sans flex overflow-hidden w-full selection:bg-black selection:text-white">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className={`fixed lg:relative top-0 left-0 h-[100dvh] flex flex-col bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full w-[260px] lg:w-auto'}`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold shrink-0">
              J
            </div>
            {(isSidebarOpen || isMobileMenuOpen) && (
              <span className="font-bold text-lg tracking-tight">jaknooma admin</span>
            )}
          </div>
          <button onClick={() => setMobileMenuOpen(false)} className="lg:hidden p-1 text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1 scrollbar-hide">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
            
            return (
              <NavLink
                key={item.id}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${isActive ? 'bg-black text-white shadow-md shadow-black/10' : 'text-gray-500 hover:bg-gray-100/80 hover:text-black'}`}
                title={!isSidebarOpen ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                {(isSidebarOpen || isMobileMenuOpen) && (
                  <span className="font-medium text-sm whitespace-nowrap">{t(item.label)}</span>
                )}
                {!isSidebarOpen && !isMobileMenuOpen && (
                  <div className="absolute left-full ml-4 px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                    {t(item.label)}
                  </div>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-100 mt-auto shrink-0 space-y-1">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors group relative"
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
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200 px-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-2 lg:gap-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="hidden lg:flex p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            
            <div className="hidden sm:flex items-center relative ml-2 lg:ml-4 group">
              <Search className="w-4 h-4 absolute left-3 text-gray-400 group-focus-within:text-black transition-colors" />
              <input 
                type="text" 
                placeholder="Search admin..." 
                className="w-64 pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black focus:bg-white transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="h-6 w-px bg-gray-200 mx-1 hidden sm:block"></div>
            <button className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded-full transition-colors pr-3 sm:pr-4">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-gray-100 border border-gray-200 overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=Admin&background=random`} alt="Admin" className="w-full h-full object-cover" />
              </div>
              <span className="text-sm font-medium hidden sm:block truncate max-w-[100px]">Admin</span>
            </button>
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
               transition={{ duration: 0.3, ease: 'easeOut' }}
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
