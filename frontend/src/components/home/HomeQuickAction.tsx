import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { theme } from '@/core/theme';

export const HomeQuickAction = React.memo(function HomeQuickAction({
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

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <ScalePressable onPress={onPress} style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={icon}
            size={22}
            color={isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT}
          />
        </View>
        <AppText
          variant="bodySm"
          style={styles.label}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </View>
    </ScalePressable>
  );
});

HomeQuickAction.displayName = 'HomeQuickAction';

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: theme.spacing.lg,
  },
  innerContainer: {
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    backgroundColor: isDark ? `${theme.colors.primary.DEFAULT}26` : theme.colors.primary.surfaceLight,
  },
  iconContainer: {
    width: theme.spacing.massive - 2,
    height: theme.spacing.massive - 2,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    backgroundColor: isDark ? `${theme.colors.primary.DEFAULT}4D` : theme.colors.primary.light,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
  },
});
