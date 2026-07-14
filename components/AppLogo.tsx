import React from 'react';

const logoUrl = "https://i.ibb.co/hRS6QzKH/Poke-House-Logo.png";

interface AppLogoProps {
  className?: string;
  variant?: 'mobile' | 'desktop' | 'default';
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = '', variant = 'default' }) => {
  // Determine standard styles to maintain original proportions and safe spacing
  let baseClass = 'object-contain select-none';
  if (variant === 'mobile') {
    baseClass += ' h-9 w-auto';
  } else if (variant === 'desktop') {
    baseClass += ' max-h-16 w-auto';
  } else {
    baseClass += ' max-h-18 w-auto';
  }

  return (
    <img
      src={logoUrl}
      alt="Poke House Logo"
      className={`${baseClass} ${className}`}
      referrerPolicy="no-referrer"
    />
  );
};
