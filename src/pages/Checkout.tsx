// قم بتحديث ملف src/pages/Checkout.tsx بهذا الكود
import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';

export default function Checkout() {
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();

  const total = cart.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0);

const handleAction = (item: any) => {
  // إذا وجد رابط أفلييت
  if (item.affiliateLink) {
    window.open(item.affiliateLink, '_blank');
  } 
  // إذا وجد رقم هاتف (استخدمنا item.phone حسب كود الإضافة الذي أرسلته سابقاً)
  else if (item.phone) {
    window.open(`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`, '_blank');
  } else {
    alert("عذراً، لا توجد وسيلة تواصل متاحة لهذا المنتج.");
  }
};

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-8">ملخص الطلب</h1>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl">
          <p className="text-gray-500 mb-4">السلة فارغة</p>
          <button onClick={() => navigate('/')} className="text-black font-bold underline">العودة للتسوق</button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">

{cart.map((item, index) => (
  <div key={index} className="flex items-center justify-between py-6 border-b">
    <div className="flex items-center gap-4">
      <img 
        src={Array.isArray(item.images) ? item.images[0] : item.image} 
        className="w-20 h-20 object-cover rounded-2xl" 
      />
      <div>
        <h3 className="font-bold text-lg">{item.name}</h3> {/* اسم المنتج */}
        <p className="text-green-600 font-bold">{item.price} درهم</p> {/* السعر */}
      </div>
    </div>
    
    <button
      onClick={() => handleAction(item)}
      className="bg-black text-white px-6 py-3 rounded-2xl font-bold hover:bg-gray-800"
    >
      شراء الآن
    </button>
  </div>
))}


          <div className="mt-8 flex justify-between items-center text-xl font-bold">
            <span>الإجمالي:</span>
            <span className="text-2xl">{total.toFixed(2)} درهم</span>
          </div>
        </div>
      )}

      <button onClick={() => navigate(-1)} className="mt-8 flex items-center gap-2 text-gray-500">
        <ArrowLeft size={20} /> العودة
      </button>
    </div>
  );
}

