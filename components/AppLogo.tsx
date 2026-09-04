import React, { useState } from 'react';
import localLogo from '../src/assets/brand/poke-house-logo.png';

const remoteLogoUrl = "https://i.ibb.co/hRS6QzKH/Poke-House-Logo.png";

interface AppLogoProps {
  className?: string;
  variant?: 'mobile' | 'desktop' | 'default';
}

export const AppLogo: React.FC<AppLogoProps> = ({ className = '', variant = 'default' }) => {
  const [src, setSrc] = useState<string>(localLogo || remoteLogoUrl);

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
      src={src}
      alt="Poke House Logo"
      className={`${baseClass} ${className}`}
      onError={() => {
        if (src !== remoteLogoUrl) {
          setSrc(remoteLogoUrl);
        }
      }}
      referrerPolicy="no-referrer"
    />
  );
};
