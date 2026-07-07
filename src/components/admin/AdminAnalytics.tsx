import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getFirestore, collection, getDocs, query, orderBy } from 'firebase/firestore';

export default function AdminAnalytics() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getFirestore();
        
        // جلب المنتجات مرتبة من الأقدم للأحدث بناءً على تاريخ الإنشاء
        const productsQuery = query(collection(db, "products"), orderBy("createdAt", "asc"));
        const productsSnapshot = await getDocs(productsQuery);
        
        // تحضير قائمة بآخر 6 أشهر ديناميكياً لتجنب تثبيت الأشهر يدوياً
        const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const last6Months = [];
        
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          last6Months.push({
            monthIndex: d.getMonth(),
            year: d.getFullYear(),
            name: `${monthsNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`,
            count: 0
          });
        }

        let totalCount = 0;

        productsSnapshot.forEach((doc) => {
          const data = doc.data();
          totalCount++;

          // التأكد من وجود حقل التاريخ وتحويله إلى كائن Date
          if (data.createdAt) {
            // إذا كان الـ timestamp من نوع Firebase Timestamp نستخدم toDate()، وإلا نمرره مباشرة
            const createdAtDate = typeof data.createdAt.toDate === 'function' 
              ? data.createdAt.toDate() 
              : new Date(data.createdAt);

            const productMonth = createdAtDate.getMonth();
            const productYear = createdAtDate.getFullYear();

            // مطابقة تاريخ المنتج مع آخر 6 أشهر المجهزة في الرسم البياني
            const targetMonth = last6Months.find(m => m.monthIndex === productMonth && m.year === productYear);
            if (targetMonth) {
              targetMonth.count += 1; // زيادة العداد بمقدار 1 لكل منتج حقيقي
            }
          }
        });

        setTotalProducts(totalCount);
        setChartData(last6Months);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Analytics...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black mb-1">Analytics</h1>
        <p className="text-gray-500">Live data from your database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الرسم البياني للأداء الحقيقي */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[400px] flex flex-col">
          <h3 className="font-bold text-lg mb-6">Product Growth Trend</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="Products" stroke="#000" strokeWidth={3} fill="#f3f4f6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* إحصائيات قاعدة البيانات الإجمالية */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[400px] flex flex-col items-center justify-center">
          <h3 className="font-bold text-lg mb-6 self-start">Database Stats</h3>
          <div className="text-center">
             <div className="text-5xl font-bold mb-2">{totalProducts}</div>
             <p className="text-gray-500 uppercase tracking-widest text-xs">Total Products In Database</p>
          </div>
        </div>
      </div>
    </div>
  );
}
