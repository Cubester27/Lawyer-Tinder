import React from 'react';

export function Logo({ size = 32, className = '' }) {
  return (
    <div className={`d-inline-flex align-items-center justify-content-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="rounded-3 shadow-sm"
      >
        <defs>
          {/* Main Gradient: Tinder Warm Flame to Legal Sapphire */}
          <linearGradient id="tinderFlameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B4A" />
            <stop offset="50%" stopColor="#FF2A5F" />
            <stop offset="100%" stopColor="#7928CA" />
          </linearGradient>
          
          {/* Gold Balance Scale Accent */}
          <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE259" />
            <stop offset="100%" stopColor="#FFA751" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Tile */}
        <rect width="48" height="48" rx="12" fill="#121826" />
        <rect width="48" height="48" rx="12" fill="url(#tinderFlameGrad)" opacity="0.15" />

        {/* Outer Match / Flame Contour */}
        <path 
          d="M24 6C24 6 15 16 15 25C15 30 18.8 35 24 35C29.2 35 33 30 33 25C33 16 24 6 24 6Z" 
          fill="url(#tinderFlameGrad)" 
        />

        {/* Inner Scales of Justice */}
        {/* Pillar */}
        <line x1="24" y1="14" x2="24" y2="30" stroke="url(#goldAccent)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Base */}
        <line x1="19" y1="30" x2="29" y2="30" stroke="url(#goldAccent)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Beam */}
        <line x1="16" y1="18" x2="32" y2="18" stroke="url(#goldAccent)" strokeWidth="2" strokeLinecap="round" />
        {/* Center Top Knob */}
        <circle cx="24" cy="14" r="2" fill="#FFE259" />
        
        {/* Left Dish */}
        <path d="M16 18 L13 23 H19 L16 18 Z" fill="url(#goldAccent)" opacity="0.9" />
        {/* Right Dish */}
        <path d="M32 18 L29 23 H35 L32 18 Z" fill="url(#goldAccent)" opacity="0.9" />
      </svg>
    </div>
  );
}

export default Logo;
