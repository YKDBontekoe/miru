import React, { useState } from 'react';
import {
  View,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { useProductivityStore } from '../../store/useProductivityStore';
import { theme } from '../../core/theme';

const T = theme.colors;
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
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, pressed && { opacity: 0.7 }]}
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={26} color={T.onSurface.mutedLight} />
            </Pressable>
          </View>

          <AppText variant="caption" style={styles.inputLabel}>
            {t('productivity.title_label') || 'Title'}
          </AppText>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder={t('productivity.note_title_placeholder')}
            placeholderTextColor={T.onSurface.disabledLight}
            style={styles.textInput}
          />

          <AppText variant="caption" style={styles.inputLabel}>
            {t('productivity.content_label') || 'Content'}
          </AppText>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder={t('productivity.note_content_placeholder')}
            placeholderTextColor={T.onSurface.disabledLight}
            multiline
            style={[styles.textInput, styles.textArea]}
          />

          <Pressable
            onPress={handleSave}
            disabled={isSaving}
            style={({ pressed }) => [
              styles.primaryButton,
              isSaving && styles.primaryButtonDisabled,
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color={T.white} />
            ) : (
              <AppText style={styles.primaryButtonText}>
                {t('productivity.save_note') || 'Save Note'}
              </AppText>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(18, 18, 26, 0.4)',
  },
  modalContent: {
    backgroundColor: T.surface.light,
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
    color: T.onSurface.light,
  },
  closeButton: {
    padding: S.xs,
  },
  inputLabel: {
    color: T.onSurface.mutedLight,
    marginBottom: S.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '600',
  },
  textInput: {
    backgroundColor: T.surface.highLight,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: T.border.light,
    paddingHorizontal: S.lg,
    paddingVertical: S.md,
    color: T.onSurface.light,
    fontSize: 16,
    marginBottom: S.xl,
  },
  textArea: {
    minHeight: 120,
    textAlignVertical: 'top',
    paddingTop: S.md,
  },
  primaryButton: {
    backgroundColor: T.primary.DEFAULT,
    borderRadius: R.xl,
    paddingVertical: S.lg,
    alignItems: 'center',
    marginTop: S.sm,
    ...theme.elevation.md,
  },
  primaryButtonDisabled: {
    backgroundColor: T.primary.light,
    ...theme.elevation.none,
  },
  primaryButtonText: {
    color: T.white,
    fontWeight: '700',
    fontSize: 16,
  },
});
