import type { ReactNode } from 'react';

export function ImperialFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative bg-imperial-navy/30 p-6 rounded-sm border border-imperial-gold/40 shadow-imperial">
      <CornerFlourish className="top-2 left-2 -rotate-90" />
      <CornerFlourish className="top-2 right-2" />
      <CornerFlourish className="bottom-2 left-2 rotate-180" />
      <CornerFlourish className="bottom-2 right-2 rotate-90" />
      {children}
    </div>
  );
}

function CornerFlourish({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 32 32" className={`absolute w-8 h-8 text-imperial-gold/80 ${className}`} fill="currentColor" aria-hidden>
      <path d="M2 2 L14 2 L14 4 L4 4 L4 14 L2 14 Z" />
      <circle cx="6" cy="6" r="1.5" />
      <path d="M8 6 Q16 0 22 8" stroke="currentColor" strokeWidth="1" fill="none" />
    </svg>
  );
}
