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
    },
    onSurface: {
      dark: '#F0EFF4',
      mutedDark: '#A0A0B0',
      disabledDark: '#606070',
      light: '#12121A',
      mutedLight: '#6E6E80',
      disabledLight: '#B0B0C0',
    },
    status: {
      success: '#34D399',
      successSurfaceDark: '#0D2E1F',
      successSurfaceLight: '#F0FDF4',
      warning: '#FBBF24',
      warningSurfaceDark: '#2E2610',
      warningSurfaceLight: '#FFFBEB',
      error: '#F87171',
      errorSurfaceDark: '#2E1212',
      errorSurfaceLight: '#FEF2F2',
      info: '#60A5FA',
      infoSurfaceDark: '#121E2E',
      infoSurfaceLight: '#EFF6FF',
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
      fontSize: 30, // text-3xl
      lineHeight: 36,
      letterSpacing: -0.5,
      fontWeight: '700' as const,
    },
    h2: {
      fontSize: 24, // text-2xl
      lineHeight: 32,
      letterSpacing: -0.3,
      fontWeight: '600' as const,
    },
    h3: {
      fontSize: 20, // text-xl
      lineHeight: 28,
      letterSpacing: -0.2,
      fontWeight: '500' as const,
    },
    body: {
      fontSize: 16, // text-base
      lineHeight: 24,
      letterSpacing: 0,
    },
    bodySm: {
      fontSize: 14, // text-sm
      lineHeight: 20,
      letterSpacing: 0,
    },
    caption: {
      fontSize: 12, // text-xs
      lineHeight: 16,
      letterSpacing: 0,
    },
  },
};
