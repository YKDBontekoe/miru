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
  useColorScheme: () => ({
    colorScheme: 'light',
    toggleColorScheme: jest.fn(),
    setColorScheme: jest.fn(),
  }),
}));

// Mock react-native-reanimated properly to avoid Native Worklets errors
jest.mock('react-native-reanimated', () => {
  const View = require('react-native/Libraries/Components/View/View');
  const Text = require('react-native/Libraries/Text/Text');
  const Image = require('react-native/Libraries/Image/Image');
  const ScrollView = require('react-native/Libraries/Components/ScrollView/ScrollView');
  const Pressable = require('react-native/Libraries/Components/Pressable/Pressable');

  return {
    __esModule: true,
    default: {
      call: () => {},
      View,
      Text,
      Image,
      ScrollView,
      createAnimatedComponent: jest.fn((Component) => Component),
    },
    useSharedValue: jest.fn((val) => ({ value: val })),
    useAnimatedStyle: jest.fn((cb) => cb()),
    useAnimatedProps: jest.fn((cb) => cb()),
    withTiming: jest.fn((val) => val),
    withSpring: jest.fn((val) => val),
    withRepeat: jest.fn((val) => val),
    withSequence: jest.fn((val) => val),
    withDelay: jest.fn((delay, val) => val),
    FadeIn: { duration: jest.fn(() => ({ duration: jest.fn() })) },
    FadeOut: { duration: jest.fn(() => ({ duration: jest.fn() })) },
    createAnimatedComponent: jest.fn((Component) => Component),
    View,
    Text,
    Image,
    ScrollView,
    Pressable,
  };
});

// Global mock for alert
jest.spyOn(require('react-native').Alert, 'alert');
