import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DollarSign, ExternalLink, Calendar, Search, CreditCard, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface Payment {
  id: string;
  userId: string;
  userEmail: string;
  productId: string;
  productName: string;
  amount: number;
  currency: string;
  status: string;
  type: string;
  createdAt: any;
}

export default function AdminPayments() {
  const { user, isAdmin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(
      collection(db, 'payments'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Payment));
      setPayments(data);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching payments:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (!user || !isAdmin) {
    return <Navigate to="/" />;
  }

  const filteredPayments = payments.filter(p => 
     p.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     p.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="flex-1 bg-[#FAFAFA] min-h-[calc(100vh-64px)] overflow-y-auto w-full relative z-0">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-black mb-2 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-[#D4AF37]" />
            {t('Revenue & Payments')}
          </h1>
          <p className="text-gray-500">{t('Track all Stripe checkout payments, VIP upgrades, and general revenue here.')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
            <span className="text-sm font-medium text-gray-500 mb-1">{t('Total Revenue')}</span>
            <div className="text-4xl font-bold text-black flex items-center gap-1">${totalRevenue.toFixed(2)}</div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
            <span className="text-sm font-medium text-gray-500 mb-1">{t('Total Transactions')}</span>
            <div className="text-4xl font-bold text-black flex items-center gap-2"><CreditCard className="w-6 h-6 text-indigo-400"/> {payments.length}</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
             <h2 className="text-lg font-bold">{t('Recent Transactions')}</h2>
             <div className="relative">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input
                 type="text"
                 placeholder={t('Search by email or product...')}
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
                 className="pl-9 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] w-full sm:w-64 bg-gray-50 focus:bg-white transition-colors"
               />
             </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">{t('Date')}</th>
                  <th className="p-4 font-medium">{t('Customer')}</th>
                  <th className="p-4 font-medium">{t('Product')}</th>
                  <th className="p-4 font-medium">{t('Type')}</th>
                  <th className="p-4 font-medium">{t('Amount')}</th>
                  <th className="p-4 font-medium text-right">{t('Status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">{t('Loading transactions...')}</td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <CreditCard className="w-12 h-12 text-gray-200 mb-3" />
                        <p>{t('No transactions found.')}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map(payment => (
                    <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 whitespace-nowrap text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                           <Calendar className="w-4 h-4" />
                           {payment.createdAt ? new Date(payment.createdAt.toDate()).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="p-4 text-sm font-medium text-gray-900">{payment.userEmail}</td>
                      <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate" title={payment.productName}>{payment.productName}</td>
                      <td className="p-4 text-sm text-gray-600">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-yellow-100 text-yellow-800">
                           {payment.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-bold text-gray-900">${payment.amount.toFixed(2)}</td>
                      <td className="p-4 text-sm text-right">
                         <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                           {payment.status}
                         </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
