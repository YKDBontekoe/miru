import React, { useState } from 'react';
import { View, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { useChatStore } from '../../store/useChatStore';

const C = {
  surface: '#FFFFFF',
  surfaceHigh: '#EEF2FF',
  primary: '#2563EB',
  text: '#0A0E2E',
  muted: '#606490',
  faint: '#B4BBDE',
};

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
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,15,46,0.4)' }}>
        <View
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: C.surfaceHigh,
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            <AppText variant="h2" style={{ color: C.text }}>
              {t('home.chat_modal.title')}
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
              <Ionicons name="close" size={17} color={C.muted} />
            </ScalePressable>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('home.chat_modal.placeholder')}
            placeholderTextColor={C.faint}
            autoFocus
            style={{
              backgroundColor: C.surfaceHigh,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: C.text,
              fontSize: 16,
              marginBottom: 14,
            }}
          />
          <ScalePressable
            onPress={handleCreate}
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? `${C.primary}70` : C.primary,
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: 'center',
              shadowColor: C.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.22,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                {t('home.actions.create')}
              </AppText>
            )}
          </ScalePressable>
        </View>
      </View>
    </Modal>
  );
}
