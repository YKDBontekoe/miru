import React from 'react';
import { View, Modal, ScrollView, FlatList } from 'react-native';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '../../core/models';

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

export function ManageAgentsModal({
  isVisible,
  onClose,
  roomAgents,
  availableAgents,
  agents,
  onAddAgent,
  onRemoveAgent,
  getAgentColor,
}: ManageAgentsModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Animated.View
          entering={SlideInUp.springify().damping(22)}
          exiting={SlideOutDown.duration(200)}
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: '72%',
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12, marginBottom: 2 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.faint }} />
          </View>
          <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <AppText style={{ fontSize: 18, fontWeight: '700', color: C.text }}>
                {t('chat.manage_agents', 'Manage Agents')}
              </AppText>
              <ScalePressable
                onPress={onClose}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: C.surfaceHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={16} color={C.muted} />
              </ScalePressable>
            </View>
            {roomAgents.length > 0 && (
              <AppText style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
                {roomAgents.length} active · tap an avatar in the header to manage
              </AppText>
            )}
          </View>

          <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
            {/* In Room section */}
            {roomAgents.length > 0 && (
              <FlatList
                data={roomAgents}
                keyExtractor={(item) => `in-${item.id}`}
                scrollEnabled={false}
                ListHeaderComponent={
                  <AppText
                    style={{
                      color: C.muted,
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: 8,
                    }}
                  >
                    In this chat
                  </AppText>
                }
                renderItem={({ item: agent }) => {
                  const color = getAgentColor(agent.name);
                  return (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: `${color}08`,
                        borderRadius: 14,
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: `${color}25`,
                      }}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: `${color}18`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginEnd: 12,
                        }}
                      >
                        <AppText style={{ color, fontWeight: '700', fontSize: 15 }}>
                          {agent.name[0].toUpperCase()}
                        </AppText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText style={{ fontSize: 14, fontWeight: '600', color: C.text }}>
                          {agent.name}
                        </AppText>
                        <AppText style={{ fontSize: 11, color: C.muted }} numberOfLines={1}>
                          {agent.personality}
                        </AppText>
                      </View>
                      <ScalePressable
                        onPress={() => onRemoveAgent(agent.id)}
                        style={{
                          backgroundColor: '#FEE2E2',
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Ionicons name="remove" size={13} color="#EF4444" />
                        <AppText style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>
                          Remove
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
                  <AppText
                    style={{
                      color: C.muted,
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: 8,
                      marginTop: 8,
                    }}
                  >
                    Add more
                  </AppText>
                ) : null
              }
              ListEmptyComponent={
                agents.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 36 }}>
                    <Ionicons
                      name="people-outline"
                      size={36}
                      color={C.faint}
                      style={{ marginBottom: 12 }}
                    />
                    <AppText style={{ textAlign: 'center', color: C.muted }}>
                      {t('chat.no_agents_create')}
                    </AppText>
                  </View>
                ) : availableAgents.length === 0 && agents.length > 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 36 }}>
                    <Ionicons
                      name="people-outline"
                      size={36}
                      color={C.faint}
                      style={{ marginBottom: 12 }}
                    />
                    <AppText style={{ textAlign: 'center', color: C.muted }}>
                      {t('chat.no_more_agents_to_add', 'No more agents to add.')}
                    </AppText>
                  </View>
                ) : null
              }
              renderItem={({ item: agent }) => {
                const color = getAgentColor(agent.name);
                return (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: C.surface,
                      borderRadius: 14,
                      padding: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: C.border,
                    }}
                  >
                    <View
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 19,
                        backgroundColor: `${color}18`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginEnd: 12,
                      }}
                    >
                      <AppText style={{ color, fontWeight: '700', fontSize: 15 }}>
                        {agent.name[0].toUpperCase()}
                      </AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={{ fontSize: 14, fontWeight: '600', color: C.text }}>
                        {agent.name}
                      </AppText>
                      <AppText style={{ fontSize: 11, color: C.muted }} numberOfLines={1}>
                        {agent.personality}
                      </AppText>
                    </View>
                    <ScalePressable
                      onPress={() => onAddAgent(agent.id)}
                      style={{
                        backgroundColor: C.primarySurface,
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Ionicons name="add" size={13} color={C.primary} />
                      <AppText style={{ fontSize: 12, color: C.primary, fontWeight: '600' }}>
                        Add
                      </AppText>
                    </ScalePressable>
                  </View>
                );
              }}
            />
            <View style={{ height: 40 }} />
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
