import React from 'react';
import { StyleProp, View, ViewStyle, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent, ChatRoom, Task } from '@/core/models';
import { HOME_COLORS, HOME_SHADOW } from './homeTheme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
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
        <ScalePressable onPress={onAction} style={styles.sectionHeaderAction}>
          <AppText variant="caption" style={styles.sectionHeaderActionText}>
            {actionLabel}
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={HOME_COLORS.muted} />
        </ScalePressable>
      ) : null}
    </View>
  );
}

export function HomeCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.cardContainer, style]}>
      {children}
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
    <View style={[styles.cardContainer, style]}>
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
    <ScalePressable onPress={onPress} style={styles.actionTileContainer}>
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
    <ScalePressable onPress={onToggle} style={styles.taskRowContainer}>
      <View
        style={[
          styles.taskCheckbox,
          {
            borderColor: task.completed ? HOME_COLORS.primary : DESIGN_TOKENS.colors.borderFaint,
            backgroundColor: task.completed ? HOME_COLORS.primary : DESIGN_TOKENS.colors.transparent,
          },
        ]}
      >
        {task.completed ? <Ionicons name="checkmark" size={14} color={DESIGN_TOKENS.colors.white} /> : null}
      </View>
      <AppText
        variant="bodySm"
        numberOfLines={1}
        style={[
          styles.taskTitle,
          {
            color: task.completed ? HOME_COLORS.muted : HOME_COLORS.text,
            textDecorationLine: task.completed ? 'line-through' : 'none',
          },
        ]}
      >
        {task.title}
      </AppText>
      {dueText ? (
        <View style={styles.taskDueContainer}>
          <AppText variant="caption" style={styles.taskDueText}>
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
    <ScalePressable onPress={onPress} style={styles.chatRowContainer}>
      <View style={styles.chatIconContainer}>
        <AppText variant="bodySm" style={styles.chatIconText}>
          {room.name[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <View style={styles.chatContentContainer}>
        <AppText variant="bodySm" numberOfLines={1} style={styles.chatTitle}>
          {room.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={styles.chatSubtitle}>
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View style={styles.chatMetaContainer}>
        <AppText variant="caption" style={styles.chatTimeText}>
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
    <ScalePressable onPress={onPress} style={styles.agentBadgeContainer}>
      <View style={styles.agentBadgeHeader}>
        <View style={styles.agentIconContainer}>
          <AppText variant="bodySm" style={styles.agentIconText}>
            {agent.name?.[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>
        <View style={styles.agentTitleContainer}>
          <AppText variant="bodySm" numberOfLines={1} style={styles.agentTitle}>
            {agent.name}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" style={styles.agentSubtitle}>
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
    <View style={styles.heroContainer}>
      <View style={[styles.heroDeco1, { backgroundColor: DESIGN_TOKENS.colors.success }]} />
      <View style={[styles.heroDeco2, { backgroundColor: DESIGN_TOKENS.colors.warning }]} />

      <View style={styles.heroHeader}>
        <View style={styles.heroTitles}>
          <AppText variant="bodySm" style={styles.heroGreeting}>
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} style={styles.heroName}>
            {firstName}
          </AppText>
          <AppText variant="caption" style={styles.heroDate}>
            {dateText}
          </AppText>
        </View>
        <ScalePressable onPress={onSettingsPress} style={[styles.heroInitialsButton, { backgroundColor: DESIGN_TOKENS.colors.primaryDark }]}>
          <AppText variant="bodySm" style={styles.heroInitialsText}>
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View style={styles.heroStatsRow}>
        <View style={[styles.heroStatCard, { backgroundColor: DESIGN_TOKENS.colors.primaryDarker }]}>
          <AppText variant="caption" style={styles.heroStatLabel}>
            {t('home.hero.today_focus', { defaultValue: 'Today focus' })}
          </AppText>
          <AppText variant="bodySm" style={styles.heroStatValue}>
            {todayTaskCount > 0
              ? t('home.hero.tasks_due_today', {
                  count: todayTaskCount,
                  defaultValue: '{{count}} tasks due today',
                })
              : t('home.hero.no_deadlines', { defaultValue: 'No deadlines today' })}
          </AppText>
        </View>
        <View style={[styles.heroStatCard, { backgroundColor: DESIGN_TOKENS.colors.primaryDarker }]}>
          <AppText variant="caption" style={styles.heroStatLabel}>
            {t('home.hero.completion', { defaultValue: 'Completion' })}
          </AppText>
          <AppText variant="bodySm" style={styles.heroStatValue}>
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
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    color: HOME_COLORS.text,
    fontWeight: '700',
  },
  sectionHeaderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  sectionHeaderActionText: {
    color: HOME_COLORS.muted,
    fontWeight: '600',
    marginRight: 2,
  },
  cardContainer: {
    backgroundColor: HOME_COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    padding: 16,
    marginBottom: 14,
    ...HOME_SHADOW,
  },
  actionTileContainer: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: HOME_COLORS.softSurface,
    marginBottom: 10,
  },
  actionTileIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: HOME_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTileLabel: {
    color: HOME_COLORS.text,
    fontWeight: '700',
  },
  taskRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: HOME_COLORS.softSurface,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  taskTitle: {
    flex: 1,
    fontWeight: '600',
  },
  taskDueContainer: {
    borderRadius: 12,
    backgroundColor: HOME_COLORS.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  taskDueText: {
    color: DESIGN_TOKENS.colors.warningText,
    fontWeight: '700',
  },
  chatRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: HOME_COLORS.softSurface,
    marginBottom: 8,
  },
  chatIconContainer: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: HOME_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  chatIconText: {
    color: HOME_COLORS.primary,
    fontWeight: '800',
  },
  chatContentContainer: {
    flex: 1,
    paddingRight: 8,
  },
  chatTitle: {
    color: HOME_COLORS.text,
    fontWeight: '700',
  },
  chatSubtitle: {
    color: HOME_COLORS.muted,
  },
  chatMetaContainer: {
    alignItems: 'flex-end',
  },
  chatTimeText: {
    color: HOME_COLORS.muted,
    marginBottom: 2,
  },
  agentBadgeContainer: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    backgroundColor: HOME_COLORS.surface,
    padding: 10,
    width: '48.5%',
    marginBottom: 10,
  },
  agentBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  agentIconContainer: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: HOME_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  agentIconText: {
    color: HOME_COLORS.primary,
    fontWeight: '800',
  },
  agentTitleContainer: {
    flex: 1,
  },
  agentTitle: {
    color: HOME_COLORS.text,
    fontWeight: '700',
  },
  agentSubtitle: {
    color: HOME_COLORS.muted,
  },
  heroContainer: {
    borderRadius: 28,
    backgroundColor: HOME_COLORS.deep,
    paddingHorizontal: 18,
    paddingVertical: 18,
    marginBottom: 14,
    overflow: 'hidden',
    ...HOME_SHADOW,
  },
  heroDeco1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 999,
    opacity: 0.26,
    top: -90,
    right: -40,
  },
  heroDeco2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 999,
    opacity: 0.22,
    bottom: -44,
    left: -24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  heroTitles: {
    flex: 1,
    paddingRight: 8,
  },
  heroGreeting: {
    color: DESIGN_TOKENS.colors.primarySoftText,
    fontWeight: '600',
  },
  heroName: {
    color: DESIGN_TOKENS.colors.white,
    fontWeight: '700',
  },
  heroDate: {
    color: DESIGN_TOKENS.colors.primarySoftText,
  },
  heroInitialsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroInitialsText: {
    color: DESIGN_TOKENS.colors.white,
    fontWeight: '700',
  },
  heroStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroStatCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  heroStatLabel: {
    color: DESIGN_TOKENS.colors.primarySoftText,
    marginBottom: 2,
  },
  heroStatValue: {
    color: DESIGN_TOKENS.colors.white,
    fontWeight: '700',
  },
});
