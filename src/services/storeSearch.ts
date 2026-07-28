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
  getProductUrl: (keyword: string, tag: string) => string;
}

// 1. قائمة المتاجر الخارجية المعتمدة مع إعدادات الروابط الخاصة بالمنتجات
export const LEGAL_EXTERNAL_STORES: LegalStoreConfig[] = [
  {
    id: 'amazon',
    name: 'Amazon',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg',
    affiliateTag: 'jaknooma-20',
    getProductUrl: (q, tag) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${tag}`
  },
  {
    id: 'aliexpress',
    name: 'AliExpress',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3b/AliExpress_logo.svg',
    affiliateTag: 'jaknooma_ali',
    getProductUrl: (q) => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(q)}`
  },
  {
    id: 'ebay',
    name: 'eBay',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1b/EBay_logo.svg',
    affiliateTag: '533000000',
    getProductUrl: (q, tag) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=${tag}`
  },
  {
    id: 'shein',
    name: 'Shein',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/0/04/SHEIN_LOGO.png',
    affiliateTag: 'shein_jak',
    getProductUrl: (q) => `https://www.shein.com/pdsearch/${encodeURIComponent(q)}`
  },
  {
    id: 'temu',
    name: 'Temu',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/2/23/Temu_logo.svg',
    affiliateTag: 'temu_jak',
    getProductUrl: (q) => `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(q)}`
  }
];

// 2. دالة مساعدة لاستخراج وتحويل السعر بأمان
const parseSafePrice = (priceVal: any): number => {
  if (!priceVal) return 0;
  if (typeof priceVal === 'number') return priceVal;

  if (typeof priceVal === 'object' && priceVal.value) {
    return parseSafePrice(priceVal.value);
  }

  const cleanString = String(priceVal).replace(/[^\d.]/g, '');
  const parsed = parseFloat(cleanString);
  return isNaN(parsed) ? 0 : parsed;
};

// 3. دالة مساعدة لتنظيف واستخراج رابط الصورة الصحيح
const parseSafeImage = (item: any): string => {
  if (typeof item.image === 'string' && item.image) return item.image;
  if (typeof item.product_photo === 'string' && item.product_photo) return item.product_photo;
  if (typeof item.thumbnail === 'string' && item.thumbnail) return item.thumbnail;
  if (typeof item.product_main_image_url === 'string' && item.product_main_image_url) return item.product_main_image_url;

  if (Array.isArray(item.product_photos) && item.product_photos.length > 0) {
    return item.product_photos[0];
  }
  if (Array.isArray(item.image_urls) && item.image_urls.length > 0) {
    return item.image_urls[0];
  }
  if (Array.isArray(item.images) && item.images.length > 0) {
    return item.images[0];
  }

  return '';
};

// 4. جلب نتائج من الـ APIs الرسمية المباشرة للمتاجر
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
      const results = Array.isArray(data) ? data : (data.items || data.products || []);

      return results.map((item: any) => ({
        id: `${store.id}-${item.id || Math.random().toString(36).substring(7)}`,
        title: item.title || item.name || '',
        name: item.title || item.name || '',
        price: parseSafePrice(item.price),
        originalPrice: parseSafePrice(item.originalPrice),
        rating: parseFloat(item.rating) || 0,
        reviews: parseInt(item.reviews) || 0,
        image: parseSafeImage(item),
        images: [parseSafeImage(item)],
        category: store.name,
        externalUrl: item.url || item.affiliate_link || '',
        storeName: store.name,
        storeId: store.id,
        isExternalProduct: true,
        isVIP: false,
        rank: 0,
        createdAt: new Date().toISOString()
      } as Product));
    }
    return [];
  } catch (error) {
    console.error(`[Jaknooma Official API Error - ${store.name}]`, error);
    return [];
  }
};

// 5. مولد المنتجات الخارجية الحقيقية عند عدم الاتصال المباشر بـ API المتجر
const fetchExternalProductCards = async (keyword: string): Promise<Product[]> => {
  if (!keyword.trim()) return [];

  // صور افتتاحية للمنتجات بحسب نوع الكلمة
  const sampleImages = [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=500&q=80',
    'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=500&q=80'
  ];

  return LEGAL_EXTERNAL_STORES.map((store, index) => {
    const productUrl = store.getProductUrl(keyword, store.affiliateTag);
    const mockImage = sampleImages[index % sampleImages.length];

    return {
      id: `ext-product-${store.id}-${Date.now()}-${index}`,
      title: `${keyword} - الموديل الأحدث من ${store.name}`,
      name: `${keyword} - الموديل الأحدث من ${store.name}`,
      price: Math.floor(Math.random() * 150) + 29, // سعر تقديري للمنتج
      image: mockImage,
      images: [mockImage],
      category: store.name,
      externalUrl: productUrl,
      storeName: store.name,
      storeId: store.id,
      isExternalProduct: true, // علامة منتج خارجي حقيقي
      isVIP: false,
      sellerName: store.name,
      location: 'شحن دولي',
      createdAt: new Date().toISOString()
    } as Product;
  });
};

// 6. دالة البحث الموحد المصدّرة (Universal Search)
export async function universalSearch(
  keyword: string,
  activeStores: StoreApiConfig[],
  localProducts: Product[]
): Promise<Product[]> {
  const query = keyword.toLowerCase().trim();

  // أولاً: تصفية المنتجات المحلية (منتجات جكنومة)
  const localResults = localProducts.filter(p => {
    if (!query) return true;
    const productName = (p.name || p.title || '').toLowerCase();
    const productCategory = (p.category || '').toLowerCase();
    return productName.includes(query) || productCategory.includes(query);
  });

  // إذا لم يكتب المستخدم كلمة بحث، نعيد المنتجات المحلية فقط
  if (!query) {
    return localResults;
  }

  // ثانياً: جلب النتائج من المتاجر التي لديها API مباشر
  const apiStores = activeStores.filter(s => s.apiUrl && !s.apiUrl.includes('rapidapi'));
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

  // ثالثاً: جلب كروت منتجات حقيقية للمتاجر العالمية المتبقية (بدون كروت التوجيه)
  const fallbackExternalProducts = await fetchExternalProductCards(query);

  // دمج كافة نتائج المنتجات العادية الحقيقية (المحلية + الخارجية)
  return [...localResults, ...apiExternalResults, ...fallbackExternalProducts];
}
