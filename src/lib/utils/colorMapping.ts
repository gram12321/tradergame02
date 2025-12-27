// ===== COLOR MAPPING SYSTEM =====
// Generic color schemes for consistent styling across the application

/**
 * Color scheme interface for consistent styling across the application
 */
export interface ColorScheme {
  primary: string;      // Hex color code
  background: string;   // Tailwind background class
  border: string;       // Tailwind border class  
  text: string;         // Tailwind text class
  icon: string;         // Tailwind icon color class
  badge: string;        // Tailwind badge classes
  ring: string;         // Tailwind ring color class
  parent?: string;      // Optional: parent category for hierarchical organization
}

/**
 * PRIMARY COLOR MAPPING - Foundation of all colors in the game
 * 
 * Generic color schemes that can be used for any purpose
 */
export const COLOR_MAPPING: Record<string, ColorScheme> = {
  // ===== PRIMARY COLORS =====

  // Green
  'green': {
    primary: '#10b981',      // green-500
    background: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-500',
    badge: 'bg-green-100 text-green-700 border-green-200',
    ring: 'ring-green-200'
  },

  // Purple
  'purple': {
    primary: '#8b5cf6',      // purple-500
    background: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: 'text-purple-500',
    badge: 'bg-purple-100 text-purple-700 border-purple-200',
    ring: 'ring-purple-200'
  },

  // Blue
  'blue': {
    primary: '#2563eb',      // blue-600
    background: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    ring: 'ring-blue-200'
  },

  // Orange
  'orange': {
    primary: '#f59e0b',      // amber-500
    background: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-700',
    icon: 'text-orange-500',
    badge: 'bg-orange-100 text-orange-700 border-orange-200',
    ring: 'ring-orange-200'
  },

  // Red
  'red': {
    primary: '#ef4444',      // red-500
    background: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-500',
    badge: 'bg-red-100 text-red-700 border-red-200',
    ring: 'ring-red-200'
  },

  // ===== SYSTEM CATEGORY =====

  // System (UI-only) - Gray
  'system': {
    primary: '#6b7280',      // gray-500
    background: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: 'text-gray-500',
    badge: 'bg-gray-100 text-gray-700 border-gray-200',
    ring: 'ring-gray-200'
  },

  // ===== ADDITIONAL COLORS =====

  // Cyan
  'cyan': {
    primary: '#0ea5e9',      // cyan-500
    background: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    icon: 'text-cyan-500',
    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    ring: 'ring-cyan-200',
    parent: 'blue'
  },

  // Amber
  'amber': {
    primary: '#f59e0b',      // amber-500
    background: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-500',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    ring: 'ring-amber-200',
    parent: 'orange'
  },

  // Indigo
  'indigo': {
    primary: '#6366f1',      // indigo-500
    background: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    icon: 'text-indigo-500',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    ring: 'ring-indigo-200',
    parent: 'purple'
  },

  // ===== NOTIFICATION CATEGORY ALIASES =====
  // These are aliases for NotificationCategory enum values

  // Finance - Blue
  'finance': {
    primary: '#2563eb',      // blue-600
    background: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-600',
    badge: 'bg-blue-100 text-blue-700 border-blue-200',
    ring: 'ring-blue-200',
    parent: 'blue'
  },

  // Time - Cyan
  'time': {
    primary: '#0ea5e9',      // cyan-500
    background: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    icon: 'text-cyan-500',
    badge: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    ring: 'ring-cyan-200',
    parent: 'blue'
  }
};

/**
 * Get primary hex color for a color key
 * Used for coloring UI elements
 */
export function getColor(colorKey: string): string {
  return COLOR_MAPPING[colorKey]?.primary || COLOR_MAPPING['system'].primary;
}

/**
 * Get Tailwind classes for any color key
 * Used for coloring notifications, toasts, and other UI elements
 */
export function getTailwindClasses(colorKey: string): {
  background: string;
  border: string;
  text: string;
  icon: string;
  badge: string;
  ring: string;
} {
  const scheme = COLOR_MAPPING[colorKey] || COLOR_MAPPING['system'];
  return {
    background: scheme.background,
    border: scheme.border,
    text: scheme.text,
    icon: scheme.icon,
    badge: scheme.badge,
    ring: scheme.ring
  };
}

