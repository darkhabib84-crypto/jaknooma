import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';

export async function seedDatabase() {
  try {
    const storesSnap = await getDocs(collection(db, 'stores'));
    const productsSnap = await getDocs(collection(db, 'products'));

    if (storesSnap.empty) {
      const batch = writeBatch(db);
      const defaultStores = [
        { id: 'amazon', name: 'Amazon', status: 'active', priority: 0, logo: 'https://logo.clearbit.com/amazon.com' },
        { id: 'shein', name: 'SHEIN', status: 'active', priority: 1, logo: 'https://logo.clearbit.com/shein.com' },
        { id: 'temu', name: 'Temu', status: 'active', priority: 2, logo: 'https://logo.clearbit.com/temu.com' },
        { id: 'dubizzle', name: 'Dubizzle', status: 'active', priority: 3, logo: 'https://logo.clearbit.com/dubizzle.com' },
        { id: 'aliexpress', name: 'AliExpress', status: 'active', priority: 4, logo: 'https://logo.clearbit.com/aliexpress.com' },
      ];
      defaultStores.forEach(s => {
        const ref = doc(db, 'stores', s.id);
        batch.set(ref, s);
      });
      await batch.commit();
      console.log('Seeded stores');
    }

    if (productsSnap.empty) {
      const batch = writeBatch(db);
      const defaultProducts = [
        { id: 'p1', name: 'Sony WH-1000XM5 Wireless Headphones', price: 348.00, originalPrice: 398.00, image: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600&q=80', category: 'Electronics', storeId: 'amazon', rating: 4.8, reviews: 3420, isNew: true },
        { id: 'p2', name: 'Minimalist Ceramic Vase Set', price: 29.99, image: 'https://images.unsplash.com/photo-1612152504930-b38fae6396b1?w=600&q=80', category: 'Home Decor', storeId: 'temu', rating: 4.5, reviews: 128, isNew: false },
        { id: 'p3', name: 'Summer Linen Button Down Shirt', price: 18.50, originalPrice: 25.00, image: 'https://images.unsplash.com/photo-1596755094514-f87e32f85e23?w=600&q=80', category: 'Fashion', storeId: 'shein', rating: 4.2, reviews: 856, isNew: true },
        { id: 'p4', name: 'MacBook Pro M3 Max 16"', price: 3499.00, image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&q=80', category: 'Electronics', storeId: 'amazon', rating: 4.9, reviews: 521, isNew: true },
        { id: 'p5', name: 'Smart Fitness Watch Serie 9', price: 45.00, originalPrice: 89.00, image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&q=80', category: 'Electronics', storeId: 'aliexpress', rating: 4.1, reviews: 4522, isNew: false },
        { id: 'p6', name: 'Pre-owned Rolex Submariner', price: 12500.00, image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80', category: 'Luxury', storeId: 'dubizzle', rating: 5.0, reviews: 2, isNew: false },
        { id: 'p7', name: 'Ergonomic Office Chair', price: 159.00, originalPrice: 249.00, image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=600&q=80', category: 'Furniture', storeId: 'amazon', rating: 4.6, reviews: 1890, isNew: false },
        { id: 'p8', name: 'Aesthetic Cloud Sofa', price: 899.00, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', category: 'Furniture', storeId: 'dubizzle', rating: 4.7, reviews: 34, isNew: true },
      ];
      defaultProducts.forEach(p => {
        const ref = doc(db, 'products', p.id);
        batch.set(ref, p);
      });
      await batch.commit();
      console.log('Seeded products');
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'seed');
  }
}
