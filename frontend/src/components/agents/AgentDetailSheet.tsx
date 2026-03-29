import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
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

const AgentDetailSheetComponent = ({
  agent,
  visible,
  onClose,
  onDeleted,
  onUpdated,
}: AgentDetailSheetProps) => {
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

  const styles = useMemo(
    () =>
      StyleSheet.create({
        modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
        container: {
          backgroundColor: C.surface,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          maxHeight: '92%',
        },
        dragIndicatorWrapper: { alignItems: 'center', paddingTop: 12 },
        dragIndicator: { width: 36, height: 4, borderRadius: 2, backgroundColor: C.faint },
        heroHeader: {
          borderBottomWidth: 1,
          padding: 20,
          paddingTop: 14,
        },
        heroRow: { flexDirection: 'row', alignItems: 'flex-start' },
        heroInfo: { flex: 1, marginStart: 14 },
        nameInput: {
          marginBottom: 6,
          fontSize: 18,
          fontWeight: '700',
          backgroundColor: `${C.surface}CC`,
        },
        nameText: { fontSize: 22, fontWeight: '700', color: C.text, marginBottom: 2 },
        moodContainer: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          marginBottom: 6,
        },
        moodEmoji: { fontSize: 14 },
        moodText: { fontSize: 12, fontWeight: '600' },
        levelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        levelBadge: {
          borderRadius: 6,
          paddingHorizontal: 7,
          paddingVertical: 2,
        },
        levelText: { fontSize: 11, fontWeight: '700' },
        xpText: { color: C.faint, fontSize: 10 },
        actionsContainer: { gap: 8, marginStart: 8 },
        actionBtn: {
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: C.surface,
          borderWidth: 1,
          borderColor: C.border,
          alignItems: 'center',
          justifyContent: 'center',
        },
        scrollView: { padding: 20 },
        input: {
          backgroundColor: C.surfaceHigh,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: C.text,
          fontSize: 15,
          marginBottom: 12,
        },
        label: {
          color: C.muted,
          fontSize: 11,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 6,
        },
        goalInputRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
        goalInput: {
          flex: 1,
          backgroundColor: C.surfaceHigh,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: 12,
          paddingVertical: 9,
          color: C.text,
          fontSize: 14,
        },
        addGoalBtn: {
          width: 40,
          backgroundColor: `${C.primary}15`,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: `${C.primary}30`,
          alignItems: 'center',
          justifyContent: 'center',
        },
        goalsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
        goalPill: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 5,
          backgroundColor: `${C.primary}12`,
          borderRadius: 20,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderWidth: 1,
          borderColor: `${C.primary}25`,
        },
        goalPillText: { color: C.primary, fontSize: 12 },
        saveBtn: {
          borderRadius: 14,
          paddingVertical: 14,
          alignItems: 'center',
          marginBottom: 14,
        },
        saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
        dangerZone: {
          borderRadius: 14,
          borderWidth: 1,
          borderColor: `${C.danger}28`,
          backgroundColor: C.dangerSurface,
          padding: 14,
          marginBottom: 40,
        },
        dangerTitle: {
          color: C.danger,
          fontSize: 11,
          fontWeight: '700',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 10,
        },
        archiveBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: C.danger,
          borderRadius: 10,
          paddingVertical: 10,
        },
        archiveIcon: { marginEnd: 6 },
        archiveText: { color: 'white', fontWeight: '700', fontSize: 14 },
        startChatBtn: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 16,
          paddingVertical: 14,
          marginBottom: 18,
          elevation: 4,
        },
        startChatIcon: { marginEnd: 8 },
        startChatText: { color: 'white', fontWeight: '700', fontSize: 16 },
        statsContainer: {
          flexDirection: 'row',
          backgroundColor: C.surfaceHigh,
          borderRadius: 16,
          padding: 16,
          marginBottom: 18,
          borderWidth: 1,
          borderColor: C.border,
        },
        statItem: { flex: 1, alignItems: 'center' },
        statValue: { fontWeight: '800', fontSize: 22 },
        statLabel: { color: C.muted, fontSize: 11, marginTop: 1 },
        statDivider: { width: 1, backgroundColor: C.border, marginVertical: 4 },
        relationshipContainer: {
          backgroundColor: C.surfaceHigh,
          borderRadius: 14,
          padding: 14,
          marginBottom: 18,
          borderWidth: 1,
          borderColor: C.border,
        },
        relationshipRow: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          marginBottom: 10,
        },
        affinityBarBg: {
          flex: 1,
          height: 6,
          borderRadius: 3,
          overflow: 'hidden',
        },
        affinityBarFill: {
          height: 6,
          borderRadius: 3,
        },
        affinityLabel: {
          fontSize: 12,
          fontWeight: '700',
          minWidth: 90,
          textAlign: 'right',
        },
        milestonesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
        milestoneBadge: {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 4,
          borderRadius: 10,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderWidth: 1,
        },
        milestoneIcon: { fontSize: 12 },
        milestoneText: { fontSize: 11 },
        nextMilestoneText: { color: C.faint, fontSize: 11, marginTop: 8 },
        infoSection: { marginBottom: 16 },
        infoText: { lineHeight: 23, color: C.text, fontSize: 15 },
        goalRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
        goalIndexBadge: {
          width: 20,
          height: 20,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          marginEnd: 10,
          marginTop: 1,
          flexShrink: 0,
        },
        goalIndexText: { fontSize: 10, fontWeight: '700' },
        goalText: { flex: 1, lineHeight: 21, color: C.text, fontSize: 14 },
        integrationsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        integrationBadge: {
          backgroundColor: C.surfaceHigh,
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderWidth: 1,
          borderColor: C.border,
        },
        integrationText: { fontSize: 12, textTransform: 'capitalize', color: C.text },
        createdText: {
          color: C.faint,
          fontSize: 11,
          textAlign: 'center',
          marginTop: 4,
          marginBottom: 40,
        },
      }),
    [C]
  );

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

  const addGoal = useCallback(() => {
    const g = goalInput.trim();
    if (g && !editGoals.includes(g)) {
      setEditGoals((prev) => [...prev, g]);
      setGoalInput('');
    }
  }, [goalInput, editGoals]);

  const removeEditGoal = useCallback((indexToRemove: number) => {
    setEditGoals((gs) => gs.filter((_, idx) => idx !== indexToRemove));
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!agent) return;
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
  }, [agent, editName, editPersonality, editDescription, editGoals, updateAgent, onUpdated]);

  const handleStartChat = useCallback(async () => {
    if (!agent) return;
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
  }, [agent, createRoom, addAgentToRoom, onClose, router]);

  const cancelEdit = useCallback(() => {
    if (!agent) return;
    setEditName(agent.name);
    setEditPersonality(agent.personality);
    setEditDescription(agent.description ?? '');
    setEditGoals(agent.goals ?? []);
    setIsEditing(false);
  }, [agent]);

  const handleArchive = useCallback(() => {
    if (!agent) return;
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
  }, [agent, onClose, onDeleted]);

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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={SlideInUp.duration(300)}
          exiting={SlideOutDown.duration(200)}
          style={styles.container}
        >
          <View style={styles.dragIndicatorWrapper}>
            <View style={styles.dragIndicator} />
          </View>

          {/* Hero header */}
          <View
            style={[
              styles.heroHeader,
              {
                backgroundColor: `${displayColor}0D`,
                borderBottomColor: `${displayColor}18`,
              },
            ]}
          >
            <View style={styles.heroRow}>
              <AgentAvatar
                name={isEditing ? editName || agent.name : agent.name}
                size={64}
                color={displayColor}
              />
              <View style={styles.heroInfo}>
                {isEditing ? (
                  <TextInput
                    value={editName}
                    onChangeText={setEditName}
                    style={[styles.input, styles.nameInput]}
                    placeholder="Name"
                    placeholderTextColor={C.faint}
                  />
                ) : (
                  <>
                    <AppText style={styles.nameText}>{agent.name}</AppText>
                    {agent.mood && (
                      <View style={styles.moodContainer}>
                        <AppText style={styles.moodEmoji}>{moodEmoji}</AppText>
                        <AppText style={[styles.moodText, { color: displayColor }]}>
                          {agent.mood}
                        </AppText>
                      </View>
                    )}
                  </>
                )}
                <View style={styles.levelRow}>
                  <View style={[styles.levelBadge, { backgroundColor: `${displayColor}22` }]}>
                    <AppText style={[styles.levelText, { color: displayColor }]}>
                      Lv {level}
                    </AppText>
                  </View>
                  <XPBar progress={xpProgress} color={displayColor} />
                  <AppText style={styles.xpText}>{agent.message_count % 10}/10</AppText>
                </View>
              </View>

              <View style={styles.actionsContainer}>
                {!isEditing && (
                  <TouchableOpacity
                    onPress={() => {
                      haptic.light();
                      setIsEditing(true);
                    }}
                    style={styles.actionBtn}
                  >
                    <Ionicons name="pencil" size={14} color={C.muted} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={isEditing ? cancelEdit : onClose}
                  style={styles.actionBtn}
                >
                  <Ionicons name="close" size={16} color={C.muted} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {isEditing ? (
              <Animated.View entering={FadeIn.duration(200)}>
                <AppText style={styles.label}>Personality</AppText>
                <TextInput
                  value={editPersonality}
                  onChangeText={setEditPersonality}
                  multiline
                  numberOfLines={4}
                  style={[styles.input, { minHeight: 90, textAlignVertical: 'top' }]}
                  placeholder="How does this persona think and communicate?"
                  placeholderTextColor={C.faint}
                />

                <AppText style={styles.label}>
                  Description{' '}
                  <AppText style={{ color: C.faint, textTransform: 'none' }}>(optional)</AppText>
                </AppText>
                <TextInput
                  value={editDescription}
                  onChangeText={setEditDescription}
                  multiline
                  numberOfLines={2}
                  style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                  placeholder="A short bio…"
                  placeholderTextColor={C.faint}
                />

                <AppText style={styles.label}>Goals</AppText>
                <View style={styles.goalInputRow}>
                  <TextInput
                    value={goalInput}
                    onChangeText={setGoalInput}
                    placeholder="Add a goal…"
                    placeholderTextColor={C.faint}
                    style={styles.goalInput}
                    onSubmitEditing={addGoal}
                    returnKeyType="done"
                  />
                  <TouchableOpacity onPress={addGoal} style={styles.addGoalBtn}>
                    <Ionicons name="add" size={20} color={C.primary} />
                  </TouchableOpacity>
                </View>
                {editGoals.length > 0 && (
                  <View style={styles.goalsWrap}>
                    {editGoals.map((g, i) => (
                      <TouchableOpacity
                        key={i}
                        onPress={() => removeEditGoal(i)}
                        style={styles.goalPill}
                      >
                        <AppText style={styles.goalPillText}>{g}</AppText>
                        <Ionicons name="close" size={11} color={C.primary} />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <TouchableOpacity
                  onPress={handleSaveEdit}
                  disabled={isSaving}
                  style={[
                    styles.saveBtn,
                    { backgroundColor: isSaving ? `${C.primary}70` : C.primary },
                  ]}
                >
                  {isSaving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <AppText style={styles.saveBtnText}>Save Changes</AppText>
                  )}
                </TouchableOpacity>

                <View style={styles.dangerZone}>
                  <AppText style={styles.dangerTitle}>Danger Zone</AppText>
                  <TouchableOpacity onPress={handleArchive} style={styles.archiveBtn}>
                    <Ionicons
                      name="archive-outline"
                      size={15}
                      color="white"
                      style={styles.archiveIcon}
                    />
                    <AppText style={styles.archiveText}>Archive Persona</AppText>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            ) : (
              <Animated.View entering={FadeIn.duration(200)}>
                {/* Start Chat CTA */}
                <ScalePressable onPress={handleStartChat}>
                  <View
                    style={[
                      styles.startChatBtn,
                      {
                        backgroundColor: displayColor,
                        shadowColor: displayColor,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                      },
                    ]}
                  >
                    {isStartingChat ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <>
                        <Ionicons
                          name="chatbubble-ellipses"
                          size={17}
                          color="white"
                          style={styles.startChatIcon}
                        />
                        <AppText style={styles.startChatText}>Start Chat</AppText>
                      </>
                    )}
                  </View>
                </ScalePressable>

                {/* Stats */}
                <View style={styles.statsContainer}>
                  {[
                    { value: agent.message_count, label: 'Messages' },
                    { value: level, label: 'Level' },
                    { value: agent.integrations?.length ?? 0, label: 'Skills' },
                  ].map((stat, i, arr) => (
                    <React.Fragment key={stat.label}>
                      <View style={styles.statItem}>
                        <AppText style={[styles.statValue, { color: displayColor }]}>
                          {stat.value}
                        </AppText>
                        <AppText style={styles.statLabel}>{stat.label}</AppText>
                      </View>
                      {i < arr.length - 1 && <View style={styles.statDivider} />}
                    </React.Fragment>
                  ))}
                </View>

                {/* Relationship / Affinity */}
                <View style={styles.relationshipContainer}>
                  <AppText style={styles.label}>Relationship</AppText>
                  <View style={styles.relationshipRow}>
                    <View style={[styles.affinityBarBg, { backgroundColor: `${displayColor}20` }]}>
                      <View
                        style={[
                          styles.affinityBarFill,
                          {
                            width: `${affinityPct}%`,
                            backgroundColor: displayColor,
                          },
                        ]}
                      />
                    </View>
                    <AppText style={[styles.affinityLabel, { color: displayColor }]}>
                      {affinityLabel}
                    </AppText>
                  </View>

                  {/* Milestone badges */}
                  <View style={styles.milestonesWrap}>
                    {MILESTONES.map((m) => {
                      const earned = agent.message_count >= m.threshold;
                      return (
                        <View
                          key={m.threshold}
                          style={[
                            styles.milestoneBadge,
                            {
                              backgroundColor: earned ? `${displayColor}15` : C.surfaceMid,
                              borderColor: earned ? `${displayColor}30` : C.border,
                              opacity: earned ? 1 : 0.55,
                            },
                          ]}
                        >
                          <AppText style={styles.milestoneIcon}>{m.icon}</AppText>
                          <AppText
                            style={[
                              styles.milestoneText,
                              {
                                color: earned ? displayColor : C.faint,
                                fontWeight: earned ? '600' : '400',
                              },
                            ]}
                          >
                            {m.label}
                          </AppText>
                        </View>
                      );
                    })}
                  </View>

                  {nextMilestone && (
                    <AppText style={styles.nextMilestoneText}>
                      Next: {nextMilestone.icon} {nextMilestone.label} at {nextMilestone.threshold}{' '}
                      messages ({nextMilestone.threshold - agent.message_count} to go)
                    </AppText>
                  )}
                </View>

                {/* Personality */}
                <View style={styles.infoSection}>
                  <AppText style={styles.label}>Personality</AppText>
                  <AppText style={styles.infoText}>{agent.personality}</AppText>
                </View>

                {agent.description ? (
                  <View style={styles.infoSection}>
                    <AppText style={styles.label}>About</AppText>
                    <AppText style={styles.infoText}>{agent.description}</AppText>
                  </View>
                ) : null}

                {agent.goals?.length > 0 && (
                  <View style={styles.infoSection}>
                    <AppText style={styles.label}>Goals</AppText>
                    {agent.goals.map((goal, i) => (
                      <View key={i} style={styles.goalRow}>
                        <View
                          style={[styles.goalIndexBadge, { backgroundColor: `${displayColor}18` }]}
                        >
                          <AppText style={[styles.goalIndexText, { color: displayColor }]}>
                            {i + 1}
                          </AppText>
                        </View>
                        <AppText style={styles.goalText}>{goal}</AppText>
                      </View>
                    ))}
                  </View>
                )}

                {agent.integrations?.length > 0 && (
                  <View style={styles.infoSection}>
                    <AppText style={styles.label}>Integrations</AppText>
                    <View style={styles.integrationsWrap}>
                      {agent.integrations.map((ig, i) => (
                        <View key={i} style={styles.integrationBadge}>
                          <AppText style={styles.integrationText}>{ig}</AppText>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <AppText style={styles.createdText}>
                  Created{' '}
                  {new Date(agent.created_at).toLocaleDateString(undefined, {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </AppText>
              </Animated.View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export const AgentDetailSheet = memo(AgentDetailSheetComponent);
