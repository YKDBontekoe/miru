import React, { useMemo } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent, ChatRoom, Task } from '@/core/models';
import { theme } from '@/core/theme';
import { relativeTimeFromNow } from './homeUtils';

export const HomeSectionHeader = React.memo(function HomeSectionHeader({
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

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <View style={styles.sectionHeaderContainer}>
      <AppText variant="h3" style={styles.sectionTitle}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <ScalePressable onPress={onAction}>
          <AppText variant="bodySm" style={styles.sectionAction}>
            {actionLabel}
          </AppText>
        </ScalePressable>
      ) : null}
    </View>
  );
});
HomeSectionHeader.displayName = 'HomeSectionHeader';

export const HomeSurfaceCard = React.memo(function HomeSurfaceCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <View style={[styles.surfaceCard, style]}>
      {children}
    </View>
  );
});
HomeSurfaceCard.displayName = 'HomeSurfaceCard';

export const HomeActionTile = React.memo(function HomeActionTile({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <ScalePressable onPress={onPress} style={styles.actionTileContainer}>
      <View style={styles.actionTileIconContainer}>
        <Ionicons name={icon} size={18} color={isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT} />
      </View>
      <AppText variant="bodySm" style={styles.actionTileText}>
        {label}
      </AppText>
    </ScalePressable>
  );
});
HomeActionTile.displayName = 'HomeActionTile';

export const HomeTaskRow = React.memo(function HomeTaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const dueText =
    dueDate && !isNaN(dueDate.getTime())
      ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(dueDate)
      : null;

  return (
    <ScalePressable onPress={onToggle} style={styles.taskRowContainer}>
      <View style={[styles.taskRowCheckbox, task.completed && styles.taskRowCheckboxCompleted]}>
        {task.completed ? <Ionicons name="checkmark" size={14} color={theme.colors.white} /> : null}
      </View>
      <AppText
        variant="bodySm"
        numberOfLines={1}
        style={[styles.taskRowTitle, task.completed && styles.taskRowTitleCompleted]}
      >
        {task.title}
      </AppText>
      {dueText ? (
        <View style={styles.taskRowDateBadge}>
          <AppText variant="caption" style={styles.taskRowDateText}>
            {dueText}
          </AppText>
        </View>
      ) : null}
    </ScalePressable>
  );
});
HomeTaskRow.displayName = 'HomeTaskRow';

export const HomeChatRow = React.memo(function HomeChatRow({
  room,
  onPress,
  t,
}: {
  room: ChatRoom;
  onPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <ScalePressable onPress={onPress} style={styles.chatRowContainer}>
      <View style={styles.chatRowAvatar}>
        <AppText variant="bodySm" style={styles.chatRowAvatarText}>
          {room.name[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <View style={styles.chatRowContent}>
        <AppText variant="bodySm" numberOfLines={1} style={styles.chatRowTitle}>
          {room.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={styles.chatRowSubtitle}>
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View style={styles.chatRowMeta}>
        <AppText variant="caption" style={styles.chatRowTime}>
          {relativeTimeFromNow(room.updated_at, t)}
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={isDark ? theme.colors.onSurface.disabledDark : theme.colors.onSurface.disabledLight} />
      </View>
    </ScalePressable>
  );
});
HomeChatRow.displayName = 'HomeChatRow';

export const HomeAgentBadge = React.memo(function HomeAgentBadge({
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
    <ScalePressable onPress={onPress} style={styles.agentBadgeContainer}>
      <View style={styles.agentBadgeHeader}>
        <View style={styles.agentBadgeAvatar}>
          <AppText variant="bodySm" style={styles.agentBadgeAvatarText}>
            {agent.name?.[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>
        <View style={styles.agentBadgeContent}>
          <AppText variant="bodySm" numberOfLines={1} style={styles.agentBadgeName}>
            {agent.name}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" style={styles.agentBadgeMessageCount}>
        {agent.message_count} {agent.message_count === 1 ? 'message' : 'messages'}
      </AppText>
    </ScalePressable>
  );
});
HomeAgentBadge.displayName = 'HomeAgentBadge';

export const HomeHeroCard = React.memo(function HomeHeroCard({
  greeting,
  firstName,
  dateText,
  initials,
  todayTaskCount,
  completionRate,
  onSettingsPress,
  t,
}: {
  greeting: string;
  firstName: string;
  dateText: string;
  initials: string;
  todayTaskCount: number;
  completionRate: number;
  onSettingsPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  return (
    <View style={styles.heroCardContainer}>
      <View style={styles.heroCardDecorationTop} />
      <View style={styles.heroCardDecorationBottom} />

      <View style={styles.heroCardHeader}>
        <View style={styles.heroCardHeaderContent}>
          <AppText variant="bodySm" style={styles.heroCardGreeting}>
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} style={styles.heroCardName}>
            {firstName}
          </AppText>
          <AppText variant="caption" style={styles.heroCardDate}>
            {dateText}
          </AppText>
        </View>
        <ScalePressable onPress={onSettingsPress} style={styles.heroCardAvatar}>
          <AppText variant="bodySm" style={styles.heroCardAvatarText}>
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View style={styles.heroCardStats}>
        <View style={styles.heroCardStatBox}>
          <AppText variant="caption" style={styles.heroCardStatLabel}>
            {t('home.hero.today_focus', { defaultValue: 'Today focus' })}
          </AppText>
          <AppText variant="bodySm" style={styles.heroCardStatValue}>
            {todayTaskCount > 0
              ? t('home.hero.tasks_due_today', {
                  count: todayTaskCount,
                  defaultValue: '{{count}} tasks due today',
                })
              : t('home.hero.no_deadlines', { defaultValue: 'No deadlines today' })}
          </AppText>
        </View>
        <View style={styles.heroCardStatBox}>
          <AppText variant="caption" style={styles.heroCardStatLabel}>
            {t('home.hero.completion', { defaultValue: 'Completion' })}
          </AppText>
          <AppText variant="bodySm" style={styles.heroCardStatValue}>
            {completionRate}% {t('home.hero.complete', { defaultValue: 'complete' })}
          </AppText>
        </View>
      </View>
    </View>
  );
});
HomeHeroCard.displayName = 'HomeHeroCard';

const createStyles = (isDark: boolean) => StyleSheet.create({
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionTitle: {
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
    fontWeight: '700',
  },
  sectionAction: {
    color: isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
    fontWeight: '700',
  },
  surfaceCard: {
    backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.light,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: isDark ? theme.colors.border.dark : theme.colors.border.light,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.elevation.md,
  },
  actionTileContainer: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: isDark ? theme.colors.border.dark : theme.colors.border.light,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: isDark ? theme.colors.surface.highDark : theme.colors.surface.highLight,
    marginBottom: theme.spacing.md,
  },
  actionTileIconContainer: {
    width: theme.spacing.xxxl + 2,
    height: theme.spacing.xxxl + 2,
    borderRadius: theme.borderRadius.md,
    backgroundColor: isDark ? `${theme.colors.primary.DEFAULT}33` : theme.colors.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTileText: {
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
    fontWeight: '700',
  },
  taskRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: isDark ? theme.colors.surface.highDark : theme.colors.surface.highLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  taskRowCheckbox: {
    width: theme.spacing.xxl,
    height: theme.spacing.xxl,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: isDark ? theme.colors.border.dark : theme.colors.border.light,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  taskRowCheckboxCompleted: {
    borderColor: isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
    backgroundColor: isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
  },
  taskRowTitle: {
    flex: 1,
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
    fontWeight: '600',
  },
  taskRowTitleCompleted: {
    color: isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight,
    textDecorationLine: 'line-through',
  },
  taskRowDateBadge: {
    borderRadius: theme.borderRadius.md,
    backgroundColor: isDark ? theme.colors.status.warningSurfaceDark : theme.colors.status.warningSurfaceLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  taskRowDateText: {
    color: isDark ? theme.colors.status.warning : theme.colors.status.warning,
    fontWeight: '700',
  },
  chatRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: isDark ? theme.colors.surface.highDark : theme.colors.surface.highLight,
    marginBottom: theme.spacing.sm,
  },
  chatRowAvatar: {
    width: theme.spacing.xxxl + 2,
    height: theme.spacing.xxxl + 2,
    borderRadius: theme.borderRadius.md,
    backgroundColor: isDark ? `${theme.colors.primary.DEFAULT}33` : theme.colors.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  chatRowAvatarText: {
    color: isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
    fontWeight: '800',
  },
  chatRowContent: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  chatRowTitle: {
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
    fontWeight: '700',
  },
  chatRowSubtitle: {
    color: isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight,
  },
  chatRowMeta: {
    alignItems: 'flex-end',
  },
  chatRowTime: {
    color: isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight,
    marginBottom: theme.spacing.xxs,
  },
  agentBadgeContainer: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: isDark ? theme.colors.border.dark : theme.colors.border.light,
    backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.light,
    padding: theme.spacing.md,
    width: '48.5%',
    marginBottom: theme.spacing.md,
  },
  agentBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  agentBadgeAvatar: {
    width: theme.spacing.xxxl - 2,
    height: theme.spacing.xxxl - 2,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: isDark ? `${theme.colors.primary.DEFAULT}33` : theme.colors.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  agentBadgeAvatarText: {
    color: isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
    fontWeight: '800',
  },
  agentBadgeContent: {
    flex: 1,
  },
  agentBadgeName: {
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
    fontWeight: '700',
  },
  agentBadgeMessageCount: {
    color: isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight,
  },
  heroCardContainer: {
    borderRadius: 28,
    backgroundColor: isDark ? theme.colors.primary.dark : theme.colors.primary.DEFAULT,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...theme.elevation.md,
  },
  heroCardDecorationTop: {
    position: 'absolute',
    width: theme.spacing.colossal * 2.8,
    height: theme.spacing.colossal * 2.8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.status.success,
    opacity: 0.26,
    top: -theme.spacing.colossal * 1.4,
    right: -theme.spacing.huge,
  },
  heroCardDecorationBottom: {
    position: 'absolute',
    width: theme.spacing.colossal * 1.8,
    height: theme.spacing.colossal * 1.8,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.status.warning,
    opacity: 0.22,
    bottom: -theme.spacing.inputBarButton,
    left: -theme.spacing.xxl,
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  heroCardHeaderContent: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  heroCardGreeting: {
    color: theme.colors.white,
    opacity: 0.8,
    fontWeight: '600',
  },
  heroCardName: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  heroCardDate: {
    color: theme.colors.white,
    opacity: 0.8,
  },
  heroCardAvatar: {
    width: theme.spacing.inputBarButton,
    height: theme.spacing.inputBarButton,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.primary.dark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardAvatarText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
  heroCardStats: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  heroCardStatBox: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    backgroundColor: isDark ? `${theme.colors.surface.dark}66` : `${theme.colors.primary.dark}80`,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  heroCardStatLabel: {
    color: theme.colors.white,
    opacity: 0.8,
    marginBottom: theme.spacing.xxs,
  },
  heroCardStatValue: {
    color: theme.colors.white,
    fontWeight: '700',
  },
});
