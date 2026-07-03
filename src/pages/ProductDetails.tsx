import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { Share2, ShoppingCart, ExternalLink, ArrowLeft } from 'lucide-react';
import Sidebar from '../components/Sidebar'; 
import 'swiper/css';
import 'swiper/css/navigation';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext'; // هذا السطر هو الناقص



const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart(); // تأكد من استيراد الـ hook الخاص بالسلة


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

  if (loading) return <div className="flex justify-center p-20">جاري التحميل...</div>;
  if (!product) return <div className="text-center p-20">المنتج غير موجود</div>;

// ابحث عن هذا السطر وقم بتعديله:
const images = Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []);

  return (
    <div className="flex w-full h-screen overflow-hidden bg-white">
      {/* السايدبار ثابت */}
      <div className="hidden md:block w-64 border-r border-gray-200 h-full overflow-y-auto">
        <Sidebar />
      </div>

      {/* المحتوى الرئيسي القابل للتمرير */}
      <main className="flex-1 h-full overflow-y-auto p-6 md:p-10">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 mb-6 text-gray-500 hover:text-black transition-colors font-medium">
          <ArrowLeft size={18} /> العودة للتسوق
        </button>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl">
          <Swiper navigation={true} modules={[Navigation]} className="h-[400px] w-full rounded-3xl bg-gray-50 shadow-inner">
            {images.map((img: string, i: number) => (
              <SwiperSlide key={i}><img src={img} className="w-full h-full object-contain p-4" /></SwiperSlide>
            ))}
          </Swiper>

          <div className="flex flex-col">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">{product.name}</h1>
            <p className="text-3xl text-green-600 font-bold mb-6">{product.price} درهم</p>
            <p className="text-gray-600 leading-relaxed mb-8 text-lg">{product.description}</p>
            
            <div className="flex flex-col gap-4">
              {product.externalUrl && (
                <button onClick={() => window.open(product.externalUrl, '_blank')} className="flex items-center justify-center gap-3 w-full py-4 bg-black text-white rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-lg">
                  <ExternalLink size={20} /> شراء من المتجر
                </button>
              )} 
            <button 
              onClick={() => addToCart(product)} // هنا قمنا بربط الضغط بالدالة
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

