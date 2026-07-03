import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  sendPasswordResetEmail,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';


declare global {
  interface Window {
    recaptchaVerifier: any;
    grecaptcha: any;
  }
}

type AuthMode = 'login' | 'signup' | 'email-link' | 'phone' | 'forgot-password';

export default function AuthModal() {
  const { isAuthModalOpen, authModalMode, closeAuthModal } = useAuth();
  const { t } = useTranslation();
  
  const [mode, setMode] = useState<AuthMode>(authModalMode as AuthMode);

  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode);
    }
  }, [isAuthModalOpen, authModalMode]);

  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode);
    }
  }, [isAuthModalOpen, authModalMode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isAuthModalOpen && mode === 'phone') {
      if (!window.recaptchaVerifier) {
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }
    } else {
      if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = null;
      }
    }
  }, [isAuthModalOpen, mode]);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // هنا نقوم بإنشاء سجل للمستخدم في قاعدة بيانات Firestore
        await setDoc(doc(db, "users", userCredential.user.uid), {
          email: email,
          name: email.split('@')[0], // اسم افتراضي من الإيميل
          role: "customer",          // الدور الافتراضي
          status: "Active",          // الحالة الافتراضية
          createdAt: serverTimestamp()
        });
        
        closeAuthModal();
      }

 else if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        closeAuthModal();
      } else if (mode === 'email-link') {
        const actionCodeSettings = {
          url: window.location.href, // Current URL to redirect back
          handleCodeInApp: true,
        };
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        setMessage(t('A sign-in link has been sent to your email address.'));
      } else if (mode === 'forgot-password') {
        await sendPasswordResetEmail(auth, email);
        setMessage(t('A password reset link has been sent to your email address.'));
      } else if (mode === 'phone') {
        if (!confirmationResult) {
          // Send OTP
          if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
          }
          const appVerifier = window.recaptchaVerifier;
          const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`;
          const result = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
          setConfirmationResult(result);
          setMessage('OTP sent to your phone. Please enter it below.');
        } else {
          // Verify OTP
          const userCredential = await confirmationResult.confirm(verificationCode);
          
          // إضافة حفظ المستخدم في قاعدة البيانات
          await setDoc(doc(db, "users", userCredential.user.uid), {
            phone: phone, // الرقم الذي أدخله المستخدم
            role: "customer",
            status: "Active",
            createdAt: serverTimestamp()
          }, { merge: true });

          closeAuthModal();
        }


      }
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('This sign-in method is not enabled. Please enable it in the Firebase Console under Authentication > Sign-in method.');
      } else {
        setError(err.message || 'An error occurred during authentication');
      }
      // Reset recaptcha if error in phone auth
      if (mode === 'phone' && !confirmationResult) {
         if (window.recaptchaVerifier) {
            window.recaptchaVerifier.render().then((widgetId: any) => {
               window.grecaptcha.reset(widgetId);
            });
         }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-serif font-bold text-black">
            {mode === 'login' ? t('Welcome Back') : mode === 'signup' ? t('Create Account') : mode === 'email-link' ? t('Email Magic Link') : mode === 'forgot-password' ? t('Reset Password') : t('Phone Login')}
          </h2>
          <button 
            onClick={closeAuthModal}
            className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 transition-colors rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 text-[13px] font-medium text-red-600 bg-red-50 px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          )}
          {message && (
            <div className="mb-4 text-[13px] font-medium text-green-700 bg-green-50 px-4 py-3 rounded-xl border border-green-100">
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {(mode === 'login' || mode === 'signup' || mode === 'email-link' || mode === 'forgot-password') && (
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  {t('Email Address')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:border-gray-200 focus:bg-white focus:ring-2 focus:ring-black/5 text-black placeholder-gray-400 transition-all text-left rtl:text-right"
                  placeholder="you@example.com"
                />
              </div>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div>
                <div className="flex justify-between items-center mb-2 mt-4">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    {t('Password')}
                  </label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => { setMode('forgot-password'); setError(''); setMessage(''); }}
                      className="text-xs text-gray-500 hover:text-black hover:underline"
                    >
                      {t('Forgot password?')}
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:border-gray-200 focus:bg-white focus:ring-2 focus:ring-black/5 text-black placeholder-gray-400 transition-all text-left rtl:text-right"
                  placeholder="••••••••"
                />
              </div>
            )}

            {mode === 'phone' && (
              <>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    {t('Phone Number')}
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    disabled={!!confirmationResult}
                    className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:border-gray-200 focus:bg-white focus:ring-2 focus:ring-black/5 text-black placeholder-gray-400 transition-all disabled:opacity-50 text-left rtl:text-right"
                    placeholder="+1234567890"
                  />
                  <div id="recaptcha-container"></div>
                </div>
                
                {confirmationResult && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 mt-4">
                      {t('Verification Code')}
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      required
                      className="w-full bg-gray-50 border border-transparent rounded-xl py-3 px-4 text-sm focus:border-gray-200 focus:bg-white focus:ring-2 focus:ring-black/5 text-black placeholder-gray-400 transition-all text-left rtl:text-right"
                      placeholder="123456"
                    />
                  </div>
                )}
              </>
            )}

            {mode === 'signup' && (
              <div className="mt-4 flex items-start gap-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  required 
                  className="mt-1 flex-shrink-0 w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                  {t('I have read and agree to the')}{' '}
                  <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-[#D4AF37] hover:underline">
                    {t('Terms & Conditions')}
                  </a>.
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white font-medium rounded-xl py-3.5 px-4 hover:bg-gray-800 transition-colors shadow-lg shadow-black/10 disabled:opacity-50 mt-6"
            >
              {loading 
                ? t('Processing...') 
                : mode === 'login' ? t('Sign In') 
                : mode === 'signup' ? t('Create Account') 
                : mode === 'email-link' ? t('Send Link') 
                : mode === 'forgot-password' ? t('Send Reset Link')
                : (!confirmationResult ? t('Send OTP') : t('Verify & Login'))}
            </button>
          </form>

            {(mode === 'login' || mode === 'signup') && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-gray-400 font-medium">{t('Or continue with')}</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"

onClick={async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // إضافة بيانات المستخدم إلى Firestore بعد التسجيل بجوجل
    await setDoc(doc(db, "users", result.user.uid), {
      email: result.user.email,
      name: result.user.displayName || "Google User",
      role: "customer",
      status: "Active",
      createdAt: serverTimestamp()
    }, { merge: true }); // استخدم merge: true لتجنب مسح البيانات إذا كان المستخدم موجوداً مسبقاً

    closeAuthModal();
  } catch (err: any) {
    console.error("Google Auth Error:", err);
    setError(err.message);
  }
}}

                    className="flex justify-center items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium text-black"
                  >
                    <svg className="w-5 h-5 rtl:ml-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                        toast(t('Apple login preview'), { icon: '🍎' });
                    }}
                    className="flex justify-center items-center gap-2 w-full px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 focus:ring-2 focus:ring-black/5 transition-all text-sm font-medium text-black"
                  >
                    <svg className="w-5 h-5 text-black rtl:ml-2" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.43.987 3.96.948 1.56-.048 2.599-1.503 3.595-2.97 1.144-1.682 1.616-3.322 1.643-3.411-.035-.018-3.189-1.222-3.218-4.85-.027-3.04 2.48-4.494 2.597-4.559-1.428-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.512 1.09zM15.502 3.833c.843-1.026 1.411-2.453 1.257-3.882-1.226.05-2.735.815-3.6 1.865-.77.91-1.455 2.37-1.26 3.766 1.365.106 2.766-.724 3.603-1.749z" />
                    </svg>
                    Apple
                  </button>
                </div>
              </div>
            )}

          <div className="mt-8 flex flex-col gap-4 text-center">
             <div className="flex bg-gray-50 p-1 rounded-xl">
                 <button 
                  type="button"
                  onClick={() => { setMode('login'); setError(''); setMessage(''); setConfirmationResult(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'login' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-black'}`}
                 >
                   {t('Password')}
                 </button>
                 <button 
                  type="button"
                  onClick={() => { setMode('email-link'); setError(''); setMessage(''); setConfirmationResult(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'email-link' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-black'}`}
                 >
                   {t('Magic Link')}
                 </button>
                 <button 
                  type="button"
                  onClick={() => { setMode('phone'); setError(''); setMessage(''); setConfirmationResult(null); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'phone' ? 'bg-white shadow-sm text-black' : 'text-gray-400 hover:text-black'}`}
                 >
                   {t('Phone')}
                 </button>
             </div>
             
             {mode === 'login' ? (
                <p className="text-sm text-gray-500">
                  {t('Don\'t have an account?')} <button onClick={() => { setMode('signup'); setError(''); setMessage(''); setConfirmationResult(null); }} className="text-black font-bold hover:underline">
                    {t('Sign up')}
                  </button>
                </p>
              ) : mode === 'signup' ? (
                <p className="text-sm text-gray-500">
                  {t('Already have an account?')} <button onClick={() => { setMode('login'); setError(''); setMessage(''); setConfirmationResult(null); }} className="text-black font-bold hover:underline">
                    {t('Sign in')}
                  </button>
                </p>
              ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
