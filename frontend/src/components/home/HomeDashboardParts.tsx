import React from 'react';
import { StyleProp, View, ViewStyle, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent, ChatRoom, Task } from '@/core/models';
import { relativeTimeFromNow } from '@/components/home/homeUtils';
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
    <View style={styles.sectionHeaderContainer}>
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
        styles.surfaceCardContainer,
        {
          backgroundColor: C.surface,
          borderColor: C.border,
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
        styles.actionTileContainer,
        {
          borderColor: C.border,
          backgroundColor: C.surfaceMid,
        },
      ]}
    >
      <View
        style={[
          styles.actionTileIconContainer,
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
        styles.taskRowContainer,
        {
          backgroundColor: C.surfaceMid,
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
        {task.completed ? <Ionicons name="checkmark" size={14} color={theme.colors.surface.light} /> : null}
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
            styles.taskRowDueBadge,
            {
              backgroundColor: C.primarySurface,
            },
          ]}
        >
          <AppText variant="caption" style={{ color: C.danger, fontWeight: '700' }}>
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
        styles.chatRowContainer,
        {
          backgroundColor: C.surfaceMid,
        },
      ]}
    >
      <View
        style={[
          styles.chatRowIconContainer,
          {
            backgroundColor: C.primarySurface,
          },
        ]}
      >
        <AppText variant="bodySm" style={{ color: C.primary, fontWeight: '800' }}>
          {room.name[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <View style={styles.chatRowTextContainer}>
        <AppText variant="bodySm" numberOfLines={1} style={{ color: C.text, fontWeight: '700' }}>
          {room.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: C.muted }}>
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View style={styles.chatRowMetaContainer}>
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
        styles.agentBadgeContainer,
        {
          borderColor: C.border,
          backgroundColor: C.surface,
        },
      ]}
    >
      <View style={styles.agentBadgeHeaderRow}>
        <View
          style={[
            styles.agentBadgeIconContainer,
            {
              backgroundColor: C.primarySurface,
            },
          ]}
        >
          <AppText variant="bodySm" style={{ color: C.primary, fontWeight: '800' }}>
            {agent.name?.[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>
        <View style={styles.agentBadgeTextWrapper}>
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
        styles.heroCardContainer,
        {
          backgroundColor: theme.colors.primary.dark,
        },
      ]}
    >
      <View
        style={[
          styles.heroCardBgCircle1,
          {
            backgroundColor: theme.colors.status.success,
          },
        ]}
      />
      <View
        style={[
          styles.heroCardBgCircle2,
          {
            backgroundColor: theme.colors.status.warning,
          },
        ]}
      />

      <View style={styles.heroCardHeaderRow}>
        <View style={styles.heroCardHeaderTextWrapper}>
          <AppText variant="bodySm" style={{ color: theme.colors.primary.light, fontWeight: '600' }}>
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} style={{ color: theme.colors.surface.light, fontWeight: '700' }}>
            {firstName}
          </AppText>
          <AppText variant="caption" style={{ color: theme.colors.primary.light }}>
            {dateText}
          </AppText>
        </View>
        <ScalePressable
          onPress={onSettingsPress}
          style={[
            styles.heroCardSettingsBtn,
            {
              backgroundColor: C.primary,
            },
          ]}
        >
          <AppText variant="bodySm" style={{ color: theme.colors.surface.light, fontWeight: '700' }}>
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View style={styles.heroCardStatsRow}>
        <View
          style={[
            styles.heroCardStatBox,
            {
              backgroundColor: C.primarySurface,
            },
          ]}
        >
          <AppText variant="caption" style={{ color: theme.colors.primary.light, marginBottom: 2 }}>
            {t('home.hero.today_focus', { defaultValue: 'Today focus' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: theme.colors.surface.light, fontWeight: '700' }}>
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
              backgroundColor: C.primarySurface,
            },
          ]}
        >
          <AppText variant="caption" style={{ color: theme.colors.primary.light, marginBottom: 2 }}>
            {t('home.hero.completion', { defaultValue: 'Completion' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: theme.colors.surface.light, fontWeight: '700' }}>
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
  surfaceCardContainer: {
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...Platform.select({
      ios: theme.elevation.sm,
      android: {
        elevation: theme.elevation.sm.elevation,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
    }) as any,
  },
  actionTileContainer: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  actionTileIconContainer: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  taskRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  taskRowCheckbox: {
    width: theme.spacing.xxl,
    height: theme.spacing.xxl,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  taskRowDueBadge: {
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  chatRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  chatRowIconContainer: {
    width: 34,
    height: 34,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  chatRowTextContainer: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  chatRowMetaContainer: {
    alignItems: 'flex-end',
  },
  agentBadgeContainer: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    padding: theme.spacing.md,
    width: '48.5%',
    marginBottom: theme.spacing.md,
  },
  agentBadgeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  agentBadgeIconContainer: {
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  agentBadgeTextWrapper: {
    flex: 1,
  },
  heroCardContainer: {
    borderRadius: theme.borderRadius.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    ...Platform.select({
      ios: theme.elevation.lg,
      android: {
        elevation: theme.elevation.lg.elevation,
        shadowColor: 'transparent',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0,
        shadowRadius: 0,
      },
    }) as any,
  },
  heroCardBgCircle1: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: theme.borderRadius.full,
    opacity: 0.26,
    top: -90,
    right: -40,
  },
  heroCardBgCircle2: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: theme.borderRadius.full,
    opacity: 0.22,
    bottom: -44,
    left: -24,
  },
  heroCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  heroCardHeaderTextWrapper: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  heroCardSettingsBtn: {
    width: theme.spacing.inputBarButton,
    height: theme.spacing.inputBarButton,
    borderRadius: theme.spacing.inputBarButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCardStatsRow: {
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
