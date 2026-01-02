import React from 'react';
import { cn } from './utils';



// ===== SVG ICONS =====

export const ChevronDownIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export const ChevronRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export const ChevronUpIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

export const ChevronLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

export const getChevronIcon = (isExpanded: boolean, className?: string) => {
  return isExpanded ?
    <ChevronDownIcon className={className} /> :
    <ChevronRightIcon className={className} />;
};

export const getChevronIconComponent = (isExpanded: boolean) => {
  return isExpanded ? ChevronDownIcon : ChevronRightIcon;
};

// ===== CONSTANTS =====

export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8'
} as const;

export type IconSize = keyof typeof ICON_SIZES;

// ===== EMOJI CONSTANTS =====

export const SPECIALIZATION_ICONS = {
  financeA: '📊',
  administrationAndResearch: '🔧'
} as const;

export const getSpecializationIcon = (specialization: string): string => {
  return SPECIALIZATION_ICONS[specialization as keyof typeof SPECIALIZATION_ICONS] || '⭐';
};

export const EMOJI_OPTIONS: readonly string[] = [
  '📊', '🔧', '🍇', '🍷', '💼', '👥', '🌟', '⚡', '🎯', '🚀',
  '💡', '🔥', '⭐', '🎪', '🏆', '🎨', '🎵', '🎮', '📱', '💻',
  '🏢', '🏭', '🌍', '🌱', '🌿', '🍃', '🌺', '🌻', '🌸', '🌷'
];

// Avatar options for company profiles
export const AVATAR_OPTIONS = [
  { id: 'default', emoji: '👤', label: 'Default' },
  { id: 'businessman', emoji: '👨‍💼', label: 'Businessman' },
  { id: 'businesswoman', emoji: '👩‍💼', label: 'Businesswoman' },
  { id: 'royal', emoji: '👑', label: 'Royal' },
  { id: 'superhero', emoji: '🦸', label: 'Superhero' },
  { id: 'ninja', emoji: '🥷', label: 'Ninja' },
  { id: 'farmer', emoji: '🚜', label: 'Farmer' }
];

export const NAVIGATION_EMOJIS = {
  dashboard: '🏠',
  finance: '💰',
  facilities: '🏭',
  marketplace: '🛒'
} as const;

export const STATUS_EMOJIS = {
  time: '📅',
  money: '💰',
  building: '🏭',
  field: '🌾',
} as const;

export const QUALITY_EMOJIS = {
  poor: '😞',
  fair: '😐',
  good: '😊',
  excellent: '🤩',
  perfect: '👑'
} as const;




// ===== ASSET ICON COMPONENTS =====


interface StoryPortraitProps {
  image?: string | null;
  alt?: string;
  className?: string;
  rounded?: boolean;
  fit?: 'cover' | 'contain';
  fallback?: string | null | false;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export const StoryPortrait: React.FC<StoryPortraitProps> = ({
  image,
  alt = 'Story portrait',
  className,
  rounded = true,
  fit = 'cover',
  fallback,
  onError
}) => {
  const src = image || (fallback ? fallback : null);
  if (!src) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        'block',
        fit === 'cover' ? 'object-cover' : 'object-contain',
        rounded ? 'rounded-lg' : '',
        className
      )}
      onError={(event) => {
        event.currentTarget.style.display = 'none';
        if (onError) {
          onError(event);
        }
      }}
    />
  );
};
