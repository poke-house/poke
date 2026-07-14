import React from 'react';

// ============================================================================
// Poke House Brand Color Palettes
// ============================================================================
// Pink Mochi:     #FF83AF
// Butter Yellow:  #F3E39F
// Olives Green:   #99CA5C
// Icy Water:      #819EC5
// Burgundy Cherry:#561621
// Rose Sorbet:    #FFD7E8
// Tomato Soup:    #F65300
// White Linen:    #F5F6E6
// Charcoal Black: #080D09

// 1. Pink Mochi Ninja
export const MochiNinjaAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#FFD7E8" stroke="#080D09" strokeWidth="4" />
    <rect x="22" y="32" width="56" height="42" rx="21" fill="#FF83AF" stroke="#080D09" strokeWidth="4" />
    <rect x="22" y="42" width="56" height="14" fill="#080D09" />
    <circle cx="38" cy="49" r="4" fill="#F5F6E6" />
    <circle cx="38" cy="49" r="1.5" fill="#561621" />
    <circle cx="62" cy="49" r="4" fill="#F5F6E6" />
    <circle cx="62" cy="49" r="1.5" fill="#561621" />
    <circle cx="28" cy="58" r="3" fill="#FFD7E8" opacity="0.8" />
    <circle cx="72" cy="58" r="3" fill="#FFD7E8" opacity="0.8" />
  </svg>
);

// 2. Salmon Shogun
export const SalmonShogunAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#FFD7E8" stroke="#080D09" strokeWidth="4" />
    <path d="M25 65 C 25 40, 75 40, 75 65 Z" fill="#F65300" stroke="#080D09" strokeWidth="4" />
    <path d="M35 53 Q 50 46 65 53" stroke="#F5F6E6" strokeWidth="4" strokeLinecap="round" />
    <path d="M40 60 Q 50 54 60 60" stroke="#F5F6E6" strokeWidth="3" strokeLinecap="round" />
    <path d="M30 42 C 40 38, 48 45, 50 48 C 52 45, 60 38, 70 42 C 60 50, 55 48, 50 52 C 45 48, 40 50, 30 42 Z" fill="#F3E39F" stroke="#080D09" strokeWidth="3" />
    <circle cx="50" cy="46" r="3" fill="#561621" />
  </svg>
);

// 3. Mango Samurai
export const MangoSamuraiAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#F5F6E6" stroke="#080D09" strokeWidth="4" />
    <path d="M30 65 C 25 45, 45 25, 65 35 C 75 45, 75 60, 60 70 C 45 80, 35 75, 30 65 Z" fill="#F3E39F" stroke="#080D09" strokeWidth="4" />
    <path d="M60 70 C 45 80, 35 75, 30 65" stroke="#F65300" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
    <path d="M26 48 L 72 50" stroke="#561621" strokeWidth="6" strokeLinecap="round" />
    <path d="M72 50 L 80 44" stroke="#561621" strokeWidth="4" strokeLinecap="round" />
    <path d="M72 50 L 78 56" stroke="#561621" strokeWidth="4" strokeLinecap="round" />
    <path d="M38 43 L 44 43" stroke="#080D09" strokeWidth="3" strokeLinecap="round" />
    <path d="M56 44 L 62 44" stroke="#080D09" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 4. Avocado Alchemist
export const AvocadoAlchemistAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#FFD7E8" stroke="#080D09" strokeWidth="4" />
    <path d="M50 20 C 35 20, 28 35, 28 55 C 28 73, 38 80, 50 80 C 62 80, 72 73, 72 55 C 72 35, 65 20, 50 20 Z" fill="#561621" stroke="#080D09" strokeWidth="4" />
    <path d="M50 24 C 38 24, 32 37, 32 55 C 32 70, 40 76, 50 76 C 60 76, 68 70, 68 55 C 68 37, 62 24, 50 24 Z" fill="#99CA5C" stroke="#080D09" strokeWidth="3" />
    <circle cx="50" cy="58" r="14" fill="#F3E39F" stroke="#080D09" strokeWidth="3" />
    <path d="M47 50 L 53 50 M 50 47 L 50 53" stroke="#561621" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="42" cy="38" r="2.5" fill="#080D09" />
    <circle cx="58" cy="38" r="2.5" fill="#080D09" />
  </svg>
);

// 5. Wasabi Warrior
export const WasabiWarriorAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#F5F6E6" stroke="#080D09" strokeWidth="4" />
    <path d="M50 22 Q 44 32 40 38 Q 30 48 30 60 C 30 74, 70 74, 70 60 Q 70 48 60 38 Q 56 32 50 22 Z" fill="#99CA5C" stroke="#080D09" strokeWidth="4" />
    <path d="M50 22 Q 52 35 56 46" stroke="#561621" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    <path d="M36 50 Q 46 54 58 58" stroke="#561621" strokeWidth="3" strokeLinecap="round" opacity="0.4" />
    <rect x="31" y="48" width="38" height="6" rx="2" fill="#F65300" stroke="#080D09" strokeWidth="2" />
    <path d="M40 44 L 45 46" stroke="#080D09" strokeWidth="3" strokeLinecap="round" />
    <path d="M60 44 L 55 46" stroke="#080D09" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

// 6. Wakame Wizard
export const WakameWizardAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#819EC5" stroke="#080D09" strokeWidth="4" />
    <path d="M35 72 Q 42 50 38 35" stroke="#99CA5C" strokeWidth="12" strokeLinecap="round" />
    <path d="M50 75 Q 52 48 48 30" stroke="#99CA5C" strokeWidth="14" strokeLinecap="round" />
    <path d="M65 72 Q 58 55 62 40" stroke="#99CA5C" strokeWidth="12" strokeLinecap="round" />
    <path d="M22 42 C 30 35, 40 18, 50 14 C 60 18, 70 35, 78 42 C 60 40, 40 40, 22 42 Z" fill="#080D09" stroke="#080D09" strokeWidth="2" />
    <path d="M25 40 Q 50 38 75 40" stroke="#FF83AF" strokeWidth="4" />
    <circle cx="42" cy="54" r="3" fill="#F3E39F" />
    <circle cx="58" cy="54" r="3" fill="#F3E39F" />
  </svg>
);

// 7. Ginger Gladiator
export const GingerGladiatorAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#FF83AF" stroke="#080D09" strokeWidth="4" />
    <path d="M30 65 C 28 50, 42 45, 45 35 C 55 35, 62 45, 70 50 C 75 58, 65 74, 50 74 C 38 74, 32 70, 30 65 Z" fill="#F3E39F" stroke="#080D09" strokeWidth="4" />
    <circle cx="68" cy="44" r="8" fill="#F3E39F" stroke="#080D09" strokeWidth="4" />
    <rect x="36" y="44" width="28" height="18" rx="4" fill="#080D09" />
    <line x1="40" y1="52" x2="60" y2="52" stroke="#FFD7E8" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M50 44 C 50 32, 38 24, 46 22 C 54 20, 58 30, 50 44 Z" fill="#FFD7E8" stroke="#080D09" strokeWidth="3" />
  </svg>
);

// 8. Açai Archer
export const AcaiArcherAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#FFD7E8" stroke="#080D09" strokeWidth="4" />
    <circle cx="50" cy="58" r="20" fill="#561621" stroke="#080D09" strokeWidth="4" />
    <path d="M26 58 C 26 35, 34 22, 50 22 C 66 22, 74 35, 74 58 L 68 58 C 68 45, 62 34, 50 34 C 38 34, 32 45, 32 58 Z" fill="#FF83AF" stroke="#080D09" strokeWidth="4" />
    <circle cx="42" cy="38" r="2" fill="#F3E39F" />
    <circle cx="58" cy="38" r="2" fill="#F3E39F" />
    <path d="M42 52 L 46 52" stroke="#F5F6E6" strokeWidth="2" strokeLinecap="round" />
    <path d="M54 52 L 58 52" stroke="#F5F6E6" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 9. Shrimp Shaman (Fallback / Mock Extra)
export const ShrimpShamanAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#FFD7E8" stroke="#080D09" strokeWidth="4" />
    <path d="M30 65 Q 40 40 60 42 Q 70 43 72 55 Q 60 58 50 62 Z" fill="#F65300" stroke="#080D09" strokeWidth="4" />
    <path d="M40 50 L 45 42 M 48 53 L 55 45" stroke="#F5F6E6" strokeWidth="3" />
    <path d="M60 42 C 62 32, 58 24, 50 24 C 58 24, 64 32, 60 42 Z" fill="#F3E39F" stroke="#080D09" strokeWidth="2" />
    <circle cx="48" cy="58" r="2.5" fill="#080D09" />
  </svg>
);

// 10. Tuna Templar (Fallback / Mock Extra)
export const TunaTemplarAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#819EC5" stroke="#080D09" strokeWidth="4" />
    <path d="M26 50 C 26 30, 74 35, 74 50 C 74 65, 26 70, 26 50 Z" fill="#561621" stroke="#080D09" strokeWidth="4" />
    <path d="M50 40 L 50 60 M 40 50 L 60 50" stroke="#FF83AF" strokeWidth="4" strokeLinecap="round" />
    <circle cx="64" cy="46" r="2.5" fill="#F5F6E6" />
  </svg>
);

// 11. Sesame Sensei (Fallback / Mock Extra)
export const SesameSenseiAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#F5F6E6" stroke="#080D09" strokeWidth="4" />
    <path d="M50 25 C 38 40, 32 60, 50 78 C 68 60, 62 40, 50 25 Z" fill="#080D09" stroke="#080D09" strokeWidth="2" />
    <path d="M42 45 Q 50 50 58 45" stroke="#F5F6E6" strokeWidth="3" strokeLinecap="round" />
    <path d="M38 58 Q 50 50 62 58" stroke="#F5F6E6" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

// 12. Default Arena Competitor / Fallback
export const DefaultArenaAvatar: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <circle cx="50" cy="50" r="46" fill="#F5F6E6" stroke="#080D09" strokeWidth="4" />
    <path d="M25 65 C 25 78, 75 78, 75 65 Z" fill="#F65300" stroke="#080D09" strokeWidth="4" />
    <path d="M35 55 L 65 55" stroke="#99CA5C" strokeWidth="6" strokeLinecap="round" />
    <circle cx="45" cy="50" r="4" fill="#FF83AF" />
    <circle cx="55" cy="50" r="4" fill="#F3E39F" />
    <line x1="20" y1="35" x2="68" y2="58" stroke="#561621" strokeWidth="4" strokeLinecap="round" />
    <line x1="80" y1="35" x2="32" y2="58" stroke="#561621" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

// ============================================================================
// REGISTRY AND HELPER MAPPINGS
// ============================================================================

export interface AvatarDefinition {
  Component: React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  bgClass: string;
}

export const ARENA_AVATAR_REGISTRY: Record<string, AvatarDefinition> = {
  avatar_mochi_ninja: {
    Component: MochiNinjaAvatar,
    label: 'Pink Mochi Ninja',
    bgClass: 'bg-brand-sorbet border-brand-mochi'
  },
  avatar_salmon_shogun: {
    Component: SalmonShogunAvatar,
    label: 'Salmon Shogun',
    bgClass: 'bg-brand-mochi/30 border-brand-mochi'
  },
  avatar_mango_samurai: {
    Component: MangoSamuraiAvatar,
    label: 'Mango Samurai',
    bgClass: 'bg-brand-butter/30 border-brand-butter'
  },
  avatar_avocado_alchemist: {
    Component: AvocadoAlchemistAvatar,
    label: 'Avocado Alchemist',
    bgClass: 'bg-brand-olives/20 border-brand-olives'
  },
  avatar_wasabi_warrior: {
    Component: WasabiWarriorAvatar,
    label: 'Wasabi Warrior',
    bgClass: 'bg-emerald-100 border-emerald-500'
  },
  avatar_wakame_wizard: {
    Component: WakameWizardAvatar,
    label: 'Wakame Wizard',
    bgClass: 'bg-blue-100 border-blue-400'
  },
  avatar_ginger_gladiator: {
    Component: GingerGladiatorAvatar,
    label: 'Ginger Gladiator',
    bgClass: 'bg-amber-100 border-amber-500'
  },
  avatar_acai_archer: {
    Component: AcaiArcherAvatar,
    label: 'Açai Archer',
    bgClass: 'bg-purple-100 border-purple-500'
  },
  // Extra mapping matching offline/mock lists for completeness and seamless integration
  avatar_shrimp_shaman: {
    Component: ShrimpShamanAvatar,
    label: 'Shrimp Shaman',
    bgClass: 'bg-rose-100 border-rose-500'
  },
  avatar_tuna_templar: {
    Component: TunaTemplarAvatar,
    label: 'Tuna Templar',
    bgClass: 'bg-blue-100 border-blue-500'
  },
  avatar_sesame_sensei: {
    Component: SesameSenseiAvatar,
    label: 'Sesame Sensei',
    bgClass: 'bg-slate-100 border-slate-500'
  }
};

export const DEFAULT_AVATAR_DEF: AvatarDefinition = {
  Component: DefaultArenaAvatar,
  label: 'Competitor',
  bgClass: 'bg-brand-sorbet/30 border-brand-sorbet'
};

/**
 * Resolves an avatar key to its SVG element component and metadata
 */
export function getAvatarDefinition(key: string | null | undefined): AvatarDefinition {
  if (!key) return DEFAULT_AVATAR_DEF;
  
  const normKey = key.trim().toLowerCase();
  
  // Try direct key matches
  if (ARENA_AVATAR_REGISTRY[normKey]) {
    return ARENA_AVATAR_REGISTRY[normKey];
  }

  // Try substring or alias match just in case "avocado", "salmon", "acai_enthusiast" are used
  const foundKey = Object.keys(ARENA_AVATAR_REGISTRY).find(
    (k) => normKey.includes(k.replace('avatar_', '')) || k.replace('avatar_', '').includes(normKey)
  );

  if (foundKey) {
    return ARENA_AVATAR_REGISTRY[foundKey];
  }

  return DEFAULT_AVATAR_DEF;
}
