// Mock environment variables for Supabase
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

jest.mock('expo', () => ({
  registerRootComponent: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useSegments: () => [],
  useLocalSearchParams: () => ({}),
  Stack: {
    Screen: jest.fn(() => null),
  },
  Tabs: {
    Screen: jest.fn(() => null),
  },
  Link: jest.fn(({ children }) => children),
}));

jest.mock('expo-constants', () => ({
  expoConfig: {
    extra: {
      supabaseUrl: 'https://test.supabase.co',
      supabaseAnonKey: 'test-key',
    },
  },
}));

// Mock nativewind
jest.mock('nativewind', () => ({
  styled: (Component) => Component,
}));

// Global mock for alert
jest.spyOn(require('react-native').Alert, 'alert');

// Mock for reanimated avoiding Worklets issues completely
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const Component = React.Component;

  return {
    useSharedValue: jest.fn(() => ({ value: 1 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withSpring: jest.fn((val) => val),
    withTiming: jest.fn((val) => val),
    createAnimatedComponent: jest.fn((comp) => comp),
    default: {
      createAnimatedComponent: jest.fn((comp) => comp),
      call: jest.fn(),
    }
  };
});
