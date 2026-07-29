import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard, { Product } from './ProductCard';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { fetchImages } from '../services/imageService';
import { searchWithAgent } from '../services/agentService'; // استدعاء خدمة الـ AI Agent

const checkIsVipActive = (product: any): boolean => {
  const isVipFlag = Boolean(product.isVIP || product.isVip);
  if (!isVipFlag) return false;
  if (!product.vipExpiry) return true;
  const expiryDate = product.vipExpiry.toDate 
    ? product.vipExpiry.toDate() 
    : new Date(product.vipExpiry);
  return expiryDate.getTime() > Date.now();
};

const getCreatedAtTime = (product: any): number => {
  if (product.createdAt) {
    if (typeof product.createdAt.toDate === 'function') {
      return product.createdAt.toDate().getTime();
    }
    return new Date(product.createdAt).getTime();
  }
  return 0;
};

const getProductPriority = (product: any): number => {
  if (checkIsVipActive(product)) return 4;
  const discountType = (product.discountType || '').toString().toLowerCase();
  if (discountType === 'gold') return 3;
  if (discountType === 'silver') return 2;
  return 1;
};

export default function ProductGrid() {
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [agentProducts, setAgentProducts] = useState<Product[]>([]);
  const [image, setImage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [agentLoading, setAgentLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const categoryFilter = searchParams.get('category');
  const subCategoryFilter = searchParams.get('sub');
  const minPriceFilter = searchParams.get('minPrice');
  const maxPriceFilter = searchParams.get('maxPrice');
  const storeFilters = searchParams.getAll('store');
  const queryFilter = (searchParams.get('q') || '').trim().toLowerCase();

  useEffect(() => {
    setVisibleCount(12);
  }, [queryFilter, categoryFilter, subCategoryFilter]);

  // 1. جلب المنتجات المحلية من Firestore
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'products'));
        const querySnapshot = await getDocs(q);

        const fetchedProducts = querySnapshot.docs.map(doc => {
          const data = doc.data() as any;
          return { 
            id: doc.id, 
            ...data, 
            isVIP: checkIsVipActive(data),
          } as Product;
        });

        setLocalProducts(fetchedProducts);
        const fetchedImages = await fetchImages();
        setImage(fetchedImages);
      } catch (error: any) {
        handleFirestoreError(error, OperationType.LIST, 'products');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. إذا كانت كلمة البحث موجودة، نطلب من الـ AI Agent جلب المنتجات تلقائياً
  useEffect(() => {
    if (!queryFilter) {
      setAgentProducts([]);
      return;
    }

    const fetchFromAgent = async () => {
      setAgentLoading(true);
      try {
        const results = await searchWithAgent(queryFilter);
        setAgentProducts(results || []);
      } catch (err) {
        console.error('[AI Agent Error]:', err);
      } finally {
        setAgentLoading(false);
      }
    };

    fetchFromAgent();
  }, [queryFilter]);

  // دمج المنتجات المحلية مع منتجات الـ AI Agent وفلترتها
  const allProducts = useMemo(() => {
    const combined = [...localProducts, ...agentProducts];
    
    // إزالة التكرار بالـ id أو العنوان
    const uniqueMap = new Map();
    combined.forEach(p => {
      const key = p.id || p.title || p.name;
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, p);
      }
    });

    return Array.from(uniqueMap.values());
  }, [localProducts, agentProducts]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((product: any) => {
      if (queryFilter) {
        const searchPool = [
          product.title,
          product.name,
          product.title_ar,
          product.productName,
          product.description,
          product.category,
          product.storeName,
          ...(Array.isArray(product.tags) ? product.tags : []),
          ...(Array.isArray(product.keywords) ? product.keywords : [])
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchPool.includes(queryFilter)) {
          return false;
        }
      }

      if (categoryFilter) {
        const prodCat = (product.category || '').toLowerCase().trim();
        const targetCat = categoryFilter.toLowerCase().trim();
        if (!prodCat.includes(targetCat) && !targetCat.includes(prodCat)) return false;
      }

      if (subCategoryFilter) {
        const productSub = product.subCategory || product.subcategory || product.sub;
        if (!productSub || productSub.toString().trim().toLowerCase() !== subCategoryFilter.trim().toLowerCase()) return false;
      }

      const productPrice = Number(product.price || 0);
      if (minPriceFilter && productPrice < Number(minPriceFilter)) return false;
      if (maxPriceFilter && productPrice > Number(maxPriceFilter)) return false;
      if (storeFilters.length > 0 && !storeFilters.includes(product.storeId) && !storeFilters.includes(product.storeName)) return false;

      return true;
    }).sort((a: any, b: any) => {
      const priorityA = getProductPriority(a);
      const priorityB = getProductPriority(b);
      if (priorityA !== priorityB) return priorityB - priorityA;
      return getCreatedAtTime(b) - getCreatedAtTime(a);
    });
  }, [allProducts, categoryFilter, subCategoryFilter, minPriceFilter, maxPriceFilter, storeFilters, queryFilter]);

  return (
    <div className="flex-1 px-4 md:px-8 lg:px-12 py-8 mx-auto w-full max-w-[1400px]">
      {image.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {image.map((item) => (
            <img key={item.id} src={item.url} alt={item.alt} className="w-full h-auto rounded-lg shadow-md" />
          ))}
        </div>
      )}

      {(loading || agentLoading) ? (
        <div className="flex flex-col justify-center items-center py-20 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
          {agentLoading && (
            <p className="text-sm text-gray-500 font-medium animate-pulse">
              جاري البحث عبر الـ AI Agent...
            </p>
          )}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-gray-500 font-medium">
            {t('لا توجد نتائج تطابق بحثك حالياً')}
          </p>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12"
        >
          {filteredProducts.slice(0, visibleCount).map((product) => (
            <motion.div key={product.id || product.title} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
              <ProductCard product={product} />
            </motion.div>
          ))}
        </motion.div>
      )}

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
