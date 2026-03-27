import React from 'react';
import { View, Pressable, ViewProps, StyleProp, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  AnimatedStyle,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { theme } from '../core/theme';

export interface AppCardProps extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  showBorder?: boolean;
  style?: StyleProp<AnimatedStyle<ViewStyle>>;
  elevation?: keyof typeof theme.elevation;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface TappableCardProps extends Omit<ViewProps, 'style'> {
  children: React.ReactNode;
  onTap: () => void;
  cardStyle: StyleProp<AnimatedStyle<ViewStyle>>;
  className: string;
}

const TappableCard = ({
  children,
  onTap,
  cardStyle,
  className,
  ...props
}: TappableCardProps) => {
  const scale = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <AnimatedPressable
      onPress={onTap}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={className}
      style={[cardStyle, animatedStyle]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};

/**
 * A flexible card container component following the Miru design system.
 *
 * Supports theming, optional borders, elevation (shadows), and tap animations
 * when an `onTap` handler is provided.
 *
 * @param props.children - The content to render inside the card.
 * @param props.className - Optional NativeWind class string for additional styling.
 * @param props.onTap - Optional callback when the card is pressed.
 *                      Makes the card animatable.
 * @param props.showBorder - Whether to render a 1px border around the card (default: true).
 * @param props.style - Optional Reanimated or standard style object.
 * @param props.elevation - The elevation preset from the theme to apply (default: 'sm').
 */
export const AppCard = ({
  children,
  className = '',
  onTap,
  showBorder = true,
  style,
  elevation = 'sm',
  ...props
}: AppCardProps) => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardStyle: StyleProp<AnimatedStyle<ViewStyle>> = [
    {
      backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.light,
      borderColor: isDark ? theme.colors.border.dark : theme.colors.border.light,
      borderWidth: showBorder ? 1 : 0,
    },
    Platform.select({
      ios: theme.elevation[elevation],
      android: {
        elevation: theme.elevation[elevation].elevation,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
    }),
    style,
  ];

  const fullClassName = `rounded-md p-lg ${className}`.trim();

  if (onTap) {
    return (
      <TappableCard onTap={onTap} className={fullClassName} cardStyle={cardStyle} {...props}>
        {children}
      </TappableCard>
    );
  }

  return (
    <View className={fullClassName} style={cardStyle as StyleProp<ViewStyle>} {...props}>
      {children}
    </View>
  );
};
