import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { theme } from '@/core/theme';

/**
 * Renders a large quick action button, typically on the Home screen dashboard.
 *
 * Displays an icon and label inside a touchable card format designed for grid layouts.
 *
 * @param icon - The name of the Ionicons icon to display.
 * @param label - The text label for the action.
 * @param onPress - Callback executed when the action is tapped.
 *
 * @returns {JSX.Element} The rendered quick action button.
 */
export function HomeQuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <ScalePressable onPress={onPress} className="w-[48%] mb-4">
      <View
        className={`rounded-2xl py-6 px-4 items-center ${
          isDark ? 'bg-primary-DEFAULT/15' : 'bg-primary-surfaceLight'
        }`}
      >
        <View
          className={`w-[46px] h-[46px] rounded-xl items-center justify-center mb-4 ${
            isDark ? 'bg-primary-DEFAULT/30' : 'bg-primary-light'
          }`}
        >
          <Ionicons
            name={icon}
            size={22}
            color={isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT}
          />
        </View>
        <AppText
          variant="bodySm"
          className={`font-semibold text-center ${
            isDark ? 'text-onSurface-dark' : 'text-onSurface-light'
          }`}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </View>
    </ScalePressable>
  );
}
