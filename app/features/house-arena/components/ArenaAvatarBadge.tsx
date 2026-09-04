import React from 'react';
import { getAvatarDefinition } from '../avatar/arenaAvatarRegistry';

interface ArenaAvatarBadgeProps {
  assetKey: string | null | undefined;
  displayName?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'podium' | 'champion';
  isCurrentParticipant?: boolean;
  isActive?: boolean;
}

export const ArenaAvatarBadge: React.FC<ArenaAvatarBadgeProps> = ({
  assetKey,
  displayName,
  size = 'md',
  isCurrentParticipant = false,
  isActive = true
}) => {
  const avatarDef = getAvatarDefinition(assetKey);
  const { Component, label, bgClass } = avatarDef;

  // Map size variants to specific tailwind class dimensions
  const sizeClasses = {
    xs: 'w-6 h-6 border-2', // 24px
    sm: 'w-10 h-10 border-2', // 40px
    md: 'w-12 h-12 border-[3px]', // 48px
    lg: 'w-14 h-14 border-[3px]', // 56px
    xl: 'w-16 h-16 border-4', // 64px
    podium: 'w-16 h-16 border-4 md:w-20 md:h-20', // Custom podium scale
    champion: 'w-24 h-24 border-4 md:w-28 md:h-28' // Large champion focus
  };

  // Border and ring styles based on participant state
  // If current participant: highlight with Pink Mochi (#FF83AF) or Butter Yellow (#F3E39F)
  const statusClasses = isCurrentParticipant
    ? 'border-brand-mochi ring-4 ring-brand-mochi/25 shadow-[0_0_8px_rgba(255,131,175,0.4)]'
    : 'border-brand-charcoal';

  // Opacity and grayscale filter for inactive/offline competitors
  const activeClasses = !isActive ? 'opacity-50 grayscale contrast-75' : '';

  // Accessible descriptive title/label
  const accessibleLabel = displayName 
    ? `${displayName}'s avatar: ${label}` 
    : `Avatar: ${label}`;

  return (
    <div
      role="img"
      aria-label={accessibleLabel}
      className={`rounded-full flex items-center justify-center shrink-0 overflow-hidden relative select-none transition-all duration-300 ${bgClass} ${sizeClasses[size]} ${statusClasses} ${activeClasses}`}
    >
      <Component className="w-full h-full object-contain" />
    </div>
  );
};

export default ArenaAvatarBadge;
