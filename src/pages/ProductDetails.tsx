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
  MessageCircle,
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
import { useTranslation } from 'react-i18next';
import { formatPrice, isRtlLanguage } from '../lib/i18n';
import { detectProductStoreName, getCleanCityLocation } from '../components/ProductCard';
import toast from 'react-hot-toast';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [sellerData, setSellerData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

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
      await navigator.share({ title: product?.name || product?.title, url: window.location.href });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('Product link copied!'));
    }
  };

  const formatDate = (dateInput: any) => {
    if (!dateInput) return t('Just now');
    try {
      const date = dateInput.toDate
        ? dateInput.toDate()
        : dateInput.seconds
        ? new Date(dateInput.seconds * 1000)
        : new Date(dateInput);
      return date.toLocaleDateString(isRtl ? 'ar-AE' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return t('Just now');
    }
  };

  if (loading) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="flex flex-col items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-bold text-gray-600">{t('Loading product details...')}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div dir={isRtl ? 'rtl' : 'ltr'} className="flex flex-col items-center justify-center min-h-screen bg-white p-6 text-center">
        <Package size={64} className="text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('Product not found')}</h2>
        <p className="text-gray-500 mb-6">{t('It may have been removed or the link is incorrect.')}</p>
        <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors cursor-pointer">
          {t('Back to Home')}
        </button>
      </div>
    );
  }

  const images = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : (product.imageUrl ? [product.imageUrl] : (product.image ? [product.image] : ['/placeholder.png']));

  const detectedStore = detectProductStoreName(product);
  const targetBuyUrl = product.affiliateLink || product.externalStoreLink || product.externalUrl;
  const sellerPhone = product.phone || product.sellerPhone || sellerData?.phone;
  const cleanPhoneDigits = sellerPhone ? String(sellerPhone).replace(/[^0-9]/g, '') : '';
  const currencySymbol = product.currency || 'AED';
  const targetSellerId = product.storeId || product.sellerId;
  const sellerName = detectedStore || product.storeName || product.sellerName || sellerData?.displayName || sellerData?.storeName || 'Jaknooma';
  const sellerAvatar = sellerData?.photoURL || sellerData?.avatar || product.sellerAvatar;
  const cityLocation = getCleanCityLocation(product, t);
  const badgeLabel = (targetBuyUrl || detectedStore) ? (detectedStore || t('External Store')) : t('Local Listing');

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="flex flex-col w-full min-h-screen bg-white outline-none overflow-x-hidden">
      {/* Slide-over drawer for mobile menu button */}
      <Sidebar drawerOnly={true} />

      {/* Main Content takes full width on mobile, tablet, and desktop */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 outline-none border-none min-w-0 flex flex-col items-center overflow-x-hidden w-full">
        <div className="w-full max-w-6xl mx-auto box-border">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 mb-6 text-gray-500 hover:text-black transition-colors font-medium group cursor-pointer"
          >
            <ArrowLeft size={18} className={`${isRtl ? 'rotate-180' : ''} transition-transform`} /> 
            <span>{t('Back to Shopping')}</span>
          </button>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 w-full mx-auto items-start">
            {/* Centered Product Image Gallery */}
            <div className="w-full min-w-0 overflow-hidden relative">
              <span
                className={`absolute top-4 ${
                  isRtl ? 'left-4' : 'right-4'
                } z-20 px-3 py-1 text-xs font-bold rounded-lg shadow-sm backdrop-blur-md ${
                  targetBuyUrl || detectedStore
                    ? 'bg-black/85 text-[#D4AF37] border border-[#D4AF37]/30'
                    : 'bg-white/95 text-gray-800 border border-gray-200'
                }`}
              >
                {badgeLabel}
              </span>

              <Swiper 
                navigation={true} 
                modules={[Navigation]} 
                className="h-[320px] sm:h-[400px] md:h-[460px] w-full max-w-full rounded-3xl bg-[#F5F5F0] shadow-inner border border-gray-100"
              >
                {images.map((img: string, i: number) => (
                  <SwiperSlide key={i} className="!flex !items-center !justify-center p-4 sm:p-6 w-full h-full">
                    <img
                      src={img}
                      referrerPolicy="no-referrer"
                      className="max-w-full max-h-full object-contain mx-auto my-auto block rounded-2xl"
                      alt={product.name || product.title || 'Product'}
                    />
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Product Details & Purchase Module */}
            <div className="flex flex-col justify-between min-w-0 w-full">
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 mb-3 leading-tight break-words">
                  {product.name || product.title}
                </h1>
                <div className="flex items-baseline gap-2 mb-6 tabular-nums">
                  <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600" dir="ltr">
                    {formatPrice(product.price)} {currencySymbol}
                  </span>
                </div>

                {/* Seller & Location Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 bg-gray-50 rounded-2xl mb-6 border border-gray-100 w-full box-border">
                  {/* Seller */}
                  <div className="flex items-center gap-3 min-w-0">
                    {sellerAvatar ? (
                      <img src={sellerAvatar} className="w-10 h-10 rounded-xl object-cover shrink-0 border border-gray-200" alt={sellerName} />
                    ) : (
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                        <User size={18} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <span className="block text-[11px] text-gray-400 font-medium">{t('Seller')}</span>
                      {targetSellerId ? (
                        <button
                          onClick={() => navigate(`/store/${targetSellerId}`)}
                          className="flex items-center gap-1 text-sm font-bold text-gray-800 hover:text-blue-600 transition-colors group text-start w-full cursor-pointer"
                        >
                          <span className="truncate">{sellerName}</span>
                          <ChevronLeft size={14} className={`text-gray-400 group-hover:text-blue-600 shrink-0 ${!isRtl ? 'rotate-180' : ''}`} />
                        </button>
                      ) : (
                        <span className="text-sm font-bold text-gray-700 truncate block w-full">{sellerName}</span>
                      )}
                    </div>
                  </div>

                  {/* Contact Number */}
                  {sellerPhone && (
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                        <Phone size={18} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="block text-[11px] text-gray-400 font-medium">{t('Contact Number')}</span>
                        <a href={`tel:${sellerPhone}`} className="text-sm font-bold text-gray-700 hover:text-emerald-600 block truncate" dir="ltr">
                          {sellerPhone}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* City Location */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-red-50 text-red-600 rounded-xl shrink-0">
                      <MapPin size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] text-gray-400 font-medium">{t('Location')}</span>
                      <span className="text-sm font-bold text-gray-700 block truncate">
                        {cityLocation}
                      </span>
                    </div>
                  </div>

                  {/* Posted Date */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                      <Calendar size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-[11px] text-gray-400 font-medium">{t('Posted Date')}</span>
                      <span className="text-sm font-bold text-gray-700 block truncate">
                        {formatDate(product.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Product Description */}
                <div className="mb-8 w-full">
                  <h3 className="text-sm font-bold text-gray-400 mb-2">{t('Description')}</h3>
                  <p className="text-gray-700 leading-relaxed text-sm sm:text-base whitespace-pre-line break-words">
                    {product.description || t('No description available for this product.')}
                  </p>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 w-full">
                {targetBuyUrl && (
                  <a
                    href={targetBuyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 w-full py-3.5 sm:py-4 bg-black text-white rounded-2xl font-bold text-base sm:text-lg hover:bg-gray-800 transition-all shadow-lg active:scale-[0.98] cursor-pointer"
                  >
                    <ExternalLink size={20} className="text-[#D4AF37]" />
                    <span>{t('Buy from')} {detectedStore || t('External Store')}</span>
                  </a>
                )}

                {sellerPhone && (
                  <div className="grid grid-cols-2 gap-3">
                    <a
                      href={`tel:${sellerPhone}`}
                      className="flex items-center justify-center gap-2 py-3.5 bg-black text-white rounded-2xl font-bold text-sm sm:text-base hover:bg-gray-800 transition-all"
                    >
                      <Phone size={18} className="text-[#D4AF37]" />
                      <span>{t('Call Seller')} 📞</span>
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhoneDigits}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-3.5 bg-emerald-600 text-white rounded-2xl font-bold text-sm sm:text-base hover:bg-emerald-700 transition-all"
                    >
                      <MessageCircle size={18} />
                      <span>{t('WhatsApp')} 💬</span>
                    </a>
                  </div>
                )}

                <button 
                  onClick={() => addToCart(product)}
                  className="flex items-center justify-center gap-3 w-full py-3.5 sm:py-4 border-2 border-gray-900 text-gray-900 rounded-2xl font-bold text-base sm:text-lg hover:bg-gray-900 hover:text-white transition-all active:scale-[0.98] cursor-pointer"
                >
                  <ShoppingCart size={20} />
                  <span>{t('Add to Cart')}</span>
                </button>

                <button 
                  onClick={handleShare} 
                  className="flex items-center justify-center gap-2 w-full py-3 text-gray-500 font-semibold hover:text-black transition-all cursor-pointer"
                >
                  <Share2 size={18} />
                  <span>{t('Share Product')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Seller Store Card */}
          <div className="mt-14 w-full border-t border-gray-100 pt-10 box-border">
            <div className="p-6 sm:p-8 bg-gray-50 rounded-3xl border border-gray-100 text-center flex flex-col items-center w-full box-border">
              <Store size={40} className="text-gray-400 mb-3" />
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                {sellerName}
              </h3>
              
              <div className="flex justify-center items-center gap-1 text-amber-400 mb-3">
                <Star size={18} fill="currentColor" />
                <Star size={18} fill="currentColor" />
                <Star size={18} fill="currentColor" />
                <Star size={18} fill="currentColor" />
                <Star size={18} fill="currentColor" />
              </div>

              <p className="text-gray-600 text-xs sm:text-sm max-w-md mb-6">
                {t('To view all other products from this seller, ratings, and full contact details, visit the dedicated seller profile.')}
              </p>

              {targetSellerId && (
                <button
                  onClick={() => navigate(`/store/${targetSellerId}`)}
                  className="flex items-center gap-2 px-6 sm:px-8 py-3 bg-black text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-md active:scale-95 cursor-pointer"
                >
                  <span>{t('Visit Seller Store & Reviews')}</span>
                  <ChevronLeft size={16} className={!isRtl ? 'rotate-180' : ''} />
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetails;
