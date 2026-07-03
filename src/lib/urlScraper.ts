export async function scrapeUrlData(url: string) {
  try {
    const encodedUrl = encodeURIComponent(url);
    const proxyUrl = `https://api.allorigins.win/get?url=${encodedUrl}`;
    const response = await fetch(proxyUrl);
    
    if (!response.ok) throw new Error('Failed to fetch from proxy');
    
    const data = await response.json();
    const html = data.contents;
    
    if (!html) throw new Error('No content received');
    
    // Parse the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract OpenGraph tags
    const getMetaProperty = (prop: string) => doc.querySelector(`meta[property="${prop}"]`)?.getAttribute('content') || '';
    const getMetaName = (name: string) => doc.querySelector(`meta[name="${name}"]`)?.getAttribute('content') || '';
    
    let title = getMetaProperty('og:title') || doc.title || '';
    let description = getMetaProperty('og:description') || getMetaName('description') || '';
    let image = getMetaProperty('og:image') || '';
    
    // Clear up Amazon/Shein titles which sometimes have trailing site names
    title = title.replace(/\|.*/, '').trim();

    // Fallback for Shein/Amazon missing OG images but having product images
    if (!image) {
      const img = doc.querySelector('.product-intro__main-image img') || doc.querySelector('#landingImage');
      if (img) image = img.getAttribute('src') || '';
    }

    // Try finding price
    let price = '';
    const priceEl = doc.querySelector('.price span') || doc.querySelector('.a-price .a-offscreen') || doc.querySelector('.discount') || doc.querySelector('[data-price]');
    if (priceEl) {
      price = priceEl.textContent?.replace(/[^0-9.]/g, '') || '';
    }

    return { title, description, image, price };
  } catch (error) {
    console.error('Scraping error:', error);
    throw error;
  }
}
