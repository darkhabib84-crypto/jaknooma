import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Trash2, Plus } from 'lucide-react';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  // جلب البيانات من Firebase
  const fetchProducts = async () => {
    const db = getFirestore();
    const querySnapshot = await getDocs(collection(db, "products"));
    const fetchedData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setProducts(fetchedData);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // دالة الحذف
  const handleDelete = async (id: string) => {
    if (window.confirm("هل أنت متأكد من حذف هذا المنتج؟")) {
      try {
        const db = getFirestore();
        await deleteDoc(doc(db, "products", id));
        // تحديث القائمة محلياً بعد الحذف
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        console.error("خطأ أثناء الحذف:", error);
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">Products</h1>
          <p className="text-gray-500">Manage {products.length} active listings.</p>
        </div>
        <button className="bg-black text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Product
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-medium pl-6">Product</th>
                <th className="p-4 font-medium">Store</th>
                <th className="p-4 font-medium">Price</th>
                <th className="p-4 font-medium text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredProducts.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="font-medium text-black text-sm">{item.name || "Unnamed Product"}</div>
                    <div className="text-gray-400 text-xs">ID: {item.id?.substring(0, 8)}</div>
                  </td>
                  <td className="p-4 text-xs font-medium">{item.store || "N/A"}</td>
                  <td className="p-4 text-sm font-medium text-black">${item.price || "0.00"}</td>
                  <td className="p-4 pr-6 text-right">
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

