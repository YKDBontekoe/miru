import React from 'react';
import { View, Modal, ScrollView, FlatList } from 'react-native';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';

const C = {
  bg: '#F8F8FC',
  surface: '#FFFFFF',
  surfaceHigh: '#F0F0F6',
  border: '#E0E0EC',
  text: '#12121A',
  muted: '#6E6E80',
  faint: '#C0C0D0',
  primary: '#2563EB',
  primarySurface: '#EFF6FF',
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
    <Modal visible={isVisible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-[rgba(0,0,0,0.4)]">
        <Animated.View
          entering={SlideInUp.springify().damping(22)}
          exiting={SlideOutDown.duration(200)}
          className="bg-white rounded-t-[32px] max-h-[72%]"
        >
          <View className="items-center pt-3 mb-0.5">
            <View className="w-9 h-1 rounded-sm bg-[#C0C0D0]" />
          </View>
          <View className="px-5 py-3.5">
            <View className="flex-row justify-between items-center">
              <AppText className="text-lg font-bold text-[#12121A]">
                {t('chat.manage_agents', 'Manage Agents')}
              </AppText>
              <ScalePressable
                onPress={onClose}
                className="w-[30px] h-[30px] rounded-[15px] bg-[#F0F0F6] items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel={t('common.close', 'Close')}
              >
                <Ionicons name="close" size={16} color={C.muted} />
              </ScalePressable>
            </View>
            {roomAgents.length > 0 && (
              <AppText className="text-[#6E6E80] text-xs mt-[3px]">
                {t('manageAgents.activeHelper', {
                  defaultValue: '{{count}} active · tap an avatar in the header to manage',
                  count: roomAgents.length,
                })}
              </AppText>
            )}
          </View>

          <ScrollView className="px-5" showsVerticalScrollIndicator={false}>
            {/* In Room section */}
            {roomAgents.length > 0 && (
              <FlatList
                data={roomAgents}
                keyExtractor={(item) => `in-${item.id}`}
                scrollEnabled={false}
                ListHeaderComponent={
                  <AppText className="text-[#6E6E80] text-[11px] font-bold uppercase tracking-[0.8px] mb-2">
                    {t('manageAgents.inThisChat', 'In this chat')}
                  </AppText>
                }
                renderItem={({ item: agent }) => {
                  const color = getAgentColor(agent.name);
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
                        <AppText className="text-[14px] font-semibold text-[#12121A]">
                          {agent.name}
                        </AppText>
                        <AppText className="text-[11px] text-[#6E6E80]" numberOfLines={1}>
                          {agent.personality}
                        </AppText>
                      </View>
                      <ScalePressable
                        onPress={() => onRemoveAgent(agent.id)}
                        className="bg-[#FEE2E2] rounded-lg px-2.5 py-1 flex-row items-center gap-1"
                      >
                        <Ionicons name="remove" size={13} color="#EF4444" />
                        <AppText className="text-[#EF4444] text-xs font-semibold">
                          {t('manageAgents.remove', 'Remove')}
                        </AppText>
                      </ScalePressable>
                    </View>
                  );
                }}
              />
            )}

            <FlatList
              data={availableAgents}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              ListHeaderComponent={
                availableAgents.length > 0 && roomAgents.length > 0 ? (
                  <AppText className="text-[#6E6E80] text-[11px] font-bold uppercase tracking-[0.8px] mb-2 mt-2">
                    {t('manageAgents.addMore', 'Add more')}
                  </AppText>
                ) : null
              }
              ListEmptyComponent={
                agents.length === 0 ? (
                  <View className="items-center py-9">
                    <Ionicons name="people-outline" size={36} color={C.faint} className="mb-3" />
                    <AppText className="text-center text-[#6E6E80]">
                      {t('chat.no_agents_create')}
                    </AppText>
                  </View>
                ) : availableAgents.length === 0 && agents.length > 0 ? (
                  <View className="items-center py-9">
                    <Ionicons name="people-outline" size={36} color={C.faint} className="mb-3" />
                    <AppText className="text-center text-[#6E6E80]">
                      {t('chat.no_more_agents_to_add', 'No more agents to add.')}
                    </AppText>
                  </View>
                ) : null
              }
              renderItem={({ item: agent }) => {
                const color = getAgentColor(agent.name);
                return (
                  <View className="flex-row items-center bg-white rounded-[14px] p-3 mb-2 border border-[#E0E0EC]">
                    <View
                      className="w-[38px] h-[38px] rounded-[19px] items-center justify-center me-3"
                      style={{ backgroundColor: `${color}18` }}
                    >
                      <AppText style={{ color }} className="font-bold text-[15px]">
                        {(agent.name?.charAt(0) || '?').toUpperCase()}
                      </AppText>
                    </View>
                    <View className="flex-1">
                      <AppText className="text-[14px] font-semibold text-[#12121A]">
                        {agent.name}
                      </AppText>
                      <AppText className="text-[11px] text-[#6E6E80]" numberOfLines={1}>
                        {agent.personality}
                      </AppText>
                    </View>
                    <ScalePressable
                      onPress={() => onAddAgent(agent.id)}
                      className="bg-[#EFF6FF] rounded-lg px-2.5 py-1 flex-row items-center gap-1"
                    >
                      <Ionicons name="add" size={13} color={C.primary} />
                      <AppText className="text-[12px] text-[#2563EB] font-semibold">
                        {t('manageAgents.add', 'Add')}
                      </AppText>
                    </ScalePressable>
                  </View>
                );
              }}
            />
            <View className="h-10" />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};
