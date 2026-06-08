import React from 'react';
import { StyleProp, View, ViewStyle, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent, ChatRoom, Task } from '@/core/models';
import { relativeTimeFromNow } from './homeUtils';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

export function HomeSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { C } = useTheme();

  return (
    <View style={styles.sectionHeader}>
      <AppText variant="h3" style={{ color: C.text, fontWeight: '700' }}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <ScalePressable onPress={onAction}>
          <AppText variant="bodySm" style={{ color: C.primary, fontWeight: '700' }}>
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
  const { C } = useTheme();

  return (
    <View
      style={[
        styles.surfaceCard,
        {
          backgroundColor: C.surface,
          borderColor: C.border,
          ...theme.elevation.sm,
        },
        style,
      ]}
    >
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
  const { C } = useTheme();

  return (
    <ScalePressable
      onPress={onPress}
      style={[
        styles.actionTile,
        {
          borderColor: C.border,
          backgroundColor: C.surfaceHigh,
        },
      ]}
    >
      <View
        style={[
          styles.actionTileIconWrapper,
          {
            backgroundColor: C.primarySurface,
          },
        ]}
      >
        <Ionicons name={icon} size={18} color={C.primary} />
      </View>
      <AppText variant="bodySm" style={{ color: C.text, fontWeight: '700' }}>
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
  const { C } = useTheme();
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const dueText =
    dueDate && !isNaN(dueDate.getTime())
      ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(dueDate)
      : null;

  return (
    <ScalePressable
      onPress={onToggle}
      style={[
        styles.taskRow,
        {
          backgroundColor: C.surfaceHigh,
        },
      ]}
    >
      <View
        style={[
          styles.taskRowCheckbox,
          {
            borderColor: task.completed ? C.primary : C.border,
            backgroundColor: task.completed ? C.primary : 'transparent',
          },
        ]}
      >
        {task.completed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
      <AppText
        variant="bodySm"
        numberOfLines={1}
        style={{
          flex: 1,
          color: task.completed ? C.muted : C.text,
          textDecorationLine: task.completed ? 'line-through' : 'none',
          fontWeight: '600',
        }}
      >
        {task.title}
      </AppText>
      {dueText ? (
        <View
          style={[
            styles.taskRowBadge,
            {
              backgroundColor: C.successSurface,
            },
          ]}
        >
          <AppText variant="caption" style={{ color: C.success, fontWeight: '700' }}>
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
  const { C } = useTheme();

  return (
    <ScalePressable
      onPress={onPress}
      style={[
        styles.chatRow,
        {
          backgroundColor: C.surfaceHigh,
        },
      ]}
    >
      <View
        style={[
          styles.chatRowAvatar,
          {
            backgroundColor: C.primarySurface,
          },
        ]}
      >
        <AppText variant="bodySm" style={{ color: C.primary, fontWeight: '800' }}>
          {room.name[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <View style={styles.chatRowContent}>
        <AppText variant="bodySm" numberOfLines={1} style={{ color: C.text, fontWeight: '700' }}>
          {room.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: C.muted }}>
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View style={styles.chatRowAction}>
        <AppText variant="caption" style={{ color: C.muted, marginBottom: 2 }}>
          {relativeTimeFromNow(room.updated_at, t)}
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={C.muted} />
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
  const { C } = useTheme();

  return (
    <ScalePressable
      onPress={onPress}
      style={[
        styles.agentBadge,
        {
          borderColor: C.border,
          backgroundColor: C.surface,
        },
      ]}
    >
      <View style={styles.agentBadgeHeader}>
        <View
          style={[
            styles.agentBadgeAvatar,
            {
              backgroundColor: C.primarySurface,
            },
          ]}
        >
          <AppText variant="bodySm" style={{ color: C.primary, fontWeight: '800' }}>
            {agent.name?.[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>
        <View style={styles.flex1}>
          <AppText variant="bodySm" numberOfLines={1} style={{ color: C.text, fontWeight: '700' }}>
            {agent.name}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" style={{ color: C.muted }}>
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
  const { C } = useTheme();

  return (
    <View
      style={[
        styles.heroCard,
        {
          backgroundColor: C.primary,
          ...theme.elevation.md,
        },
      ]}
    >
      <View style={[StyleSheet.absoluteFill, styles.heroCardBgCircle1]} />
      <View style={[StyleSheet.absoluteFill, styles.heroCardBgCircle2]} />

      <View style={styles.heroCardHeader}>
        <View style={styles.heroCardHeaderText}>
          <AppText variant="bodySm" style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '600' }}>
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {firstName}
          </AppText>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
            {dateText}
          </AppText>
        </View>
        <ScalePressable
          onPress={onSettingsPress}
          style={[
            styles.heroCardAvatar,
            {
              backgroundColor: 'rgba(255,255,255,0.2)',
            },
          ]}
        >
          <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View style={styles.heroCardStats}>
        <View
          style={[
            styles.heroCardStatBox,
            {
              backgroundColor: 'rgba(0,0,0,0.15)',
            },
          ]}
        >
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>
            {t('home.hero.today_focus', { defaultValue: 'Today focus' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {todayTaskCount > 0
              ? t('home.hero.tasks_due_today', {
                  count: todayTaskCount,
                  defaultValue: '{{count}} tasks due today',
                })
              : t('home.hero.no_deadlines', { defaultValue: 'No deadlines today' })}
          </AppText>
        </View>
        <View
          style={[
            styles.heroCardStatBox,
            {
              backgroundColor: 'rgba(0,0,0,0.15)',
            },
          ]}
        >
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 2 }}>
            {t('home.hero.completion', { defaultValue: 'Completion' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {completionRate}% {t('home.hero.complete', { defaultValue: 'complete' })}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  surfaceCard: {
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  actionTile: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  actionTileIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  taskRowCheckbox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  taskRowBadge: {
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  chatRowAvatar: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  chatRowContent: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  chatRowAction: {
    alignItems: 'flex-end',
  },
  agentBadge: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    padding: theme.spacing.md,
    width: '48.5%',
    marginBottom: theme.spacing.sm,
  },
  agentBadgeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  agentBadgeAvatar: {
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  heroCard: {
    borderRadius: 28,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  heroCardBgCircle1: {
    width: 180,
    height: 180,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    opacity: 0.1,
    top: -90,
    right: -40,
  },
  heroCardBgCircle2: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: '#000000',
    opacity: 0.1,
    bottom: -44,
    left: -24,
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  heroCardHeaderText: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  heroCardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardStats: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  heroCardStatBox: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
});
