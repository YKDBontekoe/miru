import React from 'react';
import { View, Modal, SectionList, StyleSheet } from 'react-native';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

interface ManageAgentsModalProps {
  isVisible: boolean;
  onClose: () => void;
  roomAgents: Agent[];
  availableAgents: Agent[];
  agents: Agent[];
  onAddAgent: (agentId: string) => void;
  onRemoveAgent: (agentId: string) => void;
  getAgentColor: (name: string) => string;
}

export const ManageAgentsModal = ({
  isVisible,
  onClose,
  roomAgents,
  availableAgents,
  agents,
  onAddAgent,
  onRemoveAgent,
  getAgentColor,
}: ManageAgentsModalProps) => {
  const { t } = useTranslation();
  const { C } = useTheme();

  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View
          entering={SlideInUp.springify().damping(22)}
          exiting={SlideOutDown.duration(200)}
          style={[styles.modalContent, { backgroundColor: C.surface }]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: C.faint }]} />
          </View>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <AppText style={[styles.headerTitle, { color: C.text }]}>
                {t('chat.manage_agents', 'Manage Agents')}
              </AppText>
              <ScalePressable
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: C.surfaceHigh }]}
                accessibilityRole="button"
                accessibilityLabel={t('common.close', 'Close')}
              >
                <Ionicons name="close" size={16} color={C.muted} />
              </ScalePressable>
            </View>
            {roomAgents.length > 0 && (
              <AppText style={[styles.headerSubtitle, { color: C.muted }]}>
                {t('manageAgents.activeHelper', {
                  defaultValue: '{{count}} active · tap an avatar in the header to manage',
                  count: roomAgents.length,
                })}
              </AppText>
            )}
          </View>

          <SectionList
            style={styles.sectionList}
            showsVerticalScrollIndicator={false}
            sections={[
              ...(roomAgents.length > 0
                ? [
                    {
                      title: t('manageAgents.inThisChat', 'In this chat'),
                      data: roomAgents,
                      type: 'in-room',
                    },
                  ]
                : []),
              {
                title:
                  availableAgents.length > 0 && roomAgents.length > 0
                    ? t('manageAgents.addMore', 'Add more')
                    : undefined,
                data: availableAgents,
                type: 'available',
              },
            ]}
            keyExtractor={(item) => item.id}
            renderSectionHeader={({ section: { title, type } }) => {
              if (!title && type === 'available' && availableAgents.length === 0) return null;
              if (!title) return null;
              return (
                <AppText
                  style={[
                    styles.sectionTitle,
                    { color: C.muted },
                    type === 'available' && roomAgents.length > 0 && styles.sectionTitleMargin,
                  ]}
                >
                  {title}
                </AppText>
              );
            }}
            ListFooterComponent={
              availableAgents.length === 0 ? (
                agents.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={36} color={C.faint} style={styles.emptyIcon} />
                    <AppText style={[styles.emptyText, { color: C.muted }]}>
                      {t('chat.no_agents_create', 'No agents created yet.')}
                    </AppText>
                  </View>
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="people-outline" size={36} color={C.faint} style={styles.emptyIcon} />
                    <AppText style={[styles.emptyText, { color: C.muted }]}>
                      {t('chat.no_more_agents_to_add', 'No more agents to add.')}
                    </AppText>
                  </View>
                )
              ) : (
                <View style={styles.spacer} />
              )
            }
            renderItem={({ item: agent, section }) => {
              const color = getAgentColor(agent.name);
              const isInRoom = section.type === 'in-room';

              if (isInRoom) {
                return (
                  <View
                    style={[
                      styles.agentCard,
                      { backgroundColor: C.surface, borderColor: C.surfaceHigh },
                    ]}
                  >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity: 0.08 }]} />
                    <View
                      style={[
                        styles.agentAvatar,
                        { backgroundColor: C.surfaceHigh }
                      ]}
                    >
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity: 0.18 }]} />
                      <AppText style={[styles.agentAvatarText, { color }]}>
                        {(agent.name?.charAt(0) || '?').toUpperCase()}
                      </AppText>
                    </View>
                    <View style={styles.agentInfo}>
                      <AppText style={[styles.agentName, { color: C.text }]}>
                        {agent.name}
                      </AppText>
                      <AppText style={[styles.agentPersonality, { color: C.muted }]} numberOfLines={1}>
                        {agent.personality}
                      </AppText>
                    </View>
                    <ScalePressable
                      onPress={() => onRemoveAgent(agent.id)}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: C.dangerSurface,
                          borderColor: C.dangerSurface, // Border color aligns with the design tokens
                        },
                      ]}
                    >
                      <Ionicons name="remove" size={13} color={C.danger} />
                      <AppText
                        style={[styles.actionButtonText, { color: C.danger }]}
                      >
                        {t('manageAgents.remove', 'Remove')}
                      </AppText>
                    </ScalePressable>
                  </View>
                );
              }

              return (
                <View
                  style={[
                    styles.agentCard,
                    { backgroundColor: C.surface, borderColor: C.border },
                  ]}
                >
                  <View
                    style={[
                      styles.agentAvatar,
                      { backgroundColor: C.surfaceHigh }
                    ]}
                  >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity: 0.18 }]} />
                    <AppText style={[styles.agentAvatarText, { color }]}>
                      {(agent.name?.charAt(0) || '?').toUpperCase()}
                    </AppText>
                  </View>
                  <View style={styles.agentInfo}>
                    <AppText style={[styles.agentName, { color: C.text }]}>
                      {agent.name}
                    </AppText>
                    <AppText style={[styles.agentPersonality, { color: C.muted }]} numberOfLines={1}>
                      {agent.personality}
                    </AppText>
                  </View>
                  <ScalePressable
                    onPress={() => onAddAgent(agent.id)}
                    style={[
                      styles.actionButton,
                      { backgroundColor: C.primarySurface, borderColor: C.primarySurface },
                    ]}
                  >
                    <Ionicons name="add" size={13} color={C.primary} />
                    <AppText style={[styles.actionButtonText, { color: C.primary }]}>
                      {t('manageAgents.add', 'Add')}
                    </AppText>
                  </ScalePressable>
                </View>
              );
            }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '72%',
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    marginBottom: 2,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  sectionList: {
    paddingHorizontal: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: theme.spacing.sm,
  },
  sectionTitleMargin: {
    marginTop: theme.spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
  },
  emptyIcon: {
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    textAlign: 'center',
  },
  spacer: {
    height: 40,
  },
  agentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  agentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.sm,
    overflow: 'hidden',
  },
  agentAvatarText: {
    fontWeight: 'bold',
    fontSize: 15,
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    fontSize: 14,
    fontWeight: '600',
  },
  agentPersonality: {
    fontSize: 11,
  },
  actionButton: {
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
