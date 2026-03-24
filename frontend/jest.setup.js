// Mock environment variables for Supabase
process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

// Mock react-native-reanimated properly to avoid Worklets errors
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text, Image, ScrollView } = require('react-native');

  const createAnimatedComponent = (ComponentToAnimate) => {
    return class AnimatedComponent extends React.Component {
      render() {
        return <ComponentToAnimate {...this.props} />;
      }
    };
  };

  const ViewComponent = createAnimatedComponent(View);
  const TextComponent = createAnimatedComponent(Text);
  const ImageComponent = createAnimatedComponent(Image);
  const ScrollViewComponent = createAnimatedComponent(ScrollView);

  return {
    __esModule: true,
    default: {
      createAnimatedComponent,
      View: ViewComponent,
      Text: TextComponent,
      Image: ImageComponent,
      ScrollView: ScrollViewComponent,
    },
    View: ViewComponent,
    Text: TextComponent,
    Image: ImageComponent,
    ScrollView: ScrollViewComponent,
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withTiming: jest.fn((val) => val),
    withSpring: jest.fn((val) => val),
    withDelay: jest.fn((_delay, val) => val),
    withSequence: jest.fn(() => {}),
    withRepeat: jest.fn(() => {}),
    FadeIn: { duration: jest.fn() },
    FadeOut: { duration: jest.fn() },
    Easing: {
      bezier: jest.fn(),
      linear: jest.fn(),
      ease: jest.fn(),
      in: jest.fn(),
      out: jest.fn(),
      inOut: jest.fn()
    }
  };
});

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
