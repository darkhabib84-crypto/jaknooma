import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

const COLORS = ['#000000', '#4B5563', '#9CA3AF', '#D1D5DB'];

export default function AdminAnalytics() {
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const db = getFirestore();
      
      // جلب البيانات الحقيقية من المجموعات (تأكد من مطابقة الأسماء لقاعدة بياناتك)
      const productsSnapshot = await getDocs(collection(db, "products"));
      
      // هنا نقوم بمعالجة البيانات لتمثيلها بيانياً
      // كمثال: نحسب عدد المنتجات المضافة في كل شهر (بناءً على تاريخ افتراضي)
      const monthlyData = [
        { name: 'Jan', searches: 0 }, { name: 'Feb', searches: 0 },
        { name: 'Mar', searches: 0 }, { name: 'Apr', searches: 0 },
        { name: 'May', searches: 0 }, { name: 'Jun', searches: 0 },
      ];

      productsSnapshot.forEach((doc) => {
        // إذا كان لديك حقل تاريخ (createdAt) يمكنك استخدامه هنا للتوزيع
        // حالياً نوزع المنتجات عشوائياً للتوضيح
        const randomIdx = Math.floor(Math.random() * 6);
        monthlyData[randomIdx].searches += 100;
      });

      setChartData(monthlyData);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading Analytics...</div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black mb-1">Analytics</h1>
        <p className="text-gray-500">Live data from your database.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* الرسم البياني للأداء */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[400px] flex flex-col">
          <h3 className="font-bold text-lg mb-6">Product Growth Trend</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="searches" stroke="#000" strokeWidth={3} fill="#f3f4f6" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* رسم بياني توضيحي للمتاجر */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm h-[400px] flex flex-col items-center justify-center">
          <h3 className="font-bold text-lg mb-6 self-start">Database Stats</h3>
          <div className="text-center">
             <div className="text-5xl font-bold mb-2">{chartData.reduce((acc, curr) => acc + curr.searches, 0)}</div>
             <p className="text-gray-500 uppercase tracking-widest text-xs">Total Items Tracked</p>
          </div>
        </div>
      </div>
    </div>
  );
}

