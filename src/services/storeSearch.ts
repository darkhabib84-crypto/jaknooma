import { Product } from '../components/ProductCard';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export interface StoreApiConfig {
  id: string;
  name: string;
  apiUrl?: string;
  apiKey?: string;
  type: string;
}

const realExternalSearch = async (store: StoreApiConfig, keyword: string): Promise<Product[]> => {
  const searchKeyword = keyword.trim() || 'trending';
  
  if (!store.apiUrl) return [];

  try {
    const url = new URL(store.apiUrl);

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
      let results = [];

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
        // دالة مساعدة لتنظيف السعر وتحويله لرقم بشكل آمن
        const parseSafePrice = (priceVal: any): number => {
          if (!priceVal) return 0;
          if (typeof priceVal === 'number') return priceVal;
          // إزالة أي رموز مثل $, AED, الفواصل، والنصوص ليبقى الرقم فقط
          const cleanString = String(priceVal).replace(/[^\d.]/g, '');
          const parsed = parseFloat(cleanString);
          return isNaN(parsed) ? 0 : parsed;
        };

        return results.map((item: any) => {
          const rawPrice = item.price || item.product_price || item.price?.value || item.salePrice || item.price_color;
          const rawOriginalPrice = item.originalPrice || item.original_price || item.product_original_price;
          
          const price = parseSafePrice(rawPrice);
          const originalPrice = parseSafePrice(rawOriginalPrice);

          return {
            id: `${store.id}-${item.id || item.asin || Math.random().toString(36).substring(7)}`,
            name: item.title || item.name || item.product_title || '',
            price: price > 0 ? price : 10, // وضع سعر افتراضي إذا فشل تماماً حتى لا يختفي المنتج
            originalPrice: originalPrice,
            rating: parseFloat(item.rating || item.product_rating) || 0,
            reviews: parseInt(item.reviews || item.product_num_ratings || item.num_reviews) || 0,
            image: item.image || item.product_photo || item.thumbnail || item.product_main_image_url || '',
            category: item.category || store.name,
            externalUrl: item.url || item.product_url || item.affiliate_link || '',
            storeName: store.name,
            storeId: store.id,
            source: store.name.toLowerCase(),
            isVIP: false
          };
        }).filter((p: Product) => p.name && p.image); // أزلنا شرط السعر الصارم مؤقتاً لضمان ظهور المنتجات
      }
    }
    return [];
  } catch (error) {
    console.error(`[Jaknooma Error]`, error);
    return [];
  }
};


   


export async function universalSearch(keyword: string, activeStores: StoreApiConfig[], localProducts: Product[]): Promise<Product[]> {
  const query = keyword.toLowerCase().trim();
  
  // 1. Filter local Firestore products
  const localResults = localProducts.filter(p => {
    if (!query) return true;
    return p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query);
  });

  // 2. Fetch from external stores
  const externalStores = activeStores;
  
  if (externalStores.length === 0) {
    return localResults;
  }

  try {
    const externalResultsArrays = await Promise.all(
      externalStores.map(store => realExternalSearch(store, keyword))
    );
    
    const externalResults = externalResultsArrays.flat();
    return [...localResults, ...externalResults];
  } catch (error) {
    return localResults;
  }
}
