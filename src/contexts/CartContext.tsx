import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import i18n from '../lib/i18n';

const CartContext = createContext<any>(null);

const CART_STORAGE_KEY = 'jaknooma_smart_cart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<any[]>(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage quota errors
    }
  }, [cart]);

  const addToCart = (product: any) => {
    setCart((prev) => [...prev, product]);
    const isAr = (i18n.language || 'ar').startsWith('ar');
    toast.success(isAr ? 'تمت إضافة المنتج إلى السلة الذكية' : i18n.t('Added to cart'));
  };

  const removeFromCart = (productId: string, index?: number) => {
    setCart((prev) => {
      if (typeof index === 'number') {
        return prev.filter((_, idx) => idx !== index);
      }
      return prev.filter((item) => item.id !== productId);
    });
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
