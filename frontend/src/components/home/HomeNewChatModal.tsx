import React, { useState } from 'react';
import { View, Modal, TextInput, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { useChatStore } from '../../store/useChatStore';
import { theme } from '../../core/theme';

export function HomeNewChatModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { createRoom } = useChatStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t('home.chat_modal.name_required'), t('home.chat_modal.please_enter_name'));
      return;
    }
    setIsSaving(true);
    try {
      await createRoom(name.trim());
      setName('');
      onCreated();
      onClose();
    } catch {
      Alert.alert(t('home.chat_modal.error'), t('home.chat_modal.failed_to_create'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.light },
          ]}
        >
          <View
            style={[
              styles.dragHandle,
              { backgroundColor: isDark ? theme.colors.surface.highestDark : theme.colors.surface.highestLight },
            ]}
          />
          <View style={styles.header}>
            <AppText
              variant="h2"
              style={{ color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light }}
            >
              {t('home.chat_modal.title')}
            </AppText>
            <ScalePressable
              onPress={() => {
                setName('');
                onClose();
              }}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? theme.colors.surface.highestDark : theme.colors.surface.highestLight },
              ]}
            >
              <Ionicons
                name="close"
                size={17}
                color={isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight}
              />
            </ScalePressable>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('home.chat_modal.placeholder')}
            placeholderTextColor={
              isDark ? theme.colors.onSurface.disabledDark : theme.colors.onSurface.disabledLight
            }
            autoFocus
            style={[
              styles.input,
              {
                backgroundColor: isDark ? theme.colors.surface.highestDark : theme.colors.surface.highestLight,
                color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
              },
            ]}
          />
          <ScalePressable
            onPress={handleCreate}
            disabled={isSaving}
            style={[
              styles.createButton,
              { backgroundColor: isSaving ? `${theme.colors.primary.DEFAULT}70` : theme.colors.primary.DEFAULT },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText variant="body" style={styles.createButtonText}>
                {t('home.actions.create')}
              </AppText>
            )}
          </ScalePressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,15,46,0.4)', // Keep existing subtle dark overlay
  },
  modalContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: theme.spacing.xxl,
    paddingBottom: theme.spacing.huge,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: theme.borderRadius.sm,
    alignSelf: 'center',
    marginBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 14,
    fontSize: theme.typography.body.fontSize,
    marginBottom: theme.spacing.md,
  },
  createButton: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: 15,
    alignItems: 'center',
    ...theme.elevation.md,
    shadowColor: theme.colors.primary.DEFAULT,
  },
  createButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
});
