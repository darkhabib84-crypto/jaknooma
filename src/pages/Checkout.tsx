import { useCart } from '../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, ExternalLink, Phone, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPrice, isRtlLanguage } from '../lib/i18n';
import { detectProductStoreName } from '../components/ProductCard';

export default function Checkout() {
  const { cart, removeFromCart } = useCart();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

  const total = cart.reduce((sum: number, item: any) => sum + (parseFloat(item.price) || 0), 0);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="max-w-4xl mx-auto p-4 sm:p-6 md:p-10 min-h-screen bg-gray-50">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-black font-medium transition-colors cursor-pointer"
      >
        <ArrowLeft size={18} className={isRtl ? 'rotate-180' : ''} />
        <span>{t('Back to Shopping')}</span>
      </button>

      <h1 className="text-2xl sm:text-3xl font-bold mb-3 text-gray-900">{t('Your Cart')}</h1>
      <p className="text-sm text-gray-500 mb-8">{t('Smart Cart Note')}</p>

      {cart.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <p className="text-gray-500 mb-4 font-medium">{t('Your cart is empty')}</p>
          <button onClick={() => navigate('/')} className="text-black font-bold underline cursor-pointer">
            {t('Start Shopping')}
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-6 space-y-4">
          {cart.map((item: any, index: number) => {
            const imgSrc =
              Array.isArray(item.images) && item.images.length > 0
                ? item.images[0]
                : item.image || item.imageUrl || '/placeholder.png';
            const storeName = detectProductStoreName(item);
            const externalUrl = item.externalUrl || item.affiliateLink || item.externalStoreLink;
            const phone = item.phone || item.sellerPhone;
            const cleanDigits = phone ? String(phone).replace(/[^0-9]/g, '') : '';

            return (
              <div
                key={`${item.id || index}-${index}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={imgSrc}
                    alt={item.name || item.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 object-contain bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900">
                      {item.name || item.title}
                    </h3>
                    <p className="text-emerald-600 font-bold tabular-nums" dir="ltr">
                      {formatPrice(item.price)} {item.currency || t('AED')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {externalUrl ? (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-black text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-800 flex items-center gap-1.5"
                    >
                      <span>
                        {t('Buy from')} {storeName || t('External Store')} ↗
                      </span>
                      <ExternalLink size={14} className="text-[#D4AF37]" />
                    </a>
                  ) : phone ? (
                    <>
                      <a
                        href={`tel:${phone}`}
                        className="bg-black text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-gray-800 flex items-center gap-1.5"
                      >
                        <Phone size={14} className="text-[#D4AF37]" />
                        <span>{t('Call Seller')} 📞</span>
                      </a>
                      <a
                        href={`https://wa.me/${cleanDigits}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-emerald-700 flex items-center gap-1.5"
                      >
                        <MessageCircle size={14} />
                        <span>{t('WhatsApp')} 💬</span>
                      </a>
                    </>
                  ) : null}

                  <button
                    onClick={() => removeFromCart(item.id, index)}
                    className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="pt-6 border-t border-gray-100 flex justify-between items-center text-lg sm:text-xl font-bold">
            <span>{t('Estimated Total')}:</span>
            <span className="text-xl sm:text-2xl tabular-nums" dir="ltr">
              {formatPrice(total)} {t('AED')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
