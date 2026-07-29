// src/services/agentService.ts

export interface ExternalProductResult {
  id: string;
  title: string;
  price: number;
  image: string;
  externalUrl: string;
  storeName: string;
  isExternal: boolean;
}

export async function searchWithAgent(query: string): Promise<ExternalProductResult[]> {
  if (!query || query.trim().length === 0) return [];

  const cleanQuery = query.trim();

  try {
    const results = await Promise.allSettled([
      scrapeAmazonWeb(cleanQuery),
      scrapeEbayWeb(cleanQuery)
    ]);

    return results
      .filter((r): r is PromiseFulfilledResult<ExternalProductResult[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);
  } catch (error) {
    console.error('Failed to search via AI Agent:', error);
    return [];
  }
}

async function scrapeAmazonWeb(query: string): Promise<ExternalProductResult[]> {
  try {
    const targetUrl = `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=jaknooma-20`;
    // استخدام proxy متوافق مع CORS للمستضافات الخارجية
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) return [];

    const html = await response.text();
    if (!html) return [];

    const products: ExternalProductResult[] = [];
    const itemRegex = /data-asin="([A-Z0-9]{10})".*?class="a-size-[^"]*a-color-base a-text-normal">(.*?)<\/span>.*?class="a-price-whole">(.*?)<\/span>/gs;
    
    let match;
    let count = 0;
    while ((match = itemRegex.exec(html)) !== null && count < 6) {
      const asin = match[1];
      const title = match[2].replace(/<[^>]+>/g, '').trim();
      const rawPrice = match[3].replace(/[^\d.]/g, '');
      const price = parseFloat(rawPrice) || 0;

      const imgRegex = new RegExp(`data-asin="${asin}".*?src="(https://m.media-amazon.com/images/I/[^"]+)"`, 's');
      const imgMatch = imgRegex.exec(html);
      const image = imgMatch ? imgMatch[1] : '';

      if (asin && title && price > 0) {
        products.push({
          id: `amz-${asin}`,
          title: title,
          price: price,
          image: image,
          externalUrl: `https://www.amazon.com/dp/${asin}?tag=jaknooma-20`,
          storeName: 'Amazon',
          isExternal: true
        });
        count++;
      }
    }

    return products;
  } catch (e) {
    console.error('Amazon scrape error:', e);
    return [];
  }
}

async function scrapeEbayWeb(query: string): Promise<ExternalProductResult[]> {
  try {
    const targetUrl = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(query)}&_sacat=0`;
    const proxyUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(targetUrl)}`;

    const response = await fetch(proxyUrl);
    if (!response.ok) return [];

    const html = await response.text();
    if (!html) return [];

    const products: ExternalProductResult[] = [];
    const itemRegex = /<div class="s-item__info clearfix">.*?<span role="heading"[^>]*>(.*?)<\/span>.*?<span class="s-item__price">(.*?)<\/span>/gs;

    let match;
    let count = 0;
    while ((match = itemRegex.exec(html)) !== null && count < 6) {
      const title = match[1].replace(/<[^>]+>/g, '').trim();
      const rawPrice = match[2].replace(/[^\d.]/g, '');
      const price = parseFloat(rawPrice) || 0;

      if (title && !title.toLowerCase().includes('shop on ebay') && price > 0) {
        products.push({
          id: `ebay-${Date.now()}-${count}`,
          title: title,
          price: price,
          image: '',
          externalUrl: `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(title)}&campid=533000000`,
          storeName: 'eBay',
          isExternal: true
        });
        count++;
      }
    }

    return products;
  } catch (e) {
    console.error('eBay scrape error:', e);
    return [];
  }
}
