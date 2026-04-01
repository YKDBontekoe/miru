import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { theme } from '../../core/theme';

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
    <View style={styles.container}>
      <AppText
        variant="h3"
        style={[
          styles.title,
          { color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light },
        ]}
      >
        {title}
      </AppText>
      {actionLabel && onAction && (
        <ScalePressable onPress={onAction}>
          <AppText
            variant="bodySm"
            style={[styles.action, { color: theme.colors.primary.DEFAULT }]}
          >
            {actionLabel}
          </AppText>
        </ScalePressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 15, // Keep slightly smaller than default h3 for this section header context
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  action: {
    fontSize: 13,
    fontWeight: '600',
  },
});
