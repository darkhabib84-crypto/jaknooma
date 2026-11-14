import { X, Plus, Trash2, Home, ChevronDown, ChevronRight, Store, SlidersHorizontal } from 'lucide-react';
import { useSearchParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useUI } from '../contexts/UIContext';
import { motion, AnimatePresence } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../hooks/useCategories';
import { getIconComponent } from '../lib/categories';
import { Logo } from './Logo';
import { isRtlLanguage } from '../lib/i18n';

interface SidebarProps {
  drawerOnly?: boolean;
}

export default function Sidebar({ drawerOnly = false }: SidebarProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isMobileMenuOpen, setMobileMenuOpen } = useUI();
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const { user, openAuthModal, logout, isAdmin } = useAuth();
  const { categories, saveCategories } = useCategories();

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // Inline forms for admin
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatEn, setNewCatEn] = useState('');
  const [newCatAr, setNewCatAr] = useState('');
  
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [newSubEn, setNewSubEn] = useState('');
  const [newSubAr, setNewSubAr] = useState('');

  const currentCategory = searchParams.get('category') || '';
  const currentSub = searchParams.get('sub') || searchParams.get('brand') || '';

  useEffect(() => {
    if (currentCategory) {
      setExpandedCategory(currentCategory);
    }
  }, [currentCategory]);

  const getLocalizedCatName = (category: any) => {
    if (isRtl) {
      if (category.value === '' || category.name?.en === 'All Categories') {
        return category.name?.ar && category.name.ar !== 'All Categories' ? category.name.ar : t('All Categories');
      }
      return category.name?.ar || t(category.name?.en || category.value) || category.name?.en;
    }
    return category.name?.en || t(category.value) || category.name?.ar;
  };

  const handleCategoryClick = (value: string, hasSub: boolean) => {
    if (hasSub) {
      setExpandedCategory(expandedCategory === value ? null : value);
    }
    
    if (location.pathname !== '/') {
      const params = new URLSearchParams();
      if (value) params.set('category', value);
      navigate(`/?${params.toString()}`);
      setMobileMenuOpen(false);
      return;
    }

    if (value) {
      searchParams.set('category', value);
      searchParams.delete('sub');
      searchParams.delete('brand');
    } else {
      searchParams.delete('category');
      searchParams.delete('sub');
      searchParams.delete('brand');
    }
    searchParams.delete('store');
    setSearchParams(searchParams);
    
    if (!hasSub) {
      setMobileMenuOpen(false);
    }
  };

  const handleSubClick = (catValue: string, sub: string) => {
    if (location.pathname !== '/') {
      const params = new URLSearchParams();
      params.set('category', catValue);
      params.set('sub', sub);
      navigate(`/?${params.toString()}`);
      setMobileMenuOpen(false);
      return;
    }
    searchParams.set('category', catValue);
    searchParams.set('sub', sub);
    setSearchParams(searchParams);
    setMobileMenuOpen(false);
  };

  // Admin Actions
  const handleAddCategory = () => {
    if (!newCatEn || !newCatAr) return;
    const newCat = {
      id: Date.now().toString(),
      name: { en: newCatEn, ar: newCatAr },
      value: newCatEn,
      iconName: 'LayoutList',
      sub: []
    };
    saveCategories([...categories, newCat]);
    setIsAddingCategory(false);
    setNewCatEn('');
    setNewCatAr('');
  };

  const handleDeleteCategory = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    saveCategories(categories.filter(c => c.id !== catId));
  };

  const handleAddSubCategory = (catId: string) => {
    if (!newSubEn || !newSubAr) return;
    const mapped = categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          sub: [...(c.sub || []), { en: newSubEn, ar: newSubAr }]
        };
      }
      return c;
    });
    saveCategories(mapped);
    setAddingSubTo(null);
    setNewSubEn('');
    setNewSubAr('');
  };

  const handleDeleteSubCategory = (catId: string, subEn: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const mapped = categories.map(c => {
      if (c.id === catId) {
        return {
          ...c,
          sub: (c.sub || []).filter(s => s.en !== subEn)
        };
      }
      return c;
    });
    saveCategories(mapped);
  };

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('overflow-hidden');
    } else {
      document.body.classList.remove('overflow-hidden');
    }
    return () => document.body.classList.remove('overflow-hidden');
  }, [isMobileMenuOpen]);

  const SidebarContent = (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="px-5 md:px-6 flex flex-col gap-8 min-h-max pb-8 pt-2">
      {/* Mobile Auth Actions - Top */}
      <div className="lg:hidden pb-6 border-b border-gray-100 -mt-2">
        {user ? (
          <div className="space-y-4">
            <Link 
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 w-full"
            >
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-serif text-black border border-gray-200">
                {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col text-start">
                <span className="text-xs text-gray-500">{t('Welcome')}</span>
                <span className="text-sm font-semibold text-black">{user.displayName || user.email?.split('@')[0]}</span>
              </div>
            </Link>
            <button 
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              className="text-sm font-bold text-red-500 w-full py-2.5 rounded-xl hover:bg-red-50 transition-colors text-start px-3"
            >
              {t('Log Out')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                openAuthModal('login');
                setMobileMenuOpen(false);
              }}
              className="text-sm font-medium text-black w-full py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-center"
            >
              {t('Log in')}
            </button>
            <button 
              onClick={() => {
                openAuthModal('signup');
                setMobileMenuOpen(false);
              }}
              className="text-sm font-bold text-white w-full py-2.5 rounded-xl bg-black hover:bg-gray-800 transition-colors shadow-sm text-center"
            >
              {t('Sign up')}
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <div className="pb-6 border-b border-gray-100">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-4 flex items-center justify-between">
            {t('Admin Panel')}
          </h3>
          <ul className="space-y-3 text-sm">
            <li>
              <Link 
                to="/admin/stores"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 w-full text-start font-medium transition-all group p-3 rounded-xl bg-[#D4AF37]/5 text-[#D4AF37] hover:bg-[#D4AF37]/10"
              >
                <Store className="w-5 h-5 shrink-0" />
                <span className="font-bold">{t('Store Management')}</span>
              </Link>
            </li>
          </ul>
        </div>
      )}

      <div className="lg:hidden pb-2">
        <ul className="space-y-3 text-sm">
          <li>
            <Link 
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 w-full text-start font-medium transition-all text-gray-600 hover:text-black"
            >
              <Home className="w-4 h-4 shrink-0" />
              <span className="flex-1">{t('Home')}</span>
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5 text-start">
          {t('Shop by Category')}
        </h3>
        <ul className="space-y-3.5 text-sm">
          {categories.map((category) => {
            const isActive = currentCategory === category.value;
            const hasSub = Boolean(category.sub && category.sub.length > 0);
            const isExpanded = expandedCategory === category.value;
            const catName = getLocalizedCatName(category);
            const IconComp = getIconComponent(category.iconName);
            
            return (
              <li key={category.id} className="flex flex-col">
                <div className="flex items-center w-full group">
                  <button 
                    onClick={() => handleCategoryClick(category.value, hasSub)}
                    className={`flex items-center gap-3 flex-1 text-start font-medium transition-all py-1 cursor-pointer ${
                      isActive && !hasSub ? 'text-black font-bold' : 'text-gray-600 hover:text-black'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-black'}`} />
                    <span className={`flex-1 ${isActive ? 'text-black font-bold' : ''}`}>{catName}</span>
                    {hasSub && (
                      isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                      ) : (
                        <ChevronRight className={`w-4 h-4 text-gray-400 shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
                      )
                    )}
                  </button>
                  {isAdmin && category.value !== '' && (
                    <button onClick={(e) => handleDeleteCategory(category.id, e)} className="p-1 text-red-300 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Subcategories Dropdown */}
                {((hasSub && isExpanded) || (isAdmin && isExpanded)) && (
                  <ul className={`mt-2.5 ${isRtl ? 'mr-7 pr-3 border-r' : 'ml-7 pl-3 border-l'} border-gray-100 space-y-2.5`}>
                    {category.sub?.map(sub => {
                      const subName = isRtl ? (sub.ar || sub.en) : (sub.en || sub.ar);
                      const isSubActive = currentSub === sub.en || currentSub === sub.ar;
                      return (
                        <li key={sub.en} className="flex items-center">
                          <button
                            onClick={() => handleSubClick(category.value, isRtl ? sub.ar : sub.en)}
                            className={`text-sm font-medium transition-colors flex-1 text-start cursor-pointer ${
                              isSubActive ? 'text-black font-bold' : 'text-gray-500 hover:text-black'
                            }`}
                          >
                            {subName}
                          </button>
                          {isAdmin && (
                            <button onClick={(e) => handleDeleteSubCategory(category.id, sub.en, e)} className="p-1 text-red-300 hover:text-red-600 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </li>
                      );
                    })}
                    {isAdmin && (
                      <li>
                        {addingSubTo === category.id ? (
                          <div className="flex flex-col gap-2 mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <input type="text" placeholder="EN Name" value={newSubEn} onChange={e => setNewSubEn(e.target.value)} className="text-xs p-1 border rounded w-full" />
                            <input type="text" placeholder="AR Name" value={newSubAr} onChange={e => setNewSubAr(e.target.value)} className="text-xs p-1 border rounded w-full text-right" dir="rtl" />
                            <div className="flex gap-2">
                              <button onClick={() => handleAddSubCategory(category.id)} className="text-xs font-bold text-white bg-black px-2 py-1 rounded">Save</button>
                              <button onClick={() => setAddingSubTo(null)} className="text-xs text-gray-500">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setAddingSubTo(category.id)} className="flex items-center gap-1 text-xs text-[#D4AF37] font-bold hover:text-black transition-colors mt-2">
                            <Plus className="w-3 h-3" /> Add Sub
                          </button>
                        )}
                      </li>
                    )}
                  </ul>
                )}
              </li>
            );
          })}
          
          {/* Add Category (Admin) */}
          {isAdmin && (
            <li>
              {isAddingCategory ? (
                <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 mt-2">
                  <span className="text-xs font-bold text-gray-700">Add Category</span>
                  <input type="text" placeholder="EN Name" value={newCatEn} onChange={e => setNewCatEn(e.target.value)} className="text-sm p-2 border rounded w-full" />
                  <input type="text" placeholder="AR Name" value={newCatAr} onChange={e => setNewCatAr(e.target.value)} className="text-sm p-2 border rounded w-full text-right" dir="rtl" />
                  <div className="flex gap-2">
                    <button onClick={handleAddCategory} className="text-xs font-bold text-white bg-black px-3 py-1.5 rounded flex-1">Save</button>
                    <button onClick={() => setIsAddingCategory(false)} className="text-xs text-gray-500 px-2">Cancel</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setIsAddingCategory(true)} className="flex items-center gap-2 w-full p-2 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-black hover:border-black transition-colors justify-center text-sm font-bold mt-2">
                  <Plus className="w-4 h-4" /> Add Category
                </button>
              )}
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile & Tablet Horizontal Category Bar (only on main storefront when not drawerOnly) */}
      {!drawerOnly && location.pathname === '/' && (
        <div dir={isRtl ? 'rtl' : 'ltr'} className="lg:hidden w-full bg-white border-b border-gray-100 px-3 py-2.5">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide no-scrollbar">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-black text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>{t('Categories')}</span>
            </button>

            {categories.map((category) => {
              const isActive = currentCategory === category.value;
              const catName = getLocalizedCatName(category);
              const IconComp = getIconComponent(category.iconName);
              return (
                <button
                  key={category.id}
                  onClick={() => handleCategoryClick(category.value, false)}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all border cursor-pointer ${
                    isActive
                      ? 'bg-[#D4AF37]/15 border-[#D4AF37] text-black font-bold'
                      : 'bg-gray-50 border-gray-200/80 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <IconComp className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                  <span className="whitespace-nowrap">{catName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Desktop Static Sidebar (hidden on mobile & tablet so products get full screen width) */}
      {!drawerOnly && (
        <aside
          dir={isRtl ? 'rtl' : 'ltr'}
          className="hidden lg:flex flex-col w-64 xl:w-72 bg-white/60 backdrop-blur-md border-e border-gray-100 shrink-0 overflow-y-auto pt-6 pb-8 z-10 custom-scrollbar"
        >
          {SidebarContent}
        </aside>
      )}

      {/* Slide-over Drawer for Mobile & Tablet */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] lg:hidden"
            />
            <motion.aside
              dir={isRtl ? 'rtl' : 'ltr'}
              initial={{ x: isRtl ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isRtl ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed inset-y-0 ${isRtl ? 'right-0' : 'left-0'} w-[290px] max-w-[85vw] bg-white z-[80] lg:hidden shadow-2xl flex flex-col overflow-y-auto pt-6 pb-8`}
            >
              <div className="flex justify-between items-center px-6 mb-6 mt-1">
                <Logo onClick={() => setMobileMenuOpen(false)} />
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100">
                  <X className="w-6 h-6" />
                </button>
              </div>
              {SidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
