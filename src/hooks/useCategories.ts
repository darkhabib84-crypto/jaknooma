import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase'; 
import { CategoryItem, defaultCategories } from '../lib/categories';

const defaultMap = new Map<string, CategoryItem>(
  defaultCategories.map((c) => [c.value || 'all', c])
);

function enrichCategories(items: CategoryItem[]): CategoryItem[] {
  return items.map((item) => {
    const fallback = defaultMap.get(item.value || 'all');
    const enName = typeof item.name === 'object' ? item.name.en : String(item.name || fallback?.name.en || '');
    const arName =
      typeof item.name === 'object' && item.name.ar && item.name.ar !== item.name.en
        ? item.name.ar
        : fallback?.name.ar || (enName === 'All Categories' ? 'جميع الفئات' : enName);

    const subMap = new Map(
      (fallback?.sub || []).map((s) => [s.en.toLowerCase(), s.ar])
    );

    const rawSubs = Array.isArray(item.sub) ? item.sub : [];
    const fallbackSubs = fallback?.sub || [];

    // Combine default subcategories with any custom subcategories from Firestore without duplicates
    const combinedMap = new Map<string, { en: string; ar: string }>();
    for (const s of [...fallbackSubs, ...rawSubs]) {
      const enVal = typeof s === 'string' ? s : s.en;
      if (!enVal) continue;
      const key = enVal.trim().toLowerCase();
      const arVal =
        typeof s === 'object' && s.ar && s.ar !== s.en
          ? s.ar
          : subMap.get(key) || (typeof s === 'object' ? s.ar : '') || enVal;
      combinedMap.set(key, { en: enVal, ar: arVal });
    }

    // Ensure "Other" / "أخرى (Other)" is always the final option when subcategories exist
    const otherEntry = combinedMap.get('other') || { en: 'Other', ar: 'أخرى (Other)' };
    combinedMap.delete('other');

    const enrichedSub = Array.from(combinedMap.values());
    if (enrichedSub.length > 0) {
      enrichedSub.push(otherEntry);
    }

    return {
      ...item,
      name: { en: enName, ar: arName },
      iconName: item.iconName || fallback?.iconName || 'LayoutGrid',
      sub: enrichedSub,
    };
  });
}

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const unsub = onSnapshot(
      doc(db, 'settings', 'categories'),
      (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().items) && docSnap.data().items.length > 0) {
          setCategories(enrichCategories(docSnap.data().items as CategoryItem[]));
        } else {
          setCategories(defaultCategories);
        }
        setLoading(false);
      },
      (error) => {
        console.error('Firestore Error:', error);
        setCategories(defaultCategories);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const saveCategories = async (newItems: CategoryItem[]) => {
    setCategories(newItems);
    if (!db) return;
    try {
      await setDoc(doc(db, 'settings', 'categories'), { items: newItems }, { merge: true });
    } catch (err) {
      console.error('Failed to save categories:', err);
    }
  };

  return { categories, loading, saveCategories };
}
