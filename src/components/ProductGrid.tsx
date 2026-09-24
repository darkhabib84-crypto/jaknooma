import React from 'react';
import ProductCard, { Product } from './ProductCard';
import { motion } from 'motion/react';

interface ProductGridProps {
  filteredProducts: Product[];
  loading?: boolean;
  agentLoading?: boolean;
  visibleCount: number;
  setVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  image?: { id: string; url: string; alt: string }[];
  t: (key: string) => string;
}

export default function ProductGrid({
  filteredProducts,
  loading,
  agentLoading,
  visibleCount,
  setVisibleCount,
  image = [],
  t,
}: ProductGridProps) {
  return (
    <div className="w-full flex flex-col items-center justify-start px-4 md:px-8 py-6 box-border">
      {/* شبكة الصور الترويجية إن وجدت */}
      {image.length > 0 && (
        <div className="w-full max-w-[1400px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 justify-items-center">
          {image.map((item) => (
            <img key={item.id} src={item.url} alt={item.alt} className="w-full h-auto rounded-xl shadow-sm object-cover" />
          ))}
        </div>
      )}

      {/* حالة التحميل أو عدم وجود نتائج */}
      {(loading || agentLoading) ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4 w-full">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
          {agentLoading && (
            <p className="text-sm text-gray-500 font-medium animate-pulse text-center">
              جاري البحث عبر الـ AI Agent...
            </p>
          )}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 w-full">
          <p className="text-base sm:text-lg text-gray-500 font-medium">
            {t('لا توجد نتائج تطابق بحثك حالياً')}
          </p>
        </div>
      ) : (
        /* شبكة المنتجات المتجاوبة والمسنترة تماماً في المنتصف للكمبيوتر والجوال */
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
          className="w-full max-w-[1400px] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mx-auto justify-items-center items-center box-border"
        >
          {filteredProducts.slice(0, visibleCount).map((product) => (
            <motion.div 
              key={product.id || product.title} 
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              className="w-full flex justify-center max-w-[300px] sm:max-w-none"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* زر عرض المزيد */}
      {visibleCount < filteredProducts.length && (
        <div className="flex justify-center mt-10 pb-10 w-full">
          <button
            onClick={() => setVisibleCount(prev => prev + 12)}
            className="px-6 py-3 bg-black text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {t('Load More')}
          </button>
        </div>
      )}
    </div>
  );
}
