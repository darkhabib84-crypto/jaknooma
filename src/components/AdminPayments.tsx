import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DollarSign, Calendar, Search, CreditCard, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPrice, isRtlLanguage } from '../lib/i18n';

interface Payment {
  id: string;
  userId?: string;
  userEmail?: string;
  email?: string;
  userName?: string;
  customerName?: string;
  customer?: string;
  productId?: string;
  productName?: string;
  amount: number;
  currency?: string;
  status: string;
  type?: string;
  createdAt: any;
}

export default function AdminPayments() {
  const { user, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [userLookup, setUserLookup] = useState<Record<string, { name?: string; email?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Load user map so payments with only userId still show customer name/email
  useEffect(() => {
    if (!isAdmin) return;
    getDocs(collection(db, 'users'))
      .then((snap) => {
        const map: Record<string, { name?: string; email?: string }> = {};
        snap.docs.forEach((d) => {
          const data = d.data();
          map[d.id] = {
            name: data.name || data.displayName,
            email: data.email,
          };
        });
        setUserLookup(map);
      })
      .catch(() => {});
  }, [isAdmin]);

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
      console.error('Error fetching payments:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  if (!user || !isAdmin) {
    return <Navigate to="/" />;
  }

  // Format date cleanly as DD/MM/YYYY (e.g. 29/06/2026) so RTL never scrambles slashes
  const formatCleanPaymentDate = (createdAt: any): string => {
    if (!createdAt) return '—';
    try {
      const date: Date =
        typeof createdAt.toDate === 'function'
          ? createdAt.toDate()
          : createdAt.seconds
          ? new Date(createdAt.seconds * 1000)
          : new Date(createdAt);

      if (isNaN(date.getTime())) return '—';

      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '—';
    }
  };

  const resolveCustomerDisplay = (p: Payment): { primary: string; secondary?: string } => {
    const lookedUp = p.userId ? userLookup[p.userId] : undefined;
    const email = p.userEmail || p.email || lookedUp?.email || '';
    const name = p.userName || p.customerName || p.customer || lookedUp?.name || '';

    if (name && email) {
      return { primary: name, secondary: email };
    }
    if (email) {
      return { primary: email };
    }
    if (name) {
      return { primary: name };
    }
    if (p.userId) {
      return { primary: `User #${p.userId.substring(0, 6)}` };
    }
    return { primary: isRtl ? 'عميل جكنومة' : 'Jaknooma Customer' };
  };

  const filteredPayments = payments.filter(p => {
    const q = searchTerm.toLowerCase();
    const cust = resolveCustomerDisplay(p);
    return (
      cust.primary.toLowerCase().includes(q) ||
      (cust.secondary || '').toLowerCase().includes(q) ||
      (p.productName || '').toLowerCase().includes(q)
    );
  });

  const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="flex-1 bg-[#FAFAFA] min-h-[calc(100vh-64px)] overflow-y-auto w-full relative z-0">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2 flex items-center gap-2">
            <DollarSign className="w-8 h-8 text-[#D4AF37]" />
            <span>{t('Revenue & Payments')}</span>
          </h1>
          <p className="text-gray-500">{t('Track all Stripe checkout payments, VIP upgrades, and general revenue here.')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
            <span className="text-sm font-medium text-gray-500 mb-1">{t('Total Revenue')}</span>
            <div className="text-3xl sm:text-4xl font-bold text-black tabular-nums" dir="ltr">
              {formatPrice(totalRevenue)} AED
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
            <span className="text-sm font-medium text-gray-500 mb-1">{t('Total Transactions')}</span>
            <div className="text-3xl sm:text-4xl font-bold text-black flex items-center gap-2 tabular-nums">
              <CreditCard className="w-6 h-6 text-[#D4AF37]" />
              <span>{formatPrice(payments.length)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-bold">{t('Recent Transactions')}</h2>
            <div className="relative">
              <Search
                className={`w-4 h-4 absolute ${
                  isRtl ? 'right-3.5' : 'left-3.5'
                } top-1/2 -translate-y-1/2 text-gray-400`}
              />
              <input
                type="text"
                placeholder={t('Search by email or product...')}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={`${
                  isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
                } py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-[#D4AF37] w-full sm:w-64 bg-gray-50 focus:bg-white transition-colors`}
              />
            </div>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full text-start border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                  <th className="p-4 font-semibold text-start">{t('Date')}</th>
                  <th className="p-4 font-semibold text-start">{t('Customer')}</th>
                  <th className="p-4 font-semibold text-start">{t('Product')}</th>
                  <th className="p-4 font-semibold text-start">{t('Type')}</th>
                  <th className="p-4 font-semibold text-start">{t('Amount')}</th>
                  <th className="p-4 font-semibold text-end">{t('Status')}</th>
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
                  filteredPayments.map(payment => {
                    const customerInfo = resolveCustomerDisplay(payment);
                    return (
                      <tr key={payment.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="inline-flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                            <span dir="ltr" className="font-mono tabular-nums font-medium text-gray-800">
                              {formatCleanPaymentDate(payment.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-sm font-medium text-gray-900">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate max-w-[200px]" dir="ltr">
                                {customerInfo.primary}
                              </p>
                              {customerInfo.secondary && (
                                <p className="text-xs text-gray-400 truncate max-w-[200px]" dir="ltr">
                                  {customerInfo.secondary}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-gray-600 max-w-[220px] truncate" title={payment.productName}>
                          {payment.productName || 'VIP Listing'}
                        </td>
                        <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800">
                            {payment.type || 'VIP'}
                          </span>
                        </td>
                        <td className="p-4 text-sm font-bold text-gray-900 whitespace-nowrap tabular-nums" dir="ltr">
                          {formatPrice(payment.amount)} {payment.currency || 'AED'}
                        </td>
                        <td className="p-4 text-sm text-end whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            payment.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
