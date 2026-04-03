import { HOME_CORE_COLORS, HOME_CORE_SHADOW } from '@/core/design/homeCoreTheme';

export const DESIGN_TOKENS = {
  colors: {
    pageBg: HOME_CORE_COLORS.bg,
    surface: HOME_CORE_COLORS.surface,
    surfaceSoft: HOME_CORE_COLORS.softSurface,
    border: HOME_CORE_COLORS.border,
    text: HOME_CORE_COLORS.text,
    muted: HOME_CORE_COLORS.muted,
    faint: '#97AEA3',
    primary: HOME_CORE_COLORS.primary,
    primarySoft: HOME_CORE_COLORS.primarySoft,
    accent: HOME_CORE_COLORS.accent,
    accentSoft: HOME_CORE_COLORS.accentSoft,
    deep: HOME_CORE_COLORS.deep,
    destructive: '#B23A3A',
    destructiveSoft: '#FCEEEE',
    destructiveSurface: '#FCEEEE',
    destructiveBorder: '#F4D1D1',
    white: '#FFFFFF',
    transparent: 'transparent',
  },
  radius: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    full: 999,
  },
  shadow: HOME_CORE_SHADOW,
} as const;

export type DesignColors = typeof DESIGN_TOKENS.colors;
