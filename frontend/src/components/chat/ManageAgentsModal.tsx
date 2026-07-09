import React from 'react';
import { View, Modal, SectionList } from 'react-native';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  bg: DESIGN_TOKENS.colors.pageBg,
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
  primarySurface: DESIGN_TOKENS.colors.primarySoft,
  destructive: DESIGN_TOKENS.colors.destructive,
  destructiveSurface: DESIGN_TOKENS.colors.destructiveSurface,
  destructiveBorder: DESIGN_TOKENS.colors.destructiveBorder,
};

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

  return (
    <Modal visible={isVisible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-[rgba(0,0,0,0.4)]">
        <Animated.View
          entering={SlideInUp.springify().damping(22)}
          exiting={SlideOutDown.duration(200)}
          className="rounded-t-[32px] max-h-[72%]"
          style={{ backgroundColor: C.surface }}
        >
          <View className="items-center pt-3 mb-0.5">
            <View className="w-9 h-1 rounded-sm" style={{ backgroundColor: C.faint }} />
          </View>
          <View className="px-5 py-3.5">
            <View className="flex-row justify-between items-center">
              <AppText className="text-lg font-bold" style={{ color: C.text }}>
                {t('chat.manage_agents', 'Manage Agents')}
              </AppText>
              <ScalePressable
                onPress={onClose}
                className="w-[30px] h-[30px] rounded-[15px] items-center justify-center"
                style={{ backgroundColor: C.surfaceHigh }}
                accessibilityRole="button"
                accessibilityLabel={t('common.close', 'Close')}
              >
                <Ionicons name="close" size={16} color={C.muted} />
              </ScalePressable>
            </View>
            {roomAgents.length > 0 && (
              <AppText className="text-xs mt-[3px]" style={{ color: C.muted }}>
                {t('manageAgents.activeHelper', {
                  defaultValue: '{{count}} active · tap an avatar in the header to manage',
                  count: roomAgents.length,
                })}
              </AppText>
            )}
          </View>

          <SectionList
            className="px-5"
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
                  className={`text-[11px] font-bold uppercase tracking-[0.8px] mb-2 ${
                    type === 'available' && roomAgents.length > 0 ? 'mt-2' : ''
                  }`}
                  style={{ color: C.muted }}
                >
                  {title}
                </AppText>
              );
            }}
            ListFooterComponent={
              availableAgents.length === 0 ? (
                agents.length === 0 ? (
                  <View className="items-center py-9">
                    <Ionicons name="people-outline" size={36} color={C.faint} className="mb-3" />
                    <AppText className="text-center" style={{ color: C.muted }}>
                      {t('chat.no_agents_create', 'No agents created yet.')}
                    </AppText>
                  </View>
                ) : (
                  <View className="items-center py-9">
                    <Ionicons name="people-outline" size={36} color={C.faint} className="mb-3" />
                    <AppText className="text-center" style={{ color: C.muted }}>
                      {t('chat.no_more_agents_to_add', 'No more agents to add.')}
                    </AppText>
                  </View>
                )
              ) : (
                <View className="h-10" />
              )
            }
            renderItem={({ item: agent, section }) => {
              const color = getAgentColor(agent.name);
              const isInRoom = section.type === 'in-room';

              if (isInRoom) {
                return (
                  <View
                    className="flex-row items-center rounded-[14px] p-3 mb-2 border"
                    style={{
                      backgroundColor: `${color}08`,
                      borderColor: `${color}25`,
                    }}
                  >
                    <View
                      className="w-[38px] h-[38px] rounded-[19px] items-center justify-center me-3"
                      style={{ backgroundColor: `${color}18` }}
                    >
                      <AppText style={{ color }} className="font-bold text-[15px]">
                        {(agent.name?.charAt(0) || '?').toUpperCase()}
                      </AppText>
                    </View>
                    <View className="flex-1">
                      <AppText className="text-[14px] font-semibold" style={{ color: C.text }}>
                        {agent.name}
                      </AppText>
                      <AppText className="text-[11px]" style={{ color: C.muted }} numberOfLines={1}>
                        {agent.personality}
                      </AppText>
                    </View>
                    <ScalePressable
                      onPress={() => onRemoveAgent(agent.id)}
                      className="rounded-lg px-2.5 py-1 flex-row items-center gap-1 border"
                      style={{
                        backgroundColor: C.destructiveSurface,
                        borderColor: C.destructiveBorder,
                      }}
                    >
                      <Ionicons name="remove" size={13} color={C.destructive} />
                      <AppText
                        className="text-xs font-semibold"
                        style={{ color: C.destructive }}
                      >
                        {t('manageAgents.remove', 'Remove')}
                      </AppText>
                    </ScalePressable>
                  </View>
                );
              }

              return (
                <View
                  className="flex-row items-center rounded-[14px] p-3 mb-2 border"
                  style={{ backgroundColor: C.surface, borderColor: C.border }}
                >
                  <View
                    className="w-[38px] h-[38px] rounded-[19px] items-center justify-center me-3"
                    style={{ backgroundColor: `${color}18` }}
                  >
                    <AppText style={{ color }} className="font-bold text-[15px]">
                      {(agent.name?.charAt(0) || '?').toUpperCase()}
                    </AppText>
                  </View>
                  <View className="flex-1">
                    <AppText className="text-[14px] font-semibold" style={{ color: C.text }}>
                      {agent.name}
                    </AppText>
                    <AppText className="text-[11px]" style={{ color: C.muted }} numberOfLines={1}>
                      {agent.personality}
                    </AppText>
                  </View>
                  <ScalePressable
                    onPress={() => onAddAgent(agent.id)}
                    className="rounded-lg px-2.5 py-1 flex-row items-center gap-1"
                    style={{ backgroundColor: C.primarySurface }}
                  >
                    <Ionicons name="add" size={13} color={C.primary} />
                    <AppText className="text-[12px] font-semibold" style={{ color: C.primary }}>
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
