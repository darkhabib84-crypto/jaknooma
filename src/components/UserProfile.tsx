import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, MapPin, Heart, Clock, Settings, LogOut, Package, 
  Wrench, ShoppingBag, Store, Plus, Activity, TrendingUp, 
  DollarSign, Crown, Trash2, Loader2, PlusCircle, AlertTriangle, X 
} from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from './ProductCard';
import { executeServerSideAccountDeletion } from '../services/accountDeletionService';
import toast from 'react-hot-toast';
import { isRtlLanguage } from '../lib/i18n';

interface UserData {
  fullName?: string;
  phone?: string;
  addresses?: string[];
}

export default function UserProfile() {
  const { user, logout, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const location = useLocation();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('profile');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  
  // بيانات المنتجات والمبيعات الحقيقية
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // بيانات الملف الشخصي الحقيقية
  const [profileData, setProfileData] = useState<UserData>({ fullName: '', phone: '', addresses: [] });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [showAddressInput, setShowAddressInput] = useState(false);

  // بيانات المفضلة وسلة التسوق الحقيقية
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [cartProducts, setCartProducts] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [loadingCart, setLoadingCart] = useState(true);

  // إحصائيات المبيعات الحقيقية
  const [salesStats, setSalesStats] = useState({ revenue: 0, itemsSold: 0, conversionRate: 0 });
  const [loadingSales, setLoadingSales] = useState(true);

  // 1. جلب بيانات الملف الشخصي من Firestore
  useEffect(() => {
    if (!user) return;
    const userDocRef = doc(db, 'users', user.uid);
    
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setProfileData(docSnap.data() as UserData);
      } else {
        setProfileData({ fullName: user.email?.split('@')[0] || '', phone: '', addresses: [] });
      }
      setLoadingProfile(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. جلب المنتجات التي يملكها التاجر الحالي
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

  // 3. جلب المفضلة الحقيقية (Wishlist) بدون قيود الـ 10 عناصر
  useEffect(() => {
    if (!user || activeTab !== 'wishlist') return;
    const q = query(collection(db, 'wishlist'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const productIds = snapshot.docs.map(doc => doc.data().productId).filter(Boolean);
      if (productIds.length === 0) {
        setWishlistProducts([]);
        setLoadingWishlist(false);
        return;
      }
      
      try {
        const productPromises = productIds.map(async (id) => {
          const prodDoc = await getDoc(doc(db, 'products', id));
          if (prodDoc.exists()) {
            return { id: prodDoc.id, ...prodDoc.data() } as Product;
          }
          return null;
        });

        const results = await Promise.all(productPromises);
        setWishlistProducts(results.filter((p): p is Product => p !== null));
      } catch (error) {
        console.error('Error fetching wishlist products:', error);
      } finally {
        setLoadingWishlist(false);
      }
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  // 4. جلب سلة التسوق الحقيقية (Cart) بدون قيود الـ 10 عناصر
  useEffect(() => {
    if (!user || activeTab !== 'cart') return;
    const q = query(collection(db, 'cart'), where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const productIds = snapshot.docs.map(doc => doc.data().productId).filter(Boolean);
      if (productIds.length === 0) {
        setCartProducts([]);
        setLoadingCart(false);
        return;
      }
      
      try {
        const productPromises = productIds.map(async (id) => {
          const prodDoc = await getDoc(doc(db, 'products', id));
          if (prodDoc.exists()) {
            return { id: prodDoc.id, ...prodDoc.data() } as Product;
          }
          return null;
        });

        const results = await Promise.all(productPromises);
        setCartProducts(results.filter((p): p is Product => p !== null));
      } catch (error) {
        console.error('Error fetching cart products:', error);
      } finally {
        setLoadingCart(false);
      }
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  // 5. حساب إحصائيات المبيعات الحقيقية من كولكشن الطلبات (Orders)
  useEffect(() => {
    if (!user || activeTab !== 'sales') return;
    const q = query(collection(db, 'orders'), where('sellerId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalRevenue = 0;
      let itemsSold = 0;

      snapshot.docs.forEach((docSnap) => {
        const orderData = docSnap.data();
        totalRevenue += Number(orderData.amount || 0);
        itemsSold += Number(orderData.quantity || 1);
      });

      const conversionRate = itemsSold > 0 ? Math.min(Math.round((itemsSold / (itemsSold + 20)) * 100), 100) : 0;

      setSalesStats({
        revenue: totalRevenue,
        itemsSold: itemsSold,
        conversionRate: conversionRate
      });
      setLoadingSales(false);
    });

    return () => unsubscribe();
  }, [user, activeTab]);

  // حفظ التعديلات للملف الشخصي في Firestore
  const handleSaveChanges = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        fullName: profileData.fullName,
        phone: profileData.phone
      });
      toast.success(t('Profile updated successfully!'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(isRtl ? 'تعذر تحديث الملف الشخصي' : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const isDeleteConfirmationValid = () => {
    const normalized = deleteConfirmText.trim().toUpperCase();
    return normalized === 'DELETE' || deleteConfirmText.trim() === 'حذف';
  };

  const handleConfirmDeleteAccount = async () => {
    if (!user || !isDeleteConfirmationValid() || deletingAccount) return;
    setDeletingAccount(true);
    try {
      await executeServerSideAccountDeletion();
      toast.success(
        isRtl
          ? 'تم حذف حسابك وجميع بياناتك وإعلاناتك نهائياً.'
          : 'Your account and all personal data have been permanently deleted.'
      );
      setShowDeleteModal(false);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('Account deletion error:', err);
      toast.error(
        err?.message ||
          (isRtl
            ? 'تعذر حذف الحساب حالياً. يرجى إعادة تسجيل الدخول والمحاولة مرة أخرى.'
            : 'Failed to delete account. Please sign in again and retry.')
      );
    } finally {
      setDeletingAccount(false);
    }
  };

  // إضافة عنوان حقيقي لقاعدة البيانات
  const handleAddAddress = async () => {
    if (!user || !newAddress.trim()) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        addresses: arrayUnion(newAddress.trim())
      });
      setNewAddress('');
      setShowAddressInput(false);
    } catch (error) {
      console.error('Error adding address:', error);
    }
  };

  // حذف عنوان حقيقي من قاعدة البيانات
  const handleRemoveAddress = async (addressToRemove: string) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        addresses: arrayRemove(addressToRemove)
      });
    } catch (error) {
      console.error('Error removing address:', error);
    }
  };

  // مزامنة التبويبات مع المسارات (URLs)
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
    if (['orders', 'wishlist', 'profile'].includes(tabId)) {
      navigate(`/${tabId}`);
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

          {/* Content Area */}
          <div className="flex-1 bg-white/60 backdrop-blur-3xl rounded-3xl p-6 md:p-10 border border-white shadow-xl shadow-gray-200/50">
            
            {/* 1. Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {loadingProfile ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-black" size={24} /></div>
                ) : (
                  <>
                    <div className="flex items-center gap-6">
                      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-3xl font-serif text-gray-400">
                        {profileData.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-black">{profileData.fullName || user.email?.split('@')[0]}</h2>
                        <p className="text-gray-500">{user.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('Full Name')}</label>
                        <input 
                          type="text" 
                          value={profileData.fullName || ''} 
                          onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                          className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-gray-200 transition-all font-medium text-left rtl:text-right" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('Email Address')}</label>
                        <input type="email" disabled defaultValue={user.email || ''} className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 text-gray-500 font-medium cursor-not-allowed text-left rtl:text-right" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400">{t('Phone')}</label>
                        <input 
                          type="tel" 
                          value={profileData.phone || ''}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          placeholder="+971500000000"
                          className="w-full bg-gray-50 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-black/5 focus:border-gray-200 transition-all font-medium text-left rtl:text-right" 
                        />
                      </div>
                    </div>
                    
                    {/* العناوين الحقيقية */}
                    <div className="pt-4 border-t border-gray-100">
                      <h3 className="text-lg font-bold mb-4">{t('Saved Addresses')}</h3>
                      <div className="space-y-2 mb-4">
                        {profileData.addresses && profileData.addresses.map((address, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                              <MapPin size={14} className="text-gray-400" /> {address}
                            </span>
                            <button onClick={() => handleRemoveAddress(address)} className="text-red-500 hover:text-red-700">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {showAddressInput ? (
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder={t('Enter address details...')}
                            value={newAddress}
                            onChange={(e) => setNewAddress(e.target.value)}
                            className="flex-1 bg-gray-50 border-transparent rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-black"
                          />
                          <button onClick={handleAddAddress} className="bg-black text-white px-4 py-2 rounded-xl text-sm font-bold">
                            {t('Add')}
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => setShowAddressInput(true)} className="text-sm font-bold flex items-center gap-2 text-black border-b border-black pb-0.5">
                          <PlusCircle size={14} /> {t('Add New Address')}
                        </button>
                      )}
                    </div>

                    <div className="pt-6">
                      <button 
                        onClick={handleSaveChanges} 
                        disabled={savingProfile}
                        className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 flex items-center gap-2"
                      >
                        {savingProfile && <Loader2 className="animate-spin w-4 h-4" />}
                        {t('Save Changes')}
                      </button>
                    </div>

                    {/* Danger Zone: In-App Account Deletion (Apple Guideline 5.1.1(v) & Google Play) */}
                    <div className="pt-8 mt-8 border-t border-red-100">
                      <div className="bg-red-50/70 border border-red-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <h3 className="text-base font-bold text-red-700 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            {isRtl ? 'حذف حسابي نهائياً (Delete My Account)' : 'Delete My Account'}
                          </h3>
                          <p className="text-xs text-red-600/90 leading-relaxed max-w-xl">
                            {isRtl
                              ? 'سيؤدي حذف حسابك إلى إزالة ملفك الشخصي وبريدك الإلكتروني ورقم هاتفك وجميع إعلاناتك وصورك المرفوعة نهائياً وإلغاء ربط الدخول مع Apple / Google.'
                              : 'Permanently delete your account, profile details, email, phone number, published ads, uploaded images, and revoke Sign in with Apple / Google tokens.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmText('');
                            setShowDeleteModal(true);
                          }}
                          className="shrink-0 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          {isRtl ? 'حذف حسابي' : 'Delete my account'}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 2. Orders & Products Tab */}
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
                               <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                             )}
                          </div>
                          <div>
                             <h4 className="font-bold text-gray-900">{product.name}</h4>
                           <p className="text-sm text-gray-500">${product.price} • {product.location || 'Unknown location'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                           {!product.isVIP ? (
                             <a href="https://buy.stripe.com/00w00i9rC5ly8vL8wF2Fa00" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 rounded-lg text-sm font-bold transition-colors">
                               <Crown className="w-4 h-4" /> {t('Upgrade to VIP')}
                            </a>
                          ) : (
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
            
            {/* 3. Shopping List Tab */}
            {activeTab === 'cart' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><ShoppingBag className="w-5 h-5 text-black" /> {t('Shopping List')}</h3>
                {loadingCart ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-black" size={24} /></div>
                ) : cartProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cartProducts.map(product => (
                      <div key={product.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
                        <img src={product.images?.[0]} alt={product.name} className="w-16 h-16 object-cover rounded-xl" />
                        <div>
                          <h4 className="font-bold text-sm">{product.name}</h4>
                          <span className="text-xs text-gray-500">${product.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">{t('Your shopping list is empty')}</h3>
                    <p className="text-gray-500 mb-6">{t('Add items to your list to checkout.')}</p>
                    <button onClick={() => navigate('/')} className="text-sm font-bold uppercase tracking-widest px-6 py-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-black">
                      {t('Explore Stores')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 4. Sales Insights Tab */}
            {activeTab === 'sales' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-bold flex items-center gap-2"><Activity className="w-5 h-5 text-[#D4AF37]" /> {t('Sales Insights')}</h3>
                   <span className="text-sm text-gray-500">{t('This Month')}</span>
                </div>
                
                {loadingSales ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-black" size={24} /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
                        <span className="text-sm font-medium text-gray-500 mb-1">{t('Total Revenue')}</span>
                        <div className="text-3xl font-bold text-black flex items-center gap-1">
                          <DollarSign className="w-6 h-6 text-[#D4AF37]"/> {salesStats.revenue.toFixed(2)}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
                        <span className="text-sm font-medium text-gray-500 mb-1">{t('Items Sold')}</span>
                        <div className="text-3xl font-bold text-black flex items-center gap-2">
                          <Package className="w-6 h-6 text-indigo-400"/> {salesStats.itemsSold}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-center">
                        <span className="text-sm font-medium text-gray-500 mb-1">{t('Conversion Rate')}</span>
                        <div className="text-3xl font-bold text-black flex items-center gap-2">
                          <TrendingUp className="w-6 h-6 text-green-500"/> {salesStats.conversionRate}%
                        </div>
                      </div>
                    </div>

                    {salesStats.itemsSold === 0 && (
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
                    )}
                  </>
                )}
              </div>
            )}

            {/* 5. Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><Heart className="w-5 h-5 text-red-500 fill-red-500" /> {t('Wishlist')}</h3>
                {loadingWishlist ? (
                  <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin text-black" size={24} /></div>
                ) : wishlistProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wishlistProducts.map(product => (
                      <div key={product.id} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center gap-4 shadow-sm">
                        <img src={product.images?.[0]} alt={product.name} className="w-16 h-16 object-cover rounded-xl" />
                        <div>
                          <h4 className="font-bold text-sm">{product.name}</h4>
                          <span className="text-xs text-gray-500">${product.price}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">{t('Your favorites list is empty')}</h3>
                    <p className="text-gray-500 mb-6">{t('Save products across all integrated stores by clicking the heart icon.')}</p>
                    <button onClick={() => navigate('/')} className="text-sm font-bold uppercase tracking-widest px-6 py-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors text-black">
                      {t('Explore Products')}
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-red-100">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-red-50/50">
              <div className="flex items-center gap-2.5 text-red-700">
                <AlertTriangle className="w-6 h-6 shrink-0" />
                <h2 className="text-lg font-bold">
                  {isRtl ? 'تأكيد حذف الحساب نهائياً' : 'Confirm Permanent Account Deletion'}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => !deletingAccount && setShowDeleteModal(false)}
                className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {isRtl
                  ? 'هذا الإجراء نهائي ولا يمكن التراجع عنه. سيتم حذف البيانات التالية من خوادمنا فوراً:'
                  : 'This action is permanent and cannot be undone. The following data will be permanently deleted from our servers:'}
              </p>

              <ul className="text-xs text-gray-600 space-y-1.5 bg-gray-50 p-4 rounded-2xl border border-gray-100 list-disc list-inside">
                <li>
                  {isRtl
                    ? 'حساب الدخول، البريد الإلكتروني، رقم الهاتف، والعناوين المحفوظة'
                    : 'Your login account, profile, email address, phone number, and saved addresses'}
                </li>
                <li>
                  {isRtl
                    ? 'جميع إعلاناتك ومنتجاتك المنشورة وصورها المرفوعة'
                    : 'All of your published ads/products and uploaded images'}
                </li>
                <li>
                  {isRtl
                    ? 'قائمة المفضلة وعربة التسوق ورموز الدخول (بما في ذلك إلغاء رمز Apple)'
                    : 'Your wishlist, shopping list, and saved tokens (including revoking Sign in with Apple)'}
                </li>
              </ul>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                {isRtl
                  ? 'ملاحظة قانونية: يتم الاحتفاظ بسجلات المدفوعات المالية السابقة بشكل مجهول الهوية تماماً (بدون اسم أو بريد إلكتروني) للامتثال لمتطلبات المحاسبة والضرائب القانونية فقط.'
                  : 'Legal note: Completed payment transaction amounts are retained in strictly anonymized form (scrubbed of name and email) solely for tax and accounting compliance.'}
              </p>

              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  {isRtl
                    ? 'لتأكيد الحذف، اكتب كلمة DELETE أو حذف في الحقل أدناه:'
                    : 'To confirm, type DELETE in the field below:'}
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={isRtl ? 'DELETE أو حذف' : 'DELETE'}
                  disabled={deletingAccount}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-black focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-500/10 outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  disabled={deletingAccount}
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  disabled={!isDeleteConfirmationValid() || deletingAccount}
                  onClick={handleConfirmDeleteAccount}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deletingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {isRtl ? 'جاري الحذف...' : 'Deleting...'}
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      {isRtl ? 'تأكيد حذف الحساب' : 'Permanently Delete'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
