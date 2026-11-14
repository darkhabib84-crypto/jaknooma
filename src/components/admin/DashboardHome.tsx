import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DollarSign, TrendingUp, TrendingDown, Store } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';
import { formatPrice, isRtlLanguage } from '../../lib/i18n';

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-gray-50 rounded-2xl group-hover:bg-black group-hover:text-white transition-colors">
        <Icon className="w-6 h-6" />
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium ${trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-500 bg-red-50'} px-2.5 py-1 rounded-full`}>
        {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {change}%
      </div>
    </div>
    <div>
      <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-black tabular-nums" dir="ltr">
        {value}
      </h2>
    </div>
  </motion.div>
);

export default function DashboardHome() {
  const [data, setData] = useState<any[]>([]);
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'products'));
        const fetchedData = querySnapshot.docs.map(doc => {
          const d = doc.data();
          const title = d.name || d.title || 'Item';
          return {
            name: title.substring(0, 8),
            revenue: parseFloat(d.price) || 0,
            searches: 100
          };
        });
        setData(fetchedData);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };
    fetchData();
  }, []);

  const totalValue = data.reduce((acc, curr) => acc + (curr.revenue || 0), 0);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">{t('Overview')}</h1>
          <p className="text-gray-500">{t("Welcome back. Here's what's happening with Jaknooma today.")}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title={t('Total Revenue')} 
          value={`${formatPrice(totalValue)} AED`} 
          change="0" 
          trend="up" 
          icon={DollarSign} 
        />
        <StatCard 
          title={t('Total Products')} 
          value={formatPrice(data.length)} 
          change="0" 
          trend="up" 
          icon={Store} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-6">{t('Revenue Overview')}</h3>
          <div className="h-[300px] w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `${formatPrice(val)}`}
                />
                <Tooltip
                  formatter={(value: any) => [`${formatPrice(value)} AED`, isRtl ? 'القيمة (AED)' : 'Value (AED)']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#000" fill="#D4AF37" fillOpacity={0.18} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
