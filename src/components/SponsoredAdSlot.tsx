import { Megaphone, Sparkles } from 'lucide-react';

interface SponsoredAdSlotProps {
  placement?: 'hero' | 'grid';
  adData?: {
    title?: string;
    image?: string;
    url?: string;
  } | null;
  onBookClick?: () => void;
}

export default function SponsoredAdSlot({ placement = 'hero', adData, onBookClick }: SponsoredAdSlotProps) {
  // إذا كان هناك إعلان جاهز ومرفوع بقاعدة البيانات يتم عرضه مباشرة
  if (adData && adData.image) {
    return (
      <div className="w-full overflow-hidden rounded-2xl shadow-sm border border-gray-100 bg-white">
        <a 
          href={adData.url || '#'} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="block relative group"
        >
          <img 
            src={adData.image} 
            alt={adData.title || 'Sponsored Ad'} 
            className="w-full h-auto object-cover max-h-[160px] sm:max-h-[220px] group-hover:scale-[1.01] transition-transform duration-300" 
          />
          <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
            إعلان ممول
          </span>
        </a>
      </div>
    );
  }

  // المساحة الافتراضية (احجز إعلانك هنا - تشجيع المعلنين)
  return (
    <div className={`w-full bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 rounded-2xl p-4 sm:p-5 flex items-center justify-between gap-4 ${placement === 'hero' ? 'my-2' : 'my-1'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600 shrink-0">
          <Megaphone size={20} />
        </div>
        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-1.5 truncate">
            <span>مساحة إعلانية مميزة</span>
            <Sparkles size={14} className="text-amber-500 animate-pulse shrink-0" />
          </h4>
          <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate">
            اعرض منتجك أو متجري في واجهة منصة Jaknooma أمام آلاف المتسوقين.
          </p>
        </div>
      </div>
      <button
        onClick={onBookClick}
        className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] sm:text-xs rounded-xl shadow-sm transition-all shrink-0 active:scale-95 cursor-pointer whitespace-nowrap"
      >
        احجز مساحتك
      </button>
    </div>
  );
}
