import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCategories } from '../hooks/useCategories';
import { useTranslation } from 'react-i18next';
import { isRtlLanguage } from '../lib/i18n';

export default function AddProductForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('AED');
  const [condition] = useState('New');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [affiliateLink] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [customSubCategory, setCustomSubCategory] = useState('');

  // External store and logo fields
  const [externalStoreLink, setExternalStoreLink] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [isLoadingStores, setIsLoadingStores] = useState(true);

  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch stores from Firebase
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'stores'));
        const storesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setStores(storesData);
      } catch (error) {
        console.error('Error fetching stores:', error);
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchStores();
  }, []);

  const getCategoryValue = (item: any): string => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.value || item.name?.en || '';
  };

  const getCategoryDisplayLabel = (item: any): string => {
    if (!item) return '';
    if (typeof item === 'string') return t(item);
    if (typeof item.name === 'object') {
      if (item.value === 'Cars & Automotive Brands') {
        return isRtl ? 'ماركات السيارات' : 'Cars & Automotive Brands';
      }
      return isRtl ? (item.name.ar || t(item.name.en) || item.name.en) : (item.name.en || item.name.ar);
    }
    return t(String(item.name || item.value || ''));
  };

  const getSubCategoryValue = (s: any): string => {
    if (!s) return '';
    if (typeof s === 'string') return s;
    return s.en || s.value || s.ar || '';
  };

  const getSubCategoryDisplayLabel = (s: any, isCarBrand: boolean): string => {
    if (!s) return '';
    if (typeof s === 'string') {
      if (s.toLowerCase() === 'other') return isRtl ? 'أخرى (Other)' : 'Other';
      return t(s);
    }
    const enVal = s.en || '';
    const arVal = s.ar || enVal;
    if (enVal.toLowerCase() === 'other') {
      return isRtl ? 'أخرى (Other)' : 'Other';
    }
    if (isRtl) {
      return isCarBrand && arVal !== enVal ? `${arVal} (${enVal})` : arVal;
    }
    return enVal;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from<File>(e.target.files);
      setFilesToUpload(prev => [...prev, ...newFiles]);
      setPreviews(prev => [...prev, ...newFiles.map(file => URL.createObjectURL(file))]);
    }
    e.target.value = '';
  };

  const isCarsCategory = selectedCategory === 'Cars & Automotive Brands';
  const isOtherSelected = selectedSubCategory === 'Other';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error(t('Please log in first'));
    if (filesToUpload.length === 0) return toast.error(t('Please select at least one product image'));
    if (!location.trim()) return toast.error(t('Please specify your location'));

    const finalSubCategory = isOtherSelected ? customSubCategory.trim() : selectedSubCategory;
    if (isOtherSelected && !finalSubCategory) {
      return toast.error(t('Please enter the custom brand / subcategory name'));
    }

    setIsSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of filesToUpload) {
        const storageRef = ref(storage, `products/${user.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        imageUrls.push(url);
      }

      const productData = {
        name: title,
        description,
        price: parseFloat(price),
        currency,
        category: selectedCategory,
        subCategory: finalSubCategory,
        brand: isCarsCategory ? finalSubCategory : null,
        images: imageUrls,
        sellerId: user.uid,
        sellerName: user.displayName || user.email?.split('@')[0] || 'Anonymous Seller',
        location: location.trim(),
        createdAt: serverTimestamp(),
        condition,
        phone,
        affiliateLink,
        isVip: false,
        rating: 0,
        reviews: 0,
        isNew: condition === 'New',
        externalStoreLink: externalStoreLink || null,
        storePlatform: selectedStore || null,
      };

      const docRef = await addDoc(collection(db, 'products'), productData);

      if (isVip) {
        toast.success(
          (toastInstance) => (
            <div dir={isRtl ? 'rtl' : 'ltr'} className="flex flex-col gap-2 text-start">
              <span>{t('Product published! Please complete the payment to activate VIP:')}</span>
              <a
                href={`https://buy.stripe.com/00w00i9rC5ly8vL8wF2Fa00?client_reference_id=${docRef.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#D4AF37] text-white p-2 rounded text-center font-bold"
                onClick={() => toast.dismiss(toastInstance.id)}
              >
                {t('Click here to pay now')}
              </a>
            </div>
          ),
          { duration: 10000 }
        );
      } else {
        toast.success(t('Product published successfully!'));
      }

      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error(t('An error occurred while publishing'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectableCategories = Array.isArray(categories)
    ? categories.filter((c: any) => Boolean(getCategoryValue(c)))
    : [];

  const activeCategory = selectableCategories.find(
    (c: any) => getCategoryValue(c) === selectedCategory
  );

  // Ensure subcategories list always ends with "Other" / "أخرى (Other)"
  const subCategoriesList = React.useMemo(() => {
    const raw = Array.isArray(activeCategory?.sub) ? [...activeCategory.sub] : [];
    const withoutOther = raw.filter(
      (s: any) => getSubCategoryValue(s).toLowerCase() !== 'other'
    );
    if (withoutOther.length > 0 || isCarsCategory) {
      withoutOther.push({ en: 'Other', ar: 'أخرى (Other)' });
    }
    return withoutOther;
  }, [activeCategory, isCarsCategory]);

  return (
    <form
      dir={isRtl ? 'rtl' : 'ltr'}
      onSubmit={handleSubmit}
      className="p-6 space-y-5 bg-white rounded-3xl shadow-lg max-w-2xl mx-auto my-6 border border-gray-100 text-start"
    >
      <h2 className="text-2xl font-bold text-start text-gray-900">
        {t('Add New Product')}
      </h2>

      <label className="block p-6 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 text-center hover:border-black transition">
        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
        <span className="font-semibold text-gray-800">📷 {t('Choose Images')}</span>
      </label>

      {previews.length > 0 && (
        <div className="flex gap-2 overflow-x-auto py-1">
          {previews.map((u, i) => (
            <img key={i} src={u} className="w-20 h-20 object-cover rounded-xl border border-gray-200 shrink-0" alt="Preview" />
          ))}
        </div>
      )}

      <input
        type="text"
        value={title}
        placeholder={t('Product Title')}
        className="w-full p-4 border border-gray-200 rounded-2xl text-start focus:outline-none focus:ring-2 focus:ring-black"
        onChange={e => setTitle(e.target.value)}
        required
      />

      <textarea
        value={description}
        placeholder={t('Description')}
        rows={4}
        className="w-full p-4 border border-gray-200 rounded-2xl text-start focus:outline-none focus:ring-2 focus:ring-black"
        onChange={e => setDescription(e.target.value)}
        required
      />

      {/* Price & Currency */}
      <div className="flex gap-2 w-full">
        <input
          type="number"
          step="0.01"
          min="0"
          value={price}
          placeholder={t('Price (e.g. 10.50)')}
          className="w-2/3 p-4 border border-gray-200 rounded-2xl text-start focus:outline-none focus:ring-2 focus:ring-black"
          onChange={e => setPrice(e.target.value)}
          required
        />
        <select
          value={currency}
          onChange={e => setCurrency(e.target.value)}
          className="w-1/3 p-4 border border-gray-200 rounded-2xl bg-white text-start font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="AED">AED (د.إ)</option>
          <option value="USD">USD ($)</option>
          <option value="SAR">SAR (ر.س)</option>
          <option value="EUR">EUR (€)</option>
          <option value="GBP">GBP (£)</option>
          <option value="KWD">KWD (د.ك)</option>
          <option value="QAR">QAR (ر.ق)</option>
          <option value="BHD">BHD (د.ب)</option>
          <option value="OMR">OMR (ر.ع)</option>
          <option value="EGP">EGP (ج.م)</option>
        </select>
      </div>

      {/* Category Select */}
      <select
        value={selectedCategory}
        onChange={(e) => {
          setSelectedCategory(e.target.value);
          setSelectedSubCategory('');
          setCustomSubCategory('');
        }}
        className="w-full p-4 border border-gray-200 rounded-2xl bg-white text-start cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
        required
      >
        <option value="">{t('Select Category')}</option>
        {selectableCategories.map((c: any) => {
          const val = getCategoryValue(c);
          return (
            <option key={c.id || val} value={val}>
              {getCategoryDisplayLabel(c)}
            </option>
          );
        })}
      </select>

      {/* Subcategory / Car Brands Select */}
      {subCategoriesList.length > 0 && (
        <div className="space-y-3">
          <select
            value={selectedSubCategory}
            onChange={(e) => {
              setSelectedSubCategory(e.target.value);
              if (e.target.value !== 'Other') {
                setCustomSubCategory('');
              }
            }}
            className="w-full p-4 border border-gray-200 rounded-2xl bg-white text-start cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="">
              {isCarsCategory ? t('Select Car Brand') : t('Subcategory')}
            </option>
            {subCategoriesList.map((s: any, i: number) => {
              const val = getSubCategoryValue(s);
              return (
                <option key={`${val}-${i}`} value={val}>
                  {getSubCategoryDisplayLabel(s, isCarsCategory)}
                </option>
              );
            })}
          </select>

          {/* Dynamic Custom Input when "Other" (أخرى) is selected */}
          {isOtherSelected && (
            <input
              type="text"
              value={customSubCategory}
              onChange={(e) => setCustomSubCategory(e.target.value)}
              placeholder={
                isCarsCategory
                  ? t('Enter brand name manually...')
                  : t('Enter subcategory manually...')
              }
              className="w-full p-4 border-2 border-[#D4AF37] bg-[#FDF6E3]/40 rounded-2xl text-start font-medium focus:outline-none focus:ring-2 focus:ring-black transition-all"
              required
            />
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          type="tel"
          value={phone}
          placeholder={t('Phone Number')}
          className="p-4 border border-gray-200 rounded-2xl text-start focus:outline-none focus:ring-2 focus:ring-black"
          onChange={e => setPhone(e.target.value)}
        />
        <input
          type="text"
          value={location}
          placeholder={t('Location (e.g. Dubai, UAE)')}
          className="p-4 border border-gray-200 rounded-2xl text-start focus:outline-none focus:ring-2 focus:ring-black"
          onChange={e => setLocation(e.target.value)}
          required
        />
      </div>

      {/* External Store Section */}
      <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-4">
        <h3 className="text-lg font-bold text-start text-gray-800">
          {t('Sell via Another Store (Optional)')}
        </h3>

        <input
          type="url"
          placeholder={t('Product link on the other store (e.g., https://amazon.com/...)')}
          className="w-full p-4 border border-gray-200 rounded-2xl text-start bg-white focus:outline-none focus:ring-2 focus:ring-black"
          value={externalStoreLink}
          onChange={e => setExternalStoreLink(e.target.value)}
        />

        {externalStoreLink && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-600 text-start">
              {t('Select the store logo associated with the link:')}
            </p>

            {isLoadingStores ? (
              <p className="text-xs text-gray-500 text-start">
                {t('Loading available stores...')}
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => setSelectedStore(store.id)}
                    className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl bg-white transition hover:scale-105 cursor-pointer ${
                      selectedStore === store.id
                        ? 'border-black bg-gray-100 shadow-sm'
                        : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={store.logo || store.logoUrl}
                      alt={store.name}
                      className="w-10 h-10 object-contain mb-1"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/40x40?text=Store';
                      }}
                    />
                    <span className="text-xs font-semibold">{store.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* VIP Upgrade Section */}
      <div className="relative group p-6 rounded-3xl bg-[#FDF6E3] border-2 border-[#D4AF37] shadow-lg my-6 transition-all hover:shadow-2xl text-start">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-[#B8860B] flex items-center gap-2">
              {t('VIP Upgrade')}
            </h3>
            <ul className="text-sm text-[#8B7355] font-bold space-y-1">
              <li className="flex items-center gap-2 justify-start">
                <span>⭐</span>
                <span>{t('High display priority in results')}</span>
              </li>
              <li className="flex items-center gap-2 justify-start">
                <span>📈</span>
                <span>{t('Boost buyer reach')}</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <img src="/jaknooma-vip.png" alt="VIP" className="w-16 h-16 object-contain" />
            <input
              type="checkbox"
              checked={isVip}
              onChange={(e) => {
                setIsVip(e.target.checked);
                if (e.target.checked) {
                  window.open('https://buy.stripe.com/00w00i9rC5ly8vL8wF2Fa00', '_blank');
                }
              }}
              className="w-8 h-8 rounded-md border-2 border-[#D4AF37] accent-[#D4AF37] cursor-pointer"
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 bg-black text-white rounded-2xl font-bold hover:bg-gray-900 transition-colors cursor-pointer disabled:opacity-50"
      >
        {isSubmitting ? t('Publishing...') : t('Publish Product')}
      </button>
    </form>
  );
}
