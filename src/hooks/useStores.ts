import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { StoreData } from '../components/AdminStoreManager';

const defaultStores = [
  { id: 'amazon', name: 'Amazon', logo: '/images/amazon.png' },
  { id: 'shein', name: 'SHEIN', logo: '/images/shein.png' },
  { id: 'temu', name: 'Temu', logo: '/images/temu.png' } ,
  { id: 'dubizzle', name: 'Dubizzle', logo: '/images/dubizzle.png' },
  { id: 'aliexpress', name: 'AliExpress', logo: '/images/aliexpress.png' },
  { id: 'ebay', name: 'eBay', logo: '/images/ebay.png' },
];

export function useStores() {
  const [stores, setStores] = useState<StoreData[]>(defaultStores as StoreData[]);
  const [loadingStores, setLoadingStores] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'stores'), 
      where('status', '==', 'active'),
      orderBy('priority', 'asc')
    );
    
    // Optimistically use defaultStores while waiting for Firebase
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let storeData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StoreData));
      if (storeData.length > 0) {
         setStores(storeData);
      }
    }, (error) => {
      console.warn('Firebase stores fetch failed, using defaults.', error.message);
    });

    return () => unsubscribe();
  }, []);

  return { stores, loadingStores };
}
