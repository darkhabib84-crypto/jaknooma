import React, { useState, useEffect } from 'react';
import { collection, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useCategories } from '../hooks/useCategories';

export default function AddProductForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { categories } = useCategories();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('AED'); // حالة العملة المحددة
  const [discountType, setDiscountType] = useState('none');
  const [condition, setCondition] = useState('New');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState(''); // حقل الموقع الجديد
  const [affiliateLink, setAffiliateLink] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  
  // New fields for external store and logo
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
        console.error("Error fetching stores:", error);
        toast.error("Failed to load stores list");
      } finally {
        setIsLoadingStores(false);
      }
    };

    fetchStores();
  }, []);

  const getSafeLabel = (item: any): string => {
    if (!item) return "Category";
    if (typeof item === 'string') return item;
    return item.value || item.name || item.title || Object.values(item)[0] || "Category";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFilesToUpload(prev => [...prev, ...newFiles]);
      setPreviews(prev => [...prev, ...newFiles.map(file => URL.createObjectURL(file))]);
    }
    e.target.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return toast.error('Please log in first');
    if (filesToUpload.length === 0) return toast.error('Please select at least one product image');
    if (!location.trim()) return toast.error('Please specify your location');

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
        price: parseFloat(price), // تحويل السعر لرقم عشري
        currency, // حفظ العملة المختارة
        category: selectedCategory,
        subCategory: selectedSubCategory,
        images: imageUrls,
        sellerId: user.uid,
        sellerName: user.displayName || user.email?.split('@')[0] || 'Anonymous Seller', // حفظ اسم البائع
        location: location, // حفظ الموقع المحدد
        createdAt: serverTimestamp(), // التاريخ الفعلي لوضع الإعلان
        discountType,
        condition,
        phone,
        affiliateLink,
        isVip: false, 
        rating: 0,
        reviews: 0,
        isNew: condition === 'New',
        
        // Save selected external store data
        externalStoreLink: externalStoreLink || null,
        storePlatform: selectedStore || null,
      };

      const docRef = await addDoc(collection(db, 'products'), productData);

      if (isVip) {
        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <span>Product published! Please complete the payment to activate VIP:</span>
              <a 
                href={`https://buy.stripe.com/00w00i9rC5ly8vL8wF2Fa00?client_reference_id=${docRef.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#D4AF37] text-white p-2 rounded text-center font-bold"
                onClick={() => toast.dismiss(t.id)}
              >
                Click here to pay now
              </a>
            </div>
          ),
          { duration: 10000 }
        );
      } else {
        toast.success('Product published successfully!');
      }

      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while publishing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCategory = Array.isArray(categories) ? categories.find((c: any) => getSafeLabel(c.value) === selectedCategory) : null;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white rounded-3xl shadow-lg max-w-2xl mx-auto border border-gray-100">
      <h2 className="text-2xl font-bold text-left">Add New Product</h2>
      
      <label className="block p-6 border-2 border-dashed rounded-2xl cursor-pointer bg-gray-50 text-center hover:border-black transition">
        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
        <span className="font-semibold">📷 Choose Images</span>
      </label>
      
      <div className="flex gap-2 overflow-x-auto">
        {previews.map((u, i) => (
          <img key={i} src={u} className="w-20 h-20 object-cover rounded-xl" alt="Preview" />
        ))}
      </div>
      
      <input 
        type="text" 
        placeholder="Product Title" 
        className="w-full p-4 border rounded-2xl text-left" 
        onChange={e => setTitle(e.target.value)} 
        required 
      />
      
      <textarea 
        placeholder="Description" 
        className="w-full p-4 border rounded-2xl text-left" 
        onChange={e => setDescription(e.target.value)} 
        required 
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* مربع السعر المطور ودعم الكسور والعملة */}
        <div className="flex gap-2">
          <input 
            type="number" 
            step="0.01"
            min="0"
            placeholder="Price (e.g. 10.50)" 
            className="w-2/3 p-4 border rounded-2xl text-left focus:outline-none focus:ring-2 focus:ring-black" 
            onChange={e => setPrice(e.target.value)} 
            required 
          />
          <select 
            value={currency} 
            onChange={e => setCurrency(e.target.value)} 
            className="w-1/3 p-4 border rounded-2xl bg-white text-left font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-black"
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

        <select 
          onChange={e => setDiscountType(e.target.value)} 
          className="p-4 border rounded-2xl bg-white text-left"
        >
          <option value="none">No Discount</option>
          <option value="gold">Gold Discount</option>
        </select>
      </div>
      
      <select 
        value={selectedCategory} 
        onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubCategory(''); }} 
        className="w-full p-4 border rounded-2xl text-left" 
        required
      >
        <option value="">Select Category</option>
        {Array.isArray(categories) && categories.map((c: any) => (
          <option key={c.id} value={getSafeLabel(c.value)}>
            {getSafeLabel(c.value)}
          </option>
        ))}
      </select>
      
      {activeCategory?.sub && (
        <select 
          onChange={(e) => setSelectedSubCategory(e.target.value)} 
          className="w-full p-4 border rounded-2xl text-left"
        >
          <option value="">Subcategory</option>
          {activeCategory.sub.map((s: any, i: number) => (
            <option key={i} value={getSafeLabel(s)}>
              {getSafeLabel(s)}
            </option>
          ))}
        </select>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <input 
          type="tel" 
          placeholder="Phone Number" 
          className="p-4 border rounded-2xl text-left" 
          onChange={e => setPhone(e.target.value)} 
        />
        {/* حقل إدخال الموقع الجديد */}
        <input 
          type="text" 
          placeholder="Location (e.g. Dubai, UAE)" 
          className="p-4 border rounded-2xl text-left" 
          onChange={e => setLocation(e.target.value)}
          required 
        />
      </div>

      {/* ================= External Store Section ================= */}
      <div className="p-5 border border-gray-200 rounded-2xl bg-gray-50/50 space-y-4">
        <h3 className="text-lg font-bold text-left text-gray-800">Sell via Another Store (Optional)</h3>
        
        <input 
          type="url" 
          placeholder="Product link on the other store (e.g., https://amazon.com/...)" 
          className="w-full p-4 border rounded-2xl text-left bg-white" 
          value={externalStoreLink}
          onChange={e => setExternalStoreLink(e.target.value)} 
        />

        {externalStoreLink && (
          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-600 text-left">Select the store logo associated with the link:</p>
            
            {isLoadingStores ? (
              <p className="text-xs text-gray-500 text-left">Loading available stores...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {stores.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => setSelectedStore(store.id)}
                    className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl bg-white transition hover:scale-105 ${
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
      {/* ========================================================= */}

      <div className="relative group p-6 rounded-3xl bg-[#FDF6E3] border-2 border-[#D4AF37] shadow-lg my-6 transition-all hover:shadow-2xl text-left">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-black text-[#B8860B] flex items-center gap-2">
              VIP Upgrade
            </h3>
            <ul className="text-sm text-[#8B7355] font-bold space-y-1">
              <li className="flex items-center gap-2 justify-start">⭐ High display priority in results</li>
              <li className="flex items-center gap-2 justify-start">📈 Boost buyer reach</li>
            </ul>
          </div>
          
          <div className="flex items-center gap-4">
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
        className="w-full py-4 bg-black text-white rounded-2xl font-bold"
      >
        {isSubmitting ? 'Publishing...' : 'Publish Product'}
      </button>
    </form>
  );
}
