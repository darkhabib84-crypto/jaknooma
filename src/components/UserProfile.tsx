import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, MapPin, Heart, Clock, Settings, LogOut, Package, Wrench, ShoppingBag, Store, Plus, Activity, TrendingUp, DollarSign, Crown } from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from './ProductCard';

export default function UserProfile() {
  const { user, logout, isAdmin } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setMyProducts(products);
      setLoadingProducts(false);
    });
    return () => unsubscribe();
  }, [user]);

  // Sync tab with URL
  useEffect(() => {
    if (location.pathname === '/orders') {
      setActiveTab('orders');
    } else if (location.pathname === '/wishlist') {
      setActiveTab('wishlist');
    } else if (location.pathname === '/profile') {
      setActiveTab('profile');
    }
  }, [location.pathname]);

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === 'orders') {
      navigate('/orders');
    } else if (tabId === 'wishlist') {
      navigate('/wishlist');
    } else if (tabId === 'profile') {
      navigate('/profile');
    } else if (tabId === 'admin-stores') {
      navigate('/admin/stores');
    } else if (tabId === 'admin-payments') {
      navigate('/admin/payments');
    } else if (tabId === 'add-product') {
      navigate('/add-product');
    }
  };

  if (!user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="flex-1 bg-[#FAFAFA] min-h-[calc(100vh-64px)] overflow-y-auto w-full">
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        <h1 className="text-3xl md:text-5xl font-serif text-black mb-8">{t('My Account')}</h1>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 shrink-0 space-y-2">
            {[
              { id: 'profile', label: 'Profile Settings', icon: Settings },
              { id: 'orders', label: 'My Orders / Goods', icon: Package },
              { id: 'sales', label: 'My Sales Insights', icon: Activity },
              { id: 'add-product', label: 'Add Product (Affiliate)', icon: Plus },
              { id: 'cart', label: 'Shopping List', icon: ShoppingBag },
              { id: 'wishlist', label: 'Favorites (Wishlist)', icon: Heart },
              ...(isAdmin ? [
                 { id: 'admin-stores', label: 'Store Management', icon: Store },
                 { id: 'admin-payments', label: 'Admin Payments', icon: DollarSign }
              ] : [])
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium transition-colors ${
                    activeTab === tab.id 
                      ? 'bg-black text-white shadow-lg shadow-black/10' 
                      : 'text-gray-600 hover:bg-white hover:text-black hover:shadow-sm'
                  }`}
                >
                  <Icon className="w-5 h-5 rtl:ml-2" />
                  {t(tab.label)}
                </button>
              );
            })}
            
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left font-medium text-red-500 hover:bg-red-50 transition-colors mt-8"
            >
              <LogOut className="w-5 h-5 rtl:ml-2" />
              {t('Log Out')}
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 bg-white/60 backdrop-blur-3xl rounded-3xl p-6 md:p-10 border border-white shadow-xl shadow-gray-200/50">
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-3xl font-serif text-gray-400">
                    {user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-black">{user.email?.split('@')[0]}</h2>
                    <p className="text-gray-500">{user.email}</p>
                    <button className="mt-3 text-sm font-bold uppercase tracking-widest text-black border-b border-black pb-0.5">
                      {t('Edit Photo')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('Full Name')}</label>
                    <input type="text" defaultValue="John Doe" className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-gray-200 transition-all font-medium text-left rtl:text-right" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('Email Address')}</label>
                    <input type="email" disabled defaultValue={user.email || ''} className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 text-gray-500 font-medium cursor-not-allowed text-left rtl:text-right" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('Phone (Optional)')}</label>
                    <input type="tel" className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-gray-200 transition-all font-medium text-left rtl:text-right" />
                  </div>
                </div>
                
                <h3 className="text-lg font-bold mt-8 mb-4">{t('Saved Addresses & Payment')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <button className="h-32 text-sm font-bold uppercase tracking-widest bg-gray-50 hover:bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors text-black border border-dashed border-gray-300">
                     <MapPin className="w-6 h-6" />
                     {t('Add New Address')}
                   </button>
                   <button className="h-32 text-sm font-bold uppercase tracking-widest bg-gray-50 hover:bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 transition-colors text-black border border-dashed border-gray-300">
                     <Settings className="w-6 h-6" />
                     {t('Add Payment Method')}
                   </button>
                </div>

                <div className="pt-6">
                  <button className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                    {t('Save Changes')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                   <h3 className="text-xl font-bold flex items-center gap-2"><Package className="w-5 h-5 text-indigo-500" /> {t('My Goods')}</h3>
                   <button onClick={() => navigate('/add-product')} className="text-sm font-bold bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2">
                     <Plus className="w-4 h-4" /> {t('Add Product')}
                   </button>
                </div>
                
                {loadingProducts ? (
                   <div className="animate-pulse space-y-4">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="h-24 bg-gray-100 rounded-2xl w-full"></div>
                     ))}
                   </div>
                ) : myProducts.length > 0 ? (
                   <div className="space-y-4">
                     {myProducts.map(product => (
                       <div key={product.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between shadow-sm">
                         <div className="flex items-center gap-4">
                           <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden shrink-0">
                             {product.images && product.images[0] && (
                               <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover" />
                             )}
                           </div>
                           <div>
                             <h4 className="font-bold text-gray-900">{product.title}</h4>
                             <p className="text-sm text-gray-500">{product.price} • {product.category}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           {!product.isVIP && (
                             <a href="https://buy.stripe.com/00w00i9rC5ly8vL8wF2Fa00" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-sm font-bold transition-colors">
                               <Crown className="w-4 h-4" /> {t('Upgrade to VIP')}
                             </a>
                           )}
                           {product.isVIP && (
                             <span className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg text-xs font-bold uppercase tracking-wider">
                               <Crown className="w-3.5 h-3.5" /> VIP
                             </span>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                ) : (
                  <div className="text-center py-20">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">{t('No active goods')}</h3>
                    <p className="text-gray-500 mb-6">{t('When you add a product, it will appear here.')}</p>
                    <button onClick={() => navigate('/add-product')} className="text-sm font-bold uppercase tracking-widest px-6 py-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-black">
                      {t('Add Product')}
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'cart' && (
              <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{t('Your shopping list is empty')}</h3>
                <p className="text-gray-500 mb-6">{t('Add items to your list to checkout.')}</p>
                <button onClick={() => navigate('/')} className="text-sm font-bold uppercase tracking-widest px-6 py-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-black">
                  {t('Explore Stores')}
                </button>
              </div>
            )}

            {activeTab === 'sales' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-[#D4AF37]" /> {t('Sales Insights')}</h3>
                   <span className="text-sm text-gray-500">{t('This Month')}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
                    <span className="text-sm font-medium text-gray-500 mb-1">{t('Total Revenue')}</span>
                    <div className="text-3xl font-bold text-black flex items-center gap-1"><DollarSign className="w-6 h-6 text-[#D4AF37]"/> 0.00</div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
                    <span className="text-sm font-medium text-gray-500 mb-1">{t('Items Sold')}</span>
                    <div className="text-3xl font-bold text-black flex items-center gap-2"><Package className="w-6 h-6 text-indigo-400"/> 0</div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
                    <span className="text-sm font-medium text-gray-500 mb-1">{t('Conversion Rate')}</span>
                    <div className="text-3xl font-bold text-black flex items-center gap-2"><TrendingUp className="w-6 h-6 text-green-500"/> 0%</div>
                  </div>
                </div>

                <div className="text-center py-12">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                     <TrendingUp className="w-8 h-8 text-gray-400" />
                   </div>
                   <h4 className="text-lg font-bold mb-2">{t('No sales data yet')}</h4>
                   <p className="text-gray-500 max-w-sm mx-auto">{t('Start adding your affiliate products. Once they are purchased, your commissions and sales will appear here.')}</p>
                   <button onClick={() => navigate('/add-product')} className="mt-6 text-sm font-bold uppercase tracking-widest px-6 py-3 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-lg shadow-black/10">
                     {t('Add Product (Affiliate)')}
                   </button>
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">{t('Your favorites list is empty')}</h3>
                <p className="text-gray-500 mb-6">{t('Save products across all integrated stores (Amazon, Temu, AliExpress) by clicking the heart icon.')}</p>
                <button onClick={() => navigate('/')} className="text-sm font-bold uppercase tracking-widest px-6 py-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-black">
                  {t('Explore Products')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
