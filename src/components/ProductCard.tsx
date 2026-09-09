import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, User, Calendar, ExternalLink, ImageOff } from 'lucide-react';

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
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  } | any;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const isExternal = product.isExternalProduct || Boolean(product.externalUrl);
  const discount = product.discountPercent || 0;
  const originalPrice = Number(product.originalPrice || product.price || 0);
  const finalPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : Number(product.price || 0);
  const currencySymbol = product.currency || 'AED';
  const productName = product.name || product.title || 'منتج بدون عنوان';

  // معالجة استخراج الصور وتنظيفها وتصحيح مساراتها المحلية أو الخارجية
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
      // إذا كان الرابط خارجي، نمرره عبر البروكسي الآمن
      if (cleanUrl.startsWith('http')) {
        return `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}&w=400&fit=cover`;
      }
      // إذا كان مساراً محلياً، نضمن توافقه مع مسار الاستضافة الأساسي
      const base = import.meta.env.BASE_URL || '/';
      if (cleanUrl.startsWith('/')) {
        return `${base}${cleanUrl.slice(1)}`;
      }
      return `${base}${cleanUrl}`;
    });
  })();

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return 'Just now';
    }
  };

  const resolveBadgePath = (path: string) => {
    const base = import.meta.env.BASE_URL || '/';
    return path.startsWith('/') ? `${base}${path.slice(1)}` : `${base}${path}`;
  };

  const CardContent = () => (
    <>
      <div className="relative aspect-[4/5] bg-[#F5F5F0] rounded-3xl mb-4 overflow-hidden flex items-center justify-center p-2">
        {!isExternal && (
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-1">
            {product.isVIP && (
              <img 
                src={resolveBadgePath('images/jaknooma-vip.png')} 
                alt="VIP" 
                className="w-10 h-auto" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            )}
            {discount >= 10 && (
              <img 
                src={resolveBadgePath('images/jaknooma-10.png')} 
                alt="Gold" 
                className="w-10 h-auto" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
              />
            )}
            {discount > 0 && discount < 10 && (
              <img 
                src={resolveBadgePath('images/jaknooma-5.png')} 
                alt="Silver" 
                className="w-10 h-auto" 
                onError={(e) => { e.currentTarget.style.display = 'none'; }} 
              />
            )}
          </div>
        )}

        {isExternal && (
          <span className="absolute top-3 right-3 z-30 px-3 py-1 bg-black text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
            {product.storeName || 'خارجي'}
          </span>
        )}

        {imageList.length > 0 ? (
          <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide items-center justify-center">
            {imageList.map((imgUrl, index) => (
              <SafeImage key={index} src={imgUrl} alt={`${productName} - ${index + 1}`} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 text-xs gap-1">
            <ImageOff size={24} />
            <span>لا توجد صورة متاحة</span>
          </div>
        )}
      </div>

      <div className="flex flex-col px-2 mb-2">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[40px] mb-1">{productName}</h3>
        
        <div className="flex items-center gap-2 mt-1">
          {discount > 0 ? (
            <>
              <span className="text-sm font-bold text-red-600">
                {finalPrice.toFixed(2)} {currencySymbol}
              </span>
              <span className="text-[11px] text-gray-400 line-through">
                {originalPrice.toFixed(2)} {currencySymbol}
              </span>
            </>
          ) : (
            <span className="text-sm font-semibold text-gray-900">
              {finalPrice > 0 ? `${finalPrice.toFixed(2)} ${currencySymbol}` : 'شاهد السعر بالمتجر'}
            </span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-1.5 text-[11px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <User size={12} className="text-gray-400 shrink-0" />
            <span className="truncate">
              {isExternal ? 'المتجر: ' : 'Seller: '}
              <strong className="text-gray-700 font-medium">
                {product.sellerName || product.storeName || 'Anonymous'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-gray-400 shrink-0" />
            <span className="truncate">
              Location: <strong className="text-gray-700 font-medium">{product.location || (isExternal ? 'شحن دولي' : 'Not specified')}</strong>
            </span>
          </div>

          {isExternal ? (
            <div className="flex items-center justify-between pt-1 text-black font-semibold text-xs group-hover:underline">
              <span>شراء الآن من {product.storeName}</span>
              <ExternalLink size={13} />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-gray-400 shrink-0" />
              <span>
                Posted: <strong className="text-gray-700 font-medium">{formatDate(product.createdAt)}</strong>
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <div className="group flex flex-col relative w-full bg-white rounded-3xl p-2 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      {isExternal ? (
        <a 
          href={product.externalUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex flex-col"
        >
          <CardContent />
        </a>
      ) : (
        <Link to={`/product/${product.id}`} className="flex flex-col">
          <CardContent />
        </Link>
      )}
    </div>
  );
}

function SafeImage({ src, alt }: { src: string; alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full text-gray-400 gap-1 bg-gray-50 rounded-2xl">
        <ImageOff size={22} />
        <span className="text-[10px]">الصورة غير متوفرة</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-contain flex-shrink-0 snap-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
      onError={() => setHasError(true)}
    />
  );
}
