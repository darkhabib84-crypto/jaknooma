import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-[#111111] text-white py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <h2 className="text-2xl font-serif font-bold tracking-tight text-white mb-2">{t('jaknooma')}</h2>
          <p className="text-sm text-gray-400 text-center md:text-left max-w-sm">
            {t('Elevate Your Living Space')} - {t('All our products are sourced from zero-waste artisan studios')}
          </p>
        </div>

        <div className="flex gap-6 items-center flex-wrap justify-center">
          <a href="mailto:jaknooma@gmail.com" className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors text-sm font-medium">
            <Mail className="w-4 h-4" />
            {t('Contact Us')}
          </a>
          <Link to="/terms" className="flex items-center gap-2 hover:text-[#D4AF37] transition-colors text-sm font-medium">
            <ShieldCheck className="w-4 h-4" />
            {t('Terms & Conditions')}
          </Link>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Jaknooma. {t('All rights reserved.')}
      </div>
    </footer>
  );
}
