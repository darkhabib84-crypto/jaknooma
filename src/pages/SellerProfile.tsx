import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Star, 
  ArrowLeft, 
  Store, 
  Package,
  ShoppingCart
} from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useCart } from '../contexts/CartContext';

export default function SellerProfile() {
  const { sellerId } = useParams<{ sellerId: string }>(); // 👈 التقط Parameter التاجر
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      if (!sellerId) return;
      setLoading(true);

      try {
        // 1. جلب بيانات التاجر من Firebase
        let userSnap = await getDoc(doc(db, 'users', sellerId));
        if (!userSnap.exists()) {
          userSnap = await getDoc(doc(db, 'stores', sellerId));
        }

        if (userSnap.exists()) {
          setSeller({ id: userSnap.id, ...userSnap.data() });
        }

        // 2. جلب كافة منتجات التاجر
        const q = query(
          collection(db, 'products'),
          where('sellerId', '==', sellerId)
        );
        const querySnapshot = await getDocs(q);
        const fetchedProducts = querySnapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
        setProducts(fetchedProducts);

      } catch (error) {
        console.error("Error fetching seller profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-gray-600">جاري تحميل صفحة البائع...</p>
      </div>
    );
  }

  const sellerName = seller?.displayName || seller?.storeName || seller?.name || 'متجر غير معنون';
  const sellerAvatar = seller?.photoURL || seller?.avatar || null;

  return (
    <div className="flex w-full min-h-screen bg-[#FAFAFA]">
      <div className="hidden md:block w-64 border-l border-gray-100 h-screen sticky top-0 shrink-0 overflow-hidden bg-white">
        <Sidebar />
      </div>

      <main className="flex-1 p-6 md:p-10" dir="rtl">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-6 text-gray-500 hover:text-black transition-colors font-medium"
        >
          <ArrowLeft size={18} className="rotate-180" /> العودة
        </button>

        {/* كارت معلومات البائع الهيدر */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm mb-10">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-right">
            {sellerAvatar ? (
              <img src={sellerAvatar} className="w-24 h-24 rounded-2xl object-cover border border-gray-100 shadow-sm" alt={sellerName} />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Store size={40} />
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2">{sellerName}</h1>
              
              <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 text-sm text-gray-500 mb-4">
                <div className="flex items-center gap-1 text-amber-400">
                  <Star size={16} fill="currentColor" />
                  <span className="font-bold text-gray-800">5.0</span>
                  <span className="text-gray-400">(تقييمات المتجر)</span>
                </div>

                {seller?.phone && (
                  <div className="flex items-center gap-1">
                    <Phone size={15} className="text-emerald-600" />
                    <a href={`tel:${seller.phone}`} className="dir-ltr hover:underline font-semibold text-gray-700">{seller.phone}</a>
                  </div>
                )}

                {seller?.location && (
                  <div className="flex items-center gap-1">
                    <MapPin size={15} className="text-red-500" />
                    <span>{seller.location}</span>
                  </div>
                )}
              </div>

              <p className="text-gray-600 text-sm max-w-2xl">{seller?.bio || 'أهلاً بكم في متجري المخصص، يمكنك استعراض كافة المنتجات والتواصل المباشر لشراء الإعلانات.'}</p>
            </div>
          </div>
        </div>

        {/* شبكة جميع منتجات التاجر */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Package size={24} /> جميع إعلانات البائع ({products.length})
          </h2>

          {products.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
              <Package size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-bold">لا توجد منتجات مضافة لهذا البائع حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((prod) => {
                const img = Array.isArray(prod.images) ? prod.images[0] : (prod.imageUrl || prod.images || '/placeholder.png');
                return (
                  <div 
                    key={prod.id} 
                    className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between cursor-pointer"
                    onClick={() => navigate(`/product/${prod.id}`)}
                  >
                    <div>
                      <div className="w-full h-48 bg-gray-50 overflow-hidden">
                        <img src={img} alt={prod.name} className="w-full h-full object-contain p-3 hover:scale-105 transition-transform" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{prod.name}</h3>
                        <p className="text-xs text-gray-500 line-clamp-2 mb-3">{prod.description}</p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 flex items-center justify-between border-t border-gray-50 mt-auto">
                      <span className="font-extrabold text-green-600">{prod.price} {prod.currency || 'AED'}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(prod);
                        }}
                        className="p-2 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors"
                      >
                        <ShoppingCart size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
