import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

export interface ThemeColors {
  bg: string;
  backdrop: string;
  surface: string;
  surfaceHigh: string;
  surfaceMid: string;
  border: string;
  text: string;
  subtext: string;
  muted: string;
  faint: string;
  primary: string;
  primarySurface: string;
  danger: string;
  dangerSurface: string;
  success: string;
  successSurface: string;
}

/**
 * Hook to manage dynamic design tokens. Returns theme colors based on device's current colour scheme.
 *
 * @returns {{ isDark: boolean; C: ThemeColors }} An object containing `isDark` flag and `C` object holding current theme's colors.
 */
export function useTheme(): { isDark: boolean; C: ThemeColors } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const C = useMemo<ThemeColors>(
    () =>
      isDark
        ? {
            bg: '#0E0E18',
            backdrop: 'rgba(0, 0, 0, 0.7)',
            surface: '#1A1A28',
            surfaceHigh: '#242438',
            surfaceMid: '#1F1F32',
            border: '#2E2E48',
            text: '#EBEBF5',
            subtext: '#C0C0DC',
            muted: '#8080A0',
            faint: '#464660',
            primary: '#3B82F6',
            primarySurface: '#1A2A54',
            danger: '#EF4444',
            dangerSurface: '#2D1515',
            success: '#10B981',
            successSurface: '#0D2B21',
          }
        : {
            bg: '#F4F6FF',
            backdrop: 'rgba(10, 15, 60, 0.45)',
            surface: '#FFFFFF',
            surfaceHigh: '#EEF2FF',
            surfaceMid: '#F8F9FF',
            border: '#E6EAFF',
            text: '#0A0E2E',
            subtext: '#353A60',
            muted: '#606490',
            faint: '#B4BBDE',
            primary: '#2563EB',
            primarySurface: '#EEF4FF',
            danger: '#EF4444',
            dangerSurface: '#FEF2F2',
            success: '#10B981',
            successSurface: '#F0FDF4',
          },
    [isDark]
  );

  return { isDark, C };
}
