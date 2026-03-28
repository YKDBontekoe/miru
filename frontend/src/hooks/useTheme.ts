import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

export interface ThemeColors {
  bg: string;
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

export function useTheme(): { isDark: boolean; C: ThemeColors } {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const C = useMemo<ThemeColors>(
    () =>
      isDark
        ? {
            bg: '#0E0E18',
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
            bg: '#F5F5FB',
            surface: '#FFFFFF',
            surfaceHigh: '#F0F0F7',
            surfaceMid: '#F8F8FC',
            border: '#E2E2EE',
            text: '#0E0E1A',
            subtext: '#3A3A55',
            muted: '#65657A',
            faint: '#B8B8CC',
            primary: '#2563EB',
            primarySurface: '#EFF6FF',
            danger: '#EF4444',
            dangerSurface: '#FEF2F2',
            success: '#10B981',
            successSurface: '#F0FDF4',
          },
    [isDark]
  );

  return { isDark, C };
}
