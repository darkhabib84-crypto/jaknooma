import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function ApiMonitoring() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const db = getFirestore();
        // جلب آخر 20 سجل للمراقبة مرتبة حسب التاريخ
        const q = query(collection(db, "api_logs"), orderBy("timestamp", "desc"), limit(20));
        const querySnapshot = await getDocs(q);
        
        const logsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setLogs(logsData);
      } catch (error) {
        console.error("خطأ في جلب السجلات: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Monitoring</h1>
      {loading ? (
        <p>جاري تحميل السجلات...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">Endpoint</th>
                <th className="p-4 text-left">Status</th>
                <th className="p-4 text-left">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-mono text-xs">{log.endpoint}</td>
                  <td className="p-4">{log.status}</td>
                  <td className="p-4 text-gray-500">{new Date(log.timestamp?.toDate()).toLocaleString()}</td>
                </tr>
              )) : (
                <tr><td colSpan={3} className="p-4 text-center">لا توجد سجلات حالياً في مجموعة api_logs</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

