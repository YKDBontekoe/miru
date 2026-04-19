import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { HOME_COLORS } from './homeTheme';

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
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}
    >
      <AppText variant="h3" style={{ color: HOME_COLORS.text, fontWeight: '700' }}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <ScalePressable onPress={onAction}>
          <AppText variant="bodySm" style={{ color: HOME_COLORS.primary, fontWeight: '700' }}>
            {actionLabel}
          </AppText>
        </ScalePressable>
      ) : null}
    </View>
  );
}
