import { Search, Menu, X, Plus, Trash2, Home, Briefcase, Tv, Sofa, Shirt, Sparkles, Baby, Bike, Gamepad2, BookOpen, PawPrint, Wrench, Utensils, HeartPulse, Download, Users, LayoutGrid, ChevronDown, ChevronRight, Store, User } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { useStores } from '../hooks/useStores';
import { useUI } from '../contexts/UIContext';
import { motion, AnimatePresence } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useCategories } from '../hooks/useCategories';
import { getIconComponent } from '../lib/categories';
import { Logo, LogoIcon } from './Logo';

export default function Sidebar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { stores, loadingStores } = useStores();
  const { isMobileMenuOpen, setMobileMenuOpen } = useUI();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
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
  const currentMin = searchParams.get('minPrice') || '';
  const currentMax = searchParams.get('maxPrice') || '';
  const currentStore = searchParams.get('store');

  useEffect(() => {
    if (currentCategory) {
      setExpandedCategory(currentCategory);
    }
  }, [currentCategory]);

  const handleStoreClick = (value: string) => {
    if (value) {
      searchParams.set('store', value);
    } else {
      searchParams.delete('store');
    }
    setSearchParams(searchParams);
    setMobileMenuOpen(false);
  };

  const handleCategoryClick = (value: string, hasSub: boolean) => {
    if (hasSub) {
       setExpandedCategory(expandedCategory === value ? null : value);
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
    setSearchParams(searchParams);
    
    if (!hasSub) {
        setMobileMenuOpen(false);
    }
  };

  const handleSubClick = (catValue: string, sub: string) => {
    searchParams.set('category', catValue);
    searchParams.set('sub', sub);
    setSearchParams(searchParams);
    setMobileMenuOpen(false);
  };

  const handlePriceChange = (type: 'minPrice' | 'maxPrice', value: string) => {
    if (value) {
      searchParams.set(type, value);
    } else {
      searchParams.delete(type);
    }
    setSearchParams(searchParams);
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
        }
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
        }
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
    <div className="px-5 md:px-6 flex flex-col gap-10 min-h-max pb-8 pt-2">
      {/* Mobile Auth Actions - Top */}
      <div className="md:hidden pb-8 border-b border-gray-100 -mt-2">
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
                <div className="flex flex-col text-left rtl:text-right">
                  <span className="text-xs text-gray-500">{t('Welcome')}</span>
                  <span className="text-sm font-semibold text-black">{user.displayName || user.email?.split('@')[0]}</span>
                </div>
              </Link>
              <button 
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="text-sm font-bold text-red-500 w-full py-2.5 rounded-xl hover:bg-red-50 transition-colors text-left rtl:text-right px-3 -ml-3"
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
        <div className="pb-8 border-b border-gray-100">
           <h3 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-5 flex items-center justify-between">
            {t('Admin Panel')}
            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span>
          </h3>
          <ul className="space-y-4 text-sm">
             <li>
               <Link 
                  to="/admin/stores"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center w-full text-left rtl:text-right font-medium transition-all group p-3 rounded-xl bg-[#D4AF37]/5 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                >
                  <Store className="w-5 h-5 mr-3 rtl:ml-3 shrink-0" />
                  <span className="font-bold">{t('Store Management')}</span>
                </Link>
             </li>
          </ul>
        </div>
      )}

      <div className="md:hidden pb-4">
        <ul className="space-y-4 text-sm">
          <li>
            <Link 
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center w-full text-left rtl:text-right font-medium transition-all text-gray-500 hover:text-black rtl:hover:-translate-x-1 hover:translate-x-1"
            >
              <Home className="w-4 h-4 rtl:ml-3 mr-3 shrink-0" />
              <span className="flex-1">{t('Home')}</span>
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
          {t('Shop by Category')}
        </h3>
        <ul className="space-y-4 text-sm">
          {categories.map((category) => {
            const isActive = currentCategory === category.value;
            const hasSub = category.sub && category.sub.length > 0;
            const isExpanded = expandedCategory === category.value;
            const catName = isAr ? category.name.ar : category.name.en;
            const IconComp = getIconComponent(category.iconName);
            
            return (
              <li key={category.id} className="flex flex-col">
                <div className="flex items-center w-full group">
                  <button 
                    onClick={() => handleCategoryClick(category.value, hasSub || false)}
                    className={`flex items-center flex-1 rtl:text-right text-left font-medium transition-all ${
                      isActive && !hasSub ? 'text-black' : 'text-gray-500 hover:text-black rtl:hover:-translate-x-1 hover:translate-x-1'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 rtl:ml-3 mr-3 shrink-0 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-black'}`} />
                    <span className={`flex-1 ${isActive ? 'text-black' : ''}`}>{catName}</span>
                    {hasSub && (
                      isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 rtl:rotate-180 text-gray-400 shrink-0" />
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
                  <ul className="mt-3 ml-7 rtl:ml-0 rtl:mr-7 pl-3 rtl:pl-0 rtl:pr-3 border-l rtl:border-l-0 rtl:border-r border-gray-100 space-y-3">
                    {category.sub?.map(sub => {
                       const subName = isAr ? sub.ar : sub.en;
                       return (
                       <li key={sub.en} className="flex items-center">
                         <button
                           onClick={() => handleSubClick(category.value, subName)}
                           className={`text-sm font-medium transition-colors flex-1 text-left rtl:text-right ${
                              currentSub === subName ? 'text-black font-bold' : 'text-gray-500 hover:text-black'
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
                       )
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
                           <button onClick={() => setAddingSubTo(category.id)} className="flex items-center text-xs text-[#D4AF37] font-bold hover:text-black transition-colors mt-2">
                             <Plus className="w-3 h-3 mr-1 rtl:ml-1" /> Add Sub
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
                 <button onClick={() => setIsAddingCategory(true)} className="flex items-center w-full p-2 border border-dashed border-gray-300 rounded-xl text-gray-500 hover:text-black hover:border-black transition-colors justify-center text-sm font-bold mt-2">
                   <Plus className="w-4 h-4 mr-2 rtl:ml-2" /> Add Category
                 </button>
               )}
            </li>
          )}
        </ul>
      </div>

      <div>
         <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
          {t('Shop by Store')}
        </h3>
        <ul className="space-y-4 text-sm">
           <li key="all-stores">
              <button 
                onClick={() => handleStoreClick('jaknooma')}
                className={`flex items-center w-full text-left rtl:text-right font-medium transition-all group ${
                  currentStore === 'jaknooma' ? 'text-black' : 'text-gray-500 hover:text-black rtl:hover:-translate-x-1 hover:translate-x-1'
                }`}
              >
                <div className={`w-4 h-4 overflow-hidden rounded-sm mr-3 rtl:ml-3 ${currentStore === 'jaknooma' ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}>
                   <LogoIcon />
                </div>
                <span>{t('Jaknooma')}</span>
              </button>
           </li>
          {!loadingStores && stores.map((store) => {
            const isActive = currentStore === store.id;
            return (
              <li key={store.id}>
                <button 
                  onClick={() => handleStoreClick(store.id)}
                  className={`flex items-center w-full text-left rtl:text-right font-medium transition-all group ${
                    isActive ? 'text-black' : 'text-gray-500 hover:text-black rtl:hover:-translate-x-1 hover:translate-x-1'
                  }`}
                >
                  {store.logo ? (
                     <img src={store.logo} alt={store.name} className={`w-4 h-4 mr-3 rtl:ml-3 rounded-sm object-contain ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`} />
                  ) : (
                     <Store className={`w-4 h-4 mr-3 rtl:ml-3 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-black'}`} />
                  )}
                  <span>{store.name}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div>
         <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
          {t('Price Range')}
        </h3>
         <div className="space-y-6">
            <div className="flex items-center gap-3">
              <input 
                type="number" 
                placeholder={t('Min')} 
                value={currentMin}
                onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                className="w-full text-sm py-2 px-3 border border-gray-200 rounded-xl bg-gray-50 text-black placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-left rtl:text-right" 
              />
              <span className="text-gray-400">-</span>
              <input 
                type="number" 
                placeholder={t('Max')} 
                value={currentMax}
                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                className="w-full text-sm py-2 px-3 border border-gray-200 rounded-xl bg-gray-50 text-black placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black/5 transition-all text-left rtl:text-right" 
              />
            </div>
         </div>
      </div>

      <div className="mb-8">
         <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">
          {t('Sustainability')}
        </h3>
        <div className="bg-black/5 p-5 rounded-2xl border border-black/5 hover:border-black/10 transition-colors">
          <p className="text-sm leading-relaxed text-gray-600 mb-3">{t('All our products are sourced from zero-waste artisan studios')}</p>
          <a href="#" className="text-sm font-bold underline text-black">{t('Our Manifesto')}</a>
        </div>
      </div>
      
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex flex-col w-72 bg-white/50 backdrop-blur-md border-r rtl:border-r-0 rtl:border-l border-gray-100 shrink-0 overflow-y-auto pt-6 pb-8 z-10 custom-scrollbar">
        {SidebarContent}
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-[80] md:hidden shadow-2xl flex flex-col overflow-y-auto pt-6 pb-8"
            >
              <div className="flex justify-between items-center px-6 mb-8 mt-2">
                <Logo onClick={() => setMobileMenuOpen(false)} />
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 -mr-2 text-gray-400 hover:text-black">
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
