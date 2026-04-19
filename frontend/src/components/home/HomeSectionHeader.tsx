import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';

/**
 * A header component used to separate sections on the home dashboard.
 * @param {object} props - The component props.
 * @param {string} props.title - The title text of the section.
 * @param {string} [props.actionLabel] - Optional text label for an action button (e.g., "See all").
 * @param {() => void} [props.onAction] - Optional callback function executed when the action button is pressed.
 * @returns {React.ReactElement} The HomeSectionHeader component.
 */
export function HomeSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-row justify-between items-center mb-3">
      <AppText variant="h3" className={`font-bold ${isDark ? 'text-onSurface-dark' : 'text-[#13251C]'}`}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <ScalePressable onPress={onAction}>
          <AppText variant="bodySm" className="font-bold text-primary-DEFAULT">
            {actionLabel}
          </AppText>
        </ScalePressable>
      ) : null}
    </View>
  );
}
