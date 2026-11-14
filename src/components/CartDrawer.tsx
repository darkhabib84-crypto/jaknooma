import React from 'react';
import { X, ShoppingBag, ExternalLink, Trash2, Phone, MessageCircle, Eye } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { useCart } from '../contexts/CartContext';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { formatPrice, isRtlLanguage } from '../lib/i18n';
import { detectProductStoreName } from './ProductCard';

export default function CartDrawer() {
  const { isCartOpen, setCartOpen } = useUI();
  const { cart, removeFromCart } = useCart();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = isRtlLanguage(i18n.language);

  const total = cart.reduce((sum: number, item: any) => sum + (parseFloat(item.price) || 0), 0);

  const getItemExternalUrl = (item: any): string | null => {
    const url = item.externalUrl || item.affiliateLink || item.externalStoreLink;
    return url && typeof url === 'string' && url.trim() !== '' ? url.trim() : null;
  };

  const getItemPhone = (item: any): string | null => {
    const phone = item.phone || item.sellerPhone;
    return phone && typeof phone === 'string' && phone.trim() !== '' ? phone.trim() : null;
  };

  const handleOpenAllLinks = () => {
    const externalItems = cart.filter((item: any) => Boolean(getItemExternalUrl(item)));
    if (externalItems.length > 0) {
      externalItems.forEach((item: any) => {
        const url = getItemExternalUrl(item);
        if (url) {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      });
    } else if (cart.length > 0) {
      setCartOpen(false);
      navigate('/checkout');
    }
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
            dir={isRtl ? 'rtl' : 'ltr'}
            initial={{ x: isRtl ? '-100%' : '100%' }} 
            animate={{ x: 0 }} 
            exit={{ x: isRtl ? '-100%' : '100%' }} 
            transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
            className={`fixed top-0 ${isRtl ? 'left-0' : 'right-0'} bottom-0 w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col`}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2.5 text-gray-900">
                <ShoppingBag className="w-5 h-5 text-[#D4AF37]" />
                <span>{t('Your Cart')} ({cart.length})</span>
              </h2>
              <button
                onClick={() => setCartOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <ShoppingBag className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{t('Your cart is empty')}</h3>
                  <p className="text-xs text-gray-500 max-w-xs mb-6">
                    {t("Looks like you haven't added any premium items to your cart yet.")}
                  </p>
                  <button
                    onClick={() => setCartOpen(false)}
                    className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                  >
                    {t('Start Shopping')}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item: any, index: number) => {
                    const imgSrc =
                      Array.isArray(item.images) && item.images.length > 0
                        ? item.images[0]
                        : item.image || item.imageUrl || item.img || '/placeholder.png';
                    const itemName = item.name || item.title || (isRtl ? 'منتج بدون عنوان' : 'Untitled Product');
                    const storeName = detectProductStoreName(item);
                    const externalUrl = getItemExternalUrl(item);
                    const isExternalItem = Boolean(externalUrl || item.isExternalProduct || storeName);
                    const phone = getItemPhone(item);
                    const cleanDigits = phone ? phone.replace(/[^0-9]/g, '') : '';
                    const currency = item.currency || t('AED');

                    return (
                      <div
                        key={`${item.id || index}-${index}`}
                        className="flex flex-col gap-3 p-3.5 rounded-2xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:shadow-xs transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={imgSrc}
                              alt={itemName}
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 object-contain bg-white p-1 rounded-xl border border-gray-100 shrink-0"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/5 text-gray-700">
                                  {isExternalItem ? (storeName || t('External Store')) : t('Local Listing')}
                                </span>
                              </div>
                              <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{itemName}</h4>
                              <p className="text-emerald-600 font-bold text-sm tabular-nums mt-0.5" dir="ltr">
                                {formatPrice(item.price)} {currency}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, index)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 cursor-pointer"
                            title="Remove"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>

                        {/* Smart Per-Item Direct Action Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200/60">
                          {isExternalItem && externalUrl ? (
                            <a
                              href={externalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
                            >
                              <span>
                                {t('Buy from')} {storeName || t('External Store')} ↗
                              </span>
                              <ExternalLink size={13} className="text-[#D4AF37] shrink-0" />
                            </a>
                          ) : phone ? (
                            <>
                              <a
                                href={`tel:${phone}`}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors"
                              >
                                <Phone size={13} className="text-[#D4AF37] shrink-0" />
                                <span>{t('Call Seller')} 📞</span>
                              </a>
                              <a
                                href={`https://wa.me/${cleanDigits}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors"
                              >
                                <MessageCircle size={13} className="shrink-0" />
                                <span>{t('WhatsApp')} 💬</span>
                              </a>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setCartOpen(false);
                                if (item.id) navigate(`/product/${item.id}`);
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                            >
                              <Eye size={13} />
                              <span>{t('View Listing')}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 bg-gray-50 space-y-3">
              <div className="flex justify-between items-center font-bold text-base text-gray-900">
                <span>{t('Estimated Total')}</span>
                <span className="tabular-nums" dir="ltr">
                  {formatPrice(total)} {t('AED')}
                </span>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed text-center bg-white p-2.5 rounded-xl border border-gray-200/70">
                {t('Smart Cart Note')}
              </p>

              <button
                onClick={handleOpenAllLinks}
                disabled={cart.length === 0}
                className={`w-full font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 text-sm cursor-pointer ${
                  cart.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-black text-white hover:bg-gray-800 shadow-sm'
                }`}
              >
                <span>{t('Open All Product Links')} ↗</span>
                <ExternalLink className="w-4 h-4 text-[#D4AF37]" />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
