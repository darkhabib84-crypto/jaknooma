import { Link } from 'react-router-dom';
import { Tag } from 'lucide-react';

interface LogoProps {
  onClick?: () => void;
  className?: string;
  isDark?: boolean;
}

// قمت بإضافة export هنا لحل مشكلة الـ build
export function LogoIcon({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
        <path
          d="M30,75 C5,60 10,25 40,25 C70,25 85,60 55,80 C30,95 20,70 35,50"
          stroke="#D4AF37"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M25,50 L40,40 L45,55 Z" fill="#D4AF37" transform="rotate(30 35 50)" />
      </svg>
    </div>
  );
}

export function Logo({ onClick, className = '', isDark = false }: LogoProps) {
  return (
    <Link 
      to="/" 
      onClick={onClick} 
      className={`flex items-center gap-3 hover:opacity-90 transition-all group shrink-0 ${className}`} 
      dir="ltr"
    >
      <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md group-hover:scale-105 transition-transform duration-300">
          <path
            d="M30,75 C5,60 10,25 40,25 C70,25 85,60 55,80 C30,95 20,70 35,50"
            stroke="#D4AF37"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M25,50 L40,40 L45,55 Z" fill="#D4AF37" transform="rotate(30 35 50)" />
        </svg>
        
        <div className="absolute -top-1 -right-1 z-10 bg-[#D4AF37] rounded-md shadow-lg p-0.5 border border-white/20">
          <Tag className="w-3 h-3 text-white" fill="currentColor" strokeWidth={1.5} />
        </div>
      </div>

      <span className={`font-sans font-black text-xl md:text-2xl tracking-tighter uppercase text-[#D4AF37] mt-1 drop-shadow-sm`}>
        JAKNOOMA
      </span>
    </Link>
  );
}

