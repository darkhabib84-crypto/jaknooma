import React, { useState } from 'react';
import { X, Flag, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { isRtlLanguage } from '../lib/i18n';
import { useAuth } from '../contexts/AuthContext';
import { submitListingReport } from '../services/moderationService';
import toast from 'react-hot-toast';

interface ReportListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name?: string;
    title?: string;
    images?: string[];
    image?: string;
    imageUrl?: string;
    sellerId?: string;
    sellerName?: string;
    storeName?: string;
  };
}

const REPORT_REASONS: Array<{
  id: 'inappropriate' | 'spam_scam' | 'misleading' | 'other';
  labelAr: string;
  labelEn: string;
}> = [
  {
    id: 'inappropriate',
    labelAr: 'محتوى غير لائق أو مخالف (Inappropriate Content)',
    labelEn: 'Inappropriate Content',
  },
  {
    id: 'spam_scam',
    labelAr: 'إعلان احتيالي أو وهمي (Spam or Scam)',
    labelEn: 'Spam or Scam',
  },
  {
    id: 'misleading',
    labelAr: 'سعر أو معلومات مضللة (Misleading Info)',
    labelEn: 'Misleading Info',
  },
  {
    id: 'other',
    labelAr: 'سبب آخر (Other)',
    labelEn: 'Other',
  },
];

export default function ReportListingModal({
  isOpen,
  onClose,
  product,
}: ReportListingModalProps) {
  const { i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const { user } = useAuth();

  const [selectedReason, setSelectedReason] = useState<'inappropriate' | 'spam_scam' | 'misleading' | 'other'>('inappropriate');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const productTitle = product.name || product.title || (isRtl ? 'إعلان' : 'Listing');
  const sellerName = product.sellerName || product.storeName || (isRtl ? 'بائع' : 'Seller');
  const productImage =
    (Array.isArray(product.images) && product.images[0]) ||
    product.image ||
    product.imageUrl ||
    '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const reasonObj =
      REPORT_REASONS.find((r) => r.id === selectedReason) || REPORT_REASONS[0];

    try {
      await submitListingReport({
        productId: product.id || '',
        productTitle,
        productImage,
        sellerId: product.sellerId || '',
        sellerName,
        reason: selectedReason,
        reasonLabelAr: reasonObj.labelAr,
        reasonLabelEn: reasonObj.labelEn,
        notes: notes.trim(),
        reporterId: user?.uid || 'guest',
        reporterEmail: user?.email || '',
      });

      setSubmittedSuccess(true);
      toast.success(
        isRtl
          ? 'تم إرسال بلاغك للإدارة، سيقوم المشرف بمراجعة الإعلان واتخاذ الإجراء اللازم وحظر المخالف خلال 24 ساعة'
          : 'Your report has been submitted. A moderator will review the listing, take necessary action, and ban the violator within 24 hours.',
        { duration: 6000 }
      );
    } catch (err) {
      console.error('Report submission error:', err);
      toast.error(isRtl ? 'حدث خطأ أثناء إرسال البلاغ' : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSubmittedSuccess(false);
    setNotes('');
    setSelectedReason('inappropriate');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-start"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900">
                {isRtl ? '🚩 إبلاغ عن الإعلان' : '🚩 Report Listing'}
              </h3>
              <p className="text-xs text-gray-500 truncate max-w-[260px]">
                {productTitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h4 className="text-lg font-bold text-gray-900">
              {isRtl ? 'تم استلام بلاغك بنجاح' : 'Report Submitted Successfully'}
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100">
              {isRtl
                ? 'تم إرسال بلاغك للإدارة، سيقوم المشرف بمراجعة الإعلان واتخاذ الإجراء اللازم وحظر المخالف خلال 24 ساعة'
                : 'Your report has been submitted to administration. A moderator will review the listing, take necessary action, and ban the violator within 24 hours.'}
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3.5 bg-black text-white rounded-2xl font-bold text-sm hover:bg-gray-800 transition-colors cursor-pointer"
            >
              {isRtl ? 'حسناً، إغلاق' : 'Done'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Seller & Listing Summary */}
            <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs">
              <div className="min-w-0">
                <span className="text-gray-400 block">
                  {isRtl ? 'الإعلان المبلغ عنه:' : 'Reported Listing:'}
                </span>
                <strong className="text-gray-900 truncate block">
                  {productTitle}
                </strong>
              </div>
              <div className="text-end shrink-0">
                <span className="text-gray-400 block">
                  {isRtl ? 'البائع:' : 'Seller:'}
                </span>
                <strong className="text-gray-800">{sellerName}</strong>
              </div>
            </div>

            {/* Reason Options */}
            <div className="space-y-2.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                {isRtl ? 'يرجى تحديد سبب البلاغ:' : 'Select Reason for Report:'}
              </label>
              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => {
                  const active = selectedReason === reason.id;
                  return (
                    <label
                      key={reason.id}
                      onClick={() => setSelectedReason(reason.id)}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        active
                          ? 'border-red-600 bg-red-50/40 text-gray-900 font-bold shadow-xs'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="report_reason"
                        checked={active}
                        onChange={() => setSelectedReason(reason.id)}
                        className="w-4 h-4 accent-red-600 shrink-0"
                      />
                      <span className="text-sm">
                        {isRtl ? reason.labelAr : reason.labelEn}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Optional Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                {isRtl ? 'ملاحظات إضافية (اختياري):' : 'Additional Notes (Optional):'}
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isRtl
                    ? 'أضف أي تفاصيل إضافية تساعد الإدارة في مراجعة الإعلان...'
                    : 'Provide any additional details to help moderators review this listing...'
                }
                className="w-full p-3.5 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-black text-start"
              />
            </div>

            <div className="flex items-center gap-2 text-[11px] text-gray-500 bg-amber-50/70 border border-amber-200/60 p-3 rounded-xl">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isRtl
                  ? 'تتم مراجعة كافة البلاغات من قبل فريق الإشراف خلال 24 ساعة وحظر الحسابات المخالفة فوراً.'
                  : 'All reports are reviewed by our moderation team within 24 hours and violating accounts are banned immediately.'}
              </span>
            </div>

            {/* Submit / Cancel Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 rounded-xl text-sm font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex items-center gap-2"
              >
                <Flag className="w-4 h-4" />
                <span>
                  {submitting
                    ? isRtl
                      ? 'جاري الإرسال...'
                      : 'Submitting...'
                    : isRtl
                    ? 'إرسال البلاغ'
                    : 'Submit Report'}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
