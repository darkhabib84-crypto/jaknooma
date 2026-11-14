import React, { useState, useEffect } from 'react';
import { Globe, Save, Check, Plus, RotateCcw, Search, ArrowLeftRight } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTranslation } from 'react-i18next';
import { isRtlLanguage } from '../../lib/i18n';
import toast from 'react-hot-toast';

export interface LanguageOption {
  code: string;
  nameEn: string;
  nameAr: string;
  nativeLabel: string;
  dir: 'rtl' | 'ltr';
  enabled: boolean;
}

const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: 'ar', nameEn: 'Arabic', nameAr: 'العربية', nativeLabel: 'العربية', dir: 'rtl', enabled: true },
  { code: 'en', nameEn: 'English', nameAr: 'الإنجليزية', nativeLabel: 'English', dir: 'ltr', enabled: true },
  { code: 'zh', nameEn: 'Chinese', nameAr: 'الصينية', nativeLabel: '中文', dir: 'ltr', enabled: true },
  { code: 'es', nameEn: 'Spanish', nameAr: 'الإسبانية', nativeLabel: 'Español', dir: 'ltr', enabled: true },
  { code: 'fr', nameEn: 'French', nameAr: 'الفرنسية', nativeLabel: 'Français', dir: 'ltr', enabled: true },
  { code: 'hi', nameEn: 'Hindi', nameAr: 'الهندية', nativeLabel: 'हिन्दी', dir: 'ltr', enabled: true },
  { code: 'ur', nameEn: 'Urdu', nameAr: 'الأردية', nativeLabel: 'اردو', dir: 'rtl', enabled: true },
];

interface EditableTranslationRow {
  key: string;
  ar: string;
  en: string;
}

const CORE_TRANSLATION_ROWS: EditableTranslationRow[] = [
  { key: 'All Categories', ar: 'جميع الفئات', en: 'All Categories' },
  { key: 'Categories', ar: 'الفئات', en: 'Categories' },
  { key: 'Shop by Category', ar: 'تسوق حسب الفئة', en: 'Shop by Category' },
  { key: 'Search', ar: 'بحث', en: 'Search' },
  { key: 'Search premium products...', ar: 'ابحث عن منتجات وعروض مميزة...', en: 'Search premium products...' },
  { key: 'Welcome', ar: 'مرحباً', en: 'Welcome' },
  { key: 'Seller:', ar: 'البائع:', en: 'Seller:' },
  { key: 'Store:', ar: 'المتجر:', en: 'Store:' },
  { key: 'Loc:', ar: 'الموقع:', en: 'Loc:' },
  { key: 'Posted:', ar: 'نُشر في:', en: 'Posted:' },
  { key: 'Local Listing', ar: 'إعلان محلي', en: 'Local Listing' },
  { key: 'Buy from', ar: 'شراء من', en: 'Buy from' },
  { key: 'Your Cart', ar: 'عربة التسوق الذكية', en: 'Your Cart' },
  { key: 'Open All Product Links', ar: 'فتح جميع روابط المنتجات', en: 'Open All Product Links' },
  { key: 'Call Seller', ar: 'اتصال بالبائع', en: 'Call Seller' },
  { key: 'WhatsApp', ar: 'واتساب', en: 'WhatsApp' },
  { key: 'Contact Us', ar: 'تواصل معنا', en: 'Contact Us' },
  { key: 'Terms & Conditions', ar: 'الشروط والأحكام', en: 'Terms & Conditions' },
  { key: 'Privacy Policy', ar: 'سياسة الخصوصية', en: 'Privacy Policy' },
  { key: 'All rights reserved.', ar: 'جميع الحقوق محفوظة.', en: 'All rights reserved.' },
];

export default function AdminLanguages() {
  const { i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);

  const [languages, setLanguages] = useState<LanguageOption[]>(DEFAULT_LANGUAGES);
  const [defaultLang, setDefaultLang] = useState<string>('ar');
  const [directionMode, setDirectionMode] = useState<'auto' | 'rtl' | 'ltr'>('auto');
  const [translations, setTranslations] = useState<EditableTranslationRow[]>(CORE_TRANSLATION_ROWS);
  const [searchQuery, setSearchQuery] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newAr, setNewAr] = useState('');
  const [newEn, setNewEn] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const localLangs = window.localStorage.getItem('jaknooma_languages_config');
        if (localLangs) {
          const parsed = JSON.parse(localLangs);
          if (Array.isArray(parsed.languages)) setLanguages(parsed.languages);
          if (parsed.defaultLang) setDefaultLang(parsed.defaultLang);
          if (parsed.directionMode) setDirectionMode(parsed.directionMode);
        }

        const customTrans = window.localStorage.getItem('jaknooma_custom_translations');
        if (customTrans) {
          const parsed = JSON.parse(customTrans);
          if (parsed.ar || parsed.en) {
            setTranslations((prev) =>
              prev.map((row) => ({
                key: row.key,
                ar: parsed.ar?.[row.key] ?? row.ar,
                en: parsed.en?.[row.key] ?? row.en,
              }))
            );
          }
        }
      } catch {
        // ignore localStorage read errors
      }

      try {
        const snap = await getDoc(doc(db, 'system_settings', 'languages'));
        if (snap.exists()) {
          const data = snap.data();
          if (Array.isArray(data.languages)) setLanguages(data.languages);
          if (data.defaultLang) setDefaultLang(data.defaultLang);
          if (data.directionMode) setDirectionMode(data.directionMode);
          if (Array.isArray(data.translationRows) && data.translationRows.length > 0) {
            setTranslations(data.translationRows);
          }
        }
      } catch {
        // Offline or permissions fallback
      }
    };
    loadConfig();
  }, []);

  const toggleLanguageEnabled = (code: string) => {
    if (code === defaultLang) {
      toast.error(isRtl ? 'لا يمكن تعطيل اللغة الافتراضية للمنصة' : 'Cannot disable the default platform language');
      return;
    }
    setLanguages((prev) =>
      prev.map((l) => (l.code === code ? { ...l, enabled: !l.enabled } : l))
    );
  };

  const handleTranslationChange = (key: string, field: 'ar' | 'en', value: string) => {
    setTranslations((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  };

  const handleAddKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newAr.trim() || !newEn.trim()) return;
    if (translations.some((r) => r.key === newKey.trim())) {
      toast.error(isRtl ? 'هذا المفتاح موجود مسبقاً' : 'Translation key already exists');
      return;
    }
    setTranslations((prev) => [
      { key: newKey.trim(), ar: newAr.trim(), en: newEn.trim() },
      ...prev,
    ]);
    setNewKey('');
    setNewAr('');
    setNewEn('');
    toast.success(isRtl ? 'تمت إضافة النص لقائمة الترجمة' : 'Added translation key');
  };

  const handleResetDefaults = () => {
    setLanguages(DEFAULT_LANGUAGES);
    setDefaultLang('ar');
    setDirectionMode('auto');
    setTranslations(CORE_TRANSLATION_ROWS);
    window.localStorage.removeItem('jaknooma_custom_translations');
    window.localStorage.removeItem('jaknooma_languages_config');
    toast.success(isRtl ? 'تمت استعادة الإعدادات الافتراضية للغات' : 'Restored default language settings');
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const arBundle: Record<string, string> = {};
      const enBundle: Record<string, string> = {};
      translations.forEach((row) => {
        arBundle[row.key] = row.ar;
        enBundle[row.key] = row.en;
      });

      // Apply live to i18next
      i18n.addResourceBundle('ar', 'translation', arBundle, true, true);
      i18n.addResourceBundle('en', 'translation', enBundle, true, true);

      // Apply direction and default language if changed
      i18n.changeLanguage(defaultLang);
      if (directionMode === 'rtl' || directionMode === 'ltr') {
        document.documentElement.dir = directionMode;
      } else {
        document.documentElement.dir = isRtlLanguage(defaultLang) ? 'rtl' : 'ltr';
      }

      // Persist in localStorage
      window.localStorage.setItem(
        'jaknooma_custom_translations',
        JSON.stringify({ ar: arBundle, en: enBundle })
      );
      window.localStorage.setItem(
        'jaknooma_languages_config',
        JSON.stringify({ languages, defaultLang, directionMode })
      );

      // Save to Firestore
      try {
        await setDoc(
          doc(db, 'system_settings', 'languages'),
          {
            languages,
            defaultLang,
            directionMode,
            translationRows: translations,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch {
        // local storage already saved
      }

      toast.success(
        isRtl
          ? 'تم حفظ إعدادات اللغات وتحديث نصوص الترجمة بنجاح!'
          : 'Language settings & translations saved successfully!'
      );
    } catch (error) {
      console.error('Error saving languages:', error);
      toast.error(isRtl ? 'حدث خطأ أثناء الحفظ' : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const filteredTranslations = translations.filter(
    (row) =>
      row.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.ar.toLowerCase().includes(searchQuery.toLowerCase()) ||
      row.en.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div dir={isRtl ? 'rtl' : 'ltr'} className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black flex items-center gap-2.5">
            <Globe className="w-7 h-7 text-[#D4AF37]" />
            <span>{isRtl ? 'إدارة اللغات والترجمة (Languages & i18n)' : 'Languages & Translation Manager'}</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isRtl
              ? 'تحكم في اللغات المتاحة على المنصة، اللغة الافتراضية، اتجاه العرض (RTL/LTR)، وعدّل نصوص الترجمة الأساسية مباشرة.'
              : 'Manage active storefront languages, default language, RTL/LTR layout direction, and edit core translation strings.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isRtl ? 'استعادة الافتراضي' : 'Reset'}</span>
          </button>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-black text-white hover:bg-gray-800 text-xs sm:text-sm font-bold flex items-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-[#D4AF37]" />
            <span>{saving ? (isRtl ? 'جاري الحفظ...' : 'Saving...') : isRtl ? 'حفظ التغييرات' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Section 1: Default Language & Direction */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#B8892B] flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900">
                {isRtl ? 'اللغة الافتراضية للمنصة' : 'Default Platform Language'}
              </h2>
              <p className="text-xs text-gray-500">
                {isRtl ? 'اللغة التي يفتح بها الموقع وتطبق حالياً' : 'Primary language used across the platform'}
              </p>
            </div>
          </div>

          <select
            value={defaultLang}
            onChange={(e) => {
              const code = e.target.value;
              setDefaultLang(code);
              setLanguages((prev) =>
                prev.map((l) => (l.code === code ? { ...l, enabled: true } : l))
              );
            }}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
          >
            {languages.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeLabel} — {isRtl ? l.nameAr : l.nameEn} ({l.code.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ArrowLeftRight className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-gray-900">
                {isRtl ? 'اتجاه عرض الواجهة (RTL / LTR)' : 'Layout Direction (RTL / LTR)'}
              </h2>
              <p className="text-xs text-gray-500">
                {isRtl ? 'يتحول تلقائياً لليمين مع العربية والأردية' : 'Automatically switches to RTL for Arabic & Urdu'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {[
              { id: 'auto', labelAr: 'تلقائي حسب اللغة', labelEn: 'Auto (By Lang)' },
              { id: 'rtl', labelAr: 'من اليمين (RTL)', labelEn: 'Force RTL' },
              { id: 'ltr', labelAr: 'من اليسار (LTR)', labelEn: 'Force LTR' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDirectionMode(opt.id as any)}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  directionMode === opt.id
                    ? 'bg-black text-white border-black shadow-xs'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
              >
                {isRtl ? opt.labelAr : opt.labelEn}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Section 2: Enable / Disable Languages */}
      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {isRtl ? 'تفعيل أو تعطيل اللغات المتاحة في الموقع' : 'Available Storefront Languages'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {isRtl
              ? 'اللغات المفعلة ستظهر للمتسوقين في قائمة اختيار اللغات أعلى الموقع.'
              : 'Enabled languages appear in the top header language selector.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {languages.map((lang) => (
            <div
              key={lang.code}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                lang.enabled
                  ? 'bg-white border-gray-200 shadow-2xs'
                  : 'bg-gray-50/70 border-gray-100 opacity-60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-900 font-bold text-xs uppercase flex items-center justify-center border border-gray-200">
                  {lang.code}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">{lang.nativeLabel}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                      {lang.dir}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{isRtl ? lang.nameAr : lang.nameEn}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toggleLanguageEnabled(lang.code)}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  lang.enabled ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
                aria-label={`Toggle ${lang.nameEn}`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    lang.enabled
                      ? isRtl
                        ? 'left-1'
                        : 'right-1'
                      : isRtl
                      ? 'right-1'
                      : 'left-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Section 3: Direct Translation Editor */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-gray-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isRtl ? 'محرر نصوص الترجمة الفوري (العربية / الإنجليزية)' : 'Live Translation String Editor (AR / EN)'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {isRtl
                  ? 'عدّل أي نص أدناه واضغط على "حفظ التغييرات" لتطبيقه فوراً على جميع صفحات المنصة.'
                  : 'Edit any translation string below and click Save Changes to update the storefront immediately.'}
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search
                className={`w-4 h-4 absolute ${
                  isRtl ? 'right-3.5' : 'left-3.5'
                } top-1/2 -translate-y-1/2 text-gray-400`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRtl ? 'ابحث في نصوص الترجمة...' : 'Search translation strings...'}
                className={`w-full ${
                  isRtl ? 'pr-9 pl-4' : 'pl-9 pr-4'
                } py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-black focus:bg-white`}
              />
            </div>
          </div>

          {/* Add New Custom Key Form */}
          <form onSubmit={handleAddKey} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 pt-2">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder={isRtl ? 'المفتاح (Key) مثال: Buy Now' : 'Key (e.g. Buy Now)'}
              className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
              dir="ltr"
            />
            <input
              type="text"
              value={newAr}
              onChange={(e) => setNewAr(e.target.value)}
              placeholder={isRtl ? 'الترجمة بالعربية' : 'Arabic Translation'}
              className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
              dir="rtl"
            />
            <input
              type="text"
              value={newEn}
              onChange={(e) => setNewEn(e.target.value)}
              placeholder={isRtl ? 'الترجمة بالإنجليزية' : 'English Translation'}
              className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:bg-white"
              dir="ltr"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'إضافة نص جديد' : 'Add String'}</span>
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                <th className="p-4 font-semibold text-start w-1/4">{isRtl ? 'المفتاح البرمجي (Key)' : 'Key'}</th>
                <th className="p-4 font-semibold text-start w-3/8">{isRtl ? 'النص بالعربية (العربية)' : 'Arabic Text (العربية)'}</th>
                <th className="p-4 font-semibold text-start w-3/8">{isRtl ? 'النص بالإنجليزية (English)' : 'English Text'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTranslations.map((row) => (
                <tr key={row.key} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3.5 font-mono text-xs text-gray-600" dir="ltr">
                    {row.key}
                  </td>
                  <td className="p-3.5">
                    <input
                      type="text"
                      dir="rtl"
                      value={row.ar}
                      onChange={(e) => handleTranslationChange(row.key, 'ar', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </td>
                  <td className="p-3.5">
                    <input
                      type="text"
                      dir="ltr"
                      value={row.en}
                      onChange={(e) => handleTranslationChange(row.key, 'en', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 focus:bg-white border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
