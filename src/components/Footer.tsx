import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, ShieldCheck } from 'lucide-react';

export default function Footer() {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  return (
    <footer className="w-full bg-[#111111] text-white py-12 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col items-center md:items-start gap-2">
          <h2 className="text-2xl font-serif font-bold tracking-tight text-white mb-2">jaknooma</h2>
          <p className="text-sm text-gray-400 text-center md:text-left max-w-md leading-relaxed">
            {isAr 
              ? 'منصة جكنومة تجمع لك أفضل العروض والمنتجات عبر نظام التسوق بالعمولة (Affiliate) من أشهر المتاجر العالمية والمحلية، بالإضافة إلى الإعلانات المباشرة لتجربة تسوق ذكية.'
              : 'Jaknooma aggregates the best products and deals through affiliate marketing from top global and local stores, alongside direct advertisements.'}
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
      
      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/10 text-center text-xs text-gray-500 space-y-2">
        <p className="max-w-2xl mx-auto text-gray-400">
          {isAr 
            ? 'ملاحظة: نحن لا نبيع المنتجات مباشرة، بل نوجهك لأفضل العروض من المتاجر المعتمدة. قد تحصل المنصة على عمولة مقابل عمليات الشراء التي تتم عبر روابطنا دون أي تكلفة إضافية عليك.'
            : 'Note: We do not sell products directly but direct you to verified stores. We may earn a commission on purchases made through our links at no extra cost to you.'}
        </p>
        <p className="pt-2">&copy; {new Date().getFullYear()} Jaknooma. {t('All rights reserved.')}</p>
      </div>
    </footer>
  );
}
