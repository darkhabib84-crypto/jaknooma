import React, { useState, useEffect } from 'react';
import { getFirestore, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Activity, CheckCircle, AlertTriangle, Clock, Search } from 'lucide-react';

interface ApiLog {
  id: string;
  endpoint: string;
  status: number | string;
  timestamp: any;
  method?: string; // أضفتها تحسباً لو أردت تخزين نوع الطلب GET/POST
  latency?: string; // سرعة الاستجابة بالملي ثانية
}

export default function ApiMonitoring() {
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // إحصائيات سريعة يتم حسابها ديناميكياً من الـ 20 سجل المعروضة
  const successCount = logs.filter(log => Number(log.status) >= 200 && Number(log.status) < 300).length;
  const errorCount = logs.filter(log => Number(log.status) >= 400).length;

  useEffect(() => {
    const db = getFirestore();
    // استخدام الاستماع الفوري Real-time لجلب آخر 20 سجل تلقائياً
    const q = query(collection(db, "api_logs"), orderBy("timestamp", "desc"), limit(20));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const logsData: ApiLog[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ApiLog[];
      
      setLogs(logsData);
      setLoading(false);
    }, (error) => {
      console.error("خطأ في جلب السجلات الفورية: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // فلترة السجلات بناءً على Endpoint المدخل
  const filteredLogs = logs.filter(log => 
    log.endpoint?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 h-full flex flex-col">
      {/* الهيدر */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">API Monitoring</h1>
          <p className="text-gray-500">سجل استدعاءات الـ API ومراقبة حالة واستقرار النظام فورياً.</p>
        </div>
      </div>

      {/* كروت الحالة الفوقية (Dashboard Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
         <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
               <Activity className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-sm text-gray-500">إجمالي السجلات المعروضة</h3>
               <p className="text-2xl font-bold text-black">{logs.length}</p>
             </div>
           </div>
         </div>

         <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-green-50 text-green-500 flex items-center justify-center">
               <CheckCircle className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-sm text-gray-500">الطلبات الناجحة (2xx)</h3>
               <p className="text-2xl font-bold text-green-600">{successCount}</p>
             </div>
           </div>
         </div>

         <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
           <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
               <AlertTriangle className="w-5 h-5" />
             </div>
             <div>
               <h3 className="font-bold text-sm text-gray-500">المشاكل والأخطاء (4xx/5xx)</h3>
               <p className="text-2xl font-bold text-red-600">{errorCount}</p>
             </div>
           </div>
         </div>
      </div>

      {/* جدول السجلات والبحث */}
      <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-0">
         <div className="p-4 border-b border-gray-100 flex gap-4">
             <div className="relative flex-1">
               <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input
                 type="text"
                 placeholder="ابحث عن endpoint معين..."
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all text-right"
               />
             </div>
         </div>

         <div className="overflow-x-auto flex-1">
           <table className="w-full text-left border-collapse">
             <thead>
               <tr className="bg-white text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                 <th className="p-4 font-medium pl-6">Method / Endpoint</th>
                 <th className="p-4 font-medium">Status</th>
                 <th className="p-4 font-medium">Latency</th>
                 <th className="p-4 font-medium text-right pr-6">Timestamp</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-sm text-gray-400">
                      جاري تحميل سجلات الـ API...
                    </td>
                  </tr>
                ) : filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => {
                    const statusNum = Number(log.status);
                    const isError = statusNum >= 400;
                    const isSuccess = statusNum >= 200 && statusNum < 300;

                    return (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-4 pl-6 font-mono text-xs flex items-center gap-2">
                          {log.method && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              log.method === 'POST' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                            }`}>
                              {log.method}
                            </span>
                          )}
                          <span className="text-black font-semibold">{log.endpoint}</span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-md ${
                            isSuccess ? 'bg-green-50 text-green-700' : isError ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500 font-mono">
                          {log.latency ? `${log.latency}ms` : '--'}
                        </td>
                        <td className="p-4 pr-6 text-right text-gray-400 text-xs">
                          <div className="flex items-center justify-end gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {log.timestamp?.toDate ? new Date(log.timestamp.toDate()).toLocaleString('en-US', { hour12: true }) : '---'}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-sm text-gray-400">
                      لا توجد سجلات تطابق بحثك حالياً.
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
