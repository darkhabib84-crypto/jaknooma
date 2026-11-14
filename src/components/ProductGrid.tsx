import React, { useState, useEffect } from 'react';
import ProductCard, { Product, detectProductStoreName } from './ProductCard';
import { motion } from 'motion/react';
import { useSearchParams } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useTranslation } from 'react-i18next';

interface ProductGridProps {
  filteredProducts?: Product[];
  loading?: boolean;
  agentLoading?: boolean;
  visibleCount?: number;
  setVisibleCount?: React.Dispatch<React.SetStateAction<number>>;
  image?: { id: string; url: string; alt: string }[];
  t?: (key: string) => string;
}

export default function ProductGrid(props: ProductGridProps) {
  const [searchParams] = useSearchParams();
  const { t: i18nT } = useTranslation();
  const t = props.t || i18nT;

  const [fetchedProducts, setFetchedProducts] = useState<Product[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [internalVisibleCount, setInternalVisibleCount] = useState(12);

  const visibleCount = props.visibleCount !== undefined ? props.visibleCount : internalVisibleCount;
  const setVisibleCount = props.setVisibleCount || setInternalVisibleCount;

  const currentCategory = searchParams.get('category') || '';
  const currentSub = searchParams.get('sub') || searchParams.get('brand') || '';
  const searchQuery = searchParams.get('q') || '';
  const selectedStores = searchParams.getAll('store').map((s) => s.toLowerCase());

  useEffect(() => {
    if (!props.filteredProducts) {
      async function loadProducts() {
        try {
          setFetchLoading(true);
          const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);
          const list: Product[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Product[];
          setFetchedProducts(list);
        } catch (err) {
          console.error('Error fetching products:', err);
        } finally {
          setFetchLoading(false);
        }
      }
      loadProducts();
    }
  }, [props.filteredProducts]);

  const rawProducts = props.filteredProducts || fetchedProducts;
  const isLoading = props.loading !== undefined ? props.loading : fetchLoading;

  const finalProducts = props.filteredProducts ? props.filteredProducts : rawProducts.filter(product => {
    if (selectedStores.length > 0) {
      const detected = (detectProductStoreName(product) || '').toLowerCase();
      const rawStore = ((product as any).storeId || product.storeName || '').toLowerCase();
      const isLocal = !detected && !product.isExternalProduct && !product.externalUrl;
      const matchesStore = selectedStores.some((st) => {
        if (st === 'jaknooma') return isLocal || rawStore.includes('jaknooma');
        return detected.includes(st) || rawStore.includes(st);
      });
      if (!matchesStore) return false;
    }
    if (currentCategory) {
      const matchCat = (product as any).category === currentCategory || (product as any).storeName === currentCategory;
      if (!matchCat) return false;
    }
    if (currentSub) {
      const subLower = currentSub.toLowerCase();
      const prodSub = String((product as any).subCategory || '').toLowerCase();
      const prodBrand = String((product as any).brand || '').toLowerCase();
      const prodTitle = String(product.name || product.title || '').toLowerCase();
      if (prodSub !== subLower && prodBrand !== subLower && !prodTitle.includes(subLower)) {
        return false;
      }
    }
    if (searchQuery) {
      const queryStr = searchQuery.toLowerCase();
      const title = (product.name || product.title || '').toLowerCase();
      const desc = String((product as any).description || '').toLowerCase();
      if (!title.includes(queryStr) && !desc.includes(queryStr)) return false;
    }
    return true;
  });

  const imagesList = props.image || [];

  return (
    <div className="w-full flex flex-col items-center justify-start px-3 sm:px-6 py-5 box-border overflow-x-hidden">
      {imagesList.length > 0 && (
        <div className="w-full max-w-[1400px] grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8 justify-items-center">
          {imagesList.map((item) => (
            <img key={item.id} src={item.url} alt={item.alt} className="w-full h-auto rounded-xl shadow-sm object-cover" />
          ))}
        </div>
      )}

      {(isLoading || props.agentLoading) ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4 w-full">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black"></div>
          {props.agentLoading && (
            <p className="text-sm text-gray-500 font-medium animate-pulse text-center">
              {t('Processing...')}
            </p>
          )}
        </div>
      ) : finalProducts.length === 0 ? (
        <div className="text-center py-16 w-full">
          <p className="text-base sm:text-lg text-gray-500 font-medium">
            {t('لا توجد نتائج تطابق بحثك حالياً')}
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.03 } } }}
          className="w-full max-w-[1400px] grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 mx-auto justify-items-center items-stretch box-border"
        >
          {finalProducts.slice(0, visibleCount).map((product) => (
            <motion.div 
              key={product.id || product.title} 
              variants={{ hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } }}
              className="w-full flex justify-center"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {visibleCount < finalProducts.length && (
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
