import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, User, Calendar, ExternalLink, ImageOff, ShoppingBag } from 'lucide-react';

export interface Product {
  id: string;
  name?: string;
  title?: string;
  price: number;
  originalPrice?: number;
  currency?: string;
  images?: string[];
  image?: string;
  imageUrl?: string;
  img?: string;
  photo?: string;
  isVIP?: boolean;
  externalUrl?: string;
  affiliateLink?: string;
  sellerPhone?: string;
  phone?: string;
  discountPercent?: number;
  location?: string;
  sellerName?: string;
  storeName?: string;
  storeId?: string;
  isExternalProduct?: boolean;
  createdAt?: any;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  if (!product) return null;

  const isExternal = product.isExternalProduct || Boolean(product.externalUrl);
  const discount = product.discountPercent || 0;
  const originalPrice = Number(product.originalPrice || product.price || 0);
  const finalPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : Number(product.price || 0);
  const currencySymbol = product.currency || 'AED';
  const productName = product.name || product.title || 'منتج بدون عنوان';

  // معالجة آمنة للصور
  const imageList: string[] = (() => {
    let rawImages: string[] = [];
    if (Array.isArray(product.images) && product.images.length > 0) {
      rawImages = product.images.filter((url): url is string => Boolean(url && typeof url === 'string' && url.trim() !== ''));
    } else {
      const singleImage = product.image || product.imageUrl || product.img || product.photo;
      if (typeof singleImage === 'string' && singleImage.trim() !== '') {
        rawImages = [singleImage];
      }
    }
    return rawImages.map(url => {
      const cleanUrl = url.trim();
      if (cleanUrl.startsWith('http')) return cleanUrl;
      const base = import.meta.env.BASE_URL || '/';
      return cleanUrl.startsWith('/') ? `${base}${cleanUrl.slice(1)}` : `${base}${cleanUrl}`;
    });
  })();

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return 'Just now';
    }
  };

  const resolveBadgePath = (path: string) => {
    const base = import.meta.env.BASE_URL || '/';
    return path.startsWith('/') ? `${base}${path.slice(1)}` : `${base}${path}`;
  };

  // محتوى البطاقة مدمج بشكل مباشر ونظيف لتجنب أخطاء إعادة الرسم
  const cardBody = (
    <div className="w-full flex flex-col box-border">
      {/* حاوية الصور */}
      <div className="relative w-full pt-[110%] sm:pt-[120%] bg-[#F5F5F0] rounded-2xl mb-2.5 overflow-hidden">
        {!isExternal && (
          <div className="absolute top-2.5 left-2.5 z-30 flex flex-col gap-1">
            {product.isVIP && (
              <img 
                src={resolveBadgePath('images/jaknooma-vip.png')} 
                alt="VIP" 
                className="w-8 h-auto" 
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
              />
            )}
            {discount >= 10 && (
              <img 
                src={resolveBadgePath('images/jaknooma-10.png')} 
                alt="Gold" 
                className="w-8 h-auto" 
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} 
              />
            )}
            {discount > 0 && discount < 10 && (
              <img 
                src={resolveBadgePath('images/jaknooma-5.png')} 
                alt="Silver" 
                className="w-8 h-auto" 
                onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }} 
              />
            )}
          </div>
        )}

        {isExternal && (
          <span className="absolute top-2.5 right-2.5 z-30 px-2.5 py-1 bg-black/85 backdrop-blur-sm text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
            {product.storeName || 'خارجي'}
          </span>
        )}

        {imageList.length > 0 ? (
          <div className="absolute inset-0 flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {imageList.map((imgUrl, index) => (
              <div key={index} className="w-full h-full flex-shrink-0 snap-center relative">
                <SafeImage src={imgUrl} alt={`${productName} - ${index + 1}`} />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-xs gap-1">
            <ImageOff size={20} />
            <span className="text-[10px]">لا توجد صورة</span>
          </div>
        )}
      </div>

      {/* تفاصيل المنتج */}
      <div className="flex flex-col px-1.5 pb-1">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-900 line-clamp-2 min-h-[36px] mb-1.5 leading-snug">{productName}</h3>
        
        <div className="flex items-center gap-1.5 mb-2">
          {discount > 0 ? (
            <>
              <span className="text-xs sm:text-sm font-bold text-red-600">
                {finalPrice.toFixed(2)} {currencySymbol}
              </span>
              <span className="text-[10px] text-gray-400 line-through">
                {originalPrice.toFixed(2)} {currencySymbol}
              </span>
            </>
          ) : (
            <span className="text-xs sm:text-sm font-bold text-gray-900">
              {finalPrice > 0 ? `${finalPrice.toFixed(2)} {currencySymbol}` : 'شاهد السعر بالمتجر'}
            </span>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5 text-[11px] text-gray-500">
          <div className="flex items-center gap-1">
            <User size={12} className="text-gray-400 shrink-0" />
            <span className="truncate">
              {isExternal ? 'المتجر: ' : 'Seller: '}
              <strong className="text-gray-700 font-medium">
                {product.sellerName || product.storeName || 'Anonymous'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            <span className="truncate">
              Loc: <strong className="text-gray-700 font-medium">{product.location || (isExternal ? 'شحن دولي' : 'Not specified')}</strong>
            </span>
          </div>

          {isExternal ? (
            <div className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-black hover:bg-gray-800 text-white rounded-xl font-semibold text-xs transition-colors shadow-xs">
              <ShoppingBag size={13} className="text-[#D4AF37]" />
              <span className="truncate">شراء من {product.storeName || 'المتجر'}</span>
              <ExternalLink size={12} className="shrink-0 ml-0.5" />
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-1">
              <Calendar size={12} className="text-gray-400 shrink-0" />
              <span>
                Posted: <strong className="text-gray-700 font-medium">{formatDate(product.createdAt)}</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="group flex flex-col relative w-full bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
      {isExternal ? (
        <a 
          href={product.externalUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex flex-col w-full"
        >
          {cardBody}
        </a>
      ) : (
        <Link to={`/product/${product.id}`} className="flex flex-col w-full">
          {cardBody}
        </Link>
      )}
    </div>
  );
}

function SafeImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 gap-1 bg-gray-50">
        <ImageOff size={20} />
        <span className="text-[9px]">غير متوفرة</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      onError={() => setHasError(true)}
    />
  );
}
