import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

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
  const { C } = useTheme();

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: C.surface,
      borderColor: C.border,
    },
    roomAvatar: {
      backgroundColor: C.primarySurface,
      borderColor: `${C.primary}55`,
    },
    roomAvatarText: {
      color: C.primary,
    },
    titleText: {
      color: C.text,
    },
    subtitleText: {
      color: C.subtext,
    },
    moreAgentsCircle: {
      backgroundColor: C.surfaceHigh,
      borderColor: C.surface,
    },
    moreAgentsText: {
      color: C.subtext,
    },
    manageButton: {
      backgroundColor: C.surfaceHigh,
      borderColor: C.border,
    },
    agentAvatarOutline: {
      borderColor: C.surface,
    },
  });

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <ScalePressable
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={t('chat.back', { defaultValue: 'Back' })}
      >
        <Ionicons name="chevron-back" size={26} color={C.text} />
      </ScalePressable>

      <View style={[styles.roomAvatar, dynamicStyles.roomAvatar]}>
        <AppText style={[styles.roomAvatarText, dynamicStyles.roomAvatarText]}>
          {(room?.name?.charAt(0) || '?').toUpperCase()}
        </AppText>
      </View>

      <View style={styles.titleContainer}>
        <AppText style={[styles.titleText, dynamicStyles.titleText]} numberOfLines={1}>
          {room?.name ?? 'Chat'}
        </AppText>
        {roomAgents.length > 0 && (
          <AppText style={[styles.subtitleText, dynamicStyles.subtitleText]} numberOfLines={1}>
            {roomAgents.map((a) => a.name).join(', ')}
          </AppText>
        )}
      </View>

      {/* Tappable agent avatars row */}
      {roomAgents.length > 0 && (
        <View style={styles.agentsContainer}>
          {roomAgents.slice(0, 3).map((agent, i) => {
            const color = getAgentColor(agent.name);
            return (
              <ScalePressable
                key={agent.id}
                onPress={() => onQuickViewAgent(agent)}
                style={[
                  styles.agentAvatar,
                  dynamicStyles.agentAvatarOutline,
                  {
                    backgroundColor: `${color}22`,
                    marginStart: i === 0 ? 0 : -9,
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
            <View style={[styles.moreAgentsCircle, dynamicStyles.moreAgentsCircle]}>
              <AppText style={[styles.moreAgentsText, dynamicStyles.moreAgentsText]}>
                +{roomAgents.length - 3}
              </AppText>
            </View>
          )}
        </View>
      )}

      <ScalePressable
        onPress={onManageAgentsPress}
        style={[styles.manageButton, dynamicStyles.manageButton]}
        accessibilityRole="button"
        accessibilityLabel={t('chat.manage_agents', { defaultValue: 'Manage agents' })}
      >
        <Ionicons name="person-add-outline" size={16} color={C.primary} />
      </ScalePressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  roomAvatar: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  roomAvatarText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitleText: {
    fontSize: 11,
  },
  agentsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  agentAvatar: {
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  moreAgentsCircle: {
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: -9,
    zIndex: 0,
  },
  moreAgentsText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  manageButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
