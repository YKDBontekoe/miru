import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { theme } from '../../core/theme';

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
    <ScalePressable onPress={onPress} style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark
              ? `${theme.colors.primary.DEFAULT}15`
              : theme.colors.primary.surfaceLight,
          },
        ]}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: isDark
                ? `${theme.colors.primary.DEFAULT}30`
                : theme.colors.primary.light,
            },
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT}
          />
        </View>
        <AppText
          variant="bodySm"
          style={[
            styles.label,
            { color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light },
          ]}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </View>
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: theme.spacing.md,
  },
  card: {
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  label: {
    fontWeight: '600',
    textAlign: 'center',
  },
});
