import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import { theme } from '@/core/theme';

export const HomeCard = React.memo(function HomeCard({ children }: { children: React.ReactNode }) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <View style={styles.container}>
      {children}
    </View>
  );
});

HomeCard.displayName = 'HomeCard';

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    borderRadius: 24, // Matches typical 3xl rounding
    padding: theme.spacing.xl, // 20px, closer to p-6 (24px) but consistent
    marginBottom: theme.spacing.lg,
    backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.light,
    ...theme.elevation.md, // Replace custom shadow with standard elevation
  },
});
