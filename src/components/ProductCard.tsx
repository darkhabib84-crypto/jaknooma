import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { MessageCircle } from 'lucide-react';

export interface Product {
  id: string;
  name: string;
  price: number;
  images: string[]; // تم تحديث الاسم ليكون images ليتطابق مع قاعدة البيانات
  isVIP?: boolean;
  externalUrl?: string;
  sellerPhone?: string;
  discountPercent?: number;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const discount = product.discountPercent || 0;
  const originalPrice = Number(product.price || 0);
  const finalPrice = discount > 0 ? originalPrice - (originalPrice * discount / 100) : originalPrice;

  return (
    <div className="group flex flex-col relative w-full bg-white rounded-3xl p-2 shadow-sm border border-gray-100">
      <Link to={`/product/${product.id}`} className="flex flex-col">
        {/* حاوية الصور مع التمرير الأفقي */}
        <div className="relative aspect-[4/5] bg-[#F5F5F0] rounded-3xl mb-5 overflow-hidden flex items-center justify-center p-2">
          
          {/* الشعارات */}
          <div className="absolute top-3 left-3 z-30 flex flex-col gap-1">
            {product.isVIP && <img src="/jaknooma-vip.png" alt="VIP" className="w-10 h-auto" />}
            {discount >= 10 && <img src="/jaknooma-10.png" alt="Gold" className="w-10 h-auto" />}
            {discount > 0 && discount < 10 && <img src="/jaknooma-5.png" alt="Silver" className="w-10 h-auto" />}
          </div>

          {/* عرض الصور المتعددة */}
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
            <div className="text-gray-400 text-xs">لا توجد صورة</div>
          )}
        </div>

        {/* السعر والمعلومات */}
        <div className="flex flex-col px-2 mb-3">
          <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{product.name}</h3>
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
        </div>
      </Link>

      {/* أزرار التواصل */}
      <div className="px-1 pb-1">
        {product.externalUrl ? (
          <button
            onClick={() => window.open(product.externalUrl, '_blank')}
            className="w-full py-2 bg-black text-white text-xs font-bold rounded-full hover:bg-gray-800 transition-colors z-10"
          >
            شراء من المتجر
          </button>
        ) : product.sellerPhone ? (
          <a
            href={`https://wa.me/${product.sellerPhone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 bg-[#25D366] text-white text-xs font-bold rounded-full hover:bg-[#1da851] transition-colors z-10 flex items-center justify-center gap-2"
          >
            <MessageCircle size={14} />
            واتساب
          </a>
        ) : null}
      </div>
    </div>
  );
}

