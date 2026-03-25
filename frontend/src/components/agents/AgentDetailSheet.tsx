import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp, SlideOutDown, FadeIn } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { AppText } from '../AppText';
import { AgentAvatar } from '../AgentAvatar';
import { XPBar } from '../XPBar';
import { ScalePressable } from '../ScalePressable';
import { useTheme } from '../../hooks/useTheme';
import { useAgentStore } from '../../store/useAgentStore';
import { useChatStore } from '../../store/useChatStore';
import { haptic } from '../../utils/haptics';
import { Agent } from '../../core/models';
import { getAgentColor, getMoodEmoji, MILESTONES } from './agentUtils';

interface AgentDetailSheetProps {
  agent: Agent | null;
  visible: boolean;
  onClose: () => void;
  onDeleted: (agent: Agent) => void;
  onUpdated: (updated: Agent) => void;
}

export function AgentDetailSheet({
  agent,
  visible,
  onClose,
  onDeleted,
  onUpdated,
}: AgentDetailSheetProps) {
  const { C } = useTheme();
  const router = useRouter();
  const { updateAgent } = useAgentStore();
  const { createRoom, addAgentToRoom } = useChatStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPersonality, setEditPersonality] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editGoals, setEditGoals] = useState<string[]>([]);
  const [goalInput, setGoalInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    if (agent) {
      setEditName(agent.name);
      setEditPersonality(agent.personality);
      setEditDescription(agent.description ?? '');
      setEditGoals(agent.goals ?? []);
      setIsEditing(false);
      setGoalInput('');
    }
  }, [agent]);

  if (!agent) return null;

  const color = getAgentColor(agent.name);
  const displayColor = isEditing ? getAgentColor(editName || agent.name) : color;
  const level = Math.floor(agent.message_count / 10) + 1;
  const xpProgress = (agent.message_count % 10) / 10;
  const moodEmoji = getMoodEmoji(agent.mood);

  const affinityPct = Math.min(agent.message_count * 1.5, 100);
  const affinityLabel =
    affinityPct < 10
      ? 'Stranger'
      : affinityPct < 30
        ? 'Acquaintance'
        : affinityPct < 55
          ? 'Familiar'
          : affinityPct < 80
            ? 'Trusted Friend'
            : 'Soulbound';

  const nextMilestone = MILESTONES.find((m) => agent.message_count < m.threshold);

  const addGoal = () => {
    const g = goalInput.trim();
    if (g && !editGoals.includes(g)) {
      setEditGoals((prev) => [...prev, g]);
      setGoalInput('');
    }
  };

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editPersonality.trim()) {
      Alert.alert('Required', 'Name and personality cannot be empty.');
      return;
    }
    setIsSaving(true);
    haptic.medium();
    try {
      const updated = await updateAgent(agent.id, {
        name: editName.trim(),
        personality: editPersonality.trim(),
        description: editDescription.trim() || undefined,
        goals: editGoals.filter(Boolean),
      });
      haptic.success();
      setIsEditing(false);
      onUpdated(updated);
    } catch {
      haptic.error();
      Alert.alert('Error', 'Could not save changes.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartChat = async () => {
    setIsStartingChat(true);
    haptic.medium();
    try {
      const room = await createRoom(agent.name);
      await addAgentToRoom(room.id, agent.id);
      onClose();
      router.push(`/(main)/chat/${room.id}`);
    } catch {
      haptic.error();
      Alert.alert('Error', 'Could not start a chat.');
    } finally {
      setIsStartingChat(false);
    }
  };

  const cancelEdit = () => {
    setEditName(agent.name);
    setEditPersonality(agent.personality);
    setEditDescription(agent.description ?? '');
    setEditGoals(agent.goals ?? []);
    setIsEditing(false);
  };

  const input = {
    backgroundColor: C.surfaceHigh,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.text,
    fontSize: 15,
    marginBottom: 12,
  };
  const label = {
    color: C.muted,
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 6,
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Animated.View
          entering={SlideInUp.springify().damping(22)}
          exiting={SlideOutDown.duration(200)}
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: '92%',
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.faint }} />
          </View>

          {/* Hero header */}
          <View
            style={{
              backgroundColor: `${displayColor}0D`,
              borderBottomWidth: 1,
              borderBottomColor: `${displayColor}18`,
              padding: 20,
              paddingTop: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <AgentAvatar
                name={isEditing ? editName || agent.name : agent.name}
                size={64}
                color={displayColor}
              />
              <View style={{ flex: 1, marginStart: 14 }}>
                {isEditing ? (
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={[
                      input,
                      {
                        marginBottom: 6,
                        fontSize: 18,
                        fontWeight: '700',
                        backgroundColor: `${C.surface}CC`,
                      },
                    ]}
                    placeholder="Name"
                    placeholderTextColor={C.faint}
                  />
                ) : (
                  <>
                    <AppText
                      style={{ fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 2 }}
                    >
                      {agent.name}
                    </AppText>
                    {agent.mood && (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          marginBottom: 6,
                        }}
                      >
                        <AppText style={{ fontSize: 14 }}>{moodEmoji}</AppText>
                        <AppText style={{ color: displayColor, fontSize: 12, fontWeight: '600' }}>
                          {agent.mood}
                        </AppText>
                      </View>
                    )}
                  </>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View
                    style={{
                      backgroundColor: `${displayColor}22`,
                      borderRadius: 6,
                      paddingHorizontal: 7,
                      paddingVertical: 2,
                    }}
                  >
                    <AppText style={{ color: displayColor, fontSize: 11, fontWeight: '700' }}>
                      Lv {level}
                    </AppText>
                  </View>
                  <XPBar progress={xpProgress} color={displayColor} />
                  <AppText style={{ color: C.faint, fontSize: 10 }}>
                    {agent.message_count % 10}/10
                  </AppText>
                </View>
              </View>

              <View style={{ gap: 8, marginStart: 8 }}>
                {!isEditing && (
                  <TouchableOpacity
                    onPress={() => {
                      haptic.light();
                      setIsEditing(true);
                    }}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: C.surface,
                      borderWidth: 1,
                      borderColor: C.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="pencil" size={14} color={C.muted} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={isEditing ? cancelEdit : onClose}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: C.surface,
                    borderWidth: 1,
                    borderColor: C.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={16} color={C.muted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {isEditing ? (
              <Animated.View entering={FadeIn.duration(200)}>
                <AppText style={label}>Personality</AppText>
                <TextInput
                  value={editPersonality}
                  onChangeText={setEditPersonality}
                  multiline
                  numberOfLines={4}
                  style={[input, { minHeight: 90, textAlignVertical: 'top' }]}
                  placeholder="How does this persona think and communicate?"
                  placeholderTextColor={C.faint}
                />

                <AppText style={label}>
                  Description{' '}
                  <AppText style={{ color: C.faint, textTransform: 'none' }}>(optional)</AppText>
                </AppText>
                <TextInput
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                  numberOfLines={2}
                  style={[input, { minHeight: 60, textAlignVertical: 'top' }]}
                  placeholder="A short bio…"
                  placeholderTextColor={C.faint}
                />

                <AppText style={label}>Goals</AppText>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                  <TextInput
                    value={goalInput}
                    onChangeText={setGoalInput}
                    placeholder="Add a goal…"
                    placeholderTextColor={C.faint}
                    style={{
                      flex: 1,
                      backgroundColor: C.surfaceHigh,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: C.border,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      color: C.text,
                      fontSize: 14,
                    }}
                    onSubmitEditing={addGoal}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={addGoal}
                    style={{
                      width: 40,
                      backgroundColor: `${C.primary}15`,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: `${C.primary}30`,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="add" size={20} color={C.primary} />
                  </TouchableOpacity>
                </View>
                {editGoals.length > 0 && (
                  <View
                    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}
                  >
                    {editGoals.map((g, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => setEditGoals((gs) => gs.filter((_, idx) => idx !== i))}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 5,
                          backgroundColor: `${C.primary}12`,
                          borderRadius: 20,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          borderWidth: 1,
                          borderColor: `${C.primary}25`,
                        }}
                      >
                        <AppText style={{ color: C.primary, fontSize: 12 }}>{g}</AppText>
                        <Ionicons name="close" size={11} color={C.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleSaveEdit}
                  disabled={isSaving}
                  style={{
                    backgroundColor: isSaving ? `${C.primary}70` : C.primary,
                    borderRadius: 14,
                    paddingVertical: 14,
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <AppText style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
                      Save Changes
                    </AppText>
                  )}
                </TouchableOpacity>

                <View
                  style={{
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: `${C.danger}28`,
                    backgroundColor: C.dangerSurface,
                    padding: 14,
                    marginBottom: 40,
                  }}
                >
                  <AppText
                    style={{
                      color: C.danger,
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: 10,
                    }}
                  >
                    Danger Zone
                  </AppText>
                  <TouchableOpacity
                    onPress={() => {
                      haptic.heavy();
                      Alert.alert(
                        `Archive "${agent.name}"?`,
                        'This persona will be archived and hidden from your list.',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Archive',
                            style: 'destructive',
                            onPress: () => {
                              onClose();
                              onDeleted(agent);
                            },
                          },
                        ]
                      );
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: C.danger,
                      borderRadius: 10,
                      paddingVertical: 10,
                    }}
                  >
                    <Ionicons
                      name="archive-outline"
                      size={15}
                      color="white"
                      style={{ marginEnd: 6 }}
                    />
                    <AppText style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>
                      Archive Persona
                    </AppText>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(200)}>
                {/* Start Chat CTA */}
                <ScalePressable onPress={handleStartChat}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: displayColor,
                      borderRadius: 16,
                      paddingVertical: 14,
                      marginBottom: 18,
                      shadowColor: displayColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    {isStartingChat ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="chatbubble-ellipses"
                          size={17}
                          color="white"
                          style={{ marginEnd: 8 }}
                        />
                        <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                          Start Chat
                        </AppText>
                      </>
                    )}
                  </View>
                </ScalePressable>

                {/* Stats */}
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: C.surfaceHigh,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 18,
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                >
                  {[
                    { value: agent.message_count, label: 'Messages' },
                    { value: level, label: 'Level' },
                    { value: agent.integrations?.length ?? 0, label: 'Skills' },
                  ].map((stat, i, arr) => (
                    <React.Fragment key={stat.label}>
                      <View style={{ flex: 1, alignItems: 'center' }}>
                        <AppText style={{ color: displayColor, fontWeight: '800', fontSize: 22 }}>
                          {stat.value}
                        </AppText>
                        <AppText style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>
                          {stat.label}
                        </AppText>
                      </View>
                      {i < arr.length - 1 && (
                        <View style={{ width: 1, backgroundColor: C.border, marginVertical: 4 }} />
                      )}
                    </React.Fragment>
                  ))}
                </View>

                {/* Relationship / Affinity */}
                <View
                  style={{
                    backgroundColor: C.surfaceHigh,
                    borderRadius: 14,
                    padding: 14,
                    marginBottom: 18,
                    borderWidth: 1,
                    borderColor: C.border,
                  }}
                >
                  <AppText style={label}>Relationship</AppText>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 10,
                    }}
                  >
                    <View
                      style={{
                        flex: 1,
                        height: 6,
                        backgroundColor: `${displayColor}20`,
                        borderRadius: 3,
                        overflow: 'hidden',
                      }}
                    >
                      <View
                        style={{
                          width: `${affinityPct}%`,
                          height: 6,
                          backgroundColor: displayColor,
                          borderRadius: 3,
                        }}
                      />
                    </View>
                    <AppText
                      style={{
                        color: displayColor,
                        fontSize: 12,
                        fontWeight: '700',
                        minWidth: 90,
                        textAlign: 'right',
                      }}
                    >
                      {affinityLabel}
                    </AppText>
                  </View>

                  {/* Milestone badges */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
                    {MILESTONES.map((m) => {
                      const earned = agent.message_count >= m.threshold;
                      return (
                        <View
                          key={m.threshold}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                            backgroundColor: earned ? `${displayColor}15` : C.surfaceMid,
                            borderRadius: 10,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderWidth: 1,
                            borderColor: earned ? `${displayColor}30` : C.border,
                            opacity: earned ? 1 : 0.55,
                          }}
                        >
                          <AppText style={{ fontSize: 12 }}>{m.icon}</AppText>
                          <AppText
                            style={{
                              fontSize: 11,
                              color: earned ? displayColor : C.faint,
                              fontWeight: earned ? '600' : '400',
                            }}
                          >
                            {m.label}
                          </AppText>
                        </View>
                      );
                    })}
                  </View>

                  {nextMilestone && (
                    <AppText style={{ color: C.faint, fontSize: 11, marginTop: 8 }}>
                      Next: {nextMilestone.icon} {nextMilestone.label} at {nextMilestone.threshold}{' '}
                      messages ({nextMilestone.threshold - agent.message_count} to go)
                    </AppText>
                  )}
                </View>

                {/* Personality */}
                <View style={{ marginBottom: 16 }}>
                  <AppText style={label}>Personality</AppText>
                  <AppText style={{ lineHeight: 23, color: C.text, fontSize: 15 }}>
                    {agent.personality}
                  </AppText>
                </View>

                {agent.description ? (
                  <View style={{ marginBottom: 16 }}>
                    <AppText style={label}>About</AppText>
                    <AppText style={{ lineHeight: 23, color: C.text, fontSize: 15 }}>
                      {agent.description}
                    </AppText>
                  </View>
                ) : null}

                {agent.goals?.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <AppText style={label}>Goals</AppText>
                    {agent.goals.map((goal, i) => (
                      <View
                        key={i}
                        style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}
                      >
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: `${displayColor}18`,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginEnd: 10,
                            marginTop: 1,
                            flexShrink: 0,
                          }}
                        >
                          <AppText style={{ color: displayColor, fontSize: 10, fontWeight: '700' }}>
                            {i + 1}
                          </AppText>
                        </View>
                        <AppText style={{ flex: 1, lineHeight: 21, color: C.text, fontSize: 14 }}>
                          {goal}
                        </AppText>
                      </View>
                    ))}
                  </View>
                )}

                {agent.integrations?.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <AppText style={label}>Integrations</AppText>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {agent.integrations.map((ig, i) => (
                        <View
                          key={i}
                          style={{
                            backgroundColor: C.surfaceHigh,
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderWidth: 1,
                            borderColor: C.border,
                          }}
                        >
                          <AppText
                            style={{ fontSize: 12, textTransform: 'capitalize', color: C.text }}
                          >
                            {ig}
                          </AppText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <AppText
                  style={{
                    color: C.faint,
                    fontSize: 11,
                    textAlign: 'center',
                    marginTop: 4,
                    marginBottom: 40,
                  }}
                >
                  Created{' '}
                  {new Intl.DateTimeFormat(i18n.language, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  }).format(new Date(agent.created_at))}
                </AppText>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
