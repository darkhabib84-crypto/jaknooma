import { Product } from '../components/ProductCard';

export interface StoreApiConfig {
  id: string;
  name: string;
  apiUrl?: string;
  apiKey?: string;
  type?: string;
  affiliateTag?: string;
}

export interface LegalStoreConfig {
  id: string;
  name: string;
  logo: string;
  affiliateTag: string;
}

export const LEGAL_EXTERNAL_STORES: LegalStoreConfig[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    affiliateTag: 'jaknooma-20',
  },
  {
    id: 'aliexpress',
    name: 'AliExpress',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/AliExpress_logo.svg',
    affiliateTag: 'jaknooma_ali',
  },
  {
    id: 'ebay',
    name: 'eBay',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
    affiliateTag: '533000000',
  },
  {
    id: 'shein',
    name: 'Shein',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/SHEIN_LOGO.png',
    affiliateTag: 'shein_jak',
  },
  {
    id: 'temu',
    name: 'Temu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Temu_logo.svg',
    affiliateTag: 'temu_jak',
  }
];

// رابط الـ Agent الخاص بك أو endpoint الخادم
const SEARCH_AGENT_URL = '/api/search-agent';

// مفتاح RapidAPI الخاص بك (إذا كنت تدعو RapidAPI مباشرة من الواجهة)
const RAPID_API_KEY = 'YOUR_RAPIDAPI_KEY_HERE'; 

const parseSafePrice = (priceVal: any): number => {
  if (!priceVal) return 0;
  if (typeof priceVal === 'number') return priceVal;
  if (typeof priceVal === 'object' && priceVal.value) return parseSafePrice(priceVal.value);

  const cleanString = String(priceVal).replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};

const parseSafeImage = (item: any): string => {
  if (typeof item.image === 'string' && item.image) return item.image;
  if (typeof item.product_photo === 'string' && item.product_photo) return item.product_photo;
  if (typeof item.thumbnail === 'string' && item.thumbnail) return item.thumbnail;
  if (typeof item.product_main_image_url === 'string' && item.product_main_image_url) return item.product_main_image_url;

  if (Array.isArray(item.product_photos) && item.product_photos.length > 0) return item.product_photos[0];
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0) return item.image_urls[0];
  if (Array.isArray(item.images) && item.images.length > 0) return item.images[0];

  return '';
};

// 1. طلب متجر موجه لـ RapidAPI بمعالجة آمنة للاستجابة
const fetchOfficialStoreApi = async (store: StoreApiConfig, keyword: string): Promise<Product[]> => {
  if (!store.apiUrl) return [];

  try {
    const url = new URL(store.apiUrl);
    url.searchParams.append('q', keyword);

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    // إذا كان الرابط يخص RapidAPI نمرر الهيدرز المطلوبة لمنع خطأ 401
    if (store.apiUrl.includes('rapidapi.com')) {
      headers['x-rapidapi-key'] = store.apiKey || RAPID_API_KEY;
      headers['x-rapidapi-host'] = url.hostname;
    } else if (store.apiKey) {
      headers['Authorization'] = `Bearer ${store.apiKey}`;
    }

    const response = await fetch(url.toString(), { headers });

    // التحقق من أن الاستجابة ناجحة ومن نوع JSON لمنع خطأ SyntaxError
    const contentType = response.headers.get('content-type');
    if (response.ok && contentType && contentType.includes('application/json')) {
      const data = await response.json();
      const results = Array.isArray(data) ? data : (data.items || data.products || data.results || data.data || []);

      return results.map((item: any) => ({
        id: `${store.id}-${item.id || item.asin || item.itemId || Math.random().toString(36).substring(7)}`,
        title: item.title || item.product_title || item.name || '',
        name: item.title || item.product_title || item.name || '',
        price: parseSafePrice(item.price || item.product_price || item.offer_price),
        originalPrice: parseSafePrice(item.originalPrice || item.product_original_price),
        rating: parseFloat(item.rating || item.product_star_rating) || 0,
        reviews: parseInt(item.reviews || item.product_num_ratings) || 0,
        image: parseSafeImage(item),
        images: [parseSafeImage(item)],
        category: store.name,
        externalUrl: item.url || item.product_url || item.affiliate_link || item.product_page_url || '',
        storeName: store.name,
        storeId: store.id,
        isExternalProduct: true,
        isVIP: false,
        createdAt: new Date().toISOString()
      } as Product));
    } else {
      console.warn(`[Jaknooma API Skip] ${store.name} responded with status ${response.status}`);
      return [];
    }
  } catch (error) {
    console.error(`[Jaknooma API Error - ${store.name}]`, error);
    return [];
  }
};

// 2. جلب النتائج من الـ Agent مع حماية من الأخطاء
const fetchAgentResults = async (keyword: string): Promise<Product[]> => {
  try {
    const response = await fetch(`${SEARCH_AGENT_URL}?q=${encodeURIComponent(keyword)}`);
    
    const contentType = response.headers.get('content-type');
    if (!response.ok || !contentType || !contentType.includes('application/json')) {
      return [];
    }

    const data = await response.json();
    if (!data.success || !Array.isArray(data.products)) return [];

    return data.products.map((item: any) => ({
      id: item.id || `agent-${Math.random().toString(36).substring(7)}`,
      title: item.name || item.title || '',
      name: item.name || item.title || '',
      price: parseSafePrice(item.price),
      originalPrice: parseSafePrice(item.originalPrice || item.price),
      rating: 4.5,
      reviews: 0,
      image: parseSafeImage(item),
      images: [parseSafeImage(item)],
      category: item.storeName || 'متجر خارجي',
      externalUrl: item.externalUrl || '',
      storeName: item.storeName || 'متجر خارجي',
      sellerName: item.storeName || 'متجر خارجي',
      location: 'شحن دولي',
      isExternalProduct: true,
      isVIP: false,
      createdAt: new Date().toISOString()
    } as Product));
  } catch (error) {
    console.error('[Jaknooma AI Agent Search Error]', error);
    return [];
  }
};

export async function universalSearch(
  keyword: string,
  activeStores: StoreApiConfig[],
  localProducts: Product[]
): Promise<Product[]> {
  const query = keyword.toLowerCase().trim();

  // تصفية المنتجات المحلية
  const localResults = localProducts.filter(p => {
    if (!query) return true;
    const productName = (p.name || p.title || '').toLowerCase();
    const productCategory = (p.category || '').toLowerCase();
    return productName.includes(query) || productCategory.includes(query);
  });

  if (!query) {
    return localResults;
  }

  // البحث عبر APIs المتاجر الفعالة
  const apiStores = activeStores.filter(s => s.apiUrl);
  let directApiResults: Product[] = [];

  if (apiStores.length > 0) {
    try {
      const resultsArrays = await Promise.all(
        apiStores.map(store => fetchOfficialStoreApi(store, query))
      );
      directApiResults = resultsArrays.flat();
    } catch (error) {
      console.error('[Jaknooma Direct API Error]', error);
    }
  }

  // جلب نتائج الـ AI Agent
  const agentResults = await fetchAgentResults(query);

  return [...localResults, ...directApiResults, ...agentResults];
}
