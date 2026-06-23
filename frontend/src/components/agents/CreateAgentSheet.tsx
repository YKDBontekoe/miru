import React, { useState, useEffect, useRef } from 'react';
import { View, Modal, ScrollView, TextInput, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp, SlideOutDown, FadeIn } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { TemplateGallerySheet } from './TemplateGallerySheet';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';
import { useAgentStore, AgentTemplate } from '@/store/useAgentStore';
import { haptic } from '@/utils/haptics';
import { SURPRISE_KEYWORDS, getTonePrefix } from '@/components/agents/agentUtils';
import { ScalePressable } from '@/components/ScalePressable';
import { CreateAgentForm } from '@/components/agents/create';

interface Prefill {
  name?: string;
  personality?: string;
  description?: string;
  goals?: string[];
  isGenerated?: boolean;
}

interface CreateAgentSheetProps {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
  prefill?: Prefill;
}

export function CreateAgentSheet({ visible, onClose, onCreated, prefill }: CreateAgentSheetProps) {
  const { C } = useTheme();
  const { createAgent, generateAgent } = useAgentStore();

  const [name, setName] = useState('');
  const [personality, setPersonality] = useState('');
  const [description, setDescription] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [selectedTone, setSelectedTone] = useState('');
  const [keywords, setKeywords] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const isGeneratingRef = useRef(false);
  const [wasGenerated, setWasGenerated] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successVisible, setSuccessVisible] = useState(false);

  const reset = () => {
    setName('');
    setPersonality('');
    setDescription('');
    setGoals([]);
    setSelectedTone('');
    setKeywords('');
    setErrorMsg('');
    setWasGenerated(false);
  };

  useEffect(() => {
    if (visible && prefill) {
      if (prefill.name) setName(prefill.name);
      if (prefill.personality) setPersonality(prefill.personality);
      if (prefill.description) setDescription(prefill.description);
      if (prefill.goals) setGoals(prefill.goals);
      setWasGenerated(Boolean(prefill.isGenerated));
    } else if (!visible) {
      reset();
    }
  }, [visible, prefill]);

  const handleSurprise = () => {
    haptic.selection();
    const randomKW = SURPRISE_KEYWORDS[Math.floor(Math.random() * SURPRISE_KEYWORDS.length)];
    setKeywords(randomKW);
  };

  const handleGenerate = async () => {
    if (!keywords.trim() || isGeneratingRef.current) return;
    haptic.light();
    setIsGenerating(true);
    isGeneratingRef.current = true;
    setErrorMsg('');
    try {
      const prompt = keywords.trim();
      const generated = await generateAgent(prompt);
      setName(generated.name);
      setPersonality(generated.personality);
      setDescription(generated.description ?? '');
      setGoals(generated.goals ?? []);
      setWasGenerated(true);
      haptic.success();
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to generate persona.');
      haptic.error();
    } finally {
      setIsGenerating(false);
      isGeneratingRef.current = false;
    }
  };

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (successVisible) {
      timeoutId = setTimeout(() => {
        setSuccessVisible(false);
        onCreated();
        reset();
        onClose();
      }, 1500);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [successVisible, onCreated, onClose]);

  const handleSave = async () => {
    if (!name.trim() || !personality.trim()) {
      setErrorMsg('Name and personality are required.');
      haptic.error();
      return;
    }
    setErrorMsg('');
    haptic.light();
    setIsSaving(true);
    try {
      const finalPersonality = selectedTone
        ? `${getTonePrefix(selectedTone)} ${personality.trim()}`
        : personality.trim();

      await createAgent({
        name: name.trim(),
        personality: finalPersonality,
        description: description.trim() || undefined,
        goals: goals.length > 0 ? goals : undefined,
      });

      haptic.success();
      setSuccessVisible(true);
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to create persona.');
      haptic.error();
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectTemplate = (t: AgentTemplate) => {
    setName(t.name);
    setPersonality(t.personality);
    setDescription(t.description ?? '');
    setGoals(t.goals ?? []);
    setWasGenerated(true);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={SlideInUp.duration(300)}
            exiting={SlideOutDown.duration(200)}
            style={[styles.sheetContainer, { backgroundColor: C.surface }]}
          >
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: C.faint }]} />
            </View>

            <View style={styles.header}>
              <AppText style={{ ...theme.typography.h2, color: C.text }}>New Persona</AppText>
              <ScalePressable
                onPress={() => {
                  reset();
                  onClose();
                }}
                style={[styles.closeButton, { backgroundColor: C.surfaceHigh }]}
              >
                <Ionicons name="close" size={16} color={C.muted} />
              </ScalePressable>
            </View>

            <ScrollView
              style={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Templates shortcut */}
              <ScalePressable
                onPress={() => setShowTemplates(true)}
                style={[
                  styles.templatesShortcut,
                  { backgroundColor: C.surfaceHigh, borderColor: C.border },
                ]}
              >
                <Ionicons name="albums-outline" size={16} color={C.primary} />
                <AppText
                  style={{
                    color: C.primary,
                    fontWeight: theme.typography.h3.fontWeight,
                    fontSize: theme.typography.caption.fontSize,
                    flex: 1,
                  }}
                >
                  Browse persona templates
                </AppText>
                <Ionicons name="chevron-forward" size={14} color={C.faint} />
              </ScalePressable>

              {/* AI Generation */}
              <View
                style={[
                  styles.aiContainer,
                  { backgroundColor: C.primarySurface, borderColor: `${C.primary}22` },
                ]}
              >
                <View style={styles.aiHeader}>
                  <Ionicons name="sparkles" size={15} color={C.primary} style={{ marginEnd: 7 }} />
                  <AppText
                    style={{
                      color: C.primary,
                      fontWeight: theme.typography.h2.fontWeight,
                      fontSize: theme.typography.bodySm.fontSize,
                      flex: 1,
                    }}
                  >
                    Generate with AI
                  </AppText>
                  <ScalePressable
                    onPress={handleSurprise}
                    disabled={isGenerating}
                    style={[styles.surpriseButton, { backgroundColor: `${C.primary}15` }]}
                  >
                    <AppText style={{ fontSize: theme.typography.caption.fontSize }}>🎲</AppText>
                    <AppText
                      style={{
                        color: C.primary,
                        fontSize: theme.typography.caption.fontSize,
                        fontWeight: theme.typography.h3.fontWeight,
                      }}
                    >
                      Surprise me
                    </AppText>
                  </ScalePressable>
                </View>
                <View style={styles.aiInputRow}>
                  <TextInput
                    value={keywords}
                    onChangeText={setKeywords}
                    placeholder="e.g. curious scientist, pirate chef…"
                    placeholderTextColor={C.faint}
                    style={[
                      styles.aiInput,
                      {
                        backgroundColor: C.surface,
                        borderColor: C.border,
                        color: C.text,
                      },
                    ]}
                    onSubmitEditing={() => handleGenerate()}
                    returnKeyType="go"
                  />
                  <ScalePressable
                    onPress={() => handleGenerate()}
                    disabled={isGenerating}
                    style={[styles.generateButton, { backgroundColor: C.primary }]}
                  >
                    {isGenerating ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Ionicons name="arrow-forward" size={18} color="white" />
                    )}
                  </ScalePressable>
                </View>
              </View>

              {wasGenerated && (
                <Animated.View entering={FadeIn.duration(300)} style={styles.generatedNotice}>
                  <Ionicons name="checkmark-circle" size={14} color={C.success} />
                  <AppText
                    style={{
                      color: C.success,
                      fontSize: theme.typography.caption.fontSize,
                      fontWeight: theme.typography.h3.fontWeight,
                    }}
                  >
                    AI-generated · review and edit before saving
                  </AppText>
                </Animated.View>
              )}

              <CreateAgentForm
                name={name}
                setName={setName}
                selectedTone={selectedTone}
                setSelectedTone={setSelectedTone}
                personality={personality}
                setPersonality={setPersonality}
                description={description}
                setDescription={setDescription}
                goals={goals}
                setGoals={setGoals}
                isSaving={isSaving}
                onSave={handleSave}
                errorMsg={errorMsg}
              />
            </ScrollView>
          </Animated.View>

          {successVisible && (
            <View style={styles.successOverlay}>
              <View style={[styles.successCard, { backgroundColor: C.surface }]}>
                <Ionicons name="checkmark-circle" size={48} color={C.success} />
                <AppText
                  style={{
                    marginTop: 12,
                    ...theme.typography.h3,
                    fontWeight: 'bold',
                    color: C.text,
                  }}
                >
                  Persona Created
                </AppText>
              </View>
            </View>
          )}
        </View>
      </Modal>

      <TemplateGallerySheet
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={(t) => {
          handleSelectTemplate(t);
          setShowTemplates(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: theme.colors.black + '66',
  },
  sheetContainer: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '96%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: theme.spacing.md,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: theme.borderRadius.xs,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.md,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.xxl,
  },
  templatesShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  aiContainer: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  surpriseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  aiInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  aiInput: {
    flex: 1,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.typography.bodySm.fontSize,
  },
  generateButton: {
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.lg,
    justifyContent: 'center',
    minWidth: 48,
  },
  generatedNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxs,
  },
  successOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.black + '80',
    zIndex: 1000,
  },
  successCard: {
    padding: theme.spacing.xl,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
});
