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

jest.mock('react-native-reanimated', () => {
  const React = require('react');

  class MockComponent extends React.Component {
    render() {
      const { testID, ...props } = this.props;
      const View = require('react-native').View;
      return <View testID={testID} {...props} />;
    }
  }

  const mockSharedValue = (init) => ({ value: init });

  return {
    __esModule: true,
    default: {
      createAnimatedComponent: (comp) => {
        if (
          comp.displayName === 'Pressable' ||
          comp.render?.displayName === 'Pressable' ||
          comp.name === 'Pressable'
        ) {
          const Pressable = require('react-native').Pressable;
          return Pressable;
        }
        return MockComponent;
      },
      View: MockComponent,
      Text: MockComponent,
      Image: MockComponent,
      ScrollView: MockComponent,
    },
    useSharedValue: mockSharedValue,
    useAnimatedStyle: (cb) => cb(),
    withTiming: (toValue) => toValue,
    withSpring: (toValue) => toValue,
    withRepeat: (val) => val,
    withSequence: (...vals) => vals[0],
    withDelay: (delay, val) => val,
    interpolateColor: () => '#000000',
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
    Easing: {
      bezier: () => {},
      inOut: () => {},
      ease: {},
    },
    createAnimatedComponent: (comp) => {
      if (
        comp.displayName === 'Pressable' ||
        comp.render?.displayName === 'Pressable' ||
        comp.name === 'Pressable'
      ) {
        const Pressable = require('react-native').Pressable;
        return Pressable;
      }
      return MockComponent;
    },
    View: MockComponent,
    Text: MockComponent,
    Image: MockComponent,
    ScrollView: MockComponent,
  };
});
