import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, User, Calendar, ExternalLink, ImageOff, ShoppingBag } from 'lucide-react';

export interface Product {
  id?: string;
  name?: string;
  title?: string;
  price?: number;
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
  // 1. حماية قصوى: إذا لم يأتِ المنتج بشكل صحيح، لا نفعل شيئاً ولا نحدث انهياراً
  if (!product) {
    return null;
  }

  const isExternal = Boolean(product.isExternalProduct || product.externalUrl);
  const discount = Number(product.discountPercent || 0);
  const originalPrice = Number(product.originalPrice || product.price || 0);
  const finalPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : Number(product.price || 0);
  const currencySymbol = product.currency || 'AED';
  const productName = product.name || product.title || 'منتج بدون عنوان';

  // 2. معالجة آمنة جداً للصور لتجنب أي أخطاء في الـ Array
  const imageList: string[] = (() => {
    try {
      let rawImages: string[] = [];
      if (Array.isArray(product.images) && product.images.length > 0) {
        rawImages = product.images.filter((url): url is string => Boolean(url && typeof url === 'string'));
      } else {
        const singleImage = product.image || product.imageUrl || product.img || product.photo;
        if (typeof singleImage === 'string' && singleImage.trim() !== '') {
          rawImages = [singleImage];
        }
      }

      return rawImages.map(url => {
        const cleanUrl = url.trim();
        if (cleanUrl.startsWith('//')) return `https:${cleanUrl}`;
        if (cleanUrl.startsWith('http')) return cleanUrl;
        const base = import.meta.env.BASE_URL || '/';
        return cleanUrl.startsWith('/') ? `${base}${cleanUrl.slice(1)}` : `${base}${cleanUrl}`;
      });
    } catch (e) {
      return [];
    }
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

  return (
    <div className="w-full bg-white rounded-2xl p-2.5 shadow-sm border border-gray-100 flex flex-col box-border max-w-[320px] mx-auto">
      {isExternal ? (
        <a 
          href={product.externalUrl || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex flex-col w-full"
        >
          <CardContent 
            imageList={imageList}
            productName={productName}
            finalPrice={finalPrice}
            originalPrice={originalPrice}
            discount={discount}
            currencySymbol={currencySymbol}
            isExternal={isExternal}
            product={product}
            resolveBadgePath={resolveBadgePath}
            formatDate={formatDate}
          />
        </a>
      ) : (
        <Link to={`/product/${product.id || ''}`} className="flex flex-col w-full">
          <CardContent 
            imageList={imageList}
            productName={productName}
            finalPrice={finalPrice}
            originalPrice={originalPrice}
            discount={discount}
            currencySymbol={currencySymbol}
            isExternal={isExternal}
            product={product}
            resolveBadgePath={resolveBadgePath}
            formatDate={formatDate}
          />
        </Link>
      )}
    </div>
  );
}

function CardContent({ 
  imageList, 
  productName, 
  finalPrice, 
  originalPrice, 
  discount, 
  currencySymbol, 
  isExternal, 
  product, 
  resolveBadgePath, 
  formatDate 
}: any) {
  return (
    <div className="w-full flex flex-col box-border">
      {/* حاوية الصور */}
      <div className="relative w-full aspect-square bg-[#F5F5F0] rounded-xl mb-2.5 overflow-hidden box-border">
        {!isExternal && (
          <div className="absolute top-2 left-2 z-20 flex flex-col gap-1">
            {product.isVIP && (
              <img 
                src={resolveBadgePath('images/jaknooma-vip.png')} 
                alt="VIP" 
                className="w-7 h-auto" 
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
              />
            )}
            {discount >= 10 && (
              <img 
                src={resolveBadgePath('images/jaknooma-10.png')} 
                alt="Gold" 
                className="w-7 h-auto" 
                onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} 
              />
            )}
          </div>
        )}

        {isExternal && (
          <span className="absolute top-2 right-2 z-20 px-2 py-0.5 bg-black/85 text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
            {product.storeName || 'خارجي'}
          </span>
        )}

        {imageList.length > 0 ? (
          <div className="absolute inset-0 flex w-full h-full overflow-x-auto snap-x snap-mandatory">
            {imageList.map((imgUrl: string, index: number) => (
              <div key={index} className="w-full h-full flex-shrink-0 snap-center relative bg-white flex items-center justify-center">
                <img 
                  src={imgUrl} 
                  alt={productName} 
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 text-xs gap-1 bg-gray-50">
            <ImageOff size={18} />
            <span className="text-[9px]">غير متوفرة</span>
          </div>
        )}
      </div>

      {/* تفاصيل المنتج */}
      <div className="flex flex-col w-full px-1">
        <h3 className="text-xs font-semibold text-gray-900 line-clamp-2 min-h-[32px] mb-1 leading-snug">
          {productName}
        </h3>
        
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-xs font-bold text-red-600">
            {finalPrice.toFixed(2)} {currencySymbol}
          </span>
          {discount > 0 && (
            <span className="text-[10px] text-gray-400 line-through">
              {originalPrice.toFixed(2)} {currencySymbol}
            </span>
          )}
        </div>

        <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5 text-[10px] text-gray-500 w-full">
          <div className="flex items-center gap-1 truncate w-full">
            <User size={11} className="text-gray-400 shrink-0" />
            <span className="truncate w-full">
              المتجر: <strong className="text-gray-700">{product.storeName || product.sellerName || 'متجر'}</strong>
            </span>
          </div>

          {isExternal ? (
            <div className="mt-1 w-full flex items-center justify-center gap-1 py-1.5 px-2 bg-black text-white rounded-xl font-semibold text-[10px]">
              <ShoppingBag size={11} className="text-[#D4AF37] shrink-0" />
              <span className="truncate">شراء من {product.storeName || 'المتجر'}</span>
              <ExternalLink size={10} className="shrink-0" />
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Calendar size={11} className="text-gray-400 shrink-0" />
              <span>{formatDate(product.createdAt)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
