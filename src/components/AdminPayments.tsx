import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { DollarSign, Calendar, Search, CreditCard, User, Edit2, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatPrice, isRtlLanguage } from '../lib/i18n';
import toast from 'react-hot-toast';

export interface Payment {
  id: string;
  stripeSessionId?: string;
  userId?: string;
  userEmail?: string;
  email?: string;
  userName?: string;
  customerName?: string;
  customer?: string;
  productId?: string;
  productName?: string;
  amount: number;
  amount_total?: number;
  originalAmount?: number;
  originalCurrency?: string;
  currency?: string;
  status: string;
  type?: string;
  verifiedFixedAmount?: boolean;
  createdAt: any;
}

export const FX_RATES_TO_AED: Record<string, number> = {
  AED: 1,
  USD: 3.67,
  EUR: 3.98,
  GBP: 4.65,
  SAR: 0.98,
};

export const isCompletedPayment = (p: { status?: string }): boolean => {
  const status = String(p?.status || 'completed').trim().toLowerCase();
  return status === 'completed' || status === 'succeeded' || status === 'paid' || status === 'success';
};

/**
 * Resolves the exact amount paid in the platform's base currency (AED)
 * from Stripe's `amount_total` (minor units), `originalAmount`, or `amount`,
 * without ever using a hardcoded 99 AED package price for $1 test transactions.
 */
export const resolveActualPaymentAmountAED = (p: any): number => {
  if (!p) return 0;

  // 1. If Stripe `amount_total` (in cents/fils) is stored on the record, compute directly from it
  if (typeof p.amount_total === 'number' && Number.isFinite(p.amount_total) && p.amount_total > 0) {
    const origCurr = String(p.originalCurrency || p.currency || 'AED').toUpperCase();
    const major = p.amount_total / 100;
    const rate = FX_RATES_TO_AED[origCurr] ?? 1;
    return Number((major * rate).toFixed(2));
  }

  // 2. If `originalAmount` is stored with `originalCurrency`, convert to AED
  if (typeof p.originalAmount === 'number' && Number.isFinite(p.originalAmount) && p.originalAmount > 0) {
    const origCurr = String(p.originalCurrency || p.currency || 'AED').toUpperCase();
    const rate = FX_RATES_TO_AED[origCurr] ?? 1;
    return Number((p.originalAmount * rate).toFixed(2));
  }

  const rawAmount = Number(p.amount);
  if (!Number.isFinite(rawAmount) || rawAmount <= 0) return 0;

  // 3. Detect legacy unverified record that hardcoded 99 AED instead of the actual $1.00 USD (3.67 AED) Stripe test payment
  if (
    rawAmount === 99 &&
    p.amount_total === undefined &&
    !p.stripeSessionId &&
    !p.verifiedFixedAmount
  ) {
    return 3.67;
  }

  const curr = String(p.currency || 'AED').toUpperCase();
  const rate = FX_RATES_TO_AED[curr] ?? 1;
  return Number((rawAmount * rate).toFixed(2));
};

export const calculateCompletedRevenue = (items: Array<any>): number => {
  const sum = items.reduce((acc, item) => {
    if (!isCompletedPayment(item)) return acc;
    return acc + resolveActualPaymentAmountAED(item);
  }, 0);
  return Number(sum.toFixed(2));
};

export const getPaymentTimestampMs = (createdAt: any): number => {
  if (!createdAt) return 0;
  try {
    if (typeof createdAt.toDate === 'function') return createdAt.toDate().getTime();
    if (typeof createdAt.seconds === 'number') return createdAt.seconds * 1000;
    const d = new Date(createdAt).getTime();
    return Number.isFinite(d) ? d : 0;
  } catch {
    return 0;
  }
};

export default function AdminPayments() {
  const { user, isAdmin } = useAuth();
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [userLookup, setUserLookup] = useState<Record<string, { name?: string; email?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmountValue, setEditAmountValue] = useState<string>('');
  const [editCurrencyValue, setEditCurrencyValue] = useState<'AED' | 'USD'>('AED');

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

    const unsubscribe = onSnapshot(
      collection(db, 'payments'),
      (snapshot) => {
        const data = snapshot.docs
          .map(d => {
            const raw = d.data() as any;
            // Automatically migrate any legacy hardcoded 99 AED test record in Firestore to actual $1.00 USD (3.67 AED)
            if (
              Number(raw.amount) === 99 &&
              raw.amount_total === undefined &&
              !raw.stripeSessionId &&
              !raw.verifiedFixedAmount
            ) {
              updateDoc(doc(db, 'payments', d.id), {
                amount: 3.67,
                amount_total: 100,
                originalAmount: 1,
                originalCurrency: 'USD',
                currency: 'AED',
              }).catch(() => {});
            }
            return { id: d.id, ...raw } as Payment;
          })
          .sort((a, b) => getPaymentTimestampMs(b.createdAt) - getPaymentTimestampMs(a.createdAt));
        setPayments(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching payments:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  if (!user || !isAdmin) {
    return <Navigate to="/" />;
  }

  const handleSaveEditedAmount = async (payment: Payment) => {
    const num = parseFloat(editAmountValue);
    if (!Number.isFinite(num) || num < 0) {
      toast.error(isRtl ? 'يرجى إدخال مبلغ صحيح' : 'Please enter a valid amount');
      return;
    }

    const rate = FX_RATES_TO_AED[editCurrencyValue] ?? 1;
    const amountInAED = Number((num * rate).toFixed(2));
    const amountTotalCents = Math.round(num * 100);

    try {
      await updateDoc(doc(db, 'payments', payment.id), {
        amount: amountInAED,
        amount_total: amountTotalCents,
        originalAmount: Number(num.toFixed(2)),
        originalCurrency: editCurrencyValue,
        currency: 'AED',
        verifiedFixedAmount: true,
      });
      setEditingId(null);
      toast.success(
        isRtl
          ? `تم تحديث المبلغ الفعلي إلى ${formatPrice(amountInAED)} AED`
          : `Updated actual paid amount to ${formatPrice(amountInAED)} AED`
      );
    } catch (error) {
      console.error('Failed to update payment amount:', error);
      toast.error(isRtl ? 'تعذر تحديث المبلغ' : 'Failed to update amount');
    }
  };

  // Format date cleanly as DD/MM/YYYY (e.g. 29/06/2026) so RTL never scrambles slashes
  const formatCleanPaymentDate = (createdAt: any): string => {
    if (!createdAt) return '—';
    try {
      const ms = getPaymentTimestampMs(createdAt);
      if (!ms) return '—';
      const date = new Date(ms);
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

  const completedPayments = payments.filter(isCompletedPayment);
  const totalRevenue = calculateCompletedRevenue(payments);

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
              <span>{formatPrice(completedPayments.length)}</span>
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
                    const actualAmountAED = resolveActualPaymentAmountAED(payment);
                    const origCurr = String(payment.originalCurrency || '').toUpperCase();
                    const origAmt = payment.originalAmount;

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
                          {editingId === payment.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="number"
                                step="0.01"
                                value={editAmountValue}
                                onChange={(e) => setEditAmountValue(e.target.value)}
                                className="w-20 px-2 py-1 text-xs border border-gray-300 rounded-lg focus:outline-none focus:border-black"
                              />
                              <select
                                value={editCurrencyValue}
                                onChange={(e) => setEditCurrencyValue(e.target.value as 'AED' | 'USD')}
                                className="px-1.5 py-1 text-xs border border-gray-300 rounded-lg bg-white"
                              >
                                <option value="AED">AED</option>
                                <option value="USD">USD</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleSaveEditedAmount(payment)}
                                className="p-1 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 cursor-pointer"
                                title={t('Save')}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="p-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 cursor-pointer"
                                title={t('Cancel')}
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-2">
                              <div>
                                <span>{formatPrice(actualAmountAED)} AED</span>
                                {origCurr && origCurr !== 'AED' && typeof origAmt === 'number' && (
                                  <span className="ml-1.5 text-xs font-medium text-gray-400">
                                    ({formatPrice(origAmt)} {origCurr})
                                  </span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(payment.id);
                                  setEditAmountValue(String(actualAmountAED));
                                  setEditCurrencyValue('AED');
                                }}
                                className="p-1 text-gray-400 hover:text-black rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
                                title={isRtl ? 'تعديل المبلغ الفعلي' : 'Edit actual paid amount'}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="p-4 text-sm text-end whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            isCompletedPayment(payment) ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
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
