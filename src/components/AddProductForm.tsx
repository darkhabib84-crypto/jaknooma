import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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
  const [discountType, setDiscountType] = useState('none');
  const [condition, setCondition] = useState('جديد');
  const [phone, setPhone] = useState('');
  const [affiliateLink, setAffiliateLink] = useState('');
  const [isVip, setIsVip] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  
  const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getSafeLabel = (item: any): string => {
    if (!item) return "قسم";
    if (typeof item === 'string') return item;
    return item.value || item.name || item.title || Object.values(item)[0] || "قسم";
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
    if (!user) return toast.error('يرجى تسجيل الدخول');
    if (filesToUpload.length === 0) return toast.error('يرجى اختيار صور للمنتج');

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
        price: Number(price),
        category: selectedCategory,
        subCategory: selectedSubCategory,
        images: imageUrls,
        sellerId: user.uid,
        createdAt: serverTimestamp(),
        discountType,
        condition,
        phone,
        affiliateLink,
        isVip: false, // سنبدأها بـ false دائماً حتى يتم الدفع
        rating: 0,
        reviews: 0,
        isNew: condition === 'جديد'
      };

      const docRef = await addDoc(collection(db, 'products'), productData);

      if (isVip) {
        // بدلاً من الفتح التلقائي، سنخبر المستخدم ونعطيه الرابط
        toast.success(
          (t) => (
            <div className="flex flex-col gap-2">
              <span>تم نشر المنتج! يرجى إكمال الدفع لتفعيل الـ VIP:</span>
              <a 
                href={`https://buy.stripe.com/00w00i9rC5ly8vL8wF2Fa00?client_reference_id=${docRef.id}`}
                target="_blank"
                className="bg-[#D4AF37] text-white p-2 rounded text-center font-bold"
                onClick={() => toast.dismiss(t.id)}
              >
                اضغط هنا للدفع الآن
              </a>
            </div>
          ),
          { duration: 10000 }
        );
      } else {
        toast.success('تم نشر المنتج بنجاح!');
      }

      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('حدث خطأ في النشر');
    } finally {
      setIsSubmitting(false);
    }
  };


  const activeCategory = Array.isArray(categories) ? categories.find((c: any) => getSafeLabel(c.value) === selectedCategory) : null;

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-white rounded-3xl shadow-lg max-w-2xl mx-auto border border-gray-100">
      <h2 className="text-2xl font-bold">إضافة منتج جديد</h2>
      <label className="block p-6 border-2 border-dashed rounded-2xl cursor-pointer bg-gray-50 text-center hover:border-black transition">
        <input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" />
        <span className="font-semibold">📷 اختر الصور</span>
      </label>
      <div className="flex gap-2 overflow-x-auto">{previews.map((u, i) => <img key={i} src={u} className="w-20 h-20 object-cover rounded-xl" />)}</div>
      <input type="text" placeholder="اسم المنتج" className="w-full p-4 border rounded-2xl" onChange={e => setTitle(e.target.value)} required />
      <textarea placeholder="الوصف" className="w-full p-4 border rounded-2xl" onChange={e => setDescription(e.target.value)} required />
      <div className="grid grid-cols-2 gap-4">
        <input type="number" placeholder="السعر" className="p-4 border rounded-2xl" onChange={e => setPrice(e.target.value)} required />
        <select onChange={e => setDiscountType(e.target.value)} className="p-4 border rounded-2xl bg-white">
          <option value="none">بدون خصم</option>
          <option value="gold">خصم ذهبي</option>
        </select>
      </div>
      <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubCategory(''); }} className="w-full p-4 border rounded-2xl" required>
        <option value="">اختر القسم</option>
        {Array.isArray(categories) && categories.map((c: any) => <option key={c.id} value={getSafeLabel(c.value)}>{getSafeLabel(c.value)}</option>)}
      </select>
      {activeCategory?.sub && <select onChange={(e) => setSelectedSubCategory(e.target.value)} className="w-full p-4 border rounded-2xl"><option value="">القسم الفرعي</option>{activeCategory.sub.map((s: any, i: number) => <option key={i} value={getSafeLabel(s)}>{getSafeLabel(s)}</option>)}</select>}
      <input type="tel" placeholder="رقم الهاتف" className="w-full p-4 border rounded-2xl" onChange={e => setPhone(e.target.value)} />

<div className="relative group p-6 rounded-3xl bg-[#FDF6E3] border-2 border-[#D4AF37] shadow-lg my-6 transition-all hover:shadow-2xl">
  <div className="flex items-center justify-between">
    <div className="flex flex-col gap-2">
      <h3 className="text-xl font-black text-[#B8860B] flex items-center gap-2">
        ترقية VIP
      </h3>
      <ul className="text-sm text-[#8B7355] font-bold space-y-1">
        <li className="flex items-center gap-2">⭐ أولوية العرض في النتائج</li>
        <li className="flex items-center gap-2">📈 زيادة الوصول للمشترين</li>
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

      <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-black text-white rounded-2xl font-bold">{isSubmitting ? 'جاري النشر...' : 'نشر المنتج'}</button>
    </form>
  );
}

