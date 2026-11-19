import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Trash2,
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { executeServerSideAccountDeletion } from '../services/accountDeletionService';
import { isRtlLanguage } from '../lib/i18n';
import toast from 'react-hot-toast';

export default function DeleteAccount() {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = isRtlLanguage(i18n.language);

  const [authMethod, setAuthMethod] = useState<'email-link' | 'password'>('email-link');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [linkSent, setLinkSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deletedSuccess, setDeletedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Complete email confirmation link verification if the user clicked the link in their email
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let storedEmail = window.localStorage.getItem('emailForAccountDeletion');
      if (!storedEmail) {
        storedEmail = window.localStorage.getItem('emailForSignIn');
      }
      if (storedEmail) {
        setVerifying(true);
        signInWithEmailLink(auth, storedEmail, window.location.href)
          .then(() => {
            window.localStorage.removeItem('emailForAccountDeletion');
            window.history.replaceState({}, document.title, window.location.pathname);
            toast.success(
              isAr
                ? 'تم التحقق من ملكية البريد الإلكتروني بنجاح. يمكنك الآن تأكيد حذف الحساب.'
                : 'Email ownership verified. You may now confirm account deletion.'
            );
          })
          .catch((err) => {
            setErrorMsg(
              err?.message ||
                (isAr
                  ? 'رابط التأكيد غير صالح أو منتهي الصلاحية.'
                  : 'Invalid or expired confirmation link.')
            );
          })
          .finally(() => setVerifying(false));
      }
    }
  }, [isAr]);

  const handleSendEmailVerificationLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || verifying) return;
    setErrorMsg('');
    setVerifying(true);
    try {
      const actionCodeSettings = {
        url: `${window.location.origin}/delete-account`,
        handleCodeInApp: true,
      };
      await sendSignInLinkToEmail(auth, email.trim(), actionCodeSettings);
      window.localStorage.setItem('emailForAccountDeletion', email.trim());
      setLinkSent(true);
      toast.success(
        isAr
          ? 'تم إرسال رابط تأكيد ملكية الحساب إلى بريدك الإلكتروني.'
          : 'A verification link has been sent to your email address.'
      );
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (isAr
            ? 'تعذر إرسال رابط التأكيد. يمكنك أيضاً تسجيل الدخول بكلمة المرور أو Google / Apple للتحقق.'
            : 'Could not send verification link. You can also sign in with password, Google, or Apple to verify ownership.')
      );
    } finally {
      setVerifying(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password || verifying) return;
    setErrorMsg('');
    setVerifying(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      toast.success(isAr ? 'تم التحقق من الحساب بنجاح' : 'Account ownership verified');
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (isAr ? 'بيانات الدخول غير صحيحة' : 'Invalid email or password')
      );
    } finally {
      setVerifying(false);
    }
  };

  const handleGoogleVerify = async () => {
    setErrorMsg('');
    setVerifying(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      toast.success(isAr ? 'تم التحقق عبر Google' : 'Verified with Google');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err?.message || 'Google verification failed');
      }
    } finally {
      setVerifying(false);
    }
  };

  const handleAppleVerify = async () => {
    setErrorMsg('');
    setVerifying(true);
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      await signInWithPopup(auth, provider);
      toast.success(isAr ? 'تم التحقق عبر Apple' : 'Verified with Apple');
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg(err?.message || 'Apple verification failed');
      }
    } finally {
      setVerifying(false);
    }
  };

  const isConfirmReady = () => {
    const normalized = confirmText.trim().toUpperCase();
    return normalized === 'DELETE' || confirmText.trim() === 'حذف';
  };

  const handlePermanentDelete = async () => {
    if (!user || !isConfirmReady() || deleting) return;
    setErrorMsg('');
    setDeleting(true);
    try {
      await executeServerSideAccountDeletion();
      setDeletedSuccess(true);
      toast.success(
        isAr
          ? 'تم حذف حسابك وجميع بياناتك نهائياً.'
          : 'Your account and personal data have been permanently deleted.'
      );
    } catch (err: any) {
      setErrorMsg(
        err?.message ||
          (isAr
            ? 'حدث خطأ أثناء حذف الحساب من الخادم. يرجى المحاولة مرة أخرى.'
            : 'Server-side account deletion failed. Please try again.')
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className={`min-h-[calc(100vh-64px)] bg-[#FAFAFA] py-10 px-4 ${isAr ? 'rtl' : 'ltr'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
            <span>{isAr ? 'العودة إلى جكنومة' : 'Back to Jaknooma'}</span>
          </button>
        </div>

        {/* Header & Instructions Card */}
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-black">
                {isAr
                  ? 'حذف الحساب والبيانات الشخصية – Jaknooma'
                  : 'Account & Personal Data Deletion – Jaknooma'}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {isAr
                  ? 'بوابة رسمية لحذف حسابك وبياناتك الشخصية مباشرة عبر الويب أو من داخل تطبيق جكنومة (com.jaknooma.app).'
                  : 'Official portal to permanently delete your Jaknooma account and personal data on the web or inside the mobile app (com.jaknooma.app).'}
              </p>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2">
              <h2 className="text-sm font-bold text-black">
                {isAr ? 'الطريقة 1: من داخل التطبيق (iOS / Android)' : 'Option 1: Inside the Mobile App (iOS / Android)'}
              </h2>
              <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  {isAr
                    ? 'افتح تطبيق Jaknooma وسجّل الدخول إلى حسابك.'
                    : 'Open the Jaknooma app and sign in to your account.'}
                </li>
                <li>
                  {isAr
                    ? 'اذهب إلى "حسابي" (My Account) > "إعدادات الملف الشخصي" (Profile Settings).'
                    : 'Go to "My Account" > "Profile Settings".'}
                </li>
                <li>
                  {isAr
                    ? 'اضغط على زر "حذف حسابي" (Delete my account) في أسفل الصفحة، ثم اكتب DELETE للتأكيد.'
                    : 'Tap "Delete my account" at the bottom of the page and type DELETE to confirm.'}
                </li>
              </ol>
            </div>

            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-2">
              <h2 className="text-sm font-bold text-black">
                {isAr ? 'الطريقة 2: عبر هذه الصفحة بدون تثبيت التطبيق' : 'Option 2: On This Web Page (No App Required)'}
              </h2>
              <ol className="text-xs text-gray-600 space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  {isAr
                    ? 'تحقق من ملكية حسابك أدناه عبر تسجيل الدخول أو رابط تأكيد البريد الإلكتروني.'
                    : 'Verify account ownership below by signing in or requesting an email confirmation link.'}
                </li>
                <li>
                  {isAr
                    ? 'بعد التحقق، اكتب كلمة DELETE واضغط على "تأكيد حذف الحساب نهائياً".'
                    : 'Once verified, type DELETE and click "Permanently Delete My Account".'}
                </li>
                <li>
                  {isAr
                    ? 'يتم حذف جميع بياناتك وإلغاء رموز Apple / Google فوراً من الخادم.'
                    : 'All personal data is deleted and Apple / Google tokens are revoked immediately on the server.'}
                </li>
              </ol>
            </div>
          </div>

          {/* Data Deleted vs Retained Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-red-50/50 border border-red-100 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-red-700">
                {isAr ? 'البيانات التي يتم حذفها نهائياً:' : 'Data Permanently Deleted:'}
              </h3>
              <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside">
                <li>{isAr ? 'حساب المصادقة، الاسم، البريد الإلكتروني، ورقم الهاتف' : 'Authentication account, name, email address, and phone number'}</li>
                <li>{isAr ? 'العناوين المحفوظة، قائمة المفضلة، وعربة التسوق' : 'Saved addresses, wishlist items, and shopping cart items'}</li>
                <li>{isAr ? 'جميع الإعلانات والمنتجات المنشورة وصورها المرفوعة' : 'All published ads/products and their uploaded images in Cloud Storage'}</li>
                <li>{isAr ? 'رموز الجلسات وربط الدخول مع Sign in with Apple و Google' : 'Active session tokens and Sign in with Apple / Google OAuth tokens'}</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800">
                {isAr ? 'البيانات المحتفظ بها قانونياً (مجهولة الهوية):' : 'Data Retained for Legal Compliance (Anonymized):'}
              </h3>
              <p className="text-xs text-gray-700 leading-relaxed">
                {isAr
                  ? 'امتثالاً لقوانين المحاسبة والضرائب والتدقيق المالي، يتم الاحتفاظ بمبالغ وتواريخ معاملات الدفع المكتملة عبر Stripe (مثل ترقيات VIP) بعد إزالة وتشفير جميع البيانات الشخصية منها (حذف الاسم والبريد الإلكتروني واستبدال المعرّف برمز مجهول).'
                  : 'As required by tax, accounting, and financial audit laws, completed Stripe payment records (transaction amounts and timestamps) are retained in strictly anonymized form with your name, email address, and personal identifiers permanently removed.'}
              </p>
            </div>
          </div>
        </div>

        {/* Ownership Verification & Deletion Execution Card */}
        <div className="bg-white rounded-3xl p-6 md:p-10 border border-gray-100 shadow-sm">
          {deletedSuccess ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-black">
                {isAr ? 'تم حذف حسابك وبياناتك الشخصية نهائياً' : 'Your Account Has Been Permanently Deleted'}
              </h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto">
                {isAr
                  ? 'تمت إزالة ملفك الشخصي وإعلاناتك وصورك المرفوعة وحساب الدخول بالكامل من خوادم جكنومة.'
                  : 'Your profile, ads, uploaded images, and authentication account have been completely removed from Jaknooma servers.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                className="bg-black text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors cursor-pointer"
              >
                {isAr ? 'العودة للصفحة الرئيسية' : 'Return to Home'}
              </button>
            </div>
          ) : user ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-green-50 border border-green-100 text-green-800">
                <ShieldCheck className="w-5 h-5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold">
                    {isAr ? 'تم التحقق من ملكية الحساب:' : 'Account ownership verified:'}
                  </span>{' '}
                  <span>{user.email || user.uid}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-medium text-red-600">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-700">
                  {isAr
                    ? 'لتأكيد حذف الحساب نهائياً، اكتب كلمة DELETE أو حذف:'
                    : 'To confirm permanent account deletion, type DELETE below:'}
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={isAr ? 'DELETE أو حذف' : 'DELETE'}
                  disabled={deleting}
                  className="w-full max-w-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-black focus:bg-white focus:border-red-500 outline-none"
                />
              </div>

              <button
                type="button"
                disabled={!isConfirmReady() || deleting}
                onClick={handlePermanentDelete}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-lg shadow-red-600/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {isAr ? 'جاري حذف البيانات والحساب...' : 'Deleting data & account...'}
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    {isAr ? 'تأكيد حذف الحساب نهائياً' : 'Permanently Delete My Account'}
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-black flex items-center gap-2">
                  <Lock className="w-5 h-5 text-black" />
                  {isAr
                    ? 'التحقق من ملكية الحساب قبل الحذف'
                    : 'Verify Account Ownership Before Deletion'}
                </h2>
                <p className="text-xs text-gray-500">
                  {isAr
                    ? 'لحماية حسابك من الحذف غير المصرح به، يجب إثبات ملكية الحساب عبر رابط تأكيد البريد الإلكتروني أو تسجيل الدخول.'
                    : 'To protect your account against unauthorized deletion, please verify ownership via an email confirmation link or by signing in.'}
                </p>
              </div>

              {errorMsg && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-xs font-medium text-red-600">
                  {errorMsg}
                </div>
              )}

              <div className="flex gap-2 border-b border-gray-100 pb-3">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('email-link');
                    setErrorMsg('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    authMethod === 'email-link'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isAr ? 'رابط تأكيد عبر البريد الإلكتروني' : 'Email Confirmation Link'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMethod('password');
                    setErrorMsg('');
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    authMethod === 'password'
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isAr ? 'تسجيل الدخول بكلمة المرور' : 'Sign In with Password'}
                </button>
              </div>

              {authMethod === 'email-link' ? (
                linkSent ? (
                  <div className="p-4 rounded-2xl bg-green-50 border border-green-100 text-xs text-green-800 space-y-1">
                    <p className="font-bold">
                      {isAr
                        ? 'تم إرسال رابط التأكيد إلى بريدك الإلكتروني!'
                        : 'Verification link sent to your email!'}
                    </p>
                    <p>
                      {isAr
                        ? 'افتح الرسالة واضغط على الرابط للعودة إلى هذه الصفحة وإتمام الحذف النهائي.'
                        : 'Open the email and click the confirmation link to return to this page and complete permanent deletion.'}
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSendEmailVerificationLink} className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">
                        {isAr ? 'البريد الإلكتروني المرتبط بالحساب' : 'Account Email Address'}
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-black focus:bg-white focus:border-black outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={verifying}
                      className="bg-black text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {verifying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Mail className="w-4 h-4" />
                      )}
                      {isAr ? 'إرسال رابط التحقق من الملكية' : 'Send Ownership Verification Link'}
                    </button>
                  </form>
                )
              ) : (
                <form onSubmit={handlePasswordSignIn} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">
                      {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-black focus:bg-white focus:border-black outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">
                      {isAr ? 'كلمة المرور' : 'Password'}
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-black focus:bg-white focus:border-black outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={verifying}
                    className="bg-black text-white px-5 py-3 rounded-xl text-xs font-bold hover:bg-gray-800 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isAr ? 'تحقق من الملكية للمتابعة' : 'Verify Ownership to Continue'}
                  </button>
                </form>
              )}

              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-3">
                  {isAr
                    ? 'أو تحقق من ملكية حسابك المسجل عبر Google أو Apple:'
                    : 'Or verify ownership of an account linked with Google or Apple:'}
                </p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={verifying}
                    onClick={handleGoogleVerify}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-black flex items-center gap-2 cursor-pointer"
                  >
                    {isAr ? 'التحقق عبر Google' : 'Verify with Google'}
                  </button>
                  <button
                    type="button"
                    disabled={verifying}
                    onClick={handleAppleVerify}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-bold text-black flex items-center gap-2 cursor-pointer"
                  >
                    {isAr ? 'التحقق عبر Apple' : 'Verify with Apple'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
