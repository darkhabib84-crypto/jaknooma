import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import { useUI } from '../contexts/UIContext';
import { isRtlLanguage } from '../lib/i18n';

export default function Breadcrumbs() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useUI();
  
  const categoryFilter = searchParams.get('category');
  const queryFilter = searchParams.get('q') || searchQuery;
  const isRtl = isRtlLanguage(i18n.language);

  if (location.pathname !== '/') return null;

  return (
    <nav dir={isRtl ? 'rtl' : 'ltr'} className="w-full px-4 sm:px-6 pt-3 pb-1 text-xs text-gray-500 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <Link 
        to="/" 
        onClick={() => {
          setSearchQuery('');
        }}
        className="flex items-center gap-1 hover:text-black transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="font-medium">{t('Home')}</span>
      </Link>
      
      {categoryFilter && (
        <>
          <ChevronRight className={`w-3 h-3 text-gray-400 flex-shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
          <span className="font-medium text-black">
            {t(categoryFilter)}
          </span>
        </>
      )}

      {queryFilter && !categoryFilter && (
        <>
          <ChevronRight className={`w-3 h-3 text-gray-400 flex-shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
          <span className="font-medium text-black">
            {t('Search Results for')} "{queryFilter}"
          </span>
        </>
      )}

      {queryFilter && categoryFilter && (
        <>
          <ChevronRight className={`w-3 h-3 text-gray-400 flex-shrink-0 ${isRtl ? 'rotate-180' : ''}`} />
          <span className="font-medium text-black">
            "{queryFilter}"
          </span>
        </>
      )}
    </nav>
  );
}
