import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { 
  Share2, 
  ExternalLink, 
  ArrowLeft, 
  User, 
  MapPin, 
  Calendar, 
  Phone,
  ShoppingCart,
  ChevronLeft,
  Star,
  Store,
  Package
} from 'lucide-react';
import Sidebar from '../components/Sidebar'; 
import 'swiper/css';
import 'swiper/css/navigation';
import { useCart } from '../contexts/CartContext';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [sellerData, setSellerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  // 1. جلب تفاصيل المنتج
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const docSnap = await getDoc(doc(db, 'products', id));
        if (docSnap.exists()) {
          setProduct({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (err) { 
        console.error("Error fetching product:", err); 
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  // 2. جلب بيانات البائع فقط لزر التوجيه
  useEffect(() => {
    if (!product) return;
    const sellerIdentifier = product.storeId || product.sellerId;

    const fetchSellerData = async () => {
      if (!sellerIdentifier) return;
      try {
        const userSnap = await getDoc(doc(db, 'users', sellerIdentifier));
        if (userSnap.exists()) {
          setSellerData(userSnap.data());
        } else {
          const storeSnap = await getDoc(doc(db, 'stores', sellerIdentifier));
          if (storeSnap.exists()) setSellerData(storeSnap.data());
        }
      } catch (e) {
        console.error("Error fetching seller details:", e);
      }
    };

    fetchSellerData();
  }, [product]);

  const handleShare = async () => {
    try {
      await navigator.share({ title: product?.name, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      alert("تم نسخ رابط المنتج!");
    }
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return 'غير متوفر';
    try {
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-gray-600">جاري تحميل تفاصيل المنتج...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-white p-6 dir-rtl text-center">
        <Package size={64} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">المنتج غير موجود</h2>
        <p className="text-gray-500 mb-6">قد يكون قد تم حذفه أو أن الرابط غير صحيح.</p>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors">
          العودة للرئيسية
        </button>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : (product.imageUrl ? [product.imageUrl] : (product.images ? [product.images] : ['/placeholder.png']));

  const targetBuyUrl = product.affiliateLink || product.externalStoreLink || product.externalUrl;
  const sellerPhone = product.phone || product.sellerPhone || sellerData?.phone;
  const currencySymbol = product.currency || 'AED';
  const targetSellerId = product.storeId || product.sellerId;
  const sellerName = product.storeName || product.sellerName || sellerData?.displayName || sellerData?.storeName || 'بائع غير معروف';
  const sellerAvatar = sellerData?.photoURL || sellerData?.avatar || product.sellerAvatar;

  return (
    <div className="flex w-full min-h-screen bg-white outline-none">
      
      {/* السايدبار الجانبي */}
      <div className="hidden md:block w-64 border-l border-gray-100 h-screen sticky top-0 shrink-0 overflow-hidden">
        <Sidebar />
      </div>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-6 md:p-10 outline-none border-none" dir="rtl">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 mb-6 text-gray-500 hover:text-black transition-colors font-medium group"
        >
          <ArrowLeft size={18} className="rotate-180 group-hover:-translate-x-1 transition-transform" /> 
          العودة للتسوق
        </button>

        <div className="grid lg:grid-cols-2 gap-10 max-w-6xl">
          {/* معرض الصور */}
          <div className="w-full">
            <Swiper navigation={true} modules={[Navigation]} className="h-[380px] md:h-[450px] w-full rounded-3xl bg-gray-50 shadow-inner border border-gray-100">
              {images.map((img: string, i: number) => (
                <SwiperSlide key={i} className="flex items-center justify-center p-4">
                  <img src={img} className="max-w-full max-h-full object-contain rounded-2xl" alt={product.name} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>

          {/* تفاصيل المنتج والمعلومات */}
          <div className="flex flex-col justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 leading-tight">{product.name}</h1>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-extrabold text-green-600">
                  {product.price} {currencySymbol}
                </span>
              </div>

              {/* بطاقة معلومات سريعة عن البائع والموقع */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl mb-6 border border-gray-100">
                
                {/* اسم البائع ورابط الانتقال لصفحته */}
                <div className="flex items-center gap-3">
                  {sellerAvatar ? (
                    <img src={sellerAvatar} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-200" alt={sellerName} />
                  ) : (
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                      <User size={18} />
                    </div>
                  )}
                  <div className="flex-1 overflow-hidden">
                    <span className="block text-[10px] text-gray-400 font-medium">البائع</span>
                    {targetSellerId ? (
                      <button
                        onClick={() => navigate(`/store/${targetSellerId}`)}
                        className="flex items-center gap-1 text-sm font-bold text-gray-800 hover:text-blue-600 transition-colors group text-right w-full"
                      >
                        <span className="truncate">{sellerName}</span>
                        <ChevronLeft size={14} className="text-gray-400 group-hover:text-blue-600 transition-transform group-hover:-translate-x-0.5 shrink-0" />
                      </button>
                    ) : (
                      <span className="text-sm font-bold text-gray-700 truncate block">{sellerName}</span>
                    )}
                  </div>
                </div>

                {/* رقم التواصل */}
                {sellerPhone && (
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                      <Phone size={18} />
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-medium">رقم التواصل</span>
                      <a href={`tel:${sellerPhone}`} className="text-sm font-bold text-gray-700 hover:text-emerald-600 dir-ltr block">
                        {sellerPhone}
                      </a>
                    </div>
                  </div>
                )}

                {/* موقع الإعلان */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-medium">الموقع</span>
                    <span className="text-sm font-bold text-gray-700 block truncate">
                      {product.location || 'غير محدد'}
                    </span>
                  </div>
                </div>

                {/* تاريخ الإعلان */}
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-400 font-medium">تاريخ الإعلان</span>
                    <span className="text-sm font-bold text-gray-700 block">
                      {formatDate(product.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* وصف المنتج */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-400 mb-2">الوصف</h3>
                <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line">{product.description || 'لا يوجد وصف متوفر لهذا المنتج.'}</p>
              </div>
            </div>
            
            {/* أزرار الشراء والتفاعل */}
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              {targetBuyUrl && (
                <button 
                  onClick={() => window.open(targetBuyUrl, '_blank')} 
                  className="flex items-center justify-center gap-3 w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98]"
                >
                  <ExternalLink size={20} /> شراء الآن من المتجر
                </button>
              )}

              <button 
                onClick={() => addToCart(product)}
                className="flex items-center justify-center gap-3 w-full py-4 border-2 border-gray-900 text-gray-900 rounded-2xl font-bold text-lg hover:bg-gray-900 hover:text-white transition-all active:scale-[0.98]"
              >
                <ShoppingCart size={20} /> إضافة للسلة
              </button>

              <button 
                onClick={handleShare} 
                className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 font-semibold hover:text-black transition-all"
              >
                <Share2 size={18} /> مشاركة المنتج
              </button>
            </div>
          </div>
        </div>

        {/* كارت التوجيه الحصري لصفحة البائع الكاملة (المعلومات + المنتجات + التقييمات) */}
        <div className="mt-16 max-w-6xl border-t border-gray-100 pt-10">
          <div className="p-8 bg-gray-50 rounded-3xl border border-gray-100 text-center flex flex-col items-center">
            <Store size={40} className="text-gray-400 mb-3" />
            <h3 className="text-xl font-bold text-gray-900 mb-1">متجر {sellerName}</h3>
            
            <div className="flex justify-center items-center gap-1 text-amber-400 mb-3">
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
              <Star size={18} fill="currentColor" />
            </div>

            <p className="text-gray-600 text-sm max-w-md mb-6">
              للإطلاع على جميع منتجات التاجر الأخرى، التقييمات، ومعلومات التواصل كاملة، يمكنك زيارة بروفايل البائع المخصص.
            </p>

            {targetSellerId && (
              <button
                onClick={() => navigate(`/store/${targetSellerId}`)}
                className="flex items-center gap-2 px-8 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-md active:scale-95"
              >
                الانتقال لصفحة البائع والتقييمات
                <ChevronLeft size={16} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
