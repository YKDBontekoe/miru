import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useColorScheme } from 'nativewind';
import { theme } from '../../core/theme';

export function HomeCard({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.light,
          shadowColor: theme.colors.primary.DEFAULT,
        },
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    ...Platform.select({
      ios: theme.elevation.md,
      android: {
        elevation: theme.elevation.md.elevation,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
    }),
  },
});
