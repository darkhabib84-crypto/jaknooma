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

const SEARCH_AGENT_URL = '/api/search-agent';

// ذاكرة مؤقتة لمنع تكرار الطلبات المتطابقة
const searchCache = new Map<string, Product[]>();

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

export async function universalSearch(
  keyword: string,
  activeStores: StoreApiConfig[],
  localProducts: Product[]
): Promise<Product[]> {
  const query = keyword.toLowerCase().trim();

  // 1. تصفية المنتجات المحلية أولاً
  const localResults = localProducts.filter(p => {
    if (!query) return true;
    const productName = (p.name || p.title || '').toLowerCase();
    const productCategory = (p.category || '').toLowerCase();
    const storeName = (p.storeName || '').toLowerCase();
    return productName.includes(query) || productCategory.includes(query) || storeName.includes(query);
  });

  if (!query) {
    return localResults;
  }

  // 2. التحقق من الذاكرة المؤقتة
  if (searchCache.has(query)) {
    const cachedResults = searchCache.get(query) || [];
    const existingIds = new Set(localResults.map(p => p.id));
    const uniqueCached = cachedResults.filter(p => !existingIds.has(p.id));
    return [...localResults, ...uniqueCached];
  }

  // 3. جلب النتائج بأمان من سيرفر الـ Backend الخاص بنا (بدون CORS وبدون بركسيات خارجية)
  try {
    const response = await fetch(`${SEARCH_AGENT_URL}?q=${encodeURIComponent(query)}`);
    const contentType = response.headers.get('content-type');

    if (response.ok && contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (data.success && Array.isArray(data.products)) {
        const remoteProducts: Product[] = data.products.map((item: any) => ({
          id: item.id || `agent-${Math.random().toString(36).substring(7)}`,
          title: item.title || item.name || '',
          name: item.title || item.name || '',
          price: parseSafePrice(item.price),
          originalPrice: parseSafePrice(item.originalPrice || item.price),
          rating: parseFloat(item.rating) || 4.5,
          reviews: parseInt(item.reviews) || 0,
          image: parseSafeImage(item),
          images: [parseSafeImage(item)],
          category: item.category || item.storeName || 'متجر خارجي',
          externalUrl: item.externalUrl || item.url || '',
          storeName: item.storeName || 'متجر خارجي',
          sellerName: item.storeName || 'متجر خارجي',
          location: 'شحن دولي',
          isExternalProduct: true,
          isVIP: false,
          createdAt: new Date().toISOString()
        }));

        searchCache.set(query, remoteProducts);
        
        const existingIds = new Set(localResults.map(p => p.id));
        const uniqueRemote = remoteProducts.filter(p => !existingIds.has(p.id));
        
        return [...localResults, ...uniqueRemote];
      }
    }
  } catch (error) {
    console.error('[Jaknooma Search Fetch Error]:', error);
  }

  return localResults;
}
