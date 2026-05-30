import React from 'react';
import { StyleProp, View, ViewStyle, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent, ChatRoom, Task } from '@/core/models';
import { HOME_COLORS, HOME_SHADOW } from './homeTheme';
import { relativeTimeFromNow } from './homeUtils';

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
    <View style={styles.sectionHeaderContainer}>
      <AppText variant="h3" style={styles.sectionHeaderTitle}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <ScalePressable onPress={onAction}>
          <AppText variant="bodySm" style={styles.sectionHeaderAction}>
            {actionLabel}
          </AppText>
        </ScalePressable>
      ) : null}
    </View>
  );
}

export function HomeSurfaceCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.surfaceCardContainer, style]}>
      {children}
    </View>
  );
}

export function HomeActionTile({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      style={styles.actionTileContainer}
    >
      <View style={styles.actionTileIconContainer}>
        <Ionicons name={icon} size={18} color={HOME_COLORS.primary} />
      </View>
      <AppText variant="bodySm" style={styles.actionTileLabel}>
        {label}
      </AppText>
    </ScalePressable>
  );
}

export function HomeTaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: () => void;
}) {
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const dueText =
    dueDate && !isNaN(dueDate.getTime())
      ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(dueDate)
      : null;

  return (
    <ScalePressable
      onPress={onToggle}
      style={styles.taskRowContainer}
    >
      <View
        style={[
          styles.taskRowCheckboxContainer,
          {
            borderColor: task.completed ? HOME_COLORS.primary : DESIGN_TOKENS.colors.faint,
            backgroundColor: task.completed ? HOME_COLORS.primary : 'transparent',
          }
        ]}
      >
        {task.completed ? <Ionicons name="checkmark" size={14} color={DESIGN_TOKENS.colors.white} /> : null}
      </View>
      <AppText
        variant="bodySm"
        numberOfLines={1}
        style={[
          styles.taskRowTitle,
          {
            color: task.completed ? HOME_COLORS.muted : HOME_COLORS.text,
            textDecorationLine: task.completed ? 'line-through' : 'none',
          }
        ]}
      >
        {task.title}
      </AppText>
      {dueText ? (
        <View style={styles.taskRowDueBadge}>
          <AppText variant="caption" style={styles.taskRowDueBadgeText}>
            {dueText}
          </AppText>
        </View>
      ) : null}
    </ScalePressable>
  );
}

export function HomeChatRow({
  room,
  onPress,
  t,
}: {
  room: ChatRoom;
  onPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      style={styles.chatRowContainer}
    >
      <View style={styles.chatRowAvatarContainer}>
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
      <View style={styles.chatRowEndContainer}>
        <AppText variant="caption" style={styles.chatRowTime}>
          {relativeTimeFromNow(room.updated_at, t)}
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={HOME_COLORS.muted} />
      </View>
    </ScalePressable>
  );
}

export function HomeAgentBadge({
  agent,
  onPress,
}: {
  agent: Agent;
  onPress: () => void;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      style={styles.agentBadgeContainer}
    >
      <View style={styles.agentBadgeHeaderRow}>
        <View style={styles.agentBadgeAvatarContainer}>
          <AppText variant="bodySm" style={styles.agentBadgeAvatarText}>
            {agent.name?.[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>
        <View style={styles.agentBadgeTitleContainer}>
          <AppText variant="bodySm" numberOfLines={1} style={styles.agentBadgeTitle}>
            {agent.name}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" style={styles.agentBadgeSubtitle}>
        {agent.message_count} {agent.message_count === 1 ? 'message' : 'messages'}
      </AppText>
    </ScalePressable>
  );
}

export function HomeHeroCard({
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
  return (
    <View style={styles.heroCardContainer}>
      <View style={styles.heroCardCircleTopRightPrimary} />
      <View style={styles.heroCardCircleBottomLeftAccent} />

      <View style={styles.heroCardHeaderRow}>
        <View style={styles.heroCardHeaderTextContainer}>
          <AppText variant="bodySm" style={styles.heroCardGreeting}>
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} style={styles.heroCardFirstName}>
            {firstName}
          </AppText>
          <AppText variant="caption" style={styles.heroCardDateText}>
            {dateText}
          </AppText>
        </View>
        <ScalePressable
          onPress={onSettingsPress}
          style={styles.heroCardSettingsBtn}
        >
          <AppText variant="bodySm" style={styles.heroCardInitials}>
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View style={styles.heroCardStatsRow}>
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
}

const styles = StyleSheet.create({
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  sectionHeaderTitle: {
    color: HOME_COLORS.text,
    fontWeight: '700',
  },
  sectionHeaderAction: {
    color: HOME_COLORS.primary,
    fontWeight: '700',
  },
  surfaceCardContainer: {
    backgroundColor: HOME_COLORS.surface,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...HOME_SHADOW,
  },
  actionTileContainer: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: HOME_COLORS.softSurface,
    marginBottom: theme.spacing.sm,
  },
  actionTileIconContainer: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.md,
    backgroundColor: HOME_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  actionTileLabel: {
    color: HOME_COLORS.text,
    fontWeight: '700',
  },
  taskRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: HOME_COLORS.softSurface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  taskRowCheckboxContainer: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  taskRowTitle: {
    flex: 1,
    fontWeight: '600',
  },
  taskRowDueBadge: {
    borderRadius: theme.borderRadius.md,
    backgroundColor: HOME_COLORS.accentSoft,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  taskRowDueBadgeText: {
    color: HOME_COLORS.accent,
    fontWeight: '700',
  },
  chatRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: HOME_COLORS.softSurface,
    marginBottom: theme.spacing.sm,
  },
  chatRowAvatarContainer: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.md,
    backgroundColor: HOME_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  chatRowAvatarText: {
    color: HOME_COLORS.primary,
    fontWeight: '800',
  },
  chatRowContent: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  chatRowTitle: {
    color: HOME_COLORS.text,
    fontWeight: '700',
  },
  chatRowSubtitle: {
    color: HOME_COLORS.muted,
  },
  chatRowEndContainer: {
    alignItems: 'flex-end',
  },
  chatRowTime: {
    color: HOME_COLORS.muted,
    marginBottom: theme.spacing.xxs,
  },
  agentBadgeContainer: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    backgroundColor: HOME_COLORS.surface,
    padding: theme.spacing.md,
    width: '48.5%',
    marginBottom: theme.spacing.sm,
  },
  agentBadgeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  agentBadgeAvatarContainer: {
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.md,
    backgroundColor: HOME_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  agentBadgeAvatarText: {
    color: HOME_COLORS.primary,
    fontWeight: '800',
  },
  agentBadgeTitleContainer: {
    flex: 1,
  },
  agentBadgeTitle: {
    color: HOME_COLORS.text,
    fontWeight: '700',
  },
  agentBadgeSubtitle: {
    color: HOME_COLORS.muted,
  },
  heroCardContainer: {
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: HOME_COLORS.deep,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...HOME_SHADOW,
  },
  heroCardCircleTopRightPrimary: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    opacity: 0.26,
    top: -90,
    right: -40,
    backgroundColor: HOME_COLORS.primary,
  },
  heroCardCircleBottomLeftAccent: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    opacity: 0.22,
    bottom: -44,
    left: -24,
    backgroundColor: HOME_COLORS.accent,
  },
  heroCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  heroCardHeaderTextContainer: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  heroCardGreeting: {
    color: HOME_COLORS.primarySoft,
    fontWeight: '600',
  },
  heroCardFirstName: {
    color: DESIGN_TOKENS.colors.white,
    fontWeight: '700',
  },
  heroCardDateText: {
    color: HOME_COLORS.primarySoft,
  },
  heroCardSettingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: HOME_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardInitials: {
    color: DESIGN_TOKENS.colors.white,
    fontWeight: '700',
  },
  heroCardStatsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  heroCardStatBox: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    backgroundColor: HOME_COLORS.primary,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  heroCardStatLabel: {
    color: HOME_COLORS.primarySoft,
    marginBottom: theme.spacing.xxs,
  },
  heroCardStatValue: {
    color: DESIGN_TOKENS.colors.white,
    fontWeight: '700',
  },
});
