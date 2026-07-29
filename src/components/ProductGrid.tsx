import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard, { Product } from './ProductCard';
import { collection, query, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { fetchImages } from '../services/imageService';

// 1. دالة التحقق مما إذا كان اشتراك الـ VIP سارياً
const checkIsVipActive = (product: any): boolean => {
  const isVipFlag = Boolean(product.isVIP || product.isVip);
  if (!isVipFlag) return false;

  if (!product.vipExpiry) return true;

  const expiryDate = product.vipExpiry.toDate 
    ? product.vipExpiry.toDate() 
    : new Date(product.vipExpiry);

  return expiryDate.getTime() > Date.now();
};

// 2. دالة لاستخراج تاريخ الإنشاء بصيغة Timestamp (لمقارنة الأحدث)
const getCreatedAtTime = (product: any): number => {
  if (product.createdAt) {
    if (typeof product.createdAt.toDate === 'function') {
      return product.createdAt.toDate().getTime();
    }
    return new Date(product.createdAt).getTime();
  }
  return 0;
};

// 3. دالة تحديد الفئة/المستوى للإعلان
const getProductPriority = (product: any): number => {
  if (checkIsVipActive(product)) return 4;

  const discountType = (product.discountType || '').toString().toLowerCase();
  if (discountType === 'gold') return 3;
  if (discountType === 'silver') return 2;

  return 1;
};

export default function ProductGrid() {
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [image, setImage] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  // جلب الفلاتر وكلمة البحث من الـ URL فقط
  const categoryFilter = searchParams.get('category');
  const subCategoryFilter = searchParams.get('sub');
  const minPriceFilter = searchParams.get('minPrice');
  const maxPriceFilter = searchParams.get('maxPrice');
  const storeFilters = searchParams.getAll('store');
  const queryFilter = (searchParams.get('q') || '').trim().toLowerCase();

  useEffect(() => {
    setVisibleCount(12);
  }, [queryFilter, categoryFilter, subCategoryFilter]);

  // جلب المنتجات والصور من قاعدة البيانات المحلية
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'products'));
        const querySnapshot = await getDocs(q);

        const fetchedProducts = querySnapshot.docs.map(doc => {
          const data = doc.data() as any;
          const isVipActive = checkIsVipActive(data);

          return { 
            id: doc.id, 
            ...data, 
            isVIP: isVipActive,
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

  // فلترة المنتجات محلياً بناءً على الاستعلام والأقسام
  const filteredProducts = useMemo(() => {
    const filtered = localProducts.filter((product: any) => {
      // 1. فلترة نص البحث (Search Query)
      if (queryFilter) {
        const title = (product.title || product.name || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        
        const matchesQuery = 
          title.includes(queryFilter) || 
          description.includes(queryFilter) || 
          category.includes(queryFilter);

        if (!matchesQuery) return false;
      }

      // 2. التصفية حسب القسم الرئيسي
      if (categoryFilter) {
        const prodCat = (product.category || '').toLowerCase().trim();
        const targetCat = categoryFilter.toLowerCase().trim();

        const isCategoryMatch =
          prodCat === targetCat ||
          prodCat.includes(targetCat) ||
          targetCat.includes(prodCat);

        if (!isCategoryMatch) return false;
      }

      // 3. التصفية حسب القسم الفرعي
      if (subCategoryFilter) {
        const productSub = product.subCategory || product.subcategory || product.sub;
        if (!productSub) return false;

        const isSubMatch = productSub.toString().trim().toLowerCase() === subCategoryFilter.trim().toLowerCase();
        if (!isSubMatch) return false;
      }

      // 4. التصفية حسب السعر والمتاجر
      if (minPriceFilter && product.price < Number(minPriceFilter)) return false;
      if (maxPriceFilter && product.price > Number(maxPriceFilter)) return false;
      if (storeFilters.length > 0 && !storeFilters.includes(product.storeId) && !storeFilters.includes(product.storeName)) return false;

      return true;
    });

    // منطق الترتيب: VIP -> ذهبي -> فضي -> أحدث
    return filtered.sort((a: any, b: any) => {
      const priorityA = getProductPriority(a);
      const priorityB = getProductPriority(b);

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      const timeA = getCreatedAtTime(a);
      const timeB = getCreatedAtTime(b);

      return timeB - timeA;
    });
  }, [localProducts, categoryFilter, subCategoryFilter, minPriceFilter, maxPriceFilter, storeFilters, queryFilter]);

  return (
    <div className="flex-1 px-4 md:px-8 lg:px-12 py-8 mx-auto w-full max-w-[1400px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {image.map((item) => (
          <img key={item.id} src={item.url} alt={item.alt} className="w-full h-auto rounded-lg shadow-md" />
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
        </div>
      ) : (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-12"
        >
          {filteredProducts.slice(0, visibleCount).map((product) => (
            <motion.div key={product.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
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
