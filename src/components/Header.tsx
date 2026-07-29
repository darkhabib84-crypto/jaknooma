import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, LogOut, X, Globe, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useUI } from '../contexts/UIContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../contexts/CartContext';

import StoreFilter from './StoreFilter';
import { Logo } from './Logo';

export default function Header() {
  const { user, isAdmin, openAuthModal, logout } = useAuth();
  const { setCartOpen, isMobileMenuOpen, setMobileMenuOpen, searchQuery, setSearchQuery } = useUI();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [isLangMenuOpen, setLangMenuOpen] = useState(false);
  const { cart } = useCart();

  // تنفيذ عملية البحث عند النقر على الزر أو الضغط على Enter
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      navigate(`/?q=${encodeURIComponent(query)}`);
      setMobileMenuOpen(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    document.documentElement.dir = ['ar', 'ur'].includes(lng) ? 'rtl' : 'ltr';
    setLangMenuOpen(false);
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Chinese' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'ur', name: 'Urdu' },
  ];

  const isRtl = ['ar', 'ur'].includes(i18n.language);

  return (
    <header dir="ltr" className="sticky top-0 z-[60] w-full border-b border-gray-100 bg-white/80 backdrop-blur-md shrink-0">
      <div className="flex h-16 items-center px-4 md:px-8 gap-4">
        <button 
          onClick={() => {
            if (location.pathname !== '/') {
              navigate('/');
            } else {
              setMobileMenuOpen(!isMobileMenuOpen);
            }
          }}
          className="md:hidden p-2 -ml-2 text-gray-800 hover:text-black transition-colors"
          aria-label="Toggle menu"
        >
          {location.pathname !== '/' ? <Menu className="h-6 w-6" /> : (isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />)}
        </button>
        
        <Logo onClick={() => setMobileMenuOpen(false)} />

        {/* Desktop Search Bar with Dedicated Search Button */}
        <div className="flex-1 max-w-2xl px-4 md:px-8 hidden md:block">
          <form onSubmit={handleSearch} className="flex items-center gap-2 w-full max-w-lg ml-auto">
            <div className="relative flex-1">
              <input
                type="text"
                dir={isRtl ? 'rtl' : 'ltr'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="block w-full rounded-full border border-gray-200 py-2 px-4 text-sm text-black placeholder-gray-400 bg-gray-50/50 focus:bg-white focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] transition-all text-left rtl:text-right"
                placeholder={t('Search premium products...')}
              />
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="flex items-center justify-center gap-1.5 px-5 py-2 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 shadow-sm"
            >
              <Search className="h-4 w-4" />
              <span>{t('Search')}</span>
            </button>
          </form>
        </div>

        <div className="flex items-center gap-4 md:gap-6 ml-auto relative">
          <div className="relative">
            <button 
              onClick={() => setLangMenuOpen(!isLangMenuOpen)}
              className="p-2 text-gray-600 hover:text-black transition-colors flex items-center gap-1 shrink-0"
              title={t('Language')}
            >
              <Globe className="w-5 h-5" />
            </button>
            {isLangMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-36 bg-white border border-gray-100 shadow-xl rounded-xl overflow-hidden py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
                  >
                    {t(lang.name)}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <a 
            href="mailto:jaknooma@gmail.com" 
            className="text-sm font-medium text-gray-600 hover:text-black transition-colors hidden lg:block"
          >
            {t('Support')}
          </a>          
          
          {user ? (
            <div className="flex items-center gap-3 md:gap-4">
              {isAdmin && (
                <Link 
                  to="/admin/stores"
                  className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] px-3 py-1.5 rounded-full border border-[#D4AF37]/20 bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 transition-colors"
                >
                  {t('Admin')}
                </Link>
              )}
              <Link 
                to="/add-product"
                className="text-sm font-medium text-white px-4 py-2 rounded-full bg-black hover:bg-gray-800 transition-colors hidden sm:flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                {t('Add Product')}
              </Link>
              <button 
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors hidden sm:block"
                title="Log Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
              <Link 
                to="/profile"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity hidden sm:flex shrink-0"
              >
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500">{t('Welcome')}</span>
                  <span className="text-sm font-semibold text-black">{user.displayName || user.email?.split('@')[0]}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-serif text-black border border-gray-200">
                  {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              </Link>
            </div>
          ) : (
            <div className="flex bg-gray-50 border border-gray-200 rounded-full p-1 lg:p-1.5 shrink-0 hidden sm:flex">
              <button 
                onClick={() => {
                   openAuthModal('login');
                   setMobileMenuOpen(false);
                }}
                className="text-sm font-medium text-black px-4 py-1.5 lg:py-2 hover:bg-gray-200 rounded-full transition-colors whitespace-nowrap"
              >
                {t('Log in')}
              </button>
              <button 
                onClick={() => {
                   openAuthModal('signup');
                   setMobileMenuOpen(false);
                }}
                className="text-sm font-bold text-white px-5 py-1.5 lg:py-2 rounded-full bg-black hover:bg-gray-800 transition-colors whitespace-nowrap shadow-sm"
              >
                {t('Sign up')}
              </button>
            </div>
          )}

          <button
            onClick={() => setCartOpen(true)}
            className="relative p-2 text-[#D4AF37] hover:text-black transition-colors shrink-0"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Mobile Search Bar with Dedicated Search Button */}
      <div className="md:hidden px-4 pb-3 border-t border-gray-100 pt-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full">
          <div className="relative flex-1">
            <input
              type="text"
              dir={isRtl ? 'rtl' : 'ltr'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="block w-full rounded-full border border-gray-200 py-2 px-4 text-sm text-black placeholder-gray-400 bg-gray-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-stone-300 transition-all text-left rtl:text-right"
              placeholder={t('Search products...')}
            />
          </div>
          <button
            type="submit"
            disabled={!searchQuery.trim()}
            className="flex items-center justify-center p-2.5 bg-black text-white rounded-full hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0"
            aria-label={t('Search')}
          >
            <Search className="h-4 w-4" />
          </button>
        </form>
      </div>

      <StoreFilter />
    </header>
  );
}
