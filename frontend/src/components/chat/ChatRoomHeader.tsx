import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';

const C = {
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  primary: DESIGN_TOKENS.colors.primary,
  primarySurface: DESIGN_TOKENS.colors.primarySoft,
};

interface ChatRoomHeaderProps {
  room: { name: string } | undefined;
  roomAgents: Agent[];
  onBack: () => void;
  onQuickViewAgent: (agent: Agent) => void;
  onManageAgentsPress: () => void;
  getAgentColor: (name: string) => string;
}

export const ChatRoomHeader = ({
  room,
  roomAgents,
  onBack,
  onQuickViewAgent,
  onManageAgentsPress,
  getAgentColor,
}: ChatRoomHeaderProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.headerContainer}>
      <ScalePressable
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={t('chat.back', { defaultValue: 'Back' })}
      >
        <Ionicons name="chevron-back" size={26} color={C.text} />
      </ScalePressable>

      <View style={styles.roomAvatar}>
        <AppText style={styles.roomAvatarText}>
          {(room?.name?.charAt(0) || '?').toUpperCase()}
        </AppText>
      </View>

      <View style={styles.roomInfoContainer}>
        <AppText style={styles.roomTitle} numberOfLines={1}>
          {room?.name ?? 'Chat'}
        </AppText>
        {roomAgents.length > 0 && (
          <AppText style={styles.roomAgentsText} numberOfLines={1}>
            {roomAgents.map((a) => a.name).join(', ')}
          </AppText>
        )}
      </View>

      {/* Tappable agent avatars row */}
      {roomAgents.length > 0 && (
        <View style={styles.agentAvatarsRow}>
          {roomAgents.slice(0, 3).map((agent, i) => {
            const color = getAgentColor(agent.name);
            return (
              <ScalePressable
                key={agent.id}
                onPress={() => onQuickViewAgent(agent)}
                style={[
                  styles.agentAvatar,
                  {
                    backgroundColor: `${color}22`,
                    marginStart: i === 0 ? 0 : -theme.spacing.sm,
                    zIndex: 3 - i,
                  },
                ]}
              >
                <AppText style={[styles.agentAvatarText, { color }]}>
                  {(agent.name?.charAt(0) || '?').toUpperCase()}
                </AppText>
              </ScalePressable>
            );
          })}
          {roomAgents.length > 3 && (
            <View style={styles.overflowAvatar}>
              <AppText style={styles.overflowAvatarText}>
                +{roomAgents.length - 3}
              </AppText>
            </View>
          )}
        </View>
      )}

      <ScalePressable
        onPress={onManageAgentsPress}
        style={styles.manageButton}
        accessibilityRole="button"
        accessibilityLabel={t('chat.manage_agents', { defaultValue: 'Manage agents' })}
      >
        <Ionicons name="person-add-outline" size={16} color={C.primary} />
      </ScalePressable>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
  },
  roomAvatar: {
    width: theme.spacing.xxxl,
    height: theme.spacing.xxxl,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primarySurface,
    borderWidth: 1,
    borderColor: `${C.primary}55`,
  },
  roomAvatarText: {
    fontWeight: 'bold',
    fontSize: theme.typography.body.fontSize,
    color: C.primary,
  },
  roomInfoContainer: {
    flex: 1,
  },
  roomTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: C.text,
  },
  roomAgentsText: {
    fontSize: theme.typography.caption.fontSize,
    color: C.muted,
  },
  agentAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentAvatar: {
    width: theme.spacing.xxxl,
    height: theme.spacing.xxxl,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 'bold',
  },
  overflowAvatar: {
    width: theme.spacing.xxxl,
    height: theme.spacing.xxxl,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    borderColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: -theme.spacing.sm,
    zIndex: 0,
    backgroundColor: C.surfaceHigh,
  },
  overflowAvatarText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 'bold',
    color: C.muted,
  },
  manageButton: {
    width: theme.spacing.xxxl,
    height: theme.spacing.xxxl,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
  },
});
