import { Platform } from 'react-native';

export const theme = {
  colors: {
    primary: {
      DEFAULT: '#2563EB',
      light: '#60A5FA',
      dark: '#1E40AF',
      surface: '#1E293B',
      surfaceLight: '#EFF6FF',
    },
    background: {
      dark: '#0F0F14',
      light: '#F8F8FC',
    },
    surface: {
      dark: '#1A1A22',
      highDark: '#242430',
      highestDark: '#2E2E3C',
      light: '#FFFFFF',
      highLight: '#F0F0F6',
      highestLight: '#E8E8F0',
    },
    border: {
      dark: '#3A3A4A',
      light: '#D8D8E4',
      lightAccent: '#EBEBF5',
    },
    onSurface: {
      dark: '#F0EFF4',
      mutedDark: '#A0A0B0',
      disabledDark: '#606070',
      light: '#12121A',
      mutedLight: '#6E6E80',
      disabledLight: '#B0B0C0',
      faintLight: '#C0C0D0',
    },
    status: {
      success: '#34D399',
      warning: '#FBBF24',
      error: '#F87171',
      info: '#60A5FA',
    },
  },
  spacing: {
    none: 0,
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 40,
    massive: 48,
    colossal: 64,
  },
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 34,
      letterSpacing: 0.36,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 30,
      letterSpacing: 0.35,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 25,
      letterSpacing: 0.38,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 22,
      letterSpacing: -0.32,
    },
    bodySm: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
      letterSpacing: -0.15,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
      letterSpacing: 0,
    },
    label: {
      fontSize: 11,
      fontWeight: '700' as const,
      lineHeight: 14,
      letterSpacing: 1.2,
      textTransform: 'uppercase' as const,
    },
  },
  elevation: {
    none: Platform.select({
      ios: { shadowOpacity: 0 },
      android: { elevation: 0 },
      default: {},
    }),
    sm: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
      default: {},
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: { elevation: 4 },
      default: {},
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      default: {},
    }),
    modal: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
};

// Helper for agent palette colors
export function getAgentColor(name: string) {
  const palette = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}

// Global helpers (temporary light theme forced as requested)
export const activeColors = {
  bg: theme.colors.background.light,
  surface: theme.colors.surface.light,
  surfaceHigh: theme.colors.surface.highLight,
  border: theme.colors.border.light,
  borderLight: theme.colors.border.lightAccent,
  text: theme.colors.onSurface.light,
  muted: theme.colors.onSurface.mutedLight,
  faint: theme.colors.onSurface.faintLight,
  primary: theme.colors.primary.DEFAULT,
  primarySurface: theme.colors.primary.surfaceLight,
};
