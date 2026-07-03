import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase'; 
import { CategoryItem, defaultCategories } from '../lib/categories';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryItem[]>(defaultCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db) return;

    const unsub = onSnapshot(doc(db, 'settings', 'categories'),
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().items) {
          setCategories(docSnap.data().items as CategoryItem[]);
        } else {
          setCategories(defaultCategories);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore Error:", error);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  return { categories, loading };
}

