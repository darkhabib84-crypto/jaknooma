import React, { useState, useEffect } from 'react';
import { Settings, Save, Globe, Lock, Mail, CreditCard, Monitor, Loader2 } from 'lucide-react';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// تعريف هيكل البيانات بالكامل لتجنب الأخطاء
interface SettingsState {
  // General
  platformName: string;
  supportEmail: string;
  metaDescription: string;
  // Firebase Config
  projectId: string;
  apiKey: string;
  // Security
  sessionTimeout: string;
  requireTwoFactor: boolean;
  // Payment
  stripePublicKey: string;
  currency: string;
  // Email
  smtpHost: string;
  smtpPort: string;
  // Localization
  defaultLanguage: string;
  timezone: string;
}

const defaultSettings: SettingsState = {
  platformName: 'Jaknooma',
  supportEmail: 'support@jaknooma.com',
  metaDescription: 'Jaknooma is a premium multi-store aggregator...',
  projectId: 'jaknooma-app',
  apiKey: '',
  sessionTimeout: '30',
  requireTwoFactor: false,
  stripePublicKey: '',
  currency: 'AED',
  smtpHost: 'smtp.mailtrap.io',
  smtpPort: '2525',
  defaultLanguage: 'ar',
  timezone: 'Asia/Dubai',
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const db = getFirestore();
  const settingsDocRef = doc(db, 'system_settings', 'platform');

  // 1. جلب الإعدادات الحقيقية عند تحميل الصفحة
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(settingsDocRef);
        if (docSnap.exists()) {
          setSettings({ ...defaultSettings, ...docSnap.data() });
        } else {
          // إذا لم تكن موجودة مسبقاً، نضع القيم الافتراضية
          await setDoc(settingsDocRef, defaultSettings);
        }
      } catch (error) {
        console.error("خطأ في جلب الإعدادات:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  // 2. تحديث الـ State عند تعديل أي حقل بمرونة
  const handleChange = (field: keyof SettingsState, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // 3. حفظ التعديلات كاملة في Firestore
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(settingsDocRef, settings, { merge: true });
      setMessage({ type: 'success', text: 'تم حفظ جميع التغييرات بنجاح!' });
      setTimeout(() => setMessage(null), 4000); // إخفاء التنبيه بعد 4 ثوانٍ
    } catch (error) {
      console.error("خطأ في حفظ الإعدادات:", error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ، يرجى المحاولة لاحقاً.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center p-8 text-gray-500 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
        <p className="text-sm">جاري تحميل إعدادات المنصة...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black mb-1">Platform Settings</h1>
        <p className="text-gray-500">Configure global preferences, security, and integrations.</p>
      </div>

      {/* التنبيهات وإشعارات النجاح/الخطأ */}
      {message && (
        <div className={`p-4 rounded-2xl text-sm font-medium border ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
         {/* شريط التنقل العلوي للتبويبات */}
         <div className="border-b border-gray-100 flex p-1 bg-gray-50/50 overflow-x-auto scrollbar-hide">
            {[
              { id: 'general', icon: Settings, label: 'General' },
              { id: 'security', icon: Lock, label: 'Security' },
              { id: 'payment', icon: CreditCard, label: 'Payment' },
              { id: 'email', icon: Mail, label: 'SMTP / Email' },
              { id: 'localization', icon: Globe, label: 'Localization' },
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black hover:bg-gray-100/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
         </div>

         {/* محتوى الإعدادات المتغير حسب التبويب النشط */}
         <div className="p-6 md:p-8 space-y-8">
            
            {/* تبويب General */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Platform Name</label>
                  <input 
                    type="text" 
                    value={settings.platformName} 
                    onChange={e => handleChange('platformName', e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Support Email</label>
                  <input 
                    type="email" 
                    value={settings.supportEmail} 
                    onChange={e => handleChange('supportEmail', e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Meta Description (SEO)</label>
                  <textarea 
                    rows={3} 
                    value={settings.metaDescription} 
                    onChange={e => handleChange('metaDescription', e.target.value)}
                    className="w-full max-w-lg px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all resize-none"
                  ></textarea>
                </div>

                <hr className="border-gray-100" />

                <div className="space-y-4">
                  <h3 className="font-bold text-lg">Firebase Configuration</h3>
                  <p className="text-sm text-gray-500 mb-4">Update your frontend Firebase SDK keys.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                     <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Project ID</label>
                       <input 
                         type="text" 
                         value={settings.projectId} 
                         onChange={e => handleChange('projectId', e.target.value)}
                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all font-mono" 
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Web API Key</label>
                       <input 
                         type="password" 
                         value={settings.apiKey} 
                         placeholder={settings.apiKey ? "••••••••••••••••" : "أدخل الـ API Key"}
                         onChange={e => handleChange('apiKey', e.target.value)}
                         className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all font-mono" 
                       />
                     </div>
                  </div>
                </div>
              </div>
            )}

            {/* تبويب Security */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Session Timeout (Minutes)</label>
                  <input 
                    type="number" 
                    value={settings.sessionTimeout} 
                    onChange={e => handleChange('sessionTimeout', e.target.value)}
                    className="w-full max-w-xs px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black" 
                  />
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="2fa" 
                    checked={settings.requireTwoFactor} 
                    onChange={e => handleChange('requireTwoFactor', e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 accent-black focus:ring-black"
                  />
                  <label htmlFor="2fa" className="text-sm font-bold text-gray-900">Require Two-Factor Authentication (2FA) for Admins</label>
                </div>
              </div>
            )}

            {/* تبويب Payment */}
            {activeTab === 'payment' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Stripe Public Key</label>
                  <input 
                    type="text" 
                    value={settings.stripePublicKey} 
                    placeholder="pk_test_..."
                    onChange={e => handleChange('stripePublicKey', e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black font-mono" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Default Currency</label>
                  <select 
                    value={settings.currency} 
                    onChange={e => handleChange('currency', e.target.value)}
                    className="w-full max-w-xs px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="AED">AED - UAE Dirham</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="SAR">SAR - Saudi Riyal</option>
                  </select>
                </div>
              </div>
            )}

            {/* تبويب SMTP / Email */}
            {activeTab === 'email' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">SMTP Host</label>
                  <input 
                    type="text" 
                    value={settings.smtpHost} 
                    onChange={e => handleChange('smtpHost', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">SMTP Port</label>
                  <input 
                    type="text" 
                    value={settings.smtpPort} 
                    onChange={e => handleChange('smtpPort', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black" 
                  />
                </div>
              </div>
            )}

            {/* تبويب Localization */}
            {activeTab === 'localization' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Default Language</label>
                  <select 
                    value={settings.defaultLanguage} 
                    onChange={e => handleChange('defaultLanguage', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="ar">العربية (Arabic)</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-1.5">Timezone</label>
                  <select 
                    value={settings.timezone} 
                    onChange={e => handleChange('timezone', e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none"
                  >
                    <option value="Asia/Dubai">Asia/Dubai (GMT+4)</option>
                    <option value="Asia/Riyadh">Asia/Riyadh (GMT+3)</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* زر الحفظ الموحد لجميع الأقسام */}
            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> جاري الحفظ...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Save Changes
                  </>
                )}
              </button>
            </div>

         </div>
      </div>
    </div>
  );
}
