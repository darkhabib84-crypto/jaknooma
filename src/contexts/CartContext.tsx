import { createContext, useContext, useState, ReactNode } from 'react';

// إنشاء السياق مع تعريف النوع (Type) ليكون أكثر وضوحاً
const CartContext = createContext<any>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<any[]>([]);

  // دالة الإضافة للسلة
  const addToCart = (product: any) => {
    setCart((prev) => [...prev, product]);
    alert("تمت إضافة المنتج للسلة!");
  };

  // دالة الحذف (ستحتاجها لاحقاً في الـ CartDrawer)
  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== productId));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
};

// الـ Hook المخصص لاستخدامه في أي ملف
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart يجب استخدامه داخل CartProvider");
  }
  return context;
};

