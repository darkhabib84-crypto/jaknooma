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

// دالة مساعدة لاستخراج وتنظيف السعر من استجابة الـ API الرسمية
const parseSafePrice = (priceVal: any): number => {
  if (!priceVal) return 0;
  if (typeof priceVal === 'number') return priceVal;
  if (typeof priceVal === 'object' && priceVal.value) return parseSafePrice(priceVal.value);

  const cleanString = String(priceVal).replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};

// دالة مساعدة لاستخراج رابط الصورة الحقيقي من الـ API
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

// جلب البيانات الحقيقية فقط من الـ APIs الخاصة بالمتاجر الخارجيّة
const fetchOfficialStoreApi = async (store: StoreApiConfig, keyword: string): Promise<Product[]> => {
  if (!store.apiUrl) return [];

  try {
    const url = new URL(store.apiUrl);
    url.searchParams.append('q', keyword);

    const headers: Record<string, string> = {
      'Accept': 'application/json'
    };

    if (store.apiKey) {
      headers['Authorization'] = `Bearer ${store.apiKey}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (response.ok) {
      const data = await response.json();
      const results = Array.isArray(data) ? data : (data.items || data.products || data.results || []);

      return results.map((item: any) => ({
        id: `${store.id}-${item.id || item.productId || Math.random().toString(36).substring(7)}`,
        title: item.title || item.name || item.product_title || '',
        name: item.title || item.name || item.product_title || '',
        price: parseSafePrice(item.price || item.price_final || item.offer_price),
        originalPrice: parseSafePrice(item.originalPrice || item.price_original),
        rating: parseFloat(item.rating) || 0,
        reviews: parseInt(item.reviews) || 0,
        image: parseSafeImage(item),
        images: [parseSafeImage(item)],
        category: store.name,
        externalUrl: item.url || item.product_url || item.affiliate_link || item.item_url || '',
        storeName: store.name,
        storeId: store.id,
        isExternalProduct: true,
        isVIP: false,
        createdAt: new Date().toISOString()
      } as Product));
    }
    return [];
  } catch (error) {
    console.error(`[Jaknooma API Error - ${store.name}]`, error);
    return [];
  }
};

// دالة البحث الموحد (Universal Search) - حقيقية 100% بدون Mock Data
export async function universalSearch(
  keyword: string,
  activeStores: StoreApiConfig[],
  localProducts: Product[]
): Promise<Product[]> {
  const query = keyword.toLowerCase().trim();

  // 1. تصفية المنتجات المحلية المرفوعة في جكنومة
  const localResults = localProducts.filter(p => {
    if (!query) return true;
    const productName = (p.name || p.title || '').toLowerCase();
    const productCategory = (p.category || '').toLowerCase();
    return productName.includes(query) || productCategory.includes(query);
  });

  if (!query) {
    return localResults;
  }

  // 2. جلب النتائج من المتاجر الخارجية التي تم تزويدها بـ apiUrl فعلي
  const apiStores = activeStores.filter(s => s.apiUrl);
  let apiExternalResults: Product[] = [];

  if (apiStores.length > 0) {
    try {
      const resultsArrays = await Promise.all(
        apiStores.map(store => fetchOfficialStoreApi(store, query))
      );
      apiExternalResults = resultsArrays.flat();
    } catch (error) {
      console.error('[Jaknooma Universal Search API Error]', error);
    }
  }

  // إرجاع النتائج الحقيقية فقط (المحلية + المتاجر المربوطة بـ API)
  return [...localResults, ...apiExternalResults];
}
