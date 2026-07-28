import { Product } from '../components/ProductCard';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface StoreApiConfig {
  id: string;
  name: string;
  apiUrl?: string;
  apiKey?: string;
  type?: string;
}

// 1. دالة مساعدة لاستخراج وتحويل السعر بأمان من مختلف الصيغ
const parseSafePrice = (priceVal: any): number => {
  if (!priceVal) return 0;
  if (typeof priceVal === 'number') return priceVal;
  
  // إذا كان السعر داخل كائن مثل { value: 19.99, currency: 'USD' }
  if (typeof priceVal === 'object' && priceVal.value) {
    return parseSafePrice(priceVal.value);
  }

  const cleanString = String(priceVal).replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};

// 2. دالة مساعدة لتنظيف واستخراج رابط الصورة الصحيح
const parseSafeImage = (item: any): string => {
  if (typeof item.image === 'string' && item.image) return item.image;
  if (typeof item.product_photo === 'string' && item.product_photo) return item.product_photo;
  if (typeof item.thumbnail === 'string' && item.thumbnail) return item.thumbnail;
  if (typeof item.product_main_image_url === 'string' && item.product_main_image_url) return item.product_main_image_url;
  
  // لنتائج eBay / RapidAPI القادمة كمصفوفة صور
  if (Array.isArray(item.product_photos) && item.product_photos.length > 0) {
    return item.product_photos[0];
  }
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
    return item.image_urls[0];
  }

  return '';
};

// 3. دالة جلب المنتجات الخارجية من المتاجر
const realExternalSearch = async (store: StoreApiConfig, keyword: string): Promise<Product[]> => {
  const searchKeyword = keyword.trim() || 'trending';
  
  if (!store.apiUrl) return [];

  try {
    const url = new URL(store.apiUrl);

    // ضبط استعلامات الـ URL حسب نوع المتجر / API
    if (url.hostname.includes('real-time-amazon-data')) {
      url.searchParams.append('query', searchKeyword);
      url.searchParams.append('page', '1');
      url.searchParams.append('country', 'US');
      url.searchParams.append('sort_by', 'RELEVANCE');
    } else if (url.hostname.includes('real-time-ebay-data')) {
      url.searchParams.append('q', searchKeyword);
    } else {
      url.searchParams.append('q', searchKeyword);
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (store.apiKey) {
      if (url.hostname.includes('rapidapi')) {
        headers['x-rapidapi-host'] = url.hostname;
        headers['x-rapidapi-key'] = store.apiKey;
      } else {
        url.searchParams.append('api_key', store.apiKey);
      }
    }

    const response = await fetch(url.toString(), { headers });

    if (response.ok) {
      const data = await response.json();
      let results: any[] = [];

      // استخراج القائمة بناءً على الهيكل المتوقع للاستجابة
      if (Array.isArray(data)) {
        results = data;
      } else if (data.data && Array.isArray(data.data.products)) {
        results = data.data.products;
      } else if (data.data && Array.isArray(data.data)) {
        results = data.data;
      } else if (Array.isArray(data.results)) {
        results = data.results;
      } else if (Array.isArray(data.products)) {
        results = data.products;
      } else if (data.items && Array.isArray(data.items)) {
        results = data.items;
      }

      if (results.length > 0) {
        return results.map((item: any) => {
          const rawPrice = item.price || item.product_price || item.price?.value || item.salePrice || item.price_color;
          const rawOriginalPrice = item.originalPrice || item.original_price || item.product_original_price;
          
          const price = parseSafePrice(rawPrice);
          const originalPrice = parseSafePrice(rawOriginalPrice);
          const title = item.title || item.name || item.product_title || '';
          const imageUrl = parseSafeImage(item);

          return {
            id: `${store.id}-${item.id || item.asin || Math.random().toString(36).substring(7)}`,
            title: title,
            name: title, // دعم لكلا الحقلين لضمان عدم توقف التنسيق
            price: price > 0 ? price : 10,
            originalPrice: originalPrice,
            rating: parseFloat(item.rating || item.product_rating) || 0,
            reviews: parseInt(item.reviews || item.product_num_ratings || item.num_reviews) || 0,
            image: imageUrl,
            category: item.category || store.name,
            externalUrl: item.url || item.product_url || item.affiliate_link || item.product_offers_page_url || '',
            storeName: store.name,
            storeId: store.id,
            source: store.name.toLowerCase(),
            isVIP: false,
            rank: 0,
            createdAt: new Date().toISOString() // تاريخ افتراضي للتصنيف الأحدث
          } as Product;
        }).filter((p: Product) => (p.title || p.name) && p.image);
      }
    }
    return [];
  } catch (error) {
    console.error(`[Jaknooma External Search Error - ${store.name}]`, error);
    return [];
  }
};

// 4. دالة البحث الموحد المصدّرة
export async function universalSearch(
  keyword: string, 
  activeStores: StoreApiConfig[], 
  localProducts: Product[]
): Promise<Product[]> {
  const query = keyword.toLowerCase().trim();
  
  // تصفية المنتجات المحلية أولاً
  const localResults = localProducts.filter(p => {
    if (!query) return true;
    const productName = (p.name || p.title || '').toLowerCase();
    const productCategory = (p.category || '').toLowerCase();
    return productName.includes(query) || productCategory.includes(query);
  });

  if (activeStores.length === 0) {
    return localResults;
  }

  try {
    // جلب المنتجات من كل المتاجر النشطة بشكل متوازي
    const externalResultsArrays = await Promise.all(
      activeStores.map(store => realExternalSearch(store, keyword))
    );
    
    const externalResults = externalResultsArrays.flat();

    // دمج المنتجات المحلية مع الخارجية
    return [...localResults, ...externalResults];
  } catch (error) {
    console.error('[Jaknooma Universal Search Error]', error);
    return localResults;
  }
}
