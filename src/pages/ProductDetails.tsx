import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
// تم إضافة أيقونات إضافية لتنسيق اسم البائع، الموقع، والوقت
import { Share2, ShoppingCart, ExternalLink, ArrowLeft, User, MapPin, Calendar } from 'lucide-react';
import Sidebar from '../components/Sidebar'; 
import 'swiper/css';
import 'swiper/css/navigation';
import { useCart } from '../contexts/CartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'products', id));
        if (docSnap.exists()) setProduct({ id: docSnap.id, ...docSnap.data() });
      } catch (err) { console.error(err); }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (product?.storeId) {
      const fetchRelated = async () => {
        const q = query(collection(db, 'products'), where('storeId', '==', product.storeId), limit(4));
        const snapshot = await getDocs(q);
        setRelatedProducts(snapshot.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.id !== product.id));
      };
      fetchRelated();
    }
  }, [product]);

  const handleShare = async () => {
    try {
      await navigator.share({ title: product.name, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ الرابط!");
    }
  };

  // دالة لتنسيق وعرض تاريخ الإعلان بشكل جميل بالعربية
  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'غير متوفر';
    try {
      // التحقق مما إذا كان التاريخ مرسلاً كـ Firebase Timestamp
      const date = dateInput.toDate ? dateInput.toDate() : new Date(dateInput);
      return date.toLocaleDateString('ar-AE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'تاريخ غير صالح';
    }
  };

  if (loading) return <div className="flex justify-center p-20">جاري التحميل...</div>;
  if (!product) return <div className="text-center p-20">المنتج غير موجود</div>;

  const images = Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      {/* السايدبار ثابت */}
      <div className="hidden md:block w-64 border-r border-gray-200 h-full overflow-y-auto">
        <Sidebar />
      </div>

      {/* المحتوى الرئيسي القابل للتمرير */}
      <main className="flex-1 h-full overflow-y-auto p-6 md:p-10" dir="rtl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-gray-500 hover:text-black transition-colors font-medium">
          <ArrowLeft size={18} className="rotate-180" /> العودة للتسوق
        </button>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl">
          <Swiper navigation={true} modules={[Navigation]} className="h-[400px] w-full rounded-3xl bg-gray-50 shadow-inner">
            {images.map((img: string, i: number) => (
              <SwiperSlide key={i}>
                <img src={img} className="w-full h-full object-contain p-4" alt={product.name} />
              </SwiperSlide>
            ))}
          </Swiper>

          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-3xl text-green-600 font-bold mb-4">{product.price} درهم</p>

              {/* قسم بيانات البائع، الموقع، وتاريخ الإعلان المضاف حديثاً */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
                {/* اسم البائع */}
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-medium">البائع</span>
                    <span className="text-sm font-bold text-gray-700">
                      {product.storeName || product.sellerName || 'بائع غير معروف'}
                    </span>
                  </div>
                </div>

                {/* موقع الإعلان */}
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-medium">الموقع</span>
                    <span className="text-sm font-bold text-gray-700">
                      {product.location || 'غير محدد'}
                    </span>
                  </div>
                </div>

                {/* تاريخ الإعلان */}
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-medium font-sans">تاريخ الإعلان</span>
                    <span className="text-sm font-bold text-gray-700">
                      {formatDate(product.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-8 text-lg">{product.description}</p>
            </div>
            
            <div className="flex flex-col gap-4">
              {product.externalUrl && (
                <button onClick={() => window.open(product.externalUrl, '_blank')} className="flex items-center justify-center gap-3 w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg">
                  <ExternalLink size={20} /> شراء من المتجر
                </button>
              )} 
              <button 
                onClick={() => addToCart(product)}
                className="flex items-center justify-center gap-3 w-full py-4 border-2 border-gray-200 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all"
              >
                <ShoppingCart size={20} /> إضافة للسلة
              </button>

              <button onClick={handleShare} className="flex items-center justify-center gap-3 w-full py-4 text-gray-500 font-semibold hover:text-black transition-all">
                <Share2 size={20} /> مشاركة المنتج
              </button>
            </div>
          </div>
        </div>

        <div className="mt-20 max-w-6xl border-t pt-10">
          <h2 className="text-2xl font-bold mb-6">آراء العملاء</h2>
          <div className="p-8 bg-gray-50 rounded-3xl text-center border border-gray-100">
            <p className="text-gray-500">لا توجد تقييمات لهذا المنتج حالياً.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
