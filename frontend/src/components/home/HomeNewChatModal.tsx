import React, { useState } from 'react';
import { View, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { useChatStore } from '../../store/useChatStore';
import { theme } from '@/core/theme';

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
      <View className="flex-1 justify-end bg-[#0A0F2E66]">
        <View
          className={`rounded-t-[28px] p-6 pb-12 ${
            isDark ? 'bg-surface-dark' : 'bg-surface-light'
          }`}
        >
          <View
            className={`w-10 h-1 rounded-sm self-center mb-6 ${
              isDark ? 'bg-surface-highestDark' : 'bg-surface-highestLight'
            }`}
          />
          <View className="flex-row justify-between items-center mb-6">
            <AppText
              variant="h2"
              className={isDark ? 'text-onSurface-dark' : 'text-onSurface-light'}
            >
              {t('home.chat_modal.title')}
            </AppText>
            <ScalePressable
              onPress={() => {
                setName('');
                onClose();
              }}
              className={`w-[30px] h-[30px] rounded-[15px] items-center justify-center ${
                isDark ? 'bg-surface-highestDark' : 'bg-surface-highestLight'
              }`}
            >
              <Ionicons
                name="close"
                size={17}
                color={
                  isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight
                }
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
            className={`rounded-lg px-6 py-3.5 text-base mb-4 ${
              isDark
                ? 'bg-surface-highestDark text-onSurface-dark'
                : 'bg-surface-highestLight text-onSurface-light'
            }`}
          />
          <ScalePressable
            onPress={handleCreate}
            disabled={isSaving}
            className={`rounded-md py-4 items-center shadow-sm shadow-primary-DEFAULT ${
              isSaving ? 'bg-primary-DEFAULT/70' : 'bg-primary-DEFAULT'
            }`}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText variant="body" className="text-white font-bold">
                {t('home.actions.create')}
              </AppText>
            )}
          </ScalePressable>
        </View>
      </View>
    </Modal>
  );
}
