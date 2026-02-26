import React from 'react';

export const Logo: React.FC = () => {
  return (
    <div className="flex items-center gap-3 select-none">
      {/* Network Node Icon Recreation */}
      <div className="relative w-10 h-10 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow" style={{ animationDuration: '20s' }}>
          <defs>
             <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
               <stop offset="0%" style={{ stopColor: '#34d399', stopOpacity: 1 }} />
               <stop offset="100%" style={{ stopColor: '#10b981', stopOpacity: 1 }} />
             </linearGradient>
          </defs>
          {/* Connections */}
          <path d="M20 50 L40 30 L70 20 L80 50 L60 80 L30 70 Z" fill="none" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.4" />
          <path d="M20 50 L50 50 L80 50" fill="none" stroke="#34d399" strokeWidth="1" strokeOpacity="0.3" />
          <path d="M40 30 L60 80" fill="none" stroke="#34d399" strokeWidth="1" strokeOpacity="0.3" />
          
          {/* Nodes */}
          <circle cx="20" cy="50" r="3" fill="#34d399" />
          <circle cx="40" cy="30" r="3" fill="#34d399" />
          <circle cx="70" cy="20" r="3" fill="#34d399" />
          <circle cx="80" cy="50" r="3" fill="#34d399" />
          <circle cx="60" cy="80" r="3" fill="#34d399" />
          <circle cx="30" cy="70" r="3" fill="#34d399" />
          <circle cx="50" cy="50" r="4" fill="#10b981" />
        </svg>
      </div>
      
      <div className="flex flex-col justify-center">
        <span className="text-xl font-bold text-white tracking-wide leading-none font-[Inter]">
          ONEBRIDGE
        </span>
        <span className="text-[10px] font-semibold text-emerald-400 tracking-[0.25em] leading-none mt-1.5 uppercase">
          Stalwart
        </span>
      </div>
    </div>
  );
};