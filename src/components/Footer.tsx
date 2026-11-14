import { useTranslation } from 'react-i18next';
import { Mail, ShieldCheck, Lock, ExternalLink } from 'lucide-react';
import { isRtlLanguage } from '../lib/i18n';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isRtl = isRtlLanguage(i18n.language);
  const langParam = isRtl ? 'ar' : 'en';

  return (
    <footer dir={isRtl ? 'rtl' : 'ltr'} className="w-full bg-[#111111] text-white py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <h2 className="text-2xl font-serif font-bold tracking-tight text-white mb-2">jaknooma</h2>
          <p className="text-sm text-gray-400 text-center md:text-start max-w-md leading-relaxed">
            {t('Footer Description')}
          </p>
        </div>

        <div className="flex gap-6 items-center flex-wrap justify-center">
          <a
            href="mailto:jaknooma@gmail.com"
            className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors text-sm font-medium"
          >
            <Mail className="w-4 h-4 text-[#D4AF37]" />
            <span>{t('Contact Us')}</span>
          </a>
          <a
            href={`/terms.html?lang=${langParam}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors text-sm font-medium"
          >
            <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
            <span>{t('Terms & Conditions')}</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
          <a
            href={`/privacy.html?lang=${langParam}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-[#D4AF37] transition-colors text-sm font-medium"
          >
            <Lock className="w-4 h-4 text-[#D4AF37]" />
            <span>{t('Privacy Policy')}</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-10 pt-6 border-t border-white/10 text-center text-xs text-gray-500 space-y-2">
        <p className="max-w-2xl mx-auto text-gray-400 leading-relaxed">
          {t('Footer Disclaimer')}
        </p>
        <p className="pt-2">&copy; {new Date().getFullYear()} Jaknooma. {t('All rights reserved.')}</p>
      </div>
    </footer>
  );
}