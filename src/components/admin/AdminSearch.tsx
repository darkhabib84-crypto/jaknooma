import React, { useState, useEffect } from 'react';
import { Search, Flame, Server, Shield, Trash2, Play } from 'lucide-react';
// تأكد من تعديل مسار استيراد ملف إعدادات الفايربيس الخاص بمشروعك
import { db } from '../firebase/config'; 
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';

export default function AdminSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLogs, setSearchLogs] = useState([]);
  const [stats, setStats] = useState({ cacheSize: '0 MB', blockedCount: 0 });
  const [loading, setLoading] = useState(true);

  // 1. جلب البيانات الحقيقية من Firestore وتحديثها تلقائياً (Real-time)
  useEffect(() => {
    // جلب سجلات البحث مرتبة حسب الحجم أو الوقت
    const logsQuery = query(collection(db, 'search_logs'), orderBy('volume', 'desc'));
    
    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const logsData = [];
      snapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() });
      });
      setSearchLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching logs: ", error);
      setLoading(false);
    });

    // جلب الإحصائيات العامة (مثل الكاش والكلمات المحظورة) من مستند الإعدادات
    const statsDocRef = doc(db, 'system_settings', 'search_engine');
    const unsubscribeStats = onSnapshot(statsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data());
      }
    });

    return () => {
      unsubscribeLogs();
      unsubscribeStats();
    };
  }, []);

  // 2. تصفية البيانات محلياً أثناء الكتابة في حقل البحث
  const filteredLogs = searchLogs.filter(item =>
    item.query?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 3. دالة تفريغ الكاش (تحديث القيمة في الفايربيس)
  const handleClearCache = async () => {
    try {
      const statsDocRef = doc(db, 'system_settings', 'search_engine');
      await updateDoc(statsDocRef, { cacheSize: '0 MB' });
      alert('Cache cleared successfully!');
    } catch (error) {
      console.error("Error clearing cache: ", error);
    }
  };

  // 4. دالة حظر الكلمة أو حذف السجل
  const handleBanKeyword = async (logId) => {
    if (window.confirm('Are you sure you want to delete this log?')) {
      try {
        await deleteDoc(doc(db, 'search_logs', logId));
      } catch (error) {
        console.error("Error deleting log: ", error);
      }
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">Search Engine</h1>
          <p className="text-gray-500">Manage search ranking, cache, and blocked keywords.</p>
        </div>
      </div>

      {/* كروت الإحصائيات الديناميكية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
         <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
               <Flame className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold">Trending Update</h3>
               <p className="text-xs text-gray-500">Updates every hour</p>
             </div>
           </div>
           <button className="w-full bg-black text-white py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">Force Refresh</button>
         </div>

         <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
               <Server className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold">Search Cache</h3>
               <p className="text-xs text-gray-500">{stats.cacheSize || '0 MB'} Used</p>
             </div>
           </div>
           <button onClick={handleClearCache} className="w-full bg-white border border-gray-200 text-black py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Clear Cache</button>
         </div>

         <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
               <Shield className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold">Blocked Words</h3>
               <p className="text-xs text-gray-500">{stats.blockedCount || 0} terms blocked</p>
             </div>
           </div>
           <button className="w-full bg-white border border-gray-200 text-black py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Manage List</button>
         </div>
      </div>

      {/* حقل البحث والجدول */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
         <div className="p-4 border-b border-gray-100 flex gap-4">
             <div className="relative flex-1">
               <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input
                 type="text"
                 placeholder="Search query logs..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all"
               />
             </div>
         </div>
         
         <div className="overflow-x-auto flex-1">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                 <th className="p-4 font-medium pl-6">Query</th>
                 <th className="p-4 font-medium">Volume (24h)</th>
                 <th className="p-4 font-medium">Avg. Response</th>
                 <th className="p-4 font-medium">Results Found</th>
                 <th className="p-4 font-medium text-right pr-6">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-sm text-gray-400">
                      Loading logs...
                    </td>
                  </tr>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-4 pl-6 font-medium text-black text-sm">{item.query}</td>
                      <td className="p-4 text-sm text-gray-600">{item.volume}</td>
                      <td className="p-4">
                         <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-md ${
                           parseInt(item.speed) > 300 ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
                         }`}>
                           {item.speed}
                         </span>
                      </td>
                      <td className="p-4 text-sm text-gray-600">{item.results}</td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button title="Test Query" className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                            <Play className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleBanKeyword(item.id)} 
                            title="Ban/Delete Keyword" 
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-sm text-gray-400">
                      No matching search logs found.
                    </td>
                  </tr>
                )}
             </tbody>
           </table>
         </div>
      </div>
    </div>
  );
}
