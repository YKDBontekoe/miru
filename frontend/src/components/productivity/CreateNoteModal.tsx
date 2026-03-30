import React, { useState } from 'react';
import {
  View,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
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

  const handleClose = () => {
    setTitle('');
    setContent('');
    setIsSaving(false);
    onClose();
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
