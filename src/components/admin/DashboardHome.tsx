import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, Search, DollarSign, Activity, TrendingUp, TrendingDown, ArrowUpRight, Store } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getFirestore, collection, getDocs } from 'firebase/firestore';

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
      <h2 className="text-3xl font-bold tracking-tight text-black">{value}</h2>
    </div>
  </motion.div>
);

export default function DashboardHome() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const db = getFirestore();
        const querySnapshot = await getDocs(collection(db, "products"));
        const fetchedData = querySnapshot.docs.map(doc => ({
          name: doc.data().name?.substring(0, 5) || "N/A",
          revenue: parseInt(doc.data().price) || 0,
          searches: 100
        }));
        setData(fetchedData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black mb-1">Overview</h1>
          <p className="text-gray-500">Welcome back. Here's what's happening with Jaknooma today.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value={`$${data.reduce((acc, curr) => acc + (curr.revenue || 0), 0)}`} 
          change="0" 
          trend="up" 
          icon={DollarSign} 
        />
        <StatCard 
          title="Total Products" 
          value={data.length.toString()} 
          change="0" 
          trend="up" 
          icon={Store} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Revenue Overview</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#000" fill="#000" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

