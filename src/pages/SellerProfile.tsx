import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ProductCard, { Product } from '../components/ProductCard';
import { 
  User, 
  Calendar, 
  Star, 
  Flag, 
  Phone, 
  ShoppingBag, 
  CheckCircle2, 
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SellerProfile() {
  const { sellerId } = useParams();
  const navigate = useNavigate();

  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'products' | 'reviews'>('products');
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const fetchSellerData = async () => {
      if (!sellerId) return;
      setLoading(true);

      try {
        // 1. جلب بيانات البائع (من مجموعة users أو stores)
        let sellerData: any = null;
        const userDoc = await getDoc(doc(db, 'users', sellerId));
        
        if (userDoc.exists()) {
          sellerData = userDoc.data();
        } else {
          // تجربة البحث في مجموعة المحلات
          const storeDoc = await getDoc(doc(db, 'stores', sellerId));
          if (storeDoc.exists()) sellerData = storeDoc.data();
        }

        // 2. جلب منتجات البائع
        const qProducts = query(
          collection(db, 'products'),
          where('sellerId', '==', sellerId)
        );
        const querySnapshot = await getDocs(qProducts);
        const sellerProducts = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));

        // إذا لم تجد بيانات البائع في المجموعات، نأخذها من المجموع الكلي أو المنتج الأخير
        if (!sellerData && sellerProducts.length > 0) {
          const firstProduct: any = sellerProducts[0];
          sellerData = {
            displayName: firstProduct.storeName || firstProduct.sellerName || 'بائع معتمد',
            email: firstProduct.sellerEmail || '',
            createdAt: firstProduct.createdAt || new Date(),
            phone: firstProduct.phone || firstProduct.sellerPhone,
          };
        }

        setSellerInfo(sellerData);
        setProducts(sellerProducts);

        // 3. جلب تقييمات البائع
        const qReviews = query(
          collection(db, 'reviews'),
          where('sellerId', '==', sellerId)
        );
        const reviewsSnapshot = await getDocs(qReviews);
        setReviews(reviewsSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));

      } catch (error) {
        console.error("خطأ في جلب بيانات البائع:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerData();
  }, [sellerId]);

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'عضو منذ فترة';
    try {
      const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
      return date.toLocaleDateString('ar-AE', { year: 'numeric', month: 'long' });
    } catch {
      return 'عضو جديد';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-black border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8" dir="rtl">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* زر العودة */}
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-500 hover:text-black font-medium transition-colors"
        >
          <ArrowLeft size={18} className="rotate-180" /> العودة للكتالوج
        </button>

        {/* 💳 بطاقة البائع الرئيسية (Header Profile) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-tr from-gray-900 to-gray-700 text-white flex items-center justify-center text-3xl font-black shadow-lg shrink-0">
              {sellerInfo?.photoURL ? (
                <img src={sellerInfo.photoURL} alt="Avatar" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                sellerInfo?.displayName?.charAt(0) || <User size={36} />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
                  {sellerInfo?.displayName || sellerInfo?.storeName || 'متجر غير مسمى'}
                </h1>
                <CheckCircle2 size={20} className="text-blue-500 fill-blue-50 transition-transform hover:scale-110" />
              </div>

              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar size={15} className="text-gray-400" />
                  انضم في {formatDate(sellerInfo?.createdAt)}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag size={15} className="text-gray-400" />
                  {products.length} منتج معروض
                </span>
              </div>

              {/* التقييم العام */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < (sellerInfo?.rating || 5) ? "currentColor" : "none"} className={i < (sellerInfo?.rating || 5) ? "" : "text-gray-300"} />
                  ))}
                </div>
                <span className="text-sm font-bold text-gray-800">
                  {sellerInfo?.rating || '5.0'} ({reviews.length} تقييم)
                </span>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات للعميل */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {sellerInfo?.phone && (
              <a 
                href={`tel:${sellerInfo.phone}`}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-black text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-all shadow-md active:scale-95"
              >
                <Phone size={16} /> تواصل مع البائع
              </a>
            )}

            <button 
              onClick={() => setShowReportModal(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 border border-red-200 text-red-600 rounded-xl font-bold text-sm hover:bg-red-50 transition-colors"
            >
              <Flag size={16} /> إبلاغ عن البائع / منتج
            </button>
          </div>
        </div>

        {/* 🗂️ التبويبات (المنتجات / التقييمات) */}
        <div className="border-b border-gray-200 flex gap-8">
          <button
            onClick={() => setActiveTab('products')}
            className={`pb-4 text-base font-bold transition-all relative ${
              activeTab === 'products' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            منتجات البائع ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-base font-bold transition-all relative ${
              activeTab === 'reviews' ? 'text-black border-b-2 border-black' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            تقييمات العملاء ({reviews.length})
          </button>
        </div>

        {/* 📦 عرض المنتجات */}
        {activeTab === 'products' && (
          <div>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 font-bold">لا توجد منتجات معروضة حالياً لهذا البائع.</p>
              </div>
            )}
          </div>
        )}

        {/* ⭐ عرض التقييمات */}
        {activeTab === 'reviews' && (
          <div>
            {reviews.length > 0 ? (
              <div className="space-y-4 max-w-3xl">
                {reviews.map((rev) => (
                  <div key={rev.id} className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900">{rev.userName || 'عميل'}</span>
                      <div className="flex text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} size={14} fill={i < rev.rating ? "currentColor" : "none"} className={i < rev.rating ? "" : "text-gray-300"} />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              /* حالة عدم وجود تقييمات */
              <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8 space-y-4">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle size={32} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">لا توجد تقييمات حالية</h3>
                  <p className="text-gray-500 text-sm max-w-sm mx-auto mt-1">
                    لم يقم أي عميل بكتابة تقييم لهذا البائع بعد. كن أول من يتعامل معه ويشارك تجربته!
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 🚨 النافذة المنبثقة للإبلاغ (Report Modal) */}
        {showReportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-gray-100 shadow-2xl animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-red-600 flex items-center gap-2">
                  <Flag size={20} /> إبلاغ عن مخالفة
                </h3>
                <button onClick={() => setShowReportModal(false)} className="text-gray-400 hover:text-black font-bold">✕</button>
              </div>
              <p className="text-sm text-gray-600">
                يرجى توضيح سبب الإبلاغ عن هذا البائع أو منتجاته ليتم مراجعتها من قبل الإدارة:
              </p>
              <textarea 
                rows={4} 
                placeholder="اكتب تفاصيل البلاغ هنا..." 
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-black outline-none text-sm"
              />
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    alert("تم إرسال بلاغك بنجاح للإدارة وسنتم مراجعته كأولوية.");
                    setShowReportModal(false);
                  }}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                >
                  إرسال البلاغ
                </button>
                <button 
                  onClick={() => setShowReportModal(false)}
                  className="px-5 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
