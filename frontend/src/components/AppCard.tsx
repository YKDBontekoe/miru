import React from 'react';
import {
  View,
  Pressable,
  ViewProps,
  StyleProp,
  ViewStyle,
  StyleSheet,
  Platform,
} from 'react-native';
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
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
  elevation?: keyof typeof theme.elevation;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function TappableCard({
  children,
  onTap,
  cardStyle,
  className,
  ...props
}: {
  children: React.ReactNode;
  onTap: () => void;
  cardStyle: any;
  className: string;
}) {
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
      style={[cardStyle, animatedStyle] as StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
}

// DOCS(miru-agent): needs documentation
export function AppCard({
  children,
  className = '',
  onTap,
  showBorder = true,
  style,
  elevation = 'sm',
  ...props
}: AppCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const cardStyle = [
    styles.card,
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

  if (onTap) {
    return (
      <TappableCard onTap={onTap} className={className} cardStyle={cardStyle} {...props}>
        {children}
      </TappableCard>
    );
  }

  return (
    <View className={className} style={cardStyle as StyleProp<ViewStyle>} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
  },
});
