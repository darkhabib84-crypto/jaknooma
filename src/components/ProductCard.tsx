import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, User, Calendar, ExternalLink } from 'lucide-react';

export interface Product {
  id: string;
  name?: string;
  title?: string;
  price: number;
  currency?: string;
  images?: string[];
  image?: string;
  isVIP?: boolean;
  externalUrl?: string;
  affiliateLink?: string;
  sellerPhone?: string;
  phone?: string;
  discountPercent?: number;
  location?: string;
  sellerName?: string;
  storeName?: string;
  isExternal?: boolean;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  } | any;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  // 1. التعامل مع البطاقات الخارجية (بطاقات المتاجر القانونية بروابط الأفلييت)
  if (product.isExternal) {
    const storeName = product.storeName || 'المتجر الخارجي';
    const title = product.title || product.name || `عرض النتائج على ${storeName}`;
    const logoUrl = product.image || (Array.isArray(product.images) ? product.images[0] : '');

    return (
      <a
        href={product.externalUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col justify-between items-center w-full bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-black transition-all text-center h-full min-h-[320px]"
      >
        <div className="w-full flex-1 flex flex-col items-center justify-center">
          {/* شعار المتجر الخارجي */}
          <div className="h-20 w-full flex items-center justify-center mb-4 p-2 bg-[#F5F5F0] rounded-2xl">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={storeName}
                className="max-h-12 max-w-[80%] object-contain group-hover:scale-105 transition-transform"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <span className="text-sm font-bold text-gray-700">{storeName}</span>
            )}
          </div>

          {/* عنوان البحث الخارجي */}
          <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-black">
            {title}
          </h3>
          <p className="text-xs text-gray-400 mb-4">انتقل للموقع الرسمي لـ {storeName}</p>
        </div>

        {/* زر التوجيه للمتجر الخارجي */}
        <div className="w-full pt-2">
          <span className="w-full py-3 px-4 bg-black text-white rounded-2xl text-xs font-semibold flex items-center justify-center gap-2 group-hover:bg-gray-800 transition-colors shadow-sm">
            <span>التوجه إلى {storeName}</span>
            <ExternalLink size={14} />
          </span>
        </div>
      </a>
    );
  }

  // 2. الكارت الافتراضي للمنتجات المحلية (جكنومة)
  const discount = product.discountPercent || 0;
  const originalPrice = Number(product.price || 0);
  const finalPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;
  const currencySymbol = product.currency || 'AED';
  const productName = product.name || product.title || 'منتج بدون عنوان';

  // معالجة الصور سواء كانت مصفوفة images أو رابط فردي image
  const imageList: string[] = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : (product.image ? [product.image] : []);

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

  return (
    <div className="group flex flex-col relative w-full bg-white rounded-3xl p-2 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <Link to={`/product/${product.id}`} className="flex flex-col">
        {/* Images Container */}
        <div className="relative aspect-[4/5] bg-[#F5F5F0] rounded-3xl mb-4 overflow-hidden flex items-center justify-center p-2">
          
          {/* Badges */}
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-1">
            {product.isVIP && (
              <img 
                src="/images/jaknooma-vip.png" 
                alt="VIP" 
                className="w-10 h-auto" 
                onError={(e) => {
                  if (e.currentTarget.getAttribute('src') === '/images/jaknooma-vip.png') {
                    e.currentTarget.src = '/jaknooma-vip.png';
                  } else if (e.currentTarget.getAttribute('src') === '/jaknooma-vip.png') {
                    e.currentTarget.src = 'https://i.ibb.co/6R0gGf9/jaknooma-vip.png';
                  }
                }}
              />
            )}
            {discount >= 10 && (
              <img src="/images/jaknooma-10.png" alt="Gold" className="w-10 h-auto" />
            )}
            {discount > 0 && discount < 10 && (
              <img src="/images/jaknooma-5.png" alt="Silver" className="w-10 h-auto" />
            )}
          </div>

          {/* Images Slider / Single Image */}
          {imageList.length > 0 ? (
            <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              {imageList.map((imgUrl, index) => (
                <img
                  key={index}
                  src={imgUrl}
                  alt={`${productName} - ${index + 1}`}
                  className="w-full h-full object-contain flex-shrink-0 snap-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              ))}
            </div>
          ) : (
            <div className="text-gray-400 text-xs">No image available</div>
          )}
        </div>

        {/* Product Information */}
        <div className="flex flex-col px-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{productName}</h3>
          
          {/* Price */}
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
                {originalPrice.toFixed(2)} {currencySymbol}
              </span>
            )}
          </div>

          {/* Details Section */}
          <div className="mt-3 pt-3 border-t border-gray-50 flex flex-col gap-1.5 text-[11px] text-gray-500">
            {/* Seller */}
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-gray-400 shrink-0" />
              <span className="truncate">
                Seller: <strong className="text-gray-700 font-medium">{product.sellerName || 'Anonymous'}</strong>
              </span>
            </div>

            {/* Location */}
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-gray-400 shrink-0" />
              <span className="truncate">
                Location: <strong className="text-gray-700 font-medium">{product.location || 'Not specified'}</strong>
              </span>
            </div>

            {/* Date */}
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-gray-400 shrink-0" />
              <span>
                Posted: <strong className="text-gray-700 font-medium">{formatDate(product.createdAt)}</strong>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
