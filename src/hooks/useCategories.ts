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

    const enrichedSub = (item.sub || fallback?.sub || []).map((s) => ({
      en: s.en,
      ar: s.ar && s.ar !== s.en ? s.ar : subMap.get(s.en.toLowerCase()) || s.ar || s.en,
    }));

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
