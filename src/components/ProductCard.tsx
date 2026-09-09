import React from 'react';
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

  // استخراج الصور بأمان
  const imageList: string[] = (() => {
    if (Array.isArray(product.images) && product.images.length > 0) {
      const validImages = product.images.filter((url): url is string => Boolean(url && typeof url === 'string' && url.trim() !== ''));
      if (validImages.length > 0) return validImages;
    }
    
    const singleImage = product.image || product.imageUrl || product.img || product.photo;
    if (typeof singleImage === 'string' && singleImage.trim() !== '') {
      return [singleImage];
    }
    
    return [];
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

  const CardContent = () => (
    <>
      <div className="relative aspect-[4/5] bg-[#F5F5F0] rounded-3xl mb-4 overflow-hidden flex items-center justify-center p-2">
        {!isExternal && (
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-1">
            {product.isVIP && (
              <img 
                src="/images/jaknooma-vip.png" 
                alt="VIP" 
                className="w-10 h-auto" 
                onError={(e) => {
                  e.currentTarget.src = 'https://i.ibb.co/6R0gGf9/jaknooma-vip.png';
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
        )}

        {isExternal && (
          <span className="absolute top-3 right-3 z-30 px-3 py-1 bg-black text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
            {product.storeName || 'خارجي'}
          </span>
        )}

        {imageList.length > 0 ? (
          <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {imageList.map((imgUrl, index) => (
              <img
                key={index}
                src={imgUrl}
                alt={`${productName} - ${index + 1}`}
                className="w-full h-full object-contain flex-shrink-0 snap-center mix-blend-multiply group-hover:scale-105 transition-transform duration-700"
                onError={(e) => { 
                  // منع تكرار الخطأ واستبدال العنصر بواجهة أيقونة بديلة محلياً دون طلب خارجي فاشل
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null; 
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.fallback-icon')) {
                    const fallbackDiv = document.createElement('div');
                    fallbackDiv.className = 'fallback-icon flex flex-col items-center justify-center w-full h-full text-gray-400 gap-1';
                    fallbackDiv.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="2" x2="22" y2="22"></line><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"></path><line x1="13.5" y1="6" x2="21" y2="6"></line><line x1="17" y1="2" x2="17" y2="10"></line><path d="M21 21H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2"></path><polyline points="9 18 15 12 21 18"></polyline></svg><span class="text-[10px]">تعذر تحميل الصورة</span>`;
                    parent.appendChild(fallbackDiv);
                  }
                }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-gray-400 text-xs gap-1">
            <ImageOff size={20} />
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
              {finalPrice > 0 ? `${finalPrice.toFixed(2)} {currencySymbol}` : 'شاهد السعر بالمتجر'}
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
