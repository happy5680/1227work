
import React from 'react';

export const SUBJECTS = [
  '國文', '英文', '數學', '社會', '自然', 
  '藝術', '體育', '科技', '綜合活動'
];

export const StartIcon = () => (
  <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-lg">
    <circle cx="30" cy="30" r="26" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="animate-rotate text-amber-500/50" />
    <circle cx="30" cy="30" r="22" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-amber-500/30" />
    <path d="M24 18L42 30L24 42V18Z" fill="url(#amber-grad)" stroke="#f59e0b" strokeWidth="1" />
    <defs>
      <linearGradient id="amber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
  </svg>
);

export const StopIcon = () => (
  <svg width="60" height="60" viewBox="0 0 60 60" className="drop-shadow-lg">
    <rect x="8" y="8" width="44" height="44" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 2" className="text-red-900/40" />
    <rect x="18" y="18" width="24" height="24" fill="url(#rust-grad)" stroke="#991b1b" strokeWidth="2" rx="2" />
    <path d="M12 12L20 12M12 12L12 20" stroke="#991b1b" strokeWidth="2" />
    <path d="M48 48L40 48M48 48L48 40" stroke="#991b1b" strokeWidth="2" />
    <defs>
      <linearGradient id="rust-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b91c1c" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </linearGradient>
    </defs>
  </svg>
);

export const KlimtCircle = ({ className }: { className?: string }) => (
  <div className={`absolute pointer-events-none border border-amber-500/20 rounded-full ${className}`} />
);
