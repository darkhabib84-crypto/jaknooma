import React, { useState, useEffect } from 'react';
import {
  Flag,
  Trash2,
  Ban,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ExternalLink,
  Search,
  UserX,
  RotateCcw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isRtlLanguage } from '../../lib/i18n';
import {
  ListingReport,
  BannedSellerRecord,
  fetchAllReports,
  getLocalBannedUsers,
  dismissReportAction,
  deleteReportedProductAction,
  banSellerAndRemoveAdsAction,
  unbanSellerAction,
  MODERATION_EVENT,
} from '../../services/moderationService';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function AdminReports() {
  const { i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

  const [reports, setReports] = useState<ListingReport[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedSellerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'resolved' | 'banned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadModerationData = async () => {
    setLoading(true);
    try {
      const fetched = await fetchAllReports();
      setReports(fetched);
      setBannedUsers(getLocalBannedUsers());
    } catch (err) {
      console.error('Error loading moderation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModerationData();
    const handleUpdate = () => {
      fetchAllReports().then(setReports).catch(() => {});
      setBannedUsers(getLocalBannedUsers());
    };
    window.addEventListener(MODERATION_EVENT, handleUpdate);
    return () => window.removeEventListener(MODERATION_EVENT, handleUpdate);
  }, []);

  const formatReportDate = (iso: string): string => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      if (isNaN(d.getTime())) return '—';
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '—';
    }
  };

  const handleDismiss = async (report: ListingReport) => {
    setProcessingId(report.id);
    try {
      const updated = await dismissReportAction(report.id);
      setReports(updated);
      toast.success(
        isRtl
          ? 'تم تجاهل البلاغ وإغلاقه مع الإبقاء على الإعلان'
          : 'Report dismissed; listing kept active'
      );
    } catch {
      toast.error(isRtl ? 'تعذر تحديث حالة البلاغ' : 'Failed to update report');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeleteProductOnly = async (report: ListingReport) => {
    setProcessingId(report.id);
    try {
      const updated = await deleteReportedProductAction(report);
      setReports(updated);
      toast.success(
        isRtl
          ? 'تم حذف الإعلان المبلغ عنه وإغلاق البلاغ بنجاح'
          : 'Reported product deleted and report closed'
      );
    } catch {
      toast.error(isRtl ? 'تعذر حذف الإعلان' : 'Failed to delete product');
    } finally {
      setProcessingId(null);
    }
  };

  const handleBanSellerAndRemoveAds = async (report: ListingReport) => {
    setProcessingId(report.id);
    try {
      const updated = await banSellerAndRemoveAdsAction(report);
      setReports(updated);
      setBannedUsers(getLocalBannedUsers());
      toast.success(
        isRtl
          ? `تم حظر البائع (${report.sellerName}) وحذف جميع إعلاناته فوراً`
          : `Banned seller (${report.sellerName}) and removed all their ads`
      );
    } catch {
      toast.error(isRtl ? 'تعذر تنفيذ الحظر' : 'Failed to ban seller');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnbanSeller = async (sellerId: string, sellerName?: string) => {
    try {
      const next = await unbanSellerAction(sellerId);
      setBannedUsers(next);
      toast.success(
        isRtl
          ? `تم رفع الحظر عن ${sellerName || sellerId}`
          : `Unbanned ${sellerName || sellerId}`
      );
    } catch {
      toast.error(isRtl ? 'تعذر رفع الحظر' : 'Failed to unban seller');
    }
  };

  const pendingCount = reports.filter((r) => r.status === 'pending').length;

  const filteredReports = reports.filter((r) => {
    if (activeFilter === 'pending' && r.status !== 'pending') return false;
    if (activeFilter === 'resolved' && r.status === 'pending') return false;
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (r.productTitle || '').toLowerCase().includes(q) ||
      (r.sellerName || '').toLowerCase().includes(q) ||
      (r.reasonLabelAr || '').toLowerCase().includes(q) ||
      (r.reasonLabelEn || '').toLowerCase().includes(q) ||
      (r.notes || '').toLowerCase().includes(q)
    );
  });

  const renderStatusBadge = (status: ListingReport['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200">
            <Clock className="w-3.5 h-3.5" />
            <span>{isRtl ? 'بلاغ جديد (قيد المراجعة)' : 'New / Pending Review'}</span>
          </span>
        );
      case 'dismissed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تم تجاهل البلاغ' : 'Dismissed'}</span>
          </span>
        );
      case 'resolved_deleted':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isRtl ? 'تم حذف الإعلان' : 'Product Deleted'}</span>
          </span>
        );
      case 'resolved_banned':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black text-white">
            <Ban className="w-3.5 h-3.5 text-red-400" />
            <span>{isRtl ? 'تم حظر البائع وحذف إعلاناته' : 'Seller Banned & Ads Removed'}</span>
          </span>
        );
    }
  };

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 text-start">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black">
              {isRtl ? 'البلاغات والحظر (Reports & Moderation)' : 'Reports & Moderation'}
            </h1>
            {pendingCount > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-red-600 text-white shadow-xs">
                {pendingCount} {isRtl ? 'جديد' : 'New'}
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            {isRtl
              ? 'مراجعة بلاغات المستخدمين حول الإعلانات المخالفة وإدارة حذف المحتوى وحظر الحسابات (متوافق مع متطلبات App Store Guideline 1.2).'
              : 'Review user-submitted listing reports, remove violating ads, and manage banned seller accounts (App Store Guideline 1.2 compliance).'}
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
              {isRtl ? 'البلاغات الجديدة' : 'New Pending Reports'}
            </span>
            <span className="text-3xl font-black text-red-600 tabular-nums">{pendingCount}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center">
            <Flag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
              {isRtl ? 'إجمالي البلاغات' : 'Total Reports'}
            </span>
            <span className="text-3xl font-black text-gray-900 tabular-nums">{reports.length}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-700 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block mb-1">
              {isRtl ? 'البائعون المحظورون' : 'Banned Sellers'}
            </span>
            <span className="text-3xl font-black text-gray-900 tabular-nums">{bannedUsers.length}</span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <UserX className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeFilter === 'all' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isRtl ? `جميع البلاغات (${reports.length})` : `All Reports (${reports.length})`}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeFilter === 'pending' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            <span>{isRtl ? 'بلاغات جديدة' : 'Pending'}</span>
            <span className="px-1.5 py-0.5 text-[11px] rounded-full bg-white/20 font-extrabold">
              {pendingCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('resolved')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeFilter === 'resolved' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isRtl ? 'تمت معالجتها' : 'Resolved'}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('banned')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
              activeFilter === 'banned' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isRtl ? `قائمة المحظورين (${bannedUsers.length})` : `Banned Users (${bannedUsers.length})`}
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className={`w-4 h-4 text-gray-400 absolute ${
              isRtl ? 'right-3.5' : 'left-3.5'
            } top-1/2 -translate-y-1/2`}
          />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isRtl ? 'بحث في البلاغات...' : 'Search reports...'}
            className={`w-full ${
              isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
            } py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-black`}
          />
        </div>
      </div>

      {/* Content Area */}
      {activeFilter === 'banned' ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">
              {isRtl ? 'قائمة البائعين والحسابات المحظورة' : 'Banned Sellers & Accounts'}
            </h2>
          </div>
          {bannedUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <UserX className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="font-medium">
                {isRtl ? 'لا توجد حسابات محظورة حالياً.' : 'No banned accounts at the moment.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {bannedUsers.map((b) => (
                <div
                  key={b.sellerId}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/60"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">
                        {b.sellerName || b.sellerEmail || b.sellerId}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700">
                        {isRtl ? 'محظور (Banned)' : 'Banned'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      ID: <span className="font-mono">{b.sellerId}</span>
                      {b.reason ? ` • ${isRtl ? 'السبب:' : 'Reason:'} ${b.reason}` : ''}
                    </p>
                    <p className="text-xs text-gray-400" dir="ltr">
                      {formatReportDate(b.bannedAt)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnbanSeller(b.sellerId, b.sellerName)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-black hover:text-white transition-colors cursor-pointer self-start sm:self-center"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'رفع الحظر' : 'Unban Account'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : loading ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-400">
          {isRtl ? 'جاري تحميل البلاغات...' : 'Loading reports...'}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-400">
          <Flag className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="font-medium text-gray-600">
            {isRtl ? 'لا توجد بلاغات مسجلة في هذا القسم حالياً.' : 'No reports found in this section.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const isBusy = processingId === report.id;
            return (
              <div
                key={report.id}
                className="bg-white rounded-3xl border border-gray-100 shadow-xs p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:border-gray-200 transition-all"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {report.productImage ? (
                    <img
                      src={report.productImage}
                      alt={report.productTitle}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                      <Flag className="w-6 h-6" />
                    </div>
                  )}

                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {renderStatusBadge(report.status)}
                      <span
                        dir="ltr"
                        className="text-xs font-mono text-gray-400 tabular-nums"
                      >
                        {formatReportDate(report.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-base sm:text-lg text-gray-900">
                        {report.productTitle}
                      </h3>
                      {report.productId && (
                        <Link
                          to={`/product/${report.productId}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                        >
                          <span>{isRtl ? 'عرض الإعلان' : 'View Listing'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span>
                        {isRtl ? 'البائع:' : 'Seller:'}{' '}
                        <strong className="text-gray-900">{report.sellerName}</strong>
                        {report.sellerId ? (
                          <span className="text-gray-400 font-mono"> ({report.sellerId.slice(0, 8)})</span>
                        ) : null}
                      </span>
                      <span>
                        {isRtl ? 'سبب البلاغ:' : 'Reason:'}{' '}
                        <strong className="text-red-600">
                          {isRtl ? report.reasonLabelAr : report.reasonLabelEn}
                        </strong>
                      </span>
                    </div>

                    {report.notes && (
                      <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <strong className="text-gray-500 block text-[11px] mb-0.5">
                          {isRtl ? 'ملاحظات المبلّغ:' : 'Reporter Notes:'}
                        </strong>
                        {report.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* 3 Direct Moderation Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-gray-100">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDismiss(report)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isRtl ? 'تجاهل البلاغ' : 'Dismiss Report'}
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleDeleteProductOnly(report)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'حذف الإعلان فقط' : 'Delete Product'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleBanSellerAndRemoveAds(report)}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>
                      {isRtl ? 'حظر البائع وحذف إعلاناته' : 'Ban Seller & Remove Ads'}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
