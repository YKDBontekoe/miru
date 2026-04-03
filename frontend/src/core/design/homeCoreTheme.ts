import { Platform } from 'react-native';

export const HOME_CORE_COLORS = {
  bg: '#F2F7F2',
  text: '#13251C',
  muted: '#5A7467',
  border: '#DDE8E0',
  surface: '#FFFFFF',
  softSurface: '#ECF5F0',
  primary: '#147D64',
  primarySoft: '#DDF4EB',
  accent: '#E28A2E',
  accentSoft: '#FDF1E1',
  deep: '#0F3D31',
} as const;

export const HOME_CORE_SHADOW = Platform.select({
  ios: {
    shadowColor: '#0D3C30',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
  },
  android: { elevation: 4 },
  default: {},
});
