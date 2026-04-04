import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useColorScheme } from 'nativewind';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { theme } from '@/core/theme';

export const HomeAgentChip = React.memo(function HomeAgentChip({
  agent,
  onPress,
}: {
  agent: Agent;
  onPress: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <ScalePressable
      onPress={onPress}
      style={styles.container}
    >
      <View style={styles.avatar}>
        <AppText style={styles.avatarText}>
          {agent.name?.[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <AppText style={styles.name}>{agent.name}</AppText>
      {agent.message_count > 0 && (
        <View style={styles.badge}>
          <AppText style={styles.badgeText}>{agent.message_count}</AppText>
        </View>
      )}
    </ScalePressable>
  );
});

HomeAgentChip.displayName = 'HomeAgentChip';

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? `${theme.colors.primary.DEFAULT}33` : theme.colors.primary.surfaceLight,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginRight: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  avatar: {
    width: theme.spacing.avatar - 2,
    height: theme.spacing.avatar - 2,
    borderRadius: (theme.spacing.avatar - 2) / 2,
    backgroundColor: isDark ? theme.colors.primary.dark : theme.colors.primary.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm - 1,
  },
  avatarText: {
    color: isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
    fontSize: 12,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
  },
  badge: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: theme.borderRadius.sm + 1,
    minWidth: theme.spacing.lg + 2,
    height: theme.spacing.lg + 2,
    paddingHorizontal: theme.spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: theme.spacing.sm - 1,
  },
  badgeText: {
    fontSize: 10,
    color: theme.colors.white,
    fontWeight: 'bold',
  },
});
