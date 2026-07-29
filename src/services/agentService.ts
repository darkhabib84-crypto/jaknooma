// src/services/agentService.ts

export async function searchWithAgent(query: string) {
  if (!query || query.trim().length === 0) return [];

  try {
    // لاحظ أن المسار هنا يطابق اسم ملف الـ API لديك: /api/search-agent
    const response = await fetch(`/api/search-agent?q=${encodeURIComponent(query)}`);

    if (!response.ok) return [];

    const data = await response.json();
    
    // تحويل البيانات لتناسب واجهة ProductCard في موقعك
    return (data.products || []).map((item: any) => ({
      id: item.id,
      title: item.name,
      price: item.price,
      image: item.image,
      externalUrl: item.externalUrl,
      storeName: item.storeName,
      isExternal: true
    }));
  } catch (error) {
    console.error('Failed to search via AI Agent:', error);
    return [];
  }
}
