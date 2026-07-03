import React from 'react';
import { X, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom'; // تم الاستيراد

export default function CartDrawer() {
  const { isCartOpen, setCartOpen } = useUI();
  const { cart, removeFromCart } = useCart();
  const { t } = useTranslation();
  const navigate = useNavigate(); // تهيئة الـ hook

  // حساب المجموع
  const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

  // دالة التوجيه لصفحة ملخص الطلب
  const handleCheckout = () => {
    setCartOpen(false);
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => setCartOpen(false)} 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" 
          />
          <motion.div 
            initial={{ x: document.documentElement.dir === 'rtl' ? '-100%' : '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: document.documentElement.dir === 'rtl' ? '-100%' : '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className="fixed top-0 right-0 rtl:right-auto rtl:left-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 rtl:ml-2" /> {t('Your Cart')} ({cart.length})
              </h2>
              <button onClick={() => setCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{t('Your cart is empty')}</h3>
                  <button onClick={() => setCartOpen(false)} className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors">
                    {t('Start Shopping')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">

{cart.map((item, index) => (
  <div key={index} className="flex items-center justify-between border-b pb-4">
    <div className="flex items-center gap-4">
      <img 
        src={Array.isArray(item.images) ? item.images[0] : item.image} 
        alt={item.name} 
        className="w-16 h-16 object-cover rounded-lg" 
      />
      <div>
        <h4 className="font-bold">{item.name}</h4> {/* هذا السطر سيعرض اسم المنتج */}
        <p className="text-green-600 text-sm">{item.price} درهم</p>
      </div>
    </div>
    <button onClick={() => removeFromCart(item.id)} className="text-red-500">
      <Trash2 size={18}/>
    </button>
  </div>
))}


                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex justify-between mb-4 font-bold text-lg">
                <span>{t('Total')}</span>
                <span>{total.toFixed(2)} درهم</span>
              </div>
<button
  onClick={handleCheckout}
  disabled={cart.length === 0}
  // أزلنا transition-all واستخدمنا duration ثابت مع إزالة أي تأثيرات قد تسبب اختفاء
  className={`w-full font-medium py-4 rounded-xl flex items-center justify-center gap-2 
    ${cart.length === 0 
      ? 'bg-gray-300 cursor-not-allowed' 
      : 'bg-black text-white hover:bg-black/90'}`}
  style={{ transition: 'background-color 0.2s ease' }}
>
  {t('Checkout')} <ArrowRight className="w-4 h-4 rtl:rotate-180" />
</button>




            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

