import React, { useRef } from 'react';
import { useStores } from '../hooks/useStores';
import { useSearchParams } from 'react-router-dom';
import { Store, ChevronLeft, ChevronRight } from 'lucide-react';
import { LogoIcon } from './Logo';

export default function StoreFilter() {
  const { stores, loadingStores } = useStores();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  
  const currentStores = searchParams.getAll('store');

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const selectStore = (storeId: string) => {
    if (storeId === '') {
      searchParams.delete('store');
    } else {
      const isSelected = currentStores.includes(storeId);
      searchParams.delete('store'); // Clear existing
      
      const newStores = isSelected 
        ? currentStores.filter(id => id !== storeId)
        : [...currentStores, storeId];
        
      newStores.forEach(id => searchParams.append('store', id));
    }
    setSearchParams(searchParams);
  };

  if (loadingStores) return null;
  if (!stores.length) return null;

  return (
    <div className="w-full bg-white border-b border-gray-100 py-2">
       <div className="max-w-[1400px] mx-auto px-4 md:px-8">
          <div 
           ref={scrollRef}
           className="flex overflow-x-auto gap-4 snap-x snap-mandatory scrollbar-hide no-scrollbar -mx-4 px-4 md:mx-0 md:px-0 py-2"
           style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
         >
            <button
               onClick={() => selectStore('jaknooma')}
               className="shrink-0 flex flex-col items-center justify-center gap-2 group snap-start outline-none"
               title="Jaknooma"
            >
               <div className={`w-14 h-14 flex items-center justify-center rounded-full border transition-all shadow-sm overflow-hidden ${
                 currentStores.includes('jaknooma')
                   ? 'border-[#D4AF37] bg-white shadow-lg shadow-[#D4AF37]/20 scale-105' 
                   : 'border-[#D4AF37]/30 bg-white group-hover:border-[#D4AF37] group-hover:scale-105'
               }`}>
                  <LogoIcon className="w-10 h-10" />
               </div>
               <span className={`text-[10px] font-bold uppercase tracking-widest ${currentStores.includes('jaknooma') ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>Jaknooma</span>
            </button>

            {stores.map(store => {
              const isSelected = currentStores.includes(store.id);
              // Derive a single letter from store name for the unified black/gold icon
              const initial = store.name ? store.name.charAt(0).toUpperCase() : 'S';
              
              return (
              <button
               key={store.id}
               onClick={() => selectStore(store.id)}
               title={store.name}
               className="shrink-0 flex flex-col items-center justify-center gap-2 group snap-start outline-none"
              >
                  <div className={`w-14 h-14 flex items-center justify-center rounded-full border transition-all shadow-sm overflow-hidden ${
                    isSelected 
                      ? 'border-[#D4AF37] bg-white shadow-lg shadow-[#D4AF37]/20 scale-105' 
                      : 'border-[#D4AF37]/30 bg-white group-hover:border-[#D4AF37] group-hover:scale-105'
                  }`}>
                      {store.logo ? (
                         <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                      ) : (
                         <span className={`font-serif text-xl font-bold ${isSelected ? 'text-[#D4AF37]' : 'text-black'}`}>{initial}</span>
                      )}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-black' : 'text-gray-500 group-hover:text-black'}`}>{store.name}</span>
              </button>
              );
            })}
         </div>
       </div>
    </div>
  );
}
