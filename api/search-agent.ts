// api/search-agent.ts (Node.js Serverless Function)
import type { Request, Response } from 'express'; // أو VercelRequest / VercelResponse

export interface ExternalProductResult {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  externalUrl: string;
  storeName: string;
}

export default async function handler(req: any, res: any) {
  // تفعيل CORS للسماح لموقع جكنومة بطلب البيانات
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = (req.query.q || req.body?.q || '').toString().trim();

  if (!query) {
    return res.status(400).json({ error: 'كلمة البحث مطلوبة' });
  }

  try {
    // تشغيل الـ Agent للبحث في عدة متاجر بالتوازي
    const results = await Promise.allSettled([
      scrapeAmazon(query, 'jaknooma-20'),
      scrapeAliExpress(query, 'jaknooma_ali'),
      scrapeEbay(query, '533000000')
    ]);

    // تجميع النتائج الناجحة فقط
    const allProducts: ExternalProductResult[] = results
      .filter((r): r is PromiseFulfilledResult<ExternalProductResult[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);

    return res.status(200).json({
      success: true,
      query,
      count: allProducts.length,
      products: allProducts
    });
  } catch (error: any) {
    console.error('[Search Agent Error]:', error);
    return res.status(500).json({ error: 'حدث خطأ أثناء البحث الخارجي', details: error.message });
  }
}

// 1. Agent خاص بموقع Amazon (HTML Scraping)
async function scrapeAmazon(query: string, tag: string): Promise<ExternalProductResult[]> {
  const searchUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${tag}`;
  
  const response = await fetch(searchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8'
    }
  });

  if (!response.ok) return [];

  const html = await response.text();
  const products: ExternalProductResult[] = [];

  // استخراج المنتجات عبر RegEx سريعة وخفيفة من الـ DOM
  const itemRegex = /data-asin="([A-Z0-9]{10})".*?class="a-size-[^"]*a-color-base a-text-normal">(.*?)<\/span>.*?class="a-price-whole">(.*?)<\/span>/gs;
  
  let match;
  let count = 0;
  while ((match = itemRegex.exec(html)) !== null && count < 4) {
    const asin = match[1];
    const title = match[2].trim();
    const rawPrice = match[3].replace(/[^\d.]/g, '');
    const price = parseFloat(rawPrice) || 0;

    // استخراج الصورة الخاصة بالمنتج
    const imgRegex = new RegExp(`data-asin="${asin}".*?src="(https://m.media-amazon.com/images/I/[^"]+)"`, 's');
    const imgMatch = imgRegex.exec(html);
    const image = imgMatch ? imgMatch[1] : '';

    if (asin && title && price > 0) {
      products.push({
        id: `amz-${asin}`,
        name: title,
        price,
        image,
        externalUrl: `https://www.amazon.com/dp/${asin}?tag=${tag}`,
        storeName: 'Amazon'
      });
      count++;
    }
  }

  return products;
}

// 2. Agent خاص بموقع AliExpress (Public API Search)
async function scrapeAliExpress(query: string, tag: string): Promise<ExternalProductResult[]> {
  try {
    const searchUrl = `https://offers.aliexpress.com/ds-search/products?keyword=${encodeURIComponent(query)}&page=1&pageSize=4`;
    const response = await fetch(searchUrl, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) return [];

    const data = await response.json();
    const items = data?.itemList || data?.products || [];

    return items.slice(0, 4).map((item: any) => ({
      id: `ali-${item.productId || Math.random().toString(36).substring(7)}`,
      name: item.title || item.productTitle || query,
      price: parseFloat(item.price || item.targetSalePrice) || 0,
      image: item.imageUrl || item.productImage || '',
      externalUrl: item.promotionUrl || item.productUrl || `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`,
      storeName: 'AliExpress'
    }));
  } catch (e) {
    return [];
  }
}

// 3. Agent خاص بموقع eBay (Public Scraping)
async function scrapeEbay(query: string, campId: string): Promise<ExternalProductResult[]> {
  try {
    const searchUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=0&_sop=12`;
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) return [];
    const html = await response.text();

    const products: ExternalProductResult[] = [];
    const titleRegex = /<div class="s-item__title">.*?<span[^>]*>(.*?)<\/span>.*?<span class="s-item__price">(.*?)<\/span>.*?src="(https:\/\/i\.ebayimg\.com\/images\/g\/[^"]+)"/gs;
    
    let match;
    let count = 0;
    while ((match = titleRegex.exec(html)) !== null && count < 4) {
      const title = match[1].replace(/<[^>]+>/g, '').trim();
      const priceClean = match[2].replace(/[^\d.]/g, '');
      const price = parseFloat(priceClean) || 0;
      const image = match[3];

      if (title && !title.includes('Shop on eBay') && price > 0) {
        products.push({
          id: `ebay-${Date.now()}-${count}`,
          name: title,
          price,
          image,
          externalUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(title)}&campid=${campId}`,
          storeName: 'eBay'
        });
        count++;
      }
    }
    return products;
  } catch (e) {
    return [];
  }
}
