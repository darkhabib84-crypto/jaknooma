import React, { useState, useEffect } from 'react';
import { Search, Trash2, Plus, Edit2, X, Save, ExternalLink, Store, MapPin } from 'lucide-react';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatPrice, isRtlLanguage } from '../../lib/i18n';
import { detectProductStoreName, getCleanCityLocation } from '../ProductCard';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const fetchedData = querySnapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      setProducts(fetchedData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error(isRtl ? 'تعذر تحميل المنتجات' : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const getResolvedStoreLabel = (item: any): { label: string; isExternal: boolean } => {
    const detected = detectProductStoreName(item);
    if (detected) {
      return { label: detected, isExternal: true };
    }
    if (item.store && item.store !== 'N/A') {
      return { label: item.store, isExternal: true };
    }
    if (item.isExternalProduct || item.externalUrl || item.affiliateLink) {
      return { label: item.storeName || (isRtl ? 'متجر خارجي' : 'External Store'), isExternal: true };
    }
    return { label: isRtl ? 'إعلان محلي / Local' : 'Local / إعلان محلي', isExternal: false };
  };

  const handleConfirmDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
      setDeletingId(null);
      toast.success(isRtl ? 'تم حذف المنتج بنجاح' : 'Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error(isRtl ? 'حدث خطأ أثناء الحذف' : 'Failed to delete product');
    }
  };

  const openEditModal = (item: any) => {
    const detected = detectProductStoreName(item);
    setEditingProduct({
      id: item.id,
      name: item.name || item.title || '',
      price: item.price ?? 0,
      currency: item.currency || 'AED',
      storeName: detected || item.storeName || item.store || '',
      location: getCleanCityLocation(item, t),
      externalUrl: item.externalUrl || item.affiliateLink || '',
      phone: item.phone || item.sellerPhone || '',
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct?.id) return;
    setSavingEdit(true);
    try {
      const numericPrice = parseFloat(String(editingProduct.price).replace(/,/g, '')) || 0;
      const cleanStore = editingProduct.storeName.trim();
      const isExt = Boolean(cleanStore && cleanStore.toLowerCase() !== 'local' && cleanStore !== 'إعلان محلي') || Boolean(editingProduct.externalUrl.trim());

      const updatedFields: any = {
        name: editingProduct.name.trim(),
        title: editingProduct.name.trim(),
        price: numericPrice,
        currency: 'AED',
        storeName: cleanStore,
        store: cleanStore,
        location: editingProduct.location.trim() || 'Abu Dhabi',
        externalUrl: editingProduct.externalUrl.trim(),
        phone: editingProduct.phone.trim(),
        isExternalProduct: isExt,
      };

      await updateDoc(doc(db, 'products', editingProduct.id), updatedFields);
      setProducts(prev =>
        prev.map(p => (p.id === editingProduct.id ? { ...p, ...updatedFields } : p))
      );
      setEditingProduct(null);
      toast.success(isRtl ? 'تم تحديث بيانات المنتج بنجاح!' : 'Product updated successfully!');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(isRtl ? 'حدث خطأ أثناء حفظ التعديلات' : 'Failed to update product');
    } finally {
      setSavingEdit(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const q = searchTerm.toLowerCase();
    const title = (p.name || p.title || '').toLowerCase();
    const store = getResolvedStoreLabel(p).label.toLowerCase();
    return title.includes(q) || store.includes(q);
  });

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">{t('Products')}</h1>
          <p className="text-gray-500 text-sm">
            {isRtl
              ? `إدارة وتعديل ${products.length} منتج وإعلان نشط بالدرهم الإماراتي (AED).`
              : `Manage ${products.length} active listings in AED.`}
          </p>
        </div>
        <button
          onClick={() => navigate('/add-product')}
          className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 shadow-sm cursor-pointer"
        >
          <Plus className="w-5 h-5 text-[#D4AF37]" />
          <span>{t('Add Product')}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative shrink-0">
        <Search
          className={`w-5 h-5 absolute ${
            isRtl ? 'right-3.5' : 'left-3.5'
          } top-1/2 -translate-y-1/2 text-gray-400`}
        />
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder={isRtl ? 'ابحث باسم المنتج أو المتجر (Amazon, SHEIN, Local)...' : 'Search by product name or store...'}
          className={`w-full ${
            isRtl ? 'pr-11 pl-4' : 'pl-11 pr-4'
          } py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all`}
        />
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
        <div className="overflow-x-auto flex-1 w-full">
          <table className="w-full text-start border-collapse min-w-[680px]">
            <thead>
              <tr className="bg-gray-50/70 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-semibold text-start ps-6">{t('Product')}</th>
                <th className="p-4 font-semibold text-start">{t('Store')}</th>
                <th className="p-4 font-semibold text-start">{t('Price')} (AED)</th>
                <th className="p-4 font-semibold text-end pe-6">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">
                    {isRtl ? 'جاري تحميل المنتجات...' : 'Loading products...'}
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-400 text-sm">
                    {t('No results found')}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((item) => {
                  const storeInfo = getResolvedStoreLabel(item);
                  const img =
                    Array.isArray(item.images) && item.images.length > 0
                      ? item.images[0]
                      : item.image || item.imageUrl || item.img;
                  const prodTitle = item.name || item.title || 'Unnamed Product';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 ps-6">
                        <div className="flex items-center gap-3">
                          {img ? (
                            <img
                              src={img}
                              alt={prodTitle}
                              referrerPolicy="no-referrer"
                              className="w-11 h-11 rounded-xl object-contain bg-gray-50 border border-gray-100 p-1 shrink-0"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">
                              IMG
                            </div>
                          )}
                          <div className="min-w-0 max-w-xs sm:max-w-md">
                            <div className="font-semibold text-black text-sm truncate">{prodTitle}</div>
                            <div className="text-gray-400 text-xs flex items-center gap-2 mt-0.5" dir="ltr">
                              <span>ID: {item.id?.substring(0, 8)}</span>
                              <span>•</span>
                              <span>{getCleanCityLocation(item, t)}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            storeInfo.isExternal
                              ? 'bg-black text-[#D4AF37]'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>{storeInfo.label}</span>
                        </span>
                      </td>

                      <td className="p-4 whitespace-nowrap text-sm font-bold text-gray-900 tabular-nums" dir="ltr">
                        {formatPrice(item.price)} AED
                      </td>

                      <td className="p-4 pe-6 text-end whitespace-nowrap">
                        {deletingId === item.id ? (
                          <div className="inline-flex items-center gap-1.5 bg-red-50 px-2.5 py-1 rounded-xl border border-red-200">
                            <span className="text-xs font-bold text-red-700">
                              {isRtl ? 'تأكيد الحذف؟' : 'Delete?'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleConfirmDelete(item.id)}
                              className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 cursor-pointer"
                            >
                              {isRtl ? 'نعم' : 'Yes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(null)}
                              className="px-2 py-0.5 bg-white text-gray-600 text-xs font-semibold rounded-lg border border-gray-200 cursor-pointer"
                            >
                              {isRtl ? 'إلغاء' : 'No'}
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              title={isRtl ? 'تعديل المنتج' : 'Edit Product'}
                              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(item.id)}
                              title={isRtl ? 'حذف المنتج' : 'Delete Product'}
                              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/60">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#D4AF37]" />
                <span>{isRtl ? 'تعديل بيانات المنتج / الإعلان' : 'Edit Product Listing'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {isRtl ? 'اسم المنتج / الإعلان' : 'Product Title'}
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {isRtl ? 'السعر (بالدرهم AED)' : 'Price (AED)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editingProduct.price}
                    onChange={e => setEditingProduct({ ...editingProduct, price: e.target.value })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold tabular-nums focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {isRtl ? 'المتجر المصدر (أو فارغ لإعلان محلي)' : 'Source Store (or Local)'}
                  </label>
                  <input
                    type="text"
                    value={editingProduct.storeName}
                    onChange={e => setEditingProduct({ ...editingProduct, storeName: e.target.value })}
                    placeholder="Amazon, SHEIN, Temu, Local..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {isRtl ? 'المدينة / الموقع الجغرافي' : 'City / Location'}
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={editingProduct.location}
                      onChange={e => setEditingProduct({ ...editingProduct, location: e.target.value })}
                      placeholder="Abu Dhabi, Dubai..."
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {isRtl ? 'رقم تواصل البائع (اختياري)' : 'Seller Phone (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={editingProduct.phone}
                    onChange={e => setEditingProduct({ ...editingProduct, phone: e.target.value })}
                    placeholder="+97150..."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  <span>{isRtl ? 'رابط الشراء الخارجي (Affiliate / Store URL)' : 'External Store URL'}</span>
                </label>
                <input
                  type="text"
                  value={editingProduct.externalUrl}
                  onChange={e => setEditingProduct({ ...editingProduct, externalUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black focus:bg-white"
                  dir="ltr"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 text-[#D4AF37]" />
                  <span>{savingEdit ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : isRtl ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
