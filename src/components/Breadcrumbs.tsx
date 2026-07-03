import { useLocation, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

export default function Breadcrumbs() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { searchQuery, setSearchQuery } = useUI();
  
  const categoryFilter = searchParams.get('category');
  const queryFilter = searchParams.get('q') || searchQuery;

  // Don't show breadcrumbs if we are not on the main page
  if (location.pathname !== '/') return null;

  return (
    <nav dir="ltr" className="w-full px-6 pt-4 pb-2 text-xs text-gray-500 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <Link 
        to="/" 
        onClick={() => {
          setSearchQuery('');
        }}
        className="flex items-center gap-1 hover:text-black transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span dir={['ar', 'ur'].includes(i18n.language) ? 'rtl' : 'ltr'} className="font-medium">{t('Home')}</span>
      </Link>
      
      {categoryFilter && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span dir={['ar', 'ur'].includes(i18n.language) ? 'rtl' : 'ltr'} className="font-medium text-black">
            {t(categoryFilter)}
          </span>
        </>
      )}

      {queryFilter && !categoryFilter && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span dir={['ar', 'ur'].includes(i18n.language) ? 'rtl' : 'ltr'} className="font-medium text-black">
            {t('Search Results for')} "{queryFilter}"
          </span>
        </>
      )}

      {queryFilter && categoryFilter && (
        <>
          <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
          <span dir={['ar', 'ur'].includes(i18n.language) ? 'rtl' : 'ltr'} className="font-medium text-black">
            "{queryFilter}"
          </span>
        </>
      )}
    </nav>
  );
}
