import React, { useState } from 'react';
import {
  View,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { useProductivityStore } from '../../store/useProductivityStore';
import { theme } from '../../core/theme';
import { useTheme } from '../../hooks/useTheme';

const NOTE_TEMPLATES = [
  {
    id: 'meeting',
    label: 'Meeting Notes',
    icon: '📋',
    title: 'Meeting Notes',
    content:
      '**Attendees:**\n\n**Agenda:**\n\n**Key Decisions:**\n\n**Action Items:**\n- [ ] \n\n**Next Steps:**',
  },
  {
    id: 'journal',
    label: 'Journal',
    icon: '📔',
    title: '',
    content:
      "**Today's highlights:**\n\n**What I'm grateful for:**\n\n**Challenges:**\n\n**Tomorrow's focus:**",
  },
  {
    id: 'project',
    label: 'Project Brief',
    icon: '🗂️',
    title: '',
    content:
      '**Goal:**\n\n**Background:**\n\n**Scope:**\n\n**Success criteria:**\n\n**Timeline:**\n\n**Risks:**',
  },
  {
    id: 'idea',
    label: 'Idea Capture',
    icon: '💡',
    title: '',
    content:
      '**The idea:**\n\n**Why it matters:**\n\n**How it could work:**\n\n**Next step to validate:**',
  },
];

const S = theme.spacing;
const R = theme.borderRadius;

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function CreateNoteModal({ visible, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const { createNote } = useProductivityStore();
  const { C } = useTheme();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleClose = () => {
    setTitle('');
    setContent('');
    setIsSaving(false);
    setSelectedTemplate(null);
    onClose();
  };

  const applyTemplate = (templateId: string) => {
    const tpl = NOTE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setSelectedTemplate(templateId);
    if (tpl.title) setTitle(tpl.title);
    setContent(tpl.content);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('productivity.title_required'), t('productivity.enter_title'));
      return;
    }
    setIsSaving(true);
    try {
      await createNote(title.trim(), content.trim());
      setTitle('');
      setContent('');
      onCreated();
      onClose();
    } catch {
      Alert.alert(t('productivity.error'), t('productivity.failed_create_note'));
    } finally {
      setIsSaving(false);
    }
  };

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        modalOverlay: {
          flex: 1,
          justifyContent: 'flex-end',
          backgroundColor: C.backdrop,
        },
        modalContent: {
          backgroundColor: C.surface,
          borderTopLeftRadius: R.xxl,
          borderTopRightRadius: R.xxl,
          padding: S.xxl,
          paddingBottom: Platform.OS === 'ios' ? 40 : S.xxl,
          ...theme.elevation.lg,
        },
        modalHeader: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: S.xl,
        },
        modalTitle: {
          color: C.text,
        },
        closeButton: {
          padding: S.xs,
        },
        inputLabel: {
          color: C.muted,
          marginBottom: S.sm,
          textTransform: 'uppercase',
          letterSpacing: 1,
          fontWeight: '600',
        },
        textInput: {
          backgroundColor: C.surfaceHigh,
          borderRadius: R.lg,
          borderWidth: 1,
          borderColor: C.border,
          paddingHorizontal: S.lg,
          paddingVertical: S.md,
          color: C.text,
          fontSize: 16,
          marginBottom: S.xl,
        },
        textArea: {
          minHeight: 120,
          textAlignVertical: 'top',
          paddingTop: S.md,
        },
        primaryButton: {
          backgroundColor: C.primary,
          borderRadius: R.xl,
          paddingVertical: S.lg,
          alignItems: 'center',
          marginTop: S.sm,
          ...theme.elevation.md,
        },
        primaryButtonDisabled: {
          backgroundColor: C.primarySurface,
          ...theme.elevation.none,
        },
        primaryButtonText: {
          color: theme.colors.white,
          fontWeight: '700',
          fontSize: 16,
        },
      }),
    [C]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <AppText variant="h2" style={styles.modalTitle}>
              {t('productivity.new_note') || 'New Note'}
            </AppText>
            <ScalePressable onPress={handleClose} hitSlop={8} style={styles.closeButton}>
              <Ionicons name="close-circle" size={26} color={C.muted} />
            </ScalePressable>
          </View>

          {/* Template strip */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: S.xl, marginHorizontal: -4 }}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}
          >
            {NOTE_TEMPLATES.map((tpl) => (
              <TouchableOpacity
                key={tpl.id}
                onPress={() => applyTemplate(tpl.id)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  borderWidth: 1,
                  backgroundColor: selectedTemplate === tpl.id ? C.primary : C.surfaceHigh,
                  borderColor: selectedTemplate === tpl.id ? C.primary : C.border,
                }}
              >
                <AppText style={{ fontSize: 14 }}>{tpl.icon}</AppText>
                <AppText
                  style={{
                    fontSize: 13,
                    fontWeight: '600',
                    color: selectedTemplate === tpl.id ? '#fff' : C.text,
                  }}
                >
                  {tpl.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <AppText variant="caption" style={styles.inputLabel}>
            {t('productivity.title_label') || 'Title'}
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('productivity.note_title_placeholder')}
            placeholderTextColor={C.faint}
            style={styles.textInput}
          />

          <AppText variant="caption" style={styles.inputLabel}>
            {t('productivity.content_label') || 'Content'}
          </AppText>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={t('productivity.note_content_placeholder')}
            placeholderTextColor={C.faint}
            multiline
            style={[styles.textInput, styles.textArea]}
          />

          <ScalePressable
            onPress={handleSave}
            disabled={isSaving}
            style={[styles.primaryButton, isSaving && styles.primaryButtonDisabled]}
          >
            {isSaving ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <AppText style={styles.primaryButtonText}>
                {t('productivity.save_note') || 'Save Note'}
              </AppText>
            )}
          </ScalePressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
