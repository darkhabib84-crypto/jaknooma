import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, MapPin, User, Calendar } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  isVIP?: boolean;
  externalUrl?: string;
  sellerPhone?: string;
  discountPercent?: number;
  // الحقول الجديدة التي تم إضافتها لقاعدة البيانات
  location?: string;
  sellerName?: string;
  createdAt?: {
    seconds: number;
    nanoseconds: number;
  } | any;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = product.discountPercent || 0;
  const originalPrice = Number(product.price || 0);
  const finalPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;

  // دالة لتنسيق تاريخ الإعلان بشكل مقروء
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      // التعامل مع Timestamp الخاص بـ Firebase
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
    <div className="group flex flex-col relative w-full bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
      <Link to={`/product/${product.id}`} className="flex flex-col">
        {/* Images Container with horizontal scroll */}
        <div className="relative aspect-[4/5] bg-[#F5F5F0] rounded-3xl mb-4 overflow-hidden flex items-center justify-center p-2">
          
          {/* Badges - تم توحيد كافة المسارات إلى مجلد images */}
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-1">
            {product.isVIP && (
              <img src="/images/jaknooma-vip.png" alt="VIP" className="w-10 h-auto" />
            )}
            {discount >= 10 && (
              <img src="/images/jaknooma-10.png" alt="Gold" className="w-10 h-auto" />
            )}
            {discount > 0 && discount < 10 && (
              <img src="/images/jaknooma-5.png" alt="Silver" className="w-10 h-auto" />
            )}
          </div>

          {/* Multiple Images Slider */}
          {Array.isArray(product.images) && product.images.length > 0 ? (
            <div className="flex w-full h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
              {product.images.map((imgUrl, index) => (
                <img
                  key={index}
                  src={imgUrl}
                  alt={`${product.name} - ${index + 1}`}
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
          <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
          
          {/* Price */}
          <div className="flex items-center gap-2 mt-1">
            {discount > 0 ? (
              <>
                <span className="text-sm font-bold text-red-600">${finalPrice.toFixed(2)}</span>
                <span className="text-[11px] text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-gray-900">${originalPrice.toFixed(2)}</span>
            )}
          </div>

          {/* Seller, Location, and Date Info Section */}
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

      {/* Action Buttons */}
      <div className="px-1 pb-1 mt-2">
        {product.externalUrl ? (
          <button
            onClick={() => window.open(product.externalUrl, '_blank')}
            className="w-full py-2.5 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-colors z-10"
          >
            Buy from Store
          </button>
        ) : product.sellerPhone ? (
          <a
            href={`https://wa.me/${product.sellerPhone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-[#25D366] text-white text-xs font-bold rounded-full hover:bg-[#1da851] transition-colors z-10 flex items-center justify-center gap-2"
          >
            <MessageCircle size={14} />
            WhatsApp
          </a>
        ) : null}
      </div>
    </div>
  );
}
