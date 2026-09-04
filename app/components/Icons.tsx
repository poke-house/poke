import React from 'react';

interface IconProps {
    size?: number;
    className?: string;
}

export const IconHome = ({ size = 20, className = "" }: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>);
export const IconArrowLeft = ({ size = 20, className = "" }: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>);
export const IconArrowRight = ({ size = 20, className = "" }: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>);
export const IconCheck = ({ size = 24, className = "" }: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>);
export const IconRotate = ({ size = 20, className = "" }: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>);
export const IconList = ({ size = 18, className = "" }: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>);
export const IconX = ({ size = 20, className = "" }: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>);
export const IconClock = ({ size = 20, className = "" }: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);
export const IconTrophy = ({ size = 20, className = "" }: IconProps) => (<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>);

// Poke House Design System Solid Icons
export const IconBowl = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M2 12c0 5.52 4.48 10 10 10s10-4.48 10-10H2zm10-7a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3zm-6 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm14 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
  </svg>
);

export const IconUniversity = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2 1 7l11 5 9-4.09V17h2V7L12 2zM4.14 11.81l-1.12-.37c-.38 1.48.07 3.01 1.22 4.14C5.61 16.92 7.55 18 12 18s6.39-1.08 7.76-2.42c1.15-1.13 1.6-2.66 1.22-4.14l-1.12.37c.28 1.1-.06 2.21-.92 3.05C17.72 16.03 16.05 17 12 17s-5.72-.97-6.94-2.14c-.86-.84-1.2-1.95-.92-3.05z" />
  </svg>
);

export const IconFish = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.42 14.5c-.83 0-1.58-.35-2.13-.93L8.41 12.5H6.5v-1h1.91l2.88-3.07c.55-.58 1.3-1.43 2.13-1.43 1.93 0 3.5 1.57 3.5 3.5s-1.57 3.5-3.5 3.5zM22 12l-3-3v6l3-3z" />
  </svg>
);

export const IconLeaf = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17 2H7c-2.76 0-5 2.24-5 5v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5zm-1.65 13.65c-.85.85-2.1 1.1-3.1.8l-1.2 1.2a1 1 0 1 1-1.41-1.41l1.2-1.2c-.3-1 .05-2.25.8-3.1 1.17-1.17 3.07-1.17 4.24 0 1.17 1.17 1.17 3.07-.53 4.71z" />
  </svg>
);

export const IconCup = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M4 19c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2L18 6H6L4 19zm11-15 1-2h2v2h-3zm-9 0h6V2H6v2z" />
  </svg>
);

export const IconBolt = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11 21h-1l1-7H5l7-11h1l-1 7h6l-7 11z" />
  </svg>
);

export const IconBrain = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16H11v-2h2v2zm1.07-7.75-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z" />
  </svg>
);

export const IconInfo = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
  </svg>
);

export const IconGlobe = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.53c-.26-.81-1-1.4-1.9-1.4h-1v-3c0-.55-.45-1-1-1h-6v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.4z" />
  </svg>
);

export const IconSparkles = ({ size = 20, className = "" }: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="m11.5 7.5 1.5-3 1.5 3 3 1.5-3 1.5-3 3-1.5-3-3-1.5zm-6 6.5 1-2 1 2 2 1-2 1-1 2-1-2-2-1zm12.5.5 1-2 1 2 2 1-2 1-1 2-1-2-2-1z" />
  </svg>
);
