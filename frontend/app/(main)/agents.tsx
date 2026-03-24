import React, { useEffect, useState } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { useAgentStore } from '../../src/store/useAgentStore';
import { Agent } from '../../src/core/models';

// ─── Light mode palette ───────────────────────────────────────────────────────
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

function getAgentColor(name: string) {
  const palette = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────

function AgentSkeleton() {
  const opacity = React.useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <Animated.View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: C.surfaceHigh,
          opacity,
          marginEnd: 14,
        }}
      />
      <View style={{ flex: 1 }}>
        <Animated.View
          style={{
            width: '60%',
            height: 16,
            borderRadius: 4,
            backgroundColor: C.surfaceHigh,
            opacity,
            marginBottom: 8,
          }}
        />
        <Animated.View
          style={{
            width: '80%',
            height: 12,
            borderRadius: 4,
            backgroundColor: C.surfaceHigh,
            opacity,
          }}
        />
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Animated.View
          style={{
            width: 40,
            height: 16,
            borderRadius: 4,
            backgroundColor: C.surfaceHigh,
            opacity,
            marginBottom: 6,
          }}
        />
        <Animated.View
          style={{
            width: 30,
            height: 10,
            borderRadius: 4,
            backgroundColor: C.surfaceHigh,
            opacity,
          }}
        />
      </View>
    </View>
  );
}

// ─── Create Agent Sheet ───────────────────────────────────────────────────────

function CreateAgentSheet({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const { createAgent, generateAgent } = useAgentStore();
  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!keywords.trim()) {
      Alert.alert(
        t('agents.create_modal.keywords_required', 'Keywords required'),
        t('agents.create_modal.enter_keywords', 'Enter keywords to generate a persona.')
      );
      return;
    }
    setIsGenerating(true);
    try {
      const result = await generateAgent(keywords.trim());
      setName(result.name);
      setPersonality(result.personality);
    } catch {
      Alert.alert(
        t('agents.create_modal.error', 'Error'),
        t('agents.create_modal.generate_failed', 'Could not generate persona. Try again.')
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !personality.trim()) {
      Alert.alert(
        t('agents.create_modal.required', 'Required'),
        t('agents.create_modal.name_required', 'Name and personality are required.')
      );
      return;
    }
    setIsSaving(true);
    try {
      await createAgent({ name: name.trim(), personality: personality.trim() });
      setName('');
      setPersonality('');
      setKeywords('');
      onCreated();
      onClose();
    } catch {
      Alert.alert(
        t('agents.create_modal.error', 'Error'),
        t('agents.create_modal.create_failed', 'Failed to create agent. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setName('');
    setPersonality('');
    setKeywords('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/35">
        <View className="bg-surface-light dark:bg-surface-dark rounded-t-[28px] p-6 max-h-[92%]">
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <AppText variant="h2" style={{ color: C.text }}>
              {t('agents.create_modal.title', 'New Agent')}
            </AppText>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* AI Generation */}
            <View
              style={{
                backgroundColor: C.primarySurface,
                borderRadius: 14,
                padding: 14,
                marginBottom: 20,
                borderWidth: 1,
                borderColor: `${C.primary}25`,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="sparkles" size={16} color={C.primary} style={{ marginEnd: 6 }} />
                <AppText style={{ color: C.primary, fontWeight: '600', fontSize: 13 }}>
                  {t('agents.create_modal.generate_ai', 'Generate with AI')}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TextInput
                  value={keywords}
                  onChangeText={setKeywords}
                  placeholder={t(
                    'agents.create_modal.name_placeholder',
                    'e.g. friendly chef, sci-fi expert'
                  )}
                  placeholderTextColor={C.faint}
                  style={{
                    flex: 1,
                    backgroundColor: C.surface,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: C.border,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    color: C.text,
                    fontSize: 14,
                  }}
                />
                <TouchableOpacity
                  onPress={handleGenerate}
                  disabled={isGenerating}
                  style={{
                    backgroundColor: `${C.primary}15`,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: `${C.primary}30`,
                  }}
                >
                  {isGenerating ? (
                    <ActivityIndicator size="small" color={C.primary} />
                  ) : (
                    <Ionicons name="sparkles" size={18} color={C.primary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <AppText
              variant="caption"
              style={{
                color: C.muted,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {t('agents.create_modal.name_label', 'Name')}
            </AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('agents.create_modal.name_placeholder_fallback', 'Agent name')}
              placeholderTextColor={C.faint}
              style={{
                backgroundColor: C.surfaceHigh,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: C.text,
                fontSize: 16,
                marginBottom: 16,
              }}
            />

            <AppText
              variant="caption"
              style={{
                color: C.muted,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {t('agents.labels.personality', 'Personality')}
            </AppText>
            <TextInput
              value={personality}
              onChangeText={setPersonality}
              placeholder={t(
                'agents.create_modal.keywords_placeholder',
                'Describe how this agent thinks and communicates...'
              )}
              placeholderTextColor={C.faint}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: C.surfaceHigh,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: C.text,
                fontSize: 15,
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 24,
              }}
            />

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              style={{
                backgroundColor: isSaving ? `${C.primary}70` : C.primary,
                borderRadius: 14,
                paddingVertical: 14,
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                  {t('agents.create_agent', 'Create Agent')}
                </AppText>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Agent Detail Sheet ───────────────────────────────────────────────────────

function AgentDetailSheet({
  agent,
  visible,
  onClose,
}: {
  agent: Agent | null;
  visible: boolean;
  onClose: () => void;
}) {
  if (!agent) return null;
  const color = getAgentColor(agent.name);
  const level = Math.floor(agent.message_count / 10) + 1;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View className="flex-1 justify-end bg-black/35">
        <View className="bg-surface-light dark:bg-surface-dark rounded-t-[28px] p-6 max-h-[82%]">
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: `${color}18`,
                  borderWidth: 2,
                  borderColor: `${color}40`,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginEnd: 14,
                }}
              >
                <AppText style={{ color, fontSize: 24, fontWeight: '700' }}>
                  {agent.name && agent.name.length ? agent.name[0].toUpperCase() : '?'}
                </AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="h2" style={{ marginBottom: 4, color: C.text }}>
                  {agent.name}
                </AppText>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: `${color}12`,
                    borderRadius: 8,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    alignSelf: 'flex-start',
                  }}
                >
                  <Ionicons name="flash" size={11} color={color} style={{ marginEnd: 3 }} />
                  <AppText style={{ color, fontSize: 11, fontWeight: '700' }}>
                    Level {level}
                  </AppText>
                </View>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={{ marginBottom: 16 }}>
              <AppText
                variant="caption"
                style={{
                  color: C.muted,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Personality
              </AppText>
              <AppText style={{ lineHeight: 22, color: C.text }}>{agent.personality}</AppText>
            </View>

            {agent.description && (
              <View style={{ marginBottom: 16 }}>
                <AppText
                  variant="caption"
                  style={{
                    color: C.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  About
                </AppText>
                <AppText style={{ lineHeight: 22, color: C.text }}>{agent.description}</AppText>
              </View>
            )}

            {/* Stats */}
            <View
              style={{
                flexDirection: 'row',
                backgroundColor: C.surfaceHigh,
                borderRadius: 14,
                padding: 16,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <View style={{ flex: 1, alignItems: 'center' }}>
                <AppText style={{ color, fontWeight: '700', fontSize: 22 }}>
                  {agent.message_count}
                </AppText>
                <AppText variant="caption" style={{ color: C.muted }}>
                  Messages
                </AppText>
              </View>
              <View style={{ width: 1, backgroundColor: C.border }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <AppText style={{ color, fontWeight: '700', fontSize: 22 }}>{level}</AppText>
                <AppText variant="caption" style={{ color: C.muted }}>
                  Level
                </AppText>
              </View>
              <View style={{ width: 1, backgroundColor: C.border }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <AppText style={{ color, fontWeight: '700', fontSize: 22 }}>
                  {agent.integrations?.length ?? 0}
                </AppText>
                <AppText variant="caption" style={{ color: C.muted }}>
                  Integrations
                </AppText>
              </View>
            </View>

            {agent.goals?.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <AppText
                  variant="caption"
                  style={{
                    color: C.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Goals
                </AppText>
                {agent.goals.map((goal, i) => (
                  <View
                    key={i}
                    style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}
                  >
                    <Ionicons
                      name="checkmark-circle"
                      size={16}
                      color={color}
                      style={{ marginEnd: 8, marginTop: 2 }}
                    />
                    <AppText style={{ flex: 1, lineHeight: 20, color: C.text }}>{goal}</AppText>
                  </View>
                ))}
              </View>
            )}

            {agent.integrations?.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <AppText
                  variant="caption"
                  style={{
                    color: C.muted,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginBottom: 8,
                  }}
                >
                  Integrations
                </AppText>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {agent.integrations.map((integration, i) => (
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
                        variant="caption"
                        style={{ textTransform: 'capitalize', color: C.text }}
                      >
                        {integration}
                      </AppText>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function AgentsScreen() {
  const { agents, fetchAgents, isLoading, error } = useAgentStore();
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const renderAgentItem = ({ item }: { item: Agent }) => {
    const color = getAgentColor(item.name);
    const level = Math.floor(item.message_count / 10) + 1;

    return (
      <TouchableOpacity
        onPress={() => setSelectedAgent(item)}
        activeOpacity={0.75}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.surface,
          borderRadius: 16,
          padding: 16,
          marginBottom: 10,
          borderWidth: 1,
          borderColor: C.border,
        }}
      >
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: `${color}18`,
            borderWidth: 1.5,
            borderColor: `${color}35`,
            alignItems: 'center',
            justifyContent: 'center',
            marginEnd: 14,
          }}
        >
          <AppText style={{ color, fontSize: 22, fontWeight: '700' }}>
            {item.name && item.name.length ? item.name[0].toUpperCase() : '?'}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText style={{ fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 }}>
            {item.name}
          </AppText>
          <AppText variant="caption" style={{ color: C.muted, fontSize: 12 }} numberOfLines={1}>
            {item.personality}
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: `${color}12`,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 3,
              marginBottom: 4,
            }}
          >
            <Ionicons name="flash" size={11} color={color} style={{ marginEnd: 3 }} />
            <AppText style={{ color, fontSize: 11, fontWeight: '700' }}>Lv {level}</AppText>
          </View>
          <AppText variant="caption" style={{ color: C.muted, fontSize: 10 }}>
            {item.message_count} msgs
          </AppText>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <View>
          <AppText variant="h1" style={{ fontSize: 28, fontWeight: '700', color: C.text }}>
            Agents
          </AppText>
          <AppText variant="caption" style={{ color: C.muted }}>
            Your AI persona collection
          </AppText>
        </View>
        <TouchableOpacity
          onPress={() => setShowCreateSheet(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: C.primary,
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 8,
          }}
        >
          <Ionicons name="add" size={18} color="white" style={{ marginEnd: 4 }} />
          <AppText style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>New</AppText>
        </TouchableOpacity>
      </View>

      {/* Error State */}
      {error && !isLoading && agents.length === 0 && (
        <View style={{ alignItems: 'center', paddingVertical: 48, paddingHorizontal: 20 }}>
          <Ionicons
            name="alert-circle-outline"
            size={48}
            color={C.primary}
            style={{ marginBottom: 16 }}
          />
          <AppText variant="h3" style={{ marginBottom: 8, textAlign: 'center', color: C.text }}>
            Failed to load agents
          </AppText>
          <AppText style={{ textAlign: 'center', marginBottom: 24, color: C.muted }}>
            {error}
          </AppText>
          <TouchableOpacity
            onPress={fetchAgents}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: C.primary,
              borderRadius: 14,
              paddingVertical: 12,
              paddingHorizontal: 24,
            }}
          >
            <Ionicons name="refresh" size={18} color="white" style={{ marginEnd: 6 }} />
            <AppText style={{ color: 'white', fontWeight: '700' }}>Retry</AppText>
          </TouchableOpacity>
        </View>
      )}

      {/* Loading State / Skeletons */}
      {isLoading && agents.length === 0 ? (
        <View style={{ paddingHorizontal: 20 }}>
          {[1, 2, 3].map((i) => (
            <AgentSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={agents}
          renderItem={renderAgentItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchAgents} tintColor={C.primary} />
          }
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: C.surfaceHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <Ionicons name="people-outline" size={32} color={C.faint} />
              </View>
              <AppText variant="h3" style={{ marginBottom: 8, textAlign: 'center', color: C.text }}>
                No agents yet
              </AppText>
              <AppText style={{ textAlign: 'center', marginBottom: 24, color: C.muted }}>
                Create your first AI persona to get started.
              </AppText>
              <TouchableOpacity
                onPress={() => setShowCreateSheet(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: C.primary,
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                }}
              >
                <Ionicons name="add" size={18} color="white" style={{ marginEnd: 6 }} />
                <AppText style={{ color: 'white', fontWeight: '700' }}>Create Agent</AppText>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <CreateAgentSheet
        visible={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        onCreated={fetchAgents}
      />
      <AgentDetailSheet
        agent={selectedAgent}
        visible={selectedAgent !== null}
        onClose={() => setSelectedAgent(null)}
      />
    </SafeAreaView>
  );
}
