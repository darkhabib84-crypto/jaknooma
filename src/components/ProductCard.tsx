import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, User, Calendar, Phone } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: number;
  currency?: string;
  images: string[];
  isVIP?: boolean;
  externalUrl?: string;
  affiliateLink?: string;
  sellerPhone?: string;
  phone?: string;
  discountPercent?: number;
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
  
  const currencySymbol = product.currency || 'AED';
  const phoneNumber = product.sellerPhone || product.phone;

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

          {/* Images Slider */}
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

            {/* Phone Number Displayed as Plain Text */}
            {phoneNumber && (
              <div className="flex items-center gap-1.5">
                <Phone size={12} className="text-gray-400 shrink-0" />
                <span className="truncate">
                  Phone: <strong className="text-gray-700 font-medium">{phoneNumber}</strong>
                </span>
              </div>
            )}

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
