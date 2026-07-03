import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard, { Product } from './ProductCard';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion } from 'motion/react';
import { useUI } from '../contexts/UIContext';
import { useTranslation } from 'react-i18next';
import { useStores } from '../hooks/useStores';
import { universalSearch } from '../services/storeSearch';
import { fetchImages } from '../services/imageService';

export default function ProductGrid() {
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [image, setImage] = useState<any[]>([]);
  const [displayProducts, setDisplayProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [localFetched, setLocalFetched] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [searchParams] = useSearchParams();
  const { searchQuery } = useUI();
  const { t } = useTranslation();
  const { stores } = useStores();

  const categoryFilter = searchParams.get('category');
  const minPriceFilter = searchParams.get('minPrice');
  const maxPriceFilter = searchParams.get('maxPrice');
  const storeFilters = searchParams.getAll('store');
  const queryFilter = searchParams.get('q') || searchQuery;

  useEffect(() => {
    setVisibleCount(12);
  }, [displayProducts]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'products'));
        const querySnapshot = await getDocs(q);
        const now = new Date();

        const fetchedProducts = querySnapshot.docs.map(doc => {
          const data = doc.data() as any;
          let dynamicRank = data.rank || 0;
          if (data.isVIP && data.vipExpiry) {
            const expiryDate = data.vipExpiry.toDate ? data.vipExpiry.toDate() : new Date(data.vipExpiry);
            if (expiryDate > now) dynamicRank = 1000;
          }
          return { id: doc.id, ...data, rank: dynamicRank } as Product;
        });

        fetchedProducts.sort((a: any, b: any) => b.rank - a.rank);
        setLocalProducts(fetchedProducts);
        const fetchedImages = await fetchImages();
        setImage(fetchedImages);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.LIST, 'products');
      } finally {
        setLocalFetched(true);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const runSearch = async () => {
      setLoading(true);
      const storesToSearch = storeFilters.length > 0
        ? stores.filter(s => storeFilters.includes(s.id) || storeFilters.includes(s.name))
        : stores;
      const results = await universalSearch(queryFilter || '', storesToSearch, localProducts);
      setDisplayProducts(results);
      setLoading(false);
    };
    if (localFetched) runSearch();
  }, [queryFilter, localProducts, stores, localFetched, storeFilters.join(",")]);

  const filteredProducts = useMemo(() => {
    const filtered = displayProducts.filter((product: any) => {
      if (categoryFilter && product.category !== categoryFilter) return false;
      if (minPriceFilter && product.price < Number(minPriceFilter)) return false;
      if (maxPriceFilter && product.price > Number(maxPriceFilter)) return false;
      if (storeFilters.length > 0 && !storeFilters.includes(product.storeId) && !storeFilters.includes(product.storeName)) return false;
      return true;
    });

    // الترتيب: VIP يظهر دائماً في الأعلى أولاً، ثم الترتيب حسب النوع
    return filtered.sort((a: any, b: any) => {
      // 1. منطق الـ VIP: (تأكد دائماً أن الـ VIP يظهر في الأعلى أولاً)
      if (a.isVIP && !b.isVIP) return -1;
      if (!a.isVIP && b.isVIP) return 1;

      // 2. إذا كان كلاهما VIP أو كلاهما عادي، نرتب حسب الخصومات أو الترتيب الافتراضي
      const getScore = (p: any) => {
        let score = 0;
        if (p.discountType === 'gold') score += 500;
        if (p.discountType === 'silver') score += 250;
        return score;
      };

      return getScore(b) - getScore(a);
    });
  }, [displayProducts, categoryFilter, minPriceFilter, maxPriceFilter, storeFilters]);

  return (
    <div className="flex-1 px-4 md:px-8 lg:px-12 py-8 mx-auto w-full max-w-[1400px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {image.map((item) => (
          <img key={item.id} src={item.url} alt={item.alt} className="w-full h-auto rounded-lg shadow-md" />
        ))}
      </div>

      <motion.div
        variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12"
      >
        {filteredProducts.slice(0, visibleCount).map((product) => (
          <motion.div key={product.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </motion.div>

      {visibleCount < filteredProducts.length && (
        <div className="flex justify-center mt-12 pb-12 w-full">
          <button
            onClick={() => setVisibleCount(prev => prev + 12)}
            className="px-8 py-4 bg-black text-white rounded-full font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all shadow-lg"
          >
            {t('Load More')}
          </button>
        </div>
      )}
    </div>
  );
}

